/*
To do:
improve default presets
save presets (to local storage?)
add color shifting over time
add noise / distortion variable
improve randomize inputs function (dynamically fetch min/max ranges)
what other animation parameters would be visually interesting?
footer / about div
can text be added to the center?
make parameter names more intuitive
add control for grain look
add control for background color
*/

// Global variables for WebGL
let programInfo;
let positionBuffer;

// Initialize the application
async function init() {
    // Initialize the shader program
    const shaderProgram = await initShaderProgram(gl);
    
    if (!shaderProgram) {
        console.error('Failed to create shader program');
        return;
    }
    
    // Get attribute and uniform locations
    programInfo = {
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
            colorShift: gl.getUniformLocation(shaderProgram, 'u_colorShift'),
            dotMultiplier: gl.getUniformLocation(shaderProgram, 'u_dotMultiplier'),
        },
    };
    
    // Initialize buffers
    positionBuffer = initBuffers(gl);
    
    // Initialize GUI
    const gui = initGui();
    
    // Start rendering
    animate();
}

function drawScene(){
  // Update current time
  if (params.playing) {
    currentTime = Date.now() - startTime;
  }

  // Set background color to solid black
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Ensure we're drawing on the full canvas by setting a black quad first
  gl.useProgram(programInfo.program);
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
  gl.uniform1f(programInfo.uniformLocations.dotMultiplier, params.dotMultiplier);

  // Draw the quad (TRIANGLE_STRIP needs only 4 vertices for a quad)
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

// Draw the scene
function animate() {
  drawScene();
  animationFrameId = requestAnimationFrame(animate);
}

// Cleanup on page unload
window.addEventListener('unload', () => {
    cancelAnimationFrame(animationFrameId);
});

// Initialize the application when the page loads
window.addEventListener('load', init);