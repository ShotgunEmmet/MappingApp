// Initialize the canvas and set up event handlers
function initShapeCanvas(canvasElement, appState) {
  const ctx = canvasElement.getContext('2d');
  
  // Add hoveredShape to appState if it doesn't exist
  appState.hoveredShape = null;
  
  // Adjust canvas dimensions based on device pixel ratio and zoom level
  function setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvasElement.getBoundingClientRect();
    
    // Store original canvas dimensions if not already stored
    if (!appState.originalWidth) {
      appState.originalWidth = rect.width;
      appState.originalHeight = rect.height;
    }
    
    // Apply current zoom level if it exists
    const zoomLevel = appState.zoomLevel || 1.0;
    
    // Calculate zoomed dimensions
    const zoomedWidth = appState.originalWidth * zoomLevel;
    const zoomedHeight = appState.originalHeight * zoomLevel;
    
    canvasElement.width = zoomedWidth * dpr;
    canvasElement.height = zoomedHeight * dpr;
    
    // Set display size
    canvasElement.style.width = `${zoomedWidth}px`;
    canvasElement.style.height = `${zoomedHeight}px`;
    
    // Scale context according to device pixel ratio and zoom
    ctx.setTransform(dpr * zoomLevel, 0, 0, dpr * zoomLevel, 0, 0);
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
  
  // Convert window coordinates to canvas coordinates accounting for zoom
  function windowToCanvas(x, y) {
    const zoomLevel = appState.zoomLevel || 1.0;
    return {
      x: x / zoomLevel,
      y: y / zoomLevel
    };
  }
  
  // Mouse event handlers
  function handleMouseDown(e) {
    const rect = canvasElement.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Convert to canvas coordinates accounting for zoom
    const {x, y} = windowToCanvas(rawX, rawY);
    
    // Update last mouse position for connection end point
    appState.lastMouseX = x;
    appState.lastMouseY = y;
    
    handleInteractionStart(x, y);
  }
  
  function handleMouseMove(e) {
    const rect = canvasElement.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Convert to canvas coordinates accounting for zoom
    const {x, y} = windowToCanvas(rawX, rawY);
    
    handleInteractionMove(x, y);
  }
  
  function handleMouseUp(e) {
    if (e) {
      const rect = canvasElement.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      // Convert to canvas coordinates accounting for zoom
      const {x, y} = windowToCanvas(rawX, rawY);
      
      // Update last mouse position for connection end point
      appState.lastMouseX = x;
      appState.lastMouseY = y;
    }
    
    handleInteractionEnd();
  }
  
  // Touch event handlers
  function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = canvasElement.getBoundingClientRect();
      const rawX = e.touches[0].clientX - rect.left;
      const rawY = e.touches[0].clientY - rect.top;
      
      // Convert to canvas coordinates accounting for zoom
      const {x, y} = windowToCanvas(rawX, rawY);
      
      // Update last mouse position for connection end point
      appState.lastMouseX = x;
      appState.lastMouseY = y;
      
      handleInteractionStart(x, y);
    }
  }
  
  function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length > 0) {
      const rect = canvasElement.getBoundingClientRect();
      const rawX = e.touches[0].clientX - rect.left;
      const rawY = e.touches[0].clientY - rect.top;
      
      // Convert to canvas coordinates accounting for zoom
      const {x, y} = windowToCanvas(rawX, rawY);
      
      // Update last mouse position for connection end point
      appState.lastMouseX = x;
      appState.lastMouseY = y;
      
      handleInteractionMove(x, y);
    }
  }
  
  function handleTouchEnd(e) {
    // For touch end, we need to use the last known touch position
    // since there are no touch points in the touchend event
    handleInteractionEnd();
  }
  
  // Unified interaction handlers
  function handleInteractionStart(x, y) {
    // Store current state for undo before making changes
    if (window.historyManager) {
      window.historyManager.saveState();
    }
    
    if (appState.mode === 'delete') {
      // If no connection was clicked, check for shape
      const shape = findShapeAt(x, y, appState.shapes);
      if (shape) {
        deleteShape(shape.id, appState);
        drawCanvas();
        return;
      }
	  
      // Check for connection first (have priority in delete mode)
      const conn = findConnectionAt(x, y, appState.connections, appState.shapes);
      if (conn) {
        deleteConnection(conn.id, appState);
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
        
        // Store offset between mouse position and shape center
        appState.dragOffsetX = shape.x - x;
        appState.dragOffsetY = shape.y - y;
      }
      
      drawCanvas();
    }
  }
  
  function handleInteractionMove(x, y) {
    if (appState.mode === 'delete') {
      // Check if hovering over a shape
      const shape = findShapeAt(x, y, appState.shapes);
      appState.hoveredShape = shape;

      if(appState.hoveredShape === null) {
        // Check if hovering over a connection
        const conn = findConnectionAt(x, y, appState.connections, appState.shapes);
        appState.hoveredConnection = conn;
      } else {
        appState.hoveredConnection = null
      }

      drawCanvas();
    } else if (appState.mode === 'move' && appState.selectedShape) {
      // Move the selected shape
      appState.selectedShape.x = x + appState.dragOffsetX;
      appState.selectedShape.y = y + appState.dragOffsetY;
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
        
        // Check if a connection already exists in the same direction
        const existingConnection = sameDirectionConnectionExists(
          appState.connectionStart.id, 
          endShape.id, 
          appState.connections
        );
        
        if (existingConnection) {
          // Update the existing connection instead of creating a new one
          existingConnection.color = connectionColor;
          existingConnection.type = appState.connectionType;
        } else {
          // Create the new connection
          const newConnection = {
            id: Date.now(),
            startId: appState.connectionStart.id,
            endId: endShape.id,
            color: connectionColor,
            type: appState.connectionType
          };
          appState.connections.push(newConnection);
        }
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
    const width = appState.originalWidth || canvasElement.width / (window.devicePixelRatio || 1);
    const height = appState.originalHeight || canvasElement.height / (window.devicePixelRatio || 1);
    
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
        // Check if there's a connection in the opposite direction
        const oppositeConnection = oppositeDirectionConnectionExists(
          connection.startId, 
          connection.endId, 
          appState.connections
        );
        
        // Style for connections
        const connectionColor = appState.hoveredConnection && 
          appState.hoveredConnection.id === connection.id && 
          appState.mode === 'delete' ? '#EF4444' : connection.color;
        
        ctx.strokeStyle = connectionColor;
        ctx.lineWidth = appState.hoveredConnection && 
          appState.hoveredConnection.id === connection.id && 
          appState.mode === 'delete' ? 4 : 2;
        
        if (oppositeConnection) {
          // Draw curved line for bidirectional connections
          const dx = endShape.x - startShape.x;
          const dy = endShape.y - startShape.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Calculate perpendicular offset for the curve
          // The curve should bend to the left relative to the direction of the connection
          // Make the curve proportional to the distance between shapes
          // Closer shapes = more curved, further shapes = less curved
          const curveFactor = Math.min(0.5, 30 / distance); // Limit max curvature
          const offsetX = dy * curveFactor;
          const offsetY = -dx * curveFactor;
          
          // Control point for the quadratic curve
          const controlX = (startShape.x + endShape.x) / 2 + offsetX;
          const controlY = (startShape.y + endShape.y) / 2 + offsetY;
          
          // Draw the curved path
          ctx.beginPath();
          ctx.moveTo(startShape.x, startShape.y);
          ctx.quadraticCurveTo(
            controlX,
            controlY,
            endShape.x, 
            endShape.y
          );
          ctx.stroke();
          
          // Draw arrow on the curved path
          const isDouble = connection.type === 'double-blue' || connection.type === 'double-red' || connection.type === 'double-gray';
          
          // Arrow properties
          const arrowLength = 10;
          const arrowWidth = Math.PI / 6; // 30 degrees
          
          if (isDouble) {
            // Calculate positions for double arrows on the curve
            // First arrow at 1/3 of the curve
            const t1 = 1/3;
            // Calculate point on quadratic curve at t1
            const firstThirdX = Math.pow(1-t1, 2) * startShape.x + 
                               2 * (1-t1) * t1 * controlX + 
                               Math.pow(t1, 2) * endShape.x;
            const firstThirdY = Math.pow(1-t1, 2) * startShape.y + 
                               2 * (1-t1) * t1 * controlY + 
                               Math.pow(t1, 2) * endShape.y;
            
            // Calculate tangent at t1
            const tangentX1 = 2 * (1-t1) * (controlX - startShape.x) + 
                             2 * t1 * (endShape.x - controlX);
            const tangentY1 = 2 * (1-t1) * (controlY - startShape.y) + 
                             2 * t1 * (endShape.y - controlY);
            const angle1 = Math.atan2(tangentY1, tangentX1);
            
            // Second arrow at 2/3 of the curve
            const t2 = 2/3;
            // Calculate point on quadratic curve at t2
            const secondThirdX = Math.pow(1-t2, 2) * startShape.x + 
                                2 * (1-t2) * t2 * controlX + 
                                Math.pow(t2, 2) * endShape.x;
            const secondThirdY = Math.pow(1-t2, 2) * startShape.y + 
                                2 * (1-t2) * t2 * controlY + 
                                Math.pow(t2, 2) * endShape.y;
            
            // Calculate tangent at t2
            const tangentX2 = 2 * (1-t2) * (controlX - startShape.x) + 
                             2 * t2 * (endShape.x - controlX);
            const tangentY2 = 2 * (1-t2) * (controlY - startShape.y) + 
                             2 * t2 * (endShape.y - controlY);
            const angle2 = Math.atan2(tangentY2, tangentX2);
            
            // Draw first arrow
            ctx.beginPath();
            ctx.moveTo(
              firstThirdX - arrowLength * Math.cos(angle1 - arrowWidth),
              firstThirdY - arrowLength * Math.sin(angle1 - arrowWidth)
            );
            ctx.lineTo(firstThirdX, firstThirdY);
            ctx.lineTo(
              firstThirdX - arrowLength * Math.cos(angle1 + arrowWidth),
              firstThirdY - arrowLength * Math.sin(angle1 + arrowWidth)
            );
            ctx.strokeStyle = connectionColor;
            ctx.stroke();
            
            // Draw second arrow
            ctx.beginPath();
            ctx.moveTo(
              secondThirdX - arrowLength * Math.cos(angle2 - arrowWidth),
              secondThirdY - arrowLength * Math.sin(angle2 - arrowWidth)
            );
            ctx.lineTo(secondThirdX, secondThirdY);
            ctx.lineTo(
              secondThirdX - arrowLength * Math.cos(angle2 + arrowWidth),
              secondThirdY - arrowLength * Math.sin(angle2 + arrowWidth)
            );
            ctx.strokeStyle = connectionColor;
            ctx.stroke();
          } else {
            // Single arrow at midpoint (t = 0.5)
            const t = 0.5;
            // Calculate point on quadratic curve at t
            const midX = Math.pow(1-t, 2) * startShape.x + 
                        2 * (1-t) * t * controlX + 
                        Math.pow(t, 2) * endShape.x;
            const midY = Math.pow(1-t, 2) * startShape.y + 
                        2 * (1-t) * t * controlY + 
                        Math.pow(t, 2) * endShape.y;
            
            // Calculate tangent at t
            const tangentX = 2 * (1-t) * (controlX - startShape.x) + 
                            2 * t * (endShape.x - controlX);
            const tangentY = 2 * (1-t) * (controlY - startShape.y) + 
                            2 * t * (endShape.y - controlY);
            const angle = Math.atan2(tangentY, tangentX);
            
            // Draw arrow
            ctx.beginPath();
            ctx.moveTo(
              midX - arrowLength * Math.cos(angle - arrowWidth),
              midY - arrowLength * Math.sin(angle - arrowWidth)
            );
            ctx.lineTo(midX, midY);
            ctx.lineTo(
              midX - arrowLength * Math.cos(angle + arrowWidth),
              midY - arrowLength * Math.sin(angle + arrowWidth)
            );
            ctx.strokeStyle = connectionColor;
            ctx.stroke();
          }
        } else {
          // Draw straight line for unidirectional connections
          ctx.beginPath();
          ctx.moveTo(startShape.x, startShape.y);
          ctx.lineTo(endShape.x, endShape.y);
          ctx.stroke();
          
          // Draw the arrow(s)
          const isDouble = connection.type === 'double-blue' || connection.type === 'double-red' || connection.type === 'double-gray';
          drawArrow(startShape.x, startShape.y, endShape.x, endShape.y, connectionColor, isDouble);
        }
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
      
      // Highlight shapes - MODIFIED to only highlight hovered shapes in delete mode
      if ((appState.selectedShape && shape.id === appState.selectedShape.id) || 
          (appState.mode === 'delete' && appState.hoveredShape && shape.id === appState.hoveredShape.id)) {
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
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    
    // Convert to canvas coordinates accounting for zoom
    const {x, y} = windowToCanvas(rawX, rawY);
    
    appState.lastMouseX = x;
    appState.lastMouseY = y;
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