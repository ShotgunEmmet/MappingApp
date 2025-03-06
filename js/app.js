// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
  // Global state
  const appState = {
    shapes: [],
    connections: [],
    selectedShape: null,
    connectionStart: null,
    hoveredConnection: null,
    mode: 'move', // 'move', 'connect', or 'delete'
    currentColor: '#3B82F6',
    currentShape: 'circle',
    connectionType: 'blue' // 'blue' or 'red'
  };
  
  // Create history manager
  const historyManager = createHistoryManager(appState);
  
  // Expose history manager to the global scope for use in other modules
  window.historyManager = historyManager;
  
  // Initialize canvas
  const canvasElement = document.getElementById('shape-canvas');
  initShapeCanvas(canvasElement, appState);
  
  // Initialize toolbar controls
  initToolbarControls(appState);
  
  // Initialize mode controls
  initModeControls(appState);
  
  // Initialize history controls
  initHistoryControls(appState, historyManager);
  
  // Initialize save/load controls
  initSaveLoadControls(appState, historyManager);
  
  // Initialize theme controls
  initThemeControls();
  
  // Update instructions based on current mode
  updateInstructions(appState.mode);
  
  // Set initial controls visibility
  const shapeControls = document.getElementById('shape-controls');
  const colorControls = document.getElementById('color-controls');
  const typeControls = document.getElementById('type-controls');
  
  shapeControls.style.display = appState.mode === 'move' ? 'flex' : 'none';
  colorControls.style.display = appState.mode === 'move' ? 'flex' : 'none';
  typeControls.style.display = appState.mode === 'connect' ? 'flex' : 'none';
});

// Update instructions based on the current mode
function updateInstructions(mode) {
  const instructionsElement = document.getElementById('instructions');
  
  switch(mode) {
    case 'move':
      instructionsElement.textContent = 'Drag shapes to move them around';
      break;
    case 'connect':
      instructionsElement.textContent = 'Click on a shape and drag to another shape to create a connection';
      break;
    case 'delete':
      instructionsElement.textContent = 'Click on a shape to delete it and its connections, or click on a connection line to delete just that connection';
      break;
    default:
      instructionsElement.textContent = '';
  }
}
