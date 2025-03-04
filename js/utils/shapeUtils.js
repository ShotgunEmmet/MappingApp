// Find shape at position
function findShapeAt(x, y, shapes) {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const shape = shapes[i];
    if (shape.type === 'circle') {
      const radius = shape.width / 2;
      const distance = Math.sqrt(
        Math.pow(x - shape.x, 2) + Math.pow(y - shape.y, 2)
      );
      if (distance <= radius) return shape;
    } else {
      if (
        x >= shape.x - shape.width / 2 &&
        x <= shape.x + shape.width / 2 &&
        y >= shape.y - shape.height / 2 &&
        y <= shape.y + shape.height / 2
      ) {
        return shape;
      }
    }
  }
  return null;
}

// Find connection at position
function findConnectionAt(x, y, connections, shapes) {
  for (let i = 0; i < connections.length; i++) {
    const conn = connections[i];
    const startShape = shapes.find(s => s.id === conn.startId);
    const endShape = shapes.find(s => s.id === conn.endId);
    
    if (!startShape || !endShape) continue;
    
    // Line equation parameters
    const x1 = startShape.x;
    const y1 = startShape.y;
    const x2 = endShape.x;
    const y2 = endShape.y;
    
    // Calculate distance from point to line
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if close enough to line
    if (distance < 10) {
      return conn;
    }
  }
  return null;
}

// Delete shape and its connections
function deleteShape(shapeId, appState) {
  // Remove the shape
  appState.shapes = appState.shapes.filter(shape => shape.id !== shapeId);
  
  // Remove any connections associated with this shape
  appState.connections = appState.connections.filter(
    conn => conn.startId !== shapeId && conn.endId !== shapeId
  );
}

// Add a new shape
function addShape(type, appState) {
  // Save state before adding a shape
  if (window.historyManager) {
    window.historyManager.saveState();
  }
  
  const newShape = {
    id: Date.now(),
    type,
    x: Math.random() * 400 + 50,
    y: Math.random() * 300 + 50,
    width: type === 'rectangle' ? 80 : 50,
    height: type === 'rectangle' ? 50 : 50,
    color: appState.currentColor
  };
  
  appState.shapes.push(newShape);
  window.redrawCanvas(); // Redraw after adding
}