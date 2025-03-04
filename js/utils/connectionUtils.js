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

// Check if a connection already exists between two shapes
function connectionExists(startId, endId, connections) {
  return connections.some(
    conn => (conn.startId === startId && conn.endId === endId) || 
            (conn.startId === endId && conn.endId === startId)
  );
}