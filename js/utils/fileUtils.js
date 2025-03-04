// Save the current diagram to a file
function saveToFile(appState) {
  // Prompt user for filename
  const filename = prompt('Enter a name for your diagram:', 'diagram') || 'diagram';
  
  const data = {
    shapes: appState.shapes,
    connections: appState.connections,
    version: '1.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Load diagram from a file
function loadFromFile(file, appState, historyManager) {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      if (data.shapes && data.connections) {
        appState.shapes = data.shapes;
        appState.connections = data.connections;
        
        // Clear history when loading a new file
        if (historyManager) {
          historyManager.clearHistory();
        }
        
        window.redrawCanvas(); // Redraw after loading
      } else {
        alert('Invalid file format');
      }
    } catch (error) {
      alert('Error loading file: ' + error.message);
    }
  };
  reader.readAsText(file);
}