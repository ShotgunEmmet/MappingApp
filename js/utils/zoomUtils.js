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
        
        // Adjust pan to center the shapes
        appState.panX = (canvasCenter.x - shapesCenter.x) * appState.zoomLevel * dpr;
        appState.panY = (canvasCenter.y - shapesCenter.y) * appState.zoomLevel * dpr;
      }
      
      // Set up the transformation matrix with the zoom and pan values
      const ctx = canvasElement.getContext('2d');
      ctx.setTransform(
        dpr * appState.zoomLevel, 0, 
        0, dpr * appState.zoomLevel, 
        dpr * appState.panX, dpr * appState.panY
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
    function setZoomLevel(newZoom, centerX, centerY) {
      // Constrain zoom level between min and max
      const oldZoom = appState.zoomLevel;
      const constrainedNewZoom = Math.max(appState.minZoom, Math.min(appState.maxZoom, newZoom));
      
      // If center coordinates are provided, zoom to that point
      if (centerX !== undefined && centerY !== undefined) {
        // Calculate how the point moves due to the zoom change
        const zoomRatio = constrainedNewZoom / oldZoom;
        
        // Adjust pan to keep the point under the mouse
        appState.panX = centerX - (centerX - appState.panX) * zoomRatio;
        appState.panY = centerY - (centerY - appState.panY) * zoomRatio;
      }
      
      appState.zoomLevel = constrainedNewZoom;
      applyZoom();
    }
    
    // Zoom in button handler
    function zoomIn() {
      // Zoom into the center of the canvas
      const centerX = appState.originalWidth / 2;
      const centerY = appState.originalHeight / 2;
      setZoomLevel(appState.zoomLevel * 1.1, centerX, centerY);
    }
    
    // Zoom out button handler
    function zoomOut() {
      // Zoom out from the center of the canvas
      const centerX = appState.originalWidth / 2;
      const centerY = appState.originalHeight / 2;
      const newZoom = appState.zoomLevel / 1.1;
      
      // If zooming to minimum, center the content
      if (newZoom <= appState.minZoom) {
        setZoomLevel(appState.minZoom);
      } else {
        setZoomLevel(newZoom, centerX, centerY);
      }
    }
    
    // Mouse wheel zoom handler
    function handleMouseWheel(e) {
      e.preventDefault();
      
      // Get mouse position relative to canvas in original coordinates
      const rect = canvasElement.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) / appState.zoomLevel;
      const mouseY = (e.clientY - rect.top) / appState.zoomLevel;
      
      // Determine zoom direction based on wheel delta
      const zoomDirection = e.deltaY < 0 ? 1 : -1;
      const zoomFactor = 1.1;
      
      // Calculate new zoom level
      const newZoom = zoomDirection > 0 ? 
        appState.zoomLevel * zoomFactor : 
        appState.zoomLevel / zoomFactor;
      
      // If zooming to minimum, center the content
      if (newZoom <= appState.minZoom && zoomDirection < 0) {
        setZoomLevel(appState.minZoom);
      } else {
        setZoomLevel(newZoom, mouseX, mouseY);
      }
    }
    
    // Pan the canvas when dragging with middle mouse button or with space key held
    let isPanning = false;
    let lastPanX = 0;
    let lastPanY = 0;
    
    function startPan(x, y) {
      isPanning = true;
      lastPanX = x;
      lastPanY = y;
      canvasElement.style.cursor = 'grabbing';
    }
    
    function updatePan(x, y) {
      if (!isPanning) return;
      
      // Calculate the difference
      const dx = (x - lastPanX) / appState.zoomLevel;
      const dy = (y - lastPanY) / appState.zoomLevel;
      
      // Update pan values
      appState.panX += dx;
      appState.panY += dy;
      
      // Update last position
      lastPanX = x;
      lastPanY = y;
      
      applyZoom();
    }
    
    function endPan() {
      isPanning = false;
      canvasElement.style.cursor = 'default';
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
        const centerX = appState.originalWidth / 2;
        const centerY = appState.originalHeight / 2;
        setZoomLevel(zoomSlider.value / 100, centerX, centerY);
      });
    }
    
    // Set up zoom buttons event handlers
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    
    if (zoomInBtn) zoomInBtn.addEventListener('click', zoomIn);
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', zoomOut);
    
    // Add a double-click handler to quickly center content
    canvasContainer.addEventListener('dblclick', (e) => {
      // Only if not on a shape
      const rect = canvasElement.getBoundingClientRect();
      const rawX = e.clientX - rect.left;
      const rawY = e.clientY - rect.top;
      
      // Convert to canvas coordinates
      const x = rawX / appState.zoomLevel;
      const y = rawY / appState.zoomLevel;
      
      // Check if the click is on a shape
      const clickedShape = window.findShapeAt?.(x, y, appState.shapes);
      
    });
    
    // Initialize zoom
    applyZoom();
    
    // Add a keyboard shortcut to center content (c key)
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyC' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Check if not in a text input field
        const activeElement = document.activeElement;
        const isInputActive = activeElement.tagName === 'INPUT' || 
                            activeElement.tagName === 'TEXTAREA' || 
                            activeElement.tagName === 'SELECT';
        
        if (!isInputActive) {
          e.preventDefault();
        }
      }
    });
    
    // Expose zoom functions
    return {
      zoomIn,
      zoomOut,
      setZoomLevel,
      applyZoom
    };
  }
  
  // Export for use in other modules
  window.initZoomControls = initZoomControls;