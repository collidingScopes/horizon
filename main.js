// Set up canvas and WebGL context
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
const playPauseIndicator = document.getElementById('play-pause-indicator');

if (!gl) {
    alert('WebGL not supported in your browser');
}

// Set canvas size
function resizeCanvas() {
    const maxSize = 800;
    canvas.width = Math.min(window.innerWidth, maxSize);
    canvas.height = Math.min(window.innerHeight, maxSize);
    gl.viewport(0, 0, canvas.width, canvas.height);
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Default parameters
const params = {
    // Animation Settings
    speed: 1.0,
    iterations: 8,
    // Pattern Settings
    scale: 0.2,
    dotFactor: 0.7,
    vOffset: 0.7,
    intensityFactor: 0.2,
    expFactor: 4.0,
    // Color Settings
    redFactor: 1.0,
    greenFactor: -1.0,
    blueFactor: -2.0,
    colorShift: 0.0,
    // Presets
    preset: 'Default',
    // Animation Control
    playing: true,
    resetAnimation: function() {
        startTime = Date.now();
    }
};

// Animation state
let animationFrameId;
let startTime = Date.now();
let pausedTime = 0;
let currentTime = 0;

// Vertex shader program
const vsSource = `
    attribute vec2 aVertexPosition;
    
    void main() {
        gl_Position = vec4(aVertexPosition, 0.0, 1.0);
    }
`;

// Fragment shader program
const fsSource = `
    precision highp float;
    
    uniform vec2 u_resolution;
    uniform float u_time;
    
    // UI Parameters
    uniform float u_speed;
    uniform float u_iterations;
    uniform float u_scale;
    uniform float u_dotFactor;
    uniform float u_vOffset;
    uniform float u_intensityFactor;
    uniform float u_expFactor;
    uniform vec3 u_colorFactors;
    uniform float u_colorShift;
    // Color blend uniforms removed
    
    void main() {
        vec2 r = u_resolution;
        vec2 FC = gl_FragCoord.xy;
        float time = u_time * u_speed;
        
        // vec2 p=(FC.xy*2.-r)/r.y,l,v=p*(1.-(l+=abs(.7-dot(p,p))))/.2;
        vec2 p = (FC.xy*2.0-r)/r.y;
        vec2 l = vec2(0.0);
        float dotP = dot(p, p);
        l.x += abs(u_dotFactor-dotP);
        vec2 v = p*(1.0-l.x)/u_scale;
        
        // for(float i;i++<8.;o+=(sin(v.xyyx)+1.)*abs(v.x-v.y)*.2)v+=cos(v.yx*i+vec2(0,i)+time)/i+.7;
        vec4 o = vec4(0.0);
        for(float i = 0.0; i < 16.0; i++) {
            if (i >= u_iterations) break;
            float idx = i + 1.0; // i++ starts at 1
            v += cos(v.yx*idx+vec2(0.0,idx)+time)/idx+u_vOffset;
            o += (sin(vec4(v.x,v.y,v.y,v.x))+1.0)*abs(v.x-v.y)*u_intensityFactor;
        }
        
        // Apply color shift if requested
        if (u_colorShift > 0.0) {
            o = o.wxyz * u_colorShift + o * (1.0 - u_colorShift);
        }
        
        // o=tanh(exp(p.y*vec4(1,-1,-2,0))*exp(-4.*l.x)/o);
        // Implement tanh manually since it's not available in all GLSL versions
        vec4 expPy = exp(p.y*vec4(u_colorFactors.x, u_colorFactors.y, u_colorFactors.z, 0.0));
        float expLx = exp(-u_expFactor*l.x);
        vec4 ratio = expPy*expLx/o;
        
        // tanh(x) = (exp(2x) - 1) / (exp(2x) + 1)
        vec4 exp2x = exp(2.0 * ratio);
        o = (exp2x - 1.0) / (exp2x + 1.0);
        
        // No color blending
        
        gl_FragColor = o;
    }
`;

// Create shader program
function createShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vsSource);
    gl.compileShader(vertexShader);

    // Check for shader compile errors
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader));
        gl.deleteShader(vertexShader);
        return null;
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fsSource);
    gl.compileShader(fragmentShader);

    // Check for shader compile errors
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader));
        gl.deleteShader(fragmentShader);
        gl.deleteShader(vertexShader);
        return null;
    }

    // Create shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // Check for linking errors
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        console.error('Shader program linking error:', gl.getProgramInfoLog(shaderProgram));
        return null;
    }

    return shaderProgram;
}

// Initialize shader program
const shaderProgram = createShaderProgram(gl, vsSource, fsSource);
if (!shaderProgram) {
    console.error('Failed to create shader program');
}

// Get the attribute and uniform locations
const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
        resolution: gl.getUniformLocation(shaderProgram, 'u_resolution'),
        time: gl.getUniformLocation(shaderProgram, 'u_time'),
        speed: gl.getUniformLocation(shaderProgram, 'u_speed'),
        iterations: gl.getUniformLocation(shaderProgram, 'u_iterations'),
        scale: gl.getUniformLocation(shaderProgram, 'u_scale'),
        dotFactor: gl.getUniformLocation(shaderProgram, 'u_dotFactor'),
        vOffset: gl.getUniformLocation(shaderProgram, 'u_vOffset'),
        intensityFactor: gl.getUniformLocation(shaderProgram, 'u_intensityFactor'),
        expFactor: gl.getUniformLocation(shaderProgram, 'u_expFactor'),
        colorFactors: gl.getUniformLocation(shaderProgram, 'u_colorFactors'),
        colorShift: gl.getUniformLocation(shaderProgram, 'u_colorShift')
    },
};

// Create buffers for the quad (two triangles that cover the entire canvas)
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

// Create a quad that covers the entire clip space (-1 to 1)
const positions = [
    -1.0, -1.0,  // bottom left
    1.0, -1.0,  // bottom right
    -1.0,  1.0,  // top left
    1.0,  1.0,  // top right
];
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

// Toggle play/pause
function togglePlayPause() {
    params.playing = !params.playing;
    
    if (params.playing) {
        // Resuming playback
        startTime = Date.now() - pausedTime;
        playPauseIndicator.textContent = "Playing";
    } else {
        // Pausing playback
        pausedTime = currentTime;
        playPauseIndicator.textContent = "Paused";
    }
    
    // Show indicator
    playPauseIndicator.classList.add('visible');
    
    // Hide indicator after 1.5 seconds
    setTimeout(() => {
        playPauseIndicator.classList.remove('visible');
    }, 1500);
}

// Handle keyboard events
window.addEventListener('keydown', (event) => {
    // Toggle play/pause on Space bar
    if (event.code === 'Space') {
        event.preventDefault();
        togglePlayPause();
    }
});

// Draw the scene
function render() {
    // Update current time
    if (params.playing) {
        currentTime = Date.now() - startTime;
    }
    
    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use our shader program
    gl.useProgram(programInfo.program);

    // Set up attribute and binding point to the position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        2,          // 2 components per vertex
        gl.FLOAT,   // 32bit floating point values
        false,      // don't normalize
        0,          // stride (0 = auto)
        0           // offset into buffer
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

    // Set the uniforms
    gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height);
    gl.uniform1f(programInfo.uniformLocations.time, currentTime / 1000);
    
    // Set the UI parameter uniforms
    gl.uniform1f(programInfo.uniformLocations.speed, params.speed);
    gl.uniform1f(programInfo.uniformLocations.iterations, params.iterations);
    gl.uniform1f(programInfo.uniformLocations.scale, params.scale);
    gl.uniform1f(programInfo.uniformLocations.dotFactor, params.dotFactor);
    gl.uniform1f(programInfo.uniformLocations.vOffset, params.vOffset);
    gl.uniform1f(programInfo.uniformLocations.intensityFactor, params.intensityFactor);
    gl.uniform1f(programInfo.uniformLocations.expFactor, params.expFactor);
    gl.uniform3f(programInfo.uniformLocations.colorFactors, 
                params.redFactor, params.greenFactor, params.blueFactor);
    gl.uniform1f(programInfo.uniformLocations.colorShift, params.colorShift);
    
    // Tint color uniforms removed

    // Draw the quad (TRIANGLE_STRIP needs only 4 vertices for a quad)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Continue animation
    animationFrameId = requestAnimationFrame(render);
}

// Store all controllers for updating later
let guiControllers = {};

// Initialize dat.gui
function initGui() {
    const gui = new dat.GUI({ width: 300 });
    
    // Create folders for organization
    const animationFolder = gui.addFolder('Animation');
    const patternFolder = gui.addFolder('Pattern');
    const colorFolder = gui.addFolder('Color');
    const presetFolder = gui.addFolder('Presets');
    
    // Animation controls
    guiControllers.speed = animationFolder.add(params, 'speed', 0.1, 5.0).name('Speed');
    guiControllers.iterations = animationFolder.add(params, 'iterations', 3, 16).step(1).name('Iterations');
    animationFolder.add(params, 'resetAnimation').name('Reset Animation');
    animationFolder.open();
    
    // Pattern controls
    guiControllers.scale = patternFolder.add(params, 'scale', 0.05, 2.0).name('Pattern Scale');
    guiControllers.dotFactor = patternFolder.add(params, 'dotFactor', 0.1, 2.0).name('Dot Factor');
    guiControllers.vOffset = patternFolder.add(params, 'vOffset', 0.1, 2.0).name('Pattern Offset');
    guiControllers.intensityFactor = patternFolder.add(params, 'intensityFactor', 0.05, 1.0).name('Intensity');
    guiControllers.expFactor = patternFolder.add(params, 'expFactor', 1.0, 10.0).name('Exp Factor');
    patternFolder.open();

    // Color controls
    guiControllers.redFactor = colorFolder.add(params, 'redFactor', -2.0, 2.0).name('Red Component');
    guiControllers.greenFactor = colorFolder.add(params, 'greenFactor', -2.0, 2.0).name('Green Component');
    guiControllers.blueFactor = colorFolder.add(params, 'blueFactor', -2.0, 2.0).name('Blue Component');
    guiControllers.colorShift = colorFolder.add(params, 'colorShift', 0.0, 1.0).name('Color Shift');
    colorFolder.open();

    // Presets dropdown
    const presetNames = Object.keys(presets);
    presetFolder.add(params, 'preset', presetNames).name('Load Preset')
        .onChange(function(presetName) {
            applyPreset(presetName);
        });
        
    return gui;
}

// Apply a preset
function applyPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) return;
    
    // Update the params object with preset values
    Object.keys(preset).forEach(key => {
        if (key in params) {
            params[key] = preset[key];
            
            // Update the UI controller if it exists
            if (guiControllers[key]) {
                guiControllers[key].updateDisplay();
            }
        }
    });
}

// Initialize the GUI
const gui = initGui();

// Start rendering
render();

// Cleanup on page unload
window.addEventListener('unload', () => {
    cancelAnimationFrame(animationFrameId);
});