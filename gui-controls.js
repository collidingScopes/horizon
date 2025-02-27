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
    guiControllers.speed = animationFolder.add(params, 'speed', 0.1, 3.0).name('Speed');
    guiControllers.iterations = animationFolder.add(params, 'iterations', 3, 24).step(1).name('Iterations');
    animationFolder.add(params, 'resetAnimation').name('Reset Animation');
    animationFolder.open();
    
    // Pattern controls
    guiControllers.scale = patternFolder.add(params, 'scale', 0.05, 4.0).name('Pattern Scale');
    guiControllers.dotFactor = patternFolder.add(params, 'dotFactor', 0.1, 1.2).name('Dot Factor');
    guiControllers.vOffset = patternFolder.add(params, 'vOffset', 0.0, 10.0).name('Pattern Offset');
    guiControllers.intensityFactor = patternFolder.add(params, 'intensityFactor', 0.05, 1.0).name('Intensity');
    guiControllers.expFactor = patternFolder.add(params, 'expFactor', 0.1, 20.0).name('Exp Factor');
    patternFolder.open();

    // Color controls
    guiControllers.redFactor = colorFolder.add(params, 'redFactor', -3.0, 3.0).name('Red Component');
    guiControllers.greenFactor = colorFolder.add(params, 'greenFactor', -3.0, 3.0).name('Green Component');
    guiControllers.blueFactor = colorFolder.add(params, 'blueFactor', -3.0, 3.0).name('Blue Component');
    guiControllers.colorShift = colorFolder.add(params, 'colorShift', 0.0, 2.0).name('Color Shift');
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

function randomizeInputs() {
  // Animation parameters
  params.speed = Math.random() * 2.9 + 0.1;
  params.iterations = Math.floor(Math.random() * 24);
  
  // Pattern parameters
  params.scale = Math.random() * 4;
  params.dotFactor = Math.random() * 1.1 + 0.1;
  params.vOffset = Math.random() * 1.9 + 0.1; // 0.1 to 2.0
  params.intensityFactor = Math.random() * 0.95 + 0.05; // 0.05 to 1.0
  params.expFactor = Math.random() * 9.0 + 1.0; // 1.0 to 10.0
  
  // Color parameters
  params.redFactor = Math.random() * 4.0 - 2.0; // -2.0 to 2.0
  params.greenFactor = Math.random() * 4.0 - 2.0; // -2.0 to 2.0
  params.blueFactor = Math.random() * 4.0 - 2.0; // -2.0 to 2.0
  params.colorShift = Math.random(); // 0.0 to 1.0
  
  // Update all UI controllers
  for (const key in guiControllers) {
      if (guiControllers[key]) {
          guiControllers[key].updateDisplay();
      }
  }
}