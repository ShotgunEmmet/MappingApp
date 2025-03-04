// Initialize the canvas and set up event handlers
function initShapeCanvas(canvasElement, appState) {
  const ctx = canvasElement.getContext('2d');
  
  // Adjust canvas dimensions based on device pixel ratio
  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasElement.getBoundingClientRect();
    canvasElement.width = rect.width * dpr;
    canvasElement.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    canvasElement.style.width = `${rect.width}px`;
    canvasElement.style.height = `${rect.height}px`;
  }
  
  setupCanvas();
  window.addEventListener('resize', setupCanvas);
  
  // Mouse event handlers
  canvasElement.addEventListener('mousedown', handleMouseDown);
  canvasElement.addEventListener('mousemove', handleMouseMove);
  canvasElement.addEventListener('mouseup', handleMouseUp);
  canvasElement.addEventListener('mouseleave', handleMouseUp);
  
  // Touch event handlers for mobile
  canvasElement.addEventListener('touchstart', handleTouchStart);
  canvasElement.addEventListener('touchmove', handleTouchMove);
  canvasElement.addEventListener('touchend', handleTouchEnd);
  
  // Mouse event handlers
  function handleMouseDown(e) {
    const rect = canvasElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleInteractionStart(x, y);
  }
  
  function handleMouseMove(e) {
    const rect = canvasElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    handleInteractionMove(x, y);
  }
  
  function handleMouseUp() {
    handleInteractionEnd();
  }
  
  // Touch event handlers
  function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = canvasElement.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      
      handleInteractionStart(x, y);
    }
  }
  
  function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = canvasElement.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      
      handleInteractionMove(x, y);
    }
  }
  
  function handleTouchEnd() {
    handleInteractionEnd();
  }
  
  // Unified interaction handlers
  function handleInteractionStart(x, y) {
    // Store current state for undo before making changes
    if (window.historyManager) {
      window.historyManager.saveState();
    }
    
    if (appState.mode === 'delete') {
      // Check for connection first (have priority in delete mode)
      const conn = findConnectionAt(x, y, appState.connections, appState.shapes);
      if (conn) {
        deleteConnection(conn.id, appState);
        drawCanvas();
        return;
      }
      
      // If no connection was clicked, check for shape
      const shape = findShapeAt(x, y, appState.shapes);
      if (shape) {
        deleteShape(shape.id, appState);
        drawCanvas();
        return;
      }
    } else if (appState.mode === 'connect') {
      const shape = findShapeAt(x, y, appState.shapes);
      if (shape) {
        appState.connectionStart = shape;
        drawCanvas();
      }
    } else { // move mode
      const shape = findShapeAt(x, y, appState.shapes);
      appState.selectedShape = shape;
      
      // Store original position for undo
      if (shape) {
        shape.originalX = shape.x;
        shape.originalY = shape.y;
      }
      
      drawCanvas();
    }
  }
  
  function handleInteractionMove(x, y) {
    if (appState.mode === 'delete') {
      // Check if hovering over a connection
      const conn = findConnectionAt(x, y, appState.connections, appState.shapes);
      appState.hoveredConnection = conn;
      drawCanvas();
    } else if (appState.mode === 'move' && appState.selectedShape) {
      // Move the selected shape
      appState.selectedShape.x = x;
      appState.selectedShape.y = y;
      drawCanvas();
    } else if (appState.mode === 'connect' && appState.connectionStart) {
      // Just redraw to update the temporary connection line
      drawCanvas();
    }
  }
  
  function handleInteractionEnd() {
    if (appState.mode === 'connect' && appState.connectionStart) {
      const rect = canvasElement.getBoundingClientRect();
      
      // Get current mouse position
      const mouseX = appState.lastMouseX || 0;
      const mouseY = appState.lastMouseY || 0;
      
      const endShape = findShapeAt(mouseX, mouseY, appState.shapes);
      
      if (endShape && endShape.id !== appState.connectionStart.id) {
        // Map connection type to color
        connectionColor = '#EF4444';
        if (appState.connectionType.includes('blue')) { 
          connectionColor = '#3B82F6';
        } else if (appState.connectionType.includes('gray')) { 
          connectionColor = '#888888';
        } else {
          connectionColor = '#EF4444';
        }
        
        // Create the new connection
        const newConnection = {
          id: Date.now(),
          startId: appState.connectionStart.id,
          endId: endShape.id,
          color: connectionColor,
          type: appState.connectionType
        };
        appState.connections.push(newConnection);
      } else {
        // If no connection was made, discard the history entry
        if (window.historyManager) {
          window.historyManager.undo();
          window.historyManager.saveState();
        }
      }
      
      appState.connectionStart = null;
    } else if (appState.mode === 'move' && appState.selectedShape) {
      // If shape didn't actually move, discard the history entry
      if (appState.selectedShape.originalX === appState.selectedShape.x && 
          appState.selectedShape.originalY === appState.selectedShape.y) {
        if (window.historyManager) {
          window.historyManager.undo();
          window.historyManager.saveState();
        }
      }
    }
    
    appState.selectedShape = null;
    drawCanvas();
  }
  
  // Drawing function
  function drawCanvas() {
    // Store canvas dimensions for calculations
    const width = canvasElement.width / (window.devicePixelRatio || 1);
    const height = canvasElement.height / (window.devicePixelRatio || 1);
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Helper function to draw arrow
    function drawArrow(fromX, fromY, toX, toY, color, isDouble = false) {
      // Calculate points at 1/3 and 2/3 of the line for double arrows
      const firstArrowX = fromX + (toX - fromX) / 3;
      const firstArrowY = fromY + (toY - fromY) / 3;
      const secondArrowX = fromX + 2 * (toX - fromX) / 3;
      const secondArrowY = fromY + 2 * (toY - fromY) / 3;
      
      // Calculate the angle of the line
      const angle = Math.atan2(toY - fromY, toX - fromX);
      
      // Arrow properties
      const arrowLength = 10;
      const arrowWidth = Math.PI / 6; // 30 degrees
      
      if (isDouble) {
        // Draw first arrow
        ctx.beginPath();
        ctx.moveTo(
          firstArrowX - arrowLength * Math.cos(angle - arrowWidth),
          firstArrowY - arrowLength * Math.sin(angle - arrowWidth)
        );
        ctx.lineTo(firstArrowX, firstArrowY);
        ctx.lineTo(
          firstArrowX - arrowLength * Math.cos(angle + arrowWidth),
          firstArrowY - arrowLength * Math.sin(angle + arrowWidth)
        );
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw second arrow
        ctx.beginPath();
        ctx.moveTo(
          secondArrowX - arrowLength * Math.cos(angle - arrowWidth),
          secondArrowY - arrowLength * Math.sin(angle - arrowWidth)
        );
        ctx.lineTo(secondArrowX, secondArrowY);
        ctx.lineTo(
          secondArrowX - arrowLength * Math.cos(angle + arrowWidth),
          secondArrowY - arrowLength * Math.sin(angle + arrowWidth)
        );
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Draw single arrow at center
        const centerX = (fromX + toX) / 2;
        const centerY = (fromY + toY) / 2;
        
        ctx.beginPath();
        ctx.moveTo(
          centerX - arrowLength * Math.cos(angle - arrowWidth),
          centerY - arrowLength * Math.sin(angle - arrowWidth)
        );
        ctx.lineTo(centerX, centerY);
        ctx.lineTo(
          centerX - arrowLength * Math.cos(angle + arrowWidth),
          centerY - arrowLength * Math.sin(angle + arrowWidth)
        );
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    
    // Draw connections
    appState.connections.forEach(connection => {
      const startShape = appState.shapes.find(shape => shape.id === connection.startId);
      const endShape = appState.shapes.find(shape => shape.id === connection.endId);
      
      if (startShape && endShape) {
        // Draw the line
        ctx.beginPath();
        ctx.moveTo(startShape.x, startShape.y);
        ctx.lineTo(endShape.x, endShape.y);
        
        // Style for connections
        const connectionColor = appState.hoveredConnection && 
          appState.hoveredConnection.id === connection.id && 
          appState.mode === 'delete' ? '#EF4444' : connection.color;
        
        ctx.strokeStyle = connectionColor;
        ctx.lineWidth = appState.hoveredConnection && 
          appState.hoveredConnection.id === connection.id && 
          appState.mode === 'delete' ? 4 : 2;
        
        ctx.stroke();
        
        // Draw the arrow(s)
        const isDouble = connection.type === 'double-blue' || connection.type === 'double-red' || connection.type === 'double-gray';
        drawArrow(startShape.x, startShape.y, endShape.x, endShape.y, connectionColor, isDouble);
      }
    });
    
    // Draw temp connection line when creating new connection
    if (appState.connectionStart && appState.mode === 'connect') {
      const rect = canvasElement.getBoundingClientRect();
      const mouseX = appState.lastMouseX || 0;
      const mouseY = appState.lastMouseY || 0;
      
      ctx.beginPath();
      ctx.moveTo(appState.connectionStart.x, appState.connectionStart.y);
      ctx.lineTo(mouseX, mouseY);
      // Map connection type to color for temp line
      tempLineColor = '#EF4444';
        if (appState.connectionType.includes('blue')) { 
          tempLineColor = '#3B82F6';
        } else if (appState.connectionType.includes('gray')) { 
          tempLineColor = '#888888';
        } else {
          tempLineColor = '#EF4444';
        }
      ctx.strokeStyle = tempLineColor;
      ctx.setLineDash([5, 3]);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw temp arrow(s)
      const isDouble = appState.connectionType.startsWith('double-');
      drawArrow(appState.connectionStart.x, appState.connectionStart.y, mouseX, mouseY, tempLineColor, isDouble);
    }
    
    // Draw shapes
    appState.shapes.forEach(shape => {
      ctx.fillStyle = shape.color;
      
      if (shape.type === 'circle') {
        ctx.beginPath();
        ctx.arc(shape.x, shape.y, shape.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape.type === 'rectangle') {
        ctx.fillRect(
          shape.x - shape.width / 2,
          shape.y - shape.height / 2,
          shape.width,
          shape.height
        );
      } else if (shape.type === 'triangle') {
        const height = shape.height;
        const halfWidth = shape.width / 2;
        
        ctx.beginPath();
        ctx.moveTo(shape.x, shape.y - height / 2);
        ctx.lineTo(shape.x - halfWidth, shape.y + height / 2);
        ctx.lineTo(shape.x + halfWidth, shape.y + height / 2);
        ctx.closePath();
        ctx.fill();
      }
      
      // Highlight shapes
      if ((appState.selectedShape && shape.id === appState.selectedShape.id) || 
          (appState.mode === 'delete')) {
        ctx.strokeStyle = appState.mode === 'delete' ? '#EF4444' : '#000';
        ctx.lineWidth = 2;
        if (shape.type === 'circle') {
          ctx.beginPath();
          ctx.arc(shape.x, shape.y, shape.width / 2, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape.type === 'rectangle') {
          ctx.strokeRect(
            shape.x - shape.width / 2,
            shape.y - shape.height / 2,
            shape.width,
            shape.height
          );
        } else if (shape.type === 'triangle') {
          const height = shape.height;
          const halfWidth = shape.width / 2;
          
          ctx.beginPath();
          ctx.moveTo(shape.x, shape.y - height / 2);
          ctx.lineTo(shape.x - halfWidth, shape.y + height / 2);
          ctx.lineTo(shape.x + halfWidth, shape.y + height / 2);
          ctx.closePath();
          ctx.stroke();
        }
      }
    });
  }
  
  // Track mouse position for drawing the temp connection line
  canvasElement.addEventListener('mousemove', (e) => {
    const rect = canvasElement.getBoundingClientRect();
    appState.lastMouseX = e.clientX - rect.left;
    appState.lastMouseY = e.clientY - rect.top;
  });
  
  // Initial draw
  drawCanvas();
  
  // Expose redraw method
  window.redrawCanvas = drawCanvas;
}

// Delete a single connection
function deleteConnection(connectionId, appState) {
  appState.connections = appState.connections.filter(conn => conn.id !== connectionId);
}
