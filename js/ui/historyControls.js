// Initialize history controls (undo/redo)
function initHistoryControls(appState, historyManager) {
  const undoButton = document.getElementById('undo-btn');
  const redoButton = document.getElementById('redo-btn');
  
  // Set up undo/redo button click handlers
  undoButton.addEventListener('click', () => {
    historyManager.undo();
  });
  
  redoButton.addEventListener('click', () => {
    historyManager.redo();
  });
  
  // Set up keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Check if the focused element is not an input field
    const activeElement = document.activeElement;
    const isInputActive = activeElement.tagName === 'INPUT' || 
                          activeElement.tagName === 'TEXTAREA' || 
                          activeElement.tagName === 'SELECT';
    
    if (isInputActive) return;
    
    // Undo: Ctrl+Z or Command+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      historyManager.undo();
    }
    
    // Redo: Ctrl+Y or Command+Y or Ctrl+Shift+Z
    if ((e.ctrlKey || e.metaKey) && e.key === 'y' || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      historyManager.redo();
    }
  });
}