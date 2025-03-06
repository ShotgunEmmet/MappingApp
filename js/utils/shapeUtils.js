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
    } else if (shape.type === 'triangle') {
      // For triangles, we need to check if the point is inside the triangle
      // This uses the barycentric coordinate method
      const x1 = shape.x;
      const y1 = shape.y - shape.height / 2;
      const x2 = shape.x - shape.width / 2;
      const y2 = shape.y + shape.height / 2;
      const x3 = shape.x + shape.width / 2;
      const y3 = shape.y + shape.height / 2;
      
      const denominator = ((y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3));
      if (denominator === 0) continue; // Degenerate triangle
      
      const a = ((y2 - y3) * (x - x3) + (x3 - x2) * (y - y3)) / denominator;
      const b = ((y3 - y1) * (x - x3) + (x1 - x3) * (y - y3)) / denominator;
      const c = 1 - a - b;
      
      if (a >= 0 && a <= 1 && b >= 0 && b <= 1 && c >= 0 && c <= 1) {
        return shape;
      }
    } else {
      // Rectangle hit test
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
