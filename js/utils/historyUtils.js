// History management for undo/redo functionality
const createHistoryManager = (appState) => {
  const MAX_HISTORY = 100; // Store up to 100 steps in history
  
  // History stacks
  const undoStack = [];
  const redoStack = [];
  
  // Create a snapshot of the current state
  function createSnapshot() {
    return {
      shapes: JSON.parse(JSON.stringify(appState.shapes)),
      connections: JSON.parse(JSON.stringify(appState.connections))
    };
  }
  
  // Push current state to undo stack
  function saveState() {
    redoStack.length = 0; // Clear redo stack when a new action is performed
    undoStack.push(createSnapshot());
    
    // Limit the size of undo stack
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift(); // Remove oldest item
    }
    
    // Update UI buttons
    updateButtonStates();
  }
  
  // Restore state from history
  function applyState(state) {
    appState.shapes = state.shapes;
    appState.connections = state.connections;
    window.redrawCanvas();
  }
  
  // Undo the last action
  function undo() {
    if (undoStack.length === 0) return false;
    
    // Save current state to redo stack
    redoStack.push(createSnapshot());
    
    // Get previous state
    const prevState = undoStack.pop();
    applyState(prevState);
    
    // Update UI buttons
    updateButtonStates();
    return true;
  }
  
  // Redo the last undone action
  function redo() {
    if (redoStack.length === 0) return false;
    
    // Save current state to undo stack
    undoStack.push(createSnapshot());
    
    // Get next state
    const nextState = redoStack.pop();
    applyState(nextState);
    
    // Update UI buttons
    updateButtonStates();
    return true;
  }
  
  // Clear history (used when loading a new file)
  function clearHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
    updateButtonStates();
  }
  
  // Update the undo/redo button states
  function updateButtonStates() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) {
      undoBtn.disabled = undoStack.length === 0;
      undoBtn.classList.toggle('disabled', undoStack.length === 0);
    }
    
    if (redoBtn) {
      redoBtn.disabled = redoStack.length === 0;
      redoBtn.classList.toggle('disabled', redoStack.length === 0);
    }
  }
  
  return {
    saveState,
    undo,
    redo,
    clearHistory
  };
};