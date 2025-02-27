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