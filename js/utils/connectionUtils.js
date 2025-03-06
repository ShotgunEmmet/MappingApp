// Create a new connection between shapes
function createConnection(startShape, endShape, color) {
  if (!startShape || !endShape || startShape.id === endShape.id) {
    return null;
  }
  
  return {
    id: Date.now(),
    startId: startShape.id,
    endId: endShape.id,
    color: color
  };
}

// Check if a connection already exists between two shapes in any direction
function connectionExists(startId, endId, connections) {
  return connections.some(
    conn => (conn.startId === startId && conn.endId === endId) || 
            (conn.startId === endId && conn.endId === startId)
  );
}

// Check if a connection exists in the exact same direction
function sameDirectionConnectionExists(startId, endId, connections) {
  return connections.find(conn => conn.startId === startId && conn.endId === endId);
}

// Check if a connection exists in the opposite direction
function oppositeDirectionConnectionExists(startId, endId, connections) {
  return connections.find(conn => conn.startId === endId && conn.endId === startId);
}

// Find all connections between two shapes
function findConnectionsBetweenShapes(shape1Id, shape2Id, connections) {
  return connections.filter(
    conn => (conn.startId === shape1Id && conn.endId === shape2Id) || 
            (conn.startId === shape2Id && conn.endId === shape1Id)
  );
}

// Find a connection at a specific point
function findConnectionAt(x, y, connections, shapes) {
  // Threshold for how close the point needs to be to the line
  const threshold = 5;
  
  for (const connection of connections) {
    const startShape = shapes.find(shape => shape.id === connection.startId);
    const endShape = shapes.find(shape => shape.id === connection.endId);
    
    if (!startShape || !endShape) continue;
    
    // Check if there's a connection in the opposite direction
    const oppositeConnection = oppositeDirectionConnectionExists(
      connection.startId, 
      connection.endId, 
      connections
    );
    
    if (oppositeConnection) {
      // For curved connections, use a simplified approach to check proximity
      // Calculate the control point for the quadratic curve
      const dx = endShape.x - startShape.x;
      const dy = endShape.y - startShape.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate perpendicular offset for the curve (same as in drawing)
      // Make the curve proportional to the distance between shapes
      const curveFactor = Math.min(0.5, 50 / distance); // Limit max curvature
      const offsetX = -dy * curveFactor;
      const offsetY = dx * curveFactor;
      
      const controlX = (startShape.x + endShape.x) / 2 + offsetX;
      const controlY = (startShape.y + endShape.y) / 2 + offsetY;
      
      // Check distance to the control point as a simple approximation
      // This isn't perfect but works reasonably well for user interaction
      const distToControl = Math.sqrt(
        Math.pow(x - controlX, 2) + Math.pow(y - controlY, 2)
      );
      
      // Check distance to the start and end points
      const distToStart = Math.sqrt(
        Math.pow(x - startShape.x, 2) + Math.pow(y - startShape.y, 2)
      );
      
      const distToEnd = Math.sqrt(
        Math.pow(x - endShape.x, 2) + Math.pow(y - endShape.y, 2)
      );
      
      // Check if the point is close to the curve
      // This is a simplified check that works well enough for user interaction
      if (distToControl < threshold * 3 || 
          distToStart < threshold || 
          distToEnd < threshold) {
        return connection;
      }
    } else {
      // For straight lines, use the standard point-to-line distance formula
      const dx = endShape.x - startShape.x;
      const dy = endShape.y - startShape.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      // Avoid division by zero
      if (length === 0) continue;
      
      // Calculate the distance from the point to the line
      const distance = Math.abs(
        (dy * x - dx * y + endShape.x * startShape.y - endShape.y * startShape.x) / length
      );
      
      // Check if the point is close enough to the line
      if (distance <= threshold) {
        // Make sure the point is between the start and end points (or close to them)
        const dotProduct = 
          ((x - startShape.x) * dx + (y - startShape.y) * dy) / (length * length);
        
        if (dotProduct >= -0.1 && dotProduct <= 1.1) {
          return connection;
        }
      }
    }
  }
  
  return null;
}
