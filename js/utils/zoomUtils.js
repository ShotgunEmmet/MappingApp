// Initialize and manage canvas zoom functionality
function initZoomControls(canvasElement, appState) {
  // Add zoom property to appState if it doesn't exist
  appState.zoomLevel = 1.0; // 100% zoom
  appState.minZoom = 1.0; // 100% minimum zoom
  appState.maxZoom = 4.0;  // 400% maximum zoom
  appState.panX = 0; // Pan offset X
  appState.panY = 0; // Pan offset Y
  
  const zoomSlider = document.getElementById('zoom-slider');
  const zoomPercentage = document.getElementById('zoom-percentage');
  const canvasContainer = document.querySelector('.canvas-container');
  
  // Get container dimensions
  const containerWidth = canvasContainer.clientWidth;
  const containerHeight = canvasContainer.clientHeight;
  
  // Store original dimensions
  appState.originalWidth = 1200; // Match the fixed width in CSS
  appState.originalHeight = 600; // Match the fixed height in CSS
  
  // Calculate the virtual center of all shapes
  function calculateShapesCenter() {
    if (!appState.shapes || appState.shapes.length === 0) {
      return { x: appState.originalWidth / 2, y: appState.originalHeight / 2 };
    }
    
    // Calculate the bounding box of all shapes
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    appState.shapes.forEach(shape => {
      const halfWidth = shape.width / 2;
      const halfHeight = shape.height / 2;
      
      minX = Math.min(minX, shape.x - halfWidth);
      minY = Math.min(minY, shape.y - halfHeight);
      maxX = Math.max(maxX, shape.x + halfWidth);
      maxY = Math.max(maxY, shape.y + halfHeight);
    });
    
    // If there are no shapes, use canvas center
    if (minX === Infinity) {
      return { x: appState.originalWidth / 2, y: appState.originalHeight / 2 };
    }
    
    return {
      x: (minX + maxX) / 2,
      y: (minY + maxY) / 2
    };
  }
  
  // Convert screen/client coordinates to canvas/world coordinates
  function clientToCanvas(clientX, clientY) {
    const rect = canvasElement.getBoundingClientRect();
    const x = (clientX - rect.left) / appState.zoomLevel;
    const y = (clientY - rect.top) / appState.zoomLevel;
    return { x, y };
  }
  
  // Convert canvas/world coordinates to screen coordinates
  function canvasToClient(canvasX, canvasY) {
    const rect = canvasElement.getBoundingClientRect();
    const x = (canvasX * appState.zoomLevel) + rect.left;
    const y = (canvasY * appState.zoomLevel) + rect.top;
    return { x, y };
  }
  
  // Convert window/client coordinates to canvas coordinates accounting for zoom and pan
  function windowToCanvas(clientX, clientY) {
    const rect = canvasElement.getBoundingClientRect();
    const scaleX = canvasElement.width / rect.width;
    const scaleY = canvasElement.height / rect.height;
    
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    
    // Adjust for zoom and pan
    return {
      x: (canvasX / (appState.zoomLevel * window.devicePixelRatio)) - (appState.panX / window.devicePixelRatio),
      y: (canvasY / (appState.zoomLevel * window.devicePixelRatio)) - (appState.panY / window.devicePixelRatio)
    };
  }
  
  // Update canvas dimensions and redraw based on zoom level
  function applyZoom() {
    const dpr = window.devicePixelRatio || 1;
    
    // Calculate zoomed dimensions
    const zoomedWidth = appState.originalWidth * appState.zoomLevel;
    const zoomedHeight = appState.originalHeight * appState.zoomLevel;
    
    // Update canvas size for rendering
    canvasElement.width = zoomedWidth * dpr;
    canvasElement.height = zoomedHeight * dpr;
    
    // Set display size
    canvasElement.style.width = `${zoomedWidth}px`;
    canvasElement.style.height = `${zoomedHeight}px`;
    
    // Calculate center position to ensure canvas is always centered
    // when zoomed out smaller than container
    let leftPosition = 0;
    let topPosition = 0;
    
    if (zoomedWidth < containerWidth) {
      leftPosition = (containerWidth - zoomedWidth) / 2;
    }
    
    if (zoomedHeight < containerHeight) {
      topPosition = (containerHeight - zoomedHeight) / 2;
    }
    
    // Position the canvas
    canvasElement.style.left = `${leftPosition}px`;
    canvasElement.style.top = `${topPosition}px`;
    
    // When zoomed out to minimum, center the content
    if (appState.zoomLevel === appState.minZoom) {
      const shapesCenter = calculateShapesCenter();
      const canvasCenter = { 
        x: appState.originalWidth / 2, 
        y: appState.originalHeight / 2 
      };
      
      // Reset pan to center the shapes
      appState.panX = 0;
      appState.panY = 0;
    }
    
    // Set up the transformation matrix with the zoom and pan values
    const ctx = canvasElement.getContext('2d');
    ctx.setTransform(
      dpr * appState.zoomLevel, 0, 
      0, dpr * appState.zoomLevel, 
      appState.panX * dpr, appState.panY * dpr
    );
    
    // Update UI to reflect current zoom level
    if (zoomPercentage) {
      zoomPercentage.textContent = `${Math.round(appState.zoomLevel * 100)}%`;
    }
    
    if (zoomSlider) {
      zoomSlider.value = appState.zoomLevel * 100;
    }
    
    // Redraw the canvas with the new zoom level
    window.redrawCanvas();
  }
  
  // Change zoom level with bounds checking, centered on the given point
  function setZoomLevel(newZoom, clientX, clientY) {
    // Constrain zoom level between min and max
    const oldZoom = appState.zoomLevel;
    const constrainedNewZoom = Math.max(appState.minZoom, Math.min(appState.maxZoom, newZoom));
    
    // If we're zooming to minimum, reset pan and center the content
    if (constrainedNewZoom === appState.minZoom && oldZoom !== appState.minZoom) {
      appState.zoomLevel = constrainedNewZoom;
      appState.panX = 0;
      appState.panY = 0;
      applyZoom();
      return;
    }
    
    // If client coordinates are provided, zoom relative to those coordinates
    if (clientX !== undefined && clientY !== undefined) {
      // Get the canvas rectangle
      const rect = canvasElement.getBoundingClientRect();
      
      // Calculate the mouse position relative to the canvas in canvas coordinates
      // This is the point that should stay fixed during the zoom
      const mouseXBeforeZoom = (clientX - rect.left) / oldZoom;
      const mouseYBeforeZoom = (clientY - rect.top) / oldZoom;
      
      // Calculate what the new position would be after zoom if we didn't adjust the pan
      const mouseXAfterZoom = (clientX - rect.left) / constrainedNewZoom;
      const mouseYAfterZoom = (clientY - rect.top) / constrainedNewZoom;
      
      // Update the zoom level
      appState.zoomLevel = constrainedNewZoom;
      
      // Adjust the pan to keep the point under the mouse fixed
      // The pan needs to be scaled by the devicePixelRatio
      const dpr = window.devicePixelRatio || 1;
      appState.panX += (mouseXAfterZoom - mouseXBeforeZoom) * constrainedNewZoom * dpr;
      appState.panY += (mouseYAfterZoom - mouseYBeforeZoom) * constrainedNewZoom * dpr;
    } else {
      // If no center is specified, just update the zoom level (zoom to center)
      appState.zoomLevel = constrainedNewZoom;
    }
    
    applyZoom();
  }
  
  // Zoom in button handler
  function zoomIn() {
    // Zoom into the center of the canvas
    const centerX = canvasElement.getBoundingClientRect().width / 2 + canvasElement.getBoundingClientRect().left;
    const centerY = canvasElement.getBoundingClientRect().height / 2 + canvasElement.getBoundingClientRect().top;
    setZoomLevel(appState.zoomLevel * 1.2, centerX, centerY);
  }
  
  // Zoom out button handler
  function zoomOut() {
    // Zoom out from the center of the canvas
    const centerX = canvasElement.getBoundingClientRect().width / 2 + canvasElement.getBoundingClientRect().left;
    const centerY = canvasElement.getBoundingClientRect().height / 2 + canvasElement.getBoundingClientRect().top;
    setZoomLevel(appState.zoomLevel / 1.2, centerX, centerY);
  }
  
  // Mouse wheel zoom handler
  function handleMouseWheel(e) {
    e.preventDefault();
    
    // Use the client coordinates directly for zoom centering
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    // Determine zoom direction based on wheel delta
    const zoomDirection = e.deltaY < 0 ? 1 : -1;
    const zoomFactor = 1.1;
    
    // Calculate new zoom level
    const newZoom = zoomDirection > 0 ? 
      appState.zoomLevel * zoomFactor : 
      appState.zoomLevel / zoomFactor;
    
    setZoomLevel(newZoom, clientX, clientY);
  }
  
  // Pan the canvas when dragging with middle mouse button or with space key held
  let isPanning = false;
  let lastClientX = 0;
  let lastClientY = 0;
  
  function startPan(x, y) {
    isPanning = true;
    lastClientX = x;
    lastClientY = y;
    canvasElement.style.cursor = 'grabbing';
  }
  
  function updatePan(x, y) {
    if (!isPanning) return;
    
    // Calculate the difference in client coordinates
    const dx = x - lastClientX;
    const dy = y - lastClientY;
    
    // Apply the pan directly in screen space
    const dpr = window.devicePixelRatio || 1;
    appState.panX += dx * dpr;
    appState.panY += dy * dpr;
    
    // Update last position
    lastClientX = x;
    lastClientY = y;
    
    applyZoom();
  }
  
  function endPan() {
    isPanning = false;
    canvasElement.style.cursor = appState.isSpaceKeyDown ? 'grab' : 'default';
  }
  
  // Add pan event handlers
  canvasElement.addEventListener('mousedown', (e) => {
    // Middle mouse button (button 1) or holding space key
    if (e.button === 1 || (e.button === 0 && appState.isSpaceKeyDown)) {
      e.preventDefault();
      startPan(e.clientX, e.clientY);
    }
  });
  
  canvasElement.addEventListener('mousemove', (e) => {
    if (isPanning) {
      e.preventDefault();
      updatePan(e.clientX, e.clientY);
    }
  });
  
  window.addEventListener('mouseup', () => {
    if (isPanning) {
      endPan();
    }
  });
  
  // Handle space key for panning
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      appState.isSpaceKeyDown = true;
      canvasElement.style.cursor = 'grab';
    }
  });
  
  window.addEventListener('keyup', (e) => {
    if (e.code === 'Space') {
      appState.isSpaceKeyDown = false;
      canvasElement.style.cursor = isPanning ? 'grabbing' : 'default';
    }
  });
  
  // Handle window resize to reapply zoom
  window.addEventListener('resize', () => {
    // Small delay to ensure container dimensions are updated
    setTimeout(applyZoom, 100);
  });
  
  // Set up event handlers
  canvasElement.addEventListener('wheel', handleMouseWheel);
  
  // Set up slider event handler
  if (zoomSlider) {
    zoomSlider.addEventListener('input', () => {
      const centerX = canvasElement.getBoundingClientRect().width / 2 + canvasElement.getBoundingClientRect().left;
      const centerY = canvasElement.getBoundingClientRect().height / 2 + canvasElement.getBoundingClientRect().top;
      setZoomLevel(zoomSlider.value / 100, centerX, centerY);
    });
  }
  
  // Set up zoom buttons event handlers
  const zoomInBtn = document.getElementById('zoom-in-btn');
  const zoomOutBtn = document.getElementById('zoom-out-btn');
  
  if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
  if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
  
  // Add a double-click handler to reset zoom
  canvasContainer.addEventListener('dblclick', (e) => {
    // Only if not on a shape
    const coords = windowToCanvas(e.clientX, e.clientY);
    
    // Check if the click is on a shape
    const clickedShape = window.findShapeAt?.(coords.x, coords.y, appState.shapes);
    
    if (!clickedShape) {
      // Reset zoom to 100% and center on the double-click point
      setZoomLevel(1.0, e.clientX, e.clientY);
    }
  });
  
  // Add a keyboard shortcut to reset zoom (R key)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Check if not in a text input field
      const activeElement = document.activeElement;
      const isInputActive = activeElement.tagName === 'INPUT' || 
                          activeElement.tagName === 'TEXTAREA' || 
                          activeElement.tagName === 'SELECT';
      
      if (!isInputActive) {
        e.preventDefault();
        // Reset zoom to 100% centered on the canvas
        const centerX = canvasElement.getBoundingClientRect().width / 2 + canvasElement.getBoundingClientRect().left;
        const centerY = canvasElement.getBoundingClientRect().height / 2 + canvasElement.getBoundingClientRect().top;
        setZoomLevel(1.0, centerX, centerY);
      }
    }
  });
  
  // Initialize zoom
  applyZoom();
  
  // Expose zoom functions and coordinate conversion
  return {
    zoomIn,
    zoomOut,
    setZoomLevel,
    applyZoom,
    windowToCanvas
  };
}

// Export for use in other modules
window.initZoomControls = initZoomControls;