// Initialize the toolbar controls
function initToolbarControls(appState) {
  // Shape selection buttons
  const shapeButtons = document.querySelectorAll('.shape-btn');
  
  shapeButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active shape
      shapeButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      appState.currentShape = button.dataset.shape;
      // Add shape immediately when button is clicked
      addShape(button.dataset.shape, appState);
    });
  });
  
  // Color select
  const colorSelect = document.getElementById('color-select');
  colorSelect.addEventListener('change', () => {
    appState.currentColor = colorSelect.value;
  });

  // Type select
  const typeSelect = document.getElementById('type-select');
  typeSelect.addEventListener('change', () => {
    appState.connectionType = typeSelect.value;
  });
}
