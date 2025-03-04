// Initialize the mode controls
function initModeControls(appState) {
  const modeButton = document.getElementById('mode-btn');
  
  modeButton.addEventListener('click', () => {
    // Cycle through modes
    if (appState.mode === 'move') {
      appState.mode = 'connect';
      modeButton.textContent = 'Connection Mode';
      modeButton.className = 'mode-btn connect-mode';
    } else if (appState.mode === 'connect') {
      appState.mode = 'delete';
      modeButton.textContent = 'Delete Mode';
      modeButton.className = 'mode-btn delete-mode';
    } else {
      appState.mode = 'move';
      modeButton.textContent = 'Move Mode';
      modeButton.className = 'mode-btn move-mode';
    }
    
    // Update instructions
    updateInstructions(appState.mode);
    
    // Show/hide controls based on mode
    const shapeControls = document.getElementById('shape-controls');
    const colorControls = document.getElementById('color-controls');
    const typeControls = document.getElementById('type-controls');
    
    shapeControls.style.display = appState.mode === 'move' ? 'flex' : 'none';
    colorControls.style.display = appState.mode === 'move' ? 'flex' : 'none';
    typeControls.style.display = appState.mode === 'connect' ? 'flex' : 'none';
    
    // Redraw canvas to update highlights
    window.redrawCanvas();
  });
}
