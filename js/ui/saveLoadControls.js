// Initialize the save/load controls
function initSaveLoadControls(appState, historyManager) {
  const saveButton = document.getElementById('save-btn');
  const loadButton = document.getElementById('load-btn');
  const fileInput = document.getElementById('file-input');
  
  // Save button
  saveButton.addEventListener('click', () => {
    saveToFile(appState);
  });
  
  // Load button triggers file input
  loadButton.addEventListener('click', () => {
    fileInput.click();
  });
  
  // File input change
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    loadFromFile(file, appState, historyManager);
    
    // Reset the input value so the same file can be loaded again
    fileInput.value = '';
  });
}