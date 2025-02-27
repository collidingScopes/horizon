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
    speed: 1.2,
    iterations: 8,
    // Pattern Settings
    scale: 0.71,
    dotFactor: 0.4,
    vOffset: 2.0,
    intensityFactor: 0.2,
    expFactor: 4.2,
    // Color Settings
    redFactor: 0.2,
    greenFactor: -0.8,
    blueFactor: -1.5,
    colorShift: 0.0,
    // Presets
    preset: 'Horizon',
    // Animation Control
    playing: true,
    randomizeInputs: function() {
        randomizeInputs();
    }
};

// Animation state
let animationFrameId;
let startTime = Date.now();
let pausedTime = 0;
let currentTime = 0;

// Create buffers for the quad (two triangles that cover the entire canvas)
function initBuffers(gl) {
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
    
    return positionBuffer;
}

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

function resetAnimation(){
  startTime = Date.now();
}

// Handle keyboard events
window.addEventListener('keydown', (event) => {
    // Toggle play/pause on Space bar
    if (event.code === 'Space') {
        event.preventDefault();
        togglePlayPause();
    }

    // Randomize parameters on 'r' key
    if (event.code === 'KeyR') {
      event.preventDefault();
      randomizeInputs();
      
      // Show indicator
      playPauseIndicator.textContent = "Randomized";
      playPauseIndicator.classList.add('visible');
      
      // Hide indicator after 1.5 seconds
      setTimeout(() => {
          playPauseIndicator.classList.remove('visible');
      }, 1500);
    }
});