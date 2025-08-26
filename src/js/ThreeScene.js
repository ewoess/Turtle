import * as THREE from 'three';

export class ThreeScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Zoom state - now infinite
    this.zoomLevel = 1.0;
    this.minZoom = 0.001; // Much smaller minimum for infinite zoom out
    this.maxZoom = 1000.0; // Much larger maximum for infinite zoom in
    this.zoomFactor = 0.1; // 10% change per wheel step for consistent zooming
    
    // Pan state
    this.isPanning = false;
    this.panStart = { x: 0, y: 0 };
    this.panStartCamera = { x: 0, y: 0 };
    
    this.setupRenderer();
    this.setupGrid();
    this.setupCamera();
    this.setupTurtle();
    this.setupDrawing();
    
    this.setupResizeHandler();
    this.setupZoomControls();
    
    // Now that everything is set up, update the grid to match the initial zoom
    this.updateGrid();
  }

  setupCamera() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    // Ensure top-down view (looking straight down the Z-axis)
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
    this.camera.up.set(0, 1, 0); // Y-axis is up
    
    // Set initial camera bounds without updating grid (grid not ready yet)
    this.updateCameraBounds();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.getWidth(), this.getHeight());
    this.container.appendChild(this.renderer.domElement);
  }

  setupGrid() {
    // Create initial grid - will be updated dynamically
    this.grid = new THREE.GridHelper(400, 40, 0x112233, 0x0b1624);
    this.grid.rotation.x = Math.PI/2; // make it 2D (XZ-> XY)
    this.scene.add(this.grid);
    
    // Create prominent main axes (X and Y)
    this.createMainAxes();
    
    this.gridVisible = true;
  }

  createMainAxes() {
    // Create a group for the main axes
    this.mainAxesGroup = new THREE.Group();
    
    // X-axis (horizontal) - bright red
    const xAxisGeometry = new THREE.BufferGeometry();
    const xAxisVertices = new Float32Array([
      -200, 0, 0,  // Start at left edge
      200, 0, 0    // End at right edge
    ]);
    xAxisGeometry.setAttribute('position', new THREE.BufferAttribute(xAxisVertices, 3));
    const xAxisMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff4444,  // Bright red
      linewidth: 3      // Thicker line
    });
    this.xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
    this.mainAxesGroup.add(this.xAxis);
    
    // Y-axis (vertical) - bright blue
    const yAxisGeometry = new THREE.BufferGeometry();
    const yAxisVertices = new Float32Array([
      0, -200, 0,  // Start at bottom edge
      0, 200, 0    // End at top edge
    ]);
    yAxisGeometry.setAttribute('position', new THREE.BufferAttribute(yAxisVertices, 3));
    const yAxisMaterial = new THREE.LineBasicMaterial({ 
      color: 0x4444ff,  // Bright blue
      linewidth: 3      // Thicker line
    });
    this.yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
    this.mainAxesGroup.add(this.yAxis);
    
    this.scene.add(this.mainAxesGroup);
    this.mainAxesVisible = true;
  }

  setupTurtle() {
    this.turtleGroup = new THREE.Group();
    const triGeom = new THREE.BufferGeometry();
    // Smaller turtle size for the fixed viewport
    const size = 4;
    const verts = new Float32Array([
      0, size, 0,
      -size*0.6, -size*0.8, 0,
      size*0.6, -size*0.8, 0,
    ]);
    triGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    const triMat = new THREE.MeshBasicMaterial({ color: 0x7fffd4 });
    this.turtleMesh = new THREE.Mesh(triGeom, triMat);
    this.turtleGroup.add(this.turtleMesh);
    this.scene.add(this.turtleGroup);
  }

  setupDrawing() {
    this.lineGeom = new THREE.BufferGeometry();
    this.maxSegments = 20000;
    this.positions = new Float32Array(this.maxSegments * 2 * 3);
    this.colorsArr = new Float32Array(this.maxSegments * 2 * 3);
    this.segCount = 0;
    this.currentPenSize = 6; // Track current pen size
    
    this.lineGeom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.lineGeom.setAttribute('color', new THREE.BufferAttribute(this.colorsArr, 3));
    this.lineGeom.setDrawRange(0, 0);
    
    // Use LineSegments2 for thick lines that work properly
    this.lineMat = new THREE.LineBasicMaterial({ vertexColors: true });
    this.lineMesh = new THREE.LineSegments(this.lineGeom, this.lineMat);
    this.scene.add(this.lineMesh);
    
    // Path-based drawing for continuous thick lines
    this.pathVertices = [];
    this.pathColors = [];
    this.pathGroup = new THREE.Group();
    this.scene.add(this.pathGroup);
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => this.onResize());
  }

  setupZoomControls() {
    // Mouse wheel zoom with mouse focus
    this.container.addEventListener('wheel', (event) => {
      event.preventDefault();
      const zoomDelta = event.deltaY > 0 ? -this.zoomFactor : this.zoomFactor;
      this.zoomAtMouse(event, zoomDelta);
    });

    // Touch zoom (pinch to zoom)
    let initialDistance = 0;
    this.container.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        initialDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
      }
    });

    this.container.addEventListener('touchmove', (event) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const currentDistance = Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY
        );
        const zoomDelta = (currentDistance - initialDistance) * 0.005;
        this.zoom(zoomDelta);
        initialDistance = currentDistance;
      }
    });

    // Pan controls (middle mouse button drag)
    this.setupPanControls();
  }

  setupPanControls() {
    // Middle mouse button pan (button 1 is middle mouse)
    this.container.addEventListener('mousedown', (event) => {
      if (event.button === 1) { // Middle mouse button
        event.preventDefault();
        this.startPan(event);
      }
    });

    this.container.addEventListener('mousemove', (event) => {
      if (this.isPanning) {
        event.preventDefault();
        this.updatePan(event);
      }
    });

    this.container.addEventListener('mouseup', (event) => {
      if (event.button === 1) { // Middle mouse button
        event.preventDefault();
        this.endPan();
      }
    });

    // Prevent context menu on middle mouse button
    this.container.addEventListener('contextmenu', (event) => {
      if (event.button === 1) {
        event.preventDefault();
      }
    });

    // Touch pan support (single finger drag)
    let touchStartX = 0, touchStartY = 0;
    let touchStartCameraX = 0, touchStartCameraY = 0;
    let isTouchPanning = false;

    this.container.addEventListener('touchstart', (event) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchStartCameraX = this.camera.position.x;
        touchStartCameraY = this.camera.position.y;
        isTouchPanning = true;
      }
    });

    this.container.addEventListener('touchmove', (event) => {
      if (event.touches.length === 1 && isTouchPanning) {
        event.preventDefault();
        const touch = event.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Convert screen delta to world delta
        const rect = this.container.getBoundingClientRect();
        const worldDeltaX = (deltaX / rect.width) * (this.camera.right - this.camera.left);
        const worldDeltaY = (deltaY / rect.height) * (this.camera.top - this.camera.bottom);
        
        this.camera.position.x = touchStartCameraX - worldDeltaX;
        this.camera.position.y = touchStartCameraY + worldDeltaY;
        this.camera.lookAt(this.camera.position.x, this.camera.position.y, 0);
      }
    });

    this.container.addEventListener('touchend', (event) => {
      if (event.touches.length === 0) {
        isTouchPanning = false;
      }
    });

    // Touchpad pan support (two-finger drag)
    let touchpadStartX = 0, touchpadStartY = 0;
    let touchpadStartCameraX = 0, touchpadStartCameraY = 0;
    let isTouchpadPanning = false;

    this.container.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        // Two-finger touch - could be pan or zoom
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // Calculate center point and distance
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        
        // Store initial state
        touchpadStartX = centerX;
        touchpadStartY = centerY;
        touchpadStartCameraX = this.camera.position.x;
        touchpadStartCameraY = this.camera.position.y;
        isTouchpadPanning = true;
      }
    });

    this.container.addEventListener('touchmove', (event) => {
      if (event.touches.length === 2 && isTouchpadPanning) {
        event.preventDefault();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        
        // Calculate current center point
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        
        const deltaX = centerX - touchpadStartX;
        const deltaY = centerY - touchpadStartY;
        
        // Convert screen delta to world delta
        const rect = this.container.getBoundingClientRect();
        const worldDeltaX = (deltaX / rect.width) * (this.camera.right - this.camera.left);
        const worldDeltaY = (deltaY / rect.height) * (this.camera.top - this.camera.bottom);
        
        this.camera.position.x = touchpadStartCameraX - worldDeltaX;
        this.camera.position.y = touchpadStartCameraY + worldDeltaY;
        this.camera.lookAt(this.camera.position.x, this.camera.position.y, 0);
      }
    });

    this.container.addEventListener('touchend', (event) => {
      if (event.touches.length < 2) {
        isTouchpadPanning = false;
      }
    });

    // Alternative: Right-click + drag for panning (common in CAD software)
    this.container.addEventListener('mousedown', (event) => {
      if (event.button === 2) { // Right mouse button
        event.preventDefault();
        this.startPan(event);
      }
    });

    this.container.addEventListener('mouseup', (event) => {
      if (event.button === 2) { // Right mouse button
        event.preventDefault();
        this.endPan();
      }
    });

    // Prevent context menu on right-click
    this.container.addEventListener('contextmenu', (event) => {
      event.preventDefault();
    });
  }

  startPan(event) {
    this.isPanning = true;
    this.panStart.x = event.clientX;
    this.panStart.y = event.clientY;
    this.panStartCamera.x = this.camera.position.x;
    this.panStartCamera.y = this.camera.position.y;
    
    // Change cursor to indicate panning
    this.container.style.cursor = 'grabbing';
  }

  updatePan(event) {
    if (!this.isPanning) return;
    
    const deltaX = event.clientX - this.panStart.x;
    const deltaY = event.clientY - this.panStart.y;
    
    // Convert screen delta to world delta
    const rect = this.container.getBoundingClientRect();
    const worldDeltaX = (deltaX / rect.width) * (this.camera.right - this.camera.left);
    const worldDeltaY = (deltaY / rect.height) * (this.camera.top - this.camera.bottom);
    
    // Update camera position
    this.camera.position.x = this.panStartCamera.x - worldDeltaX;
    this.camera.position.y = this.panStartCamera.y + worldDeltaY;
    this.camera.lookAt(this.camera.position.x, this.camera.position.y, 0);
  }

  endPan() {
    this.isPanning = false;
    
    // Restore cursor
    this.container.style.cursor = 'default';
  }

  resetView() {
    // Reset camera to center on origin
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
    this.camera.up.set(0, 1, 0);
    
    // Update camera bounds to match current zoom
    this.updateCameraBounds();
  }

  zoom(delta) {
    // Use multiplicative zooming for consistency with mouse zoom
    const zoomMultiplier = 1 + delta;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel * zoomMultiplier));
    
    // Only apply zoom if the change is significant enough
    const zoomChange = Math.abs(newZoom - this.zoomLevel) / this.zoomLevel;
    if (zoomChange > 0.001 && newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      this.updateCamera();
      this.updateZoomSlider();
    }
  }

  zoomAtMouse(event, delta) {
    // Get mouse position in normalized device coordinates (-1 to +1)
    const rect = this.container.getBoundingClientRect();
    const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Calculate the world position under the mouse before zoom
    const vector = new THREE.Vector3(mouseX, mouseY, 0);
    vector.unproject(this.camera);
    vector.z = 0; // Set to 0 since we're in 2D
    
    // Use multiplicative zooming for consistent behavior
    const zoomMultiplier = 1 + delta; // delta is now a factor like 0.1 or -0.1
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel * zoomMultiplier));
    
    // Only apply zoom if the change is significant enough
    const zoomChange = Math.abs(newZoom - this.zoomLevel) / this.zoomLevel;
    if (zoomChange > 0.001 && newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      
      // Update camera bounds first
      this.updateCameraBounds();
      
      // Calculate the new world position under the mouse after zoom
      const newVector = new THREE.Vector3(mouseX, mouseY, 0);
      newVector.unproject(this.camera);
      newVector.z = 0;
      
      // Calculate the offset to keep the mouse position fixed
      const offsetX = vector.x - newVector.x;
      const offsetY = vector.y - newVector.y;
      
      // Apply the offset to the camera position
      this.camera.position.x += offsetX;
      this.camera.position.y += offsetY;
      
      // Update the camera's lookAt target to match the new position
      this.camera.lookAt(this.camera.position.x, this.camera.position.y, 0);
      
      // Update grid and slider
      this.updateGrid();
      this.updateZoomSlider();
    }
  }

  setZoom(zoom) {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.updateCamera();
  }

  zoomIn() {
    const zoomFactor = 1.5;
    this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel * zoomFactor);
    this.updateCamera();
    this.updateZoomSlider();
  }

  zoomOut() {
    const zoomFactor = 1.5;
    this.zoomLevel = Math.max(this.minZoom, this.zoomLevel / zoomFactor);
    this.updateCamera();
    this.updateZoomSlider();
  }

  setZoomFactor(factor) {
    this.zoomFactor = Math.max(0.01, Math.min(0.5, factor));
  }

  updateCameraBounds() {
    const width = this.getWidth();
    const height = this.getHeight();
    const aspect = width / height;
    
    // Apply zoom to viewport
    const viewHeight = 200 / this.zoomLevel;
    const viewWidth = viewHeight * aspect;
    
    this.camera.left = -viewWidth/2;
    this.camera.right = viewWidth/2;
    this.camera.top = viewHeight/2;
    this.camera.bottom = -viewHeight/2;
    this.camera.updateProjectionMatrix();
  }

  updateCamera() {
    this.updateCameraBounds();
    
    // Update grid to match current zoom level (only if grid exists)
    if (this.grid) {
      this.updateGrid();
    }
  }

  updateZoomSlider() {
    const slider = document.getElementById('zoomSlider');
    if (slider) {
      slider.value = this.zoomLevel;
      slider.title = `Zoom: ${this.zoomLevel.toFixed(2)}x`;
    }
  }

  updateGrid() {
    // Only update if grid exists
    if (!this.grid) return;
    
    // Calculate appropriate grid size and divisions based on zoom level
    const baseSize = 200; // Base viewport size
    const viewSize = baseSize / this.zoomLevel;
    
    // Determine grid spacing based on zoom level
    // At zoom level 1.0, we want roughly 10-unit spacing
    // As we zoom out, we want larger spacing to avoid too many lines
    let gridSpacing = 10;
    if (this.zoomLevel < 0.5) gridSpacing = 50;
    else if (this.zoomLevel < 0.2) gridSpacing = 100;
    else if (this.zoomLevel < 0.1) gridSpacing = 200;
    else if (this.zoomLevel < 0.05) gridSpacing = 500;
    
    // Calculate grid size and divisions
    const gridSize = Math.max(viewSize * 2, 400); // At least 400 units wide
    const divisions = Math.max(2, Math.floor(gridSize / gridSpacing)); // At least 2 divisions
    
    // Remove the old grid
    this.scene.remove(this.grid);
    this.grid.geometry.dispose();
    this.grid.material.dispose();
    
    // Create new grid with appropriate size and divisions
    this.grid = new THREE.GridHelper(gridSize, divisions, 0x112233, 0x0b1624);
    this.grid.rotation.x = Math.PI/2; // make it 2D (XZ-> XY)
    this.grid.visible = this.gridVisible;
    this.scene.add(this.grid);
    
    // Update the main axes to match the grid size
    this.updateMainAxes(gridSize);
  }

  updateMainAxes(gridSize) {
    // Only update if main axes exist
    if (!this.mainAxesGroup) return;
    
    const halfSize = gridSize / 2;
    
    // Remove old axes
    this.scene.remove(this.mainAxesGroup);
    this.mainAxesGroup.children.forEach(child => {
      child.geometry.dispose();
      child.material.dispose();
    });
    this.mainAxesGroup.clear();
    
    // Create new X-axis (horizontal) - bright red
    const xAxisGeometry = new THREE.BufferGeometry();
    const xAxisVertices = new Float32Array([
      -halfSize, 0, 0,  // Start at left edge
      halfSize, 0, 0    // End at right edge
    ]);
    xAxisGeometry.setAttribute('position', new THREE.BufferAttribute(xAxisVertices, 3));
    const xAxisMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff4444,  // Bright red
      linewidth: 3      // Thicker line
    });
    this.xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
    this.mainAxesGroup.add(this.xAxis);
    
    // Create new Y-axis (vertical) - bright blue
    const yAxisGeometry = new THREE.BufferGeometry();
    const yAxisVertices = new Float32Array([
      0, -halfSize, 0,  // Start at bottom edge
      0, halfSize, 0    // End at top edge
    ]);
    yAxisGeometry.setAttribute('position', new THREE.BufferAttribute(yAxisVertices, 3));
    const yAxisMaterial = new THREE.LineBasicMaterial({ 
      color: 0x4444ff,  // Bright blue
      linewidth: 3      // Thicker line
    });
    this.yAxis = new THREE.Line(yAxisGeometry, yAxisMaterial);
    this.mainAxesGroup.add(this.yAxis);
    
    this.scene.add(this.mainAxesGroup);
    this.mainAxesGroup.visible = this.mainAxesVisible;
  }

  getWidth() {
    return this.container.clientWidth || (this.container.parentElement?.clientWidth ?? 800);
  }

  getHeight() {
    return this.container.clientHeight || (this.container.parentElement?.clientHeight ?? 600);
  }

  onResize() {
    const w = this.getWidth();
    const h = this.getHeight();
    this.renderer.setSize(w, h);
    
    // Update camera with current zoom level
    this.updateCamera();
  }

  updateTurtleVisualization(x, y, heading) {
    this.turtleGroup.position.set(x, y, 1);
    this.turtleGroup.rotation.z = THREE.MathUtils.degToRad(-heading);
  }

  ensureCapacity(nextSegs) {
    if (nextSegs <= this.maxSegments) return;
    
    let newMax = Math.ceil(this.maxSegments * 1.5);
    while (newMax < nextSegs) newMax *= 2;
    
    const newPos = new Float32Array(newMax * 2 * 3);
    newPos.set(this.positions);
    this.positions = newPos;
    this.lineGeom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    
    const newCol = new Float32Array(newMax * 2 * 3);
    newCol.set(this.colorsArr);
    this.colorsArr = newCol;
    this.lineGeom.setAttribute('color', new THREE.BufferAttribute(this.colorsArr, 3));
    
    this.maxSegments = newMax;
  }

  drawSegment(start, end, color) {
    const penSize = this.currentPenSize;
    
    // Store the segment for later processing
    if (!this.segments) this.segments = [];
    this.segments.push({ start, end, color });
    
    // Rebuild the entire path with proper joins
    this.rebuildPathWithJoins();
  }
  
  rebuildPathWithJoins() {
    // Clear existing path meshes
    while (this.pathGroup.children.length > 0) {
      const child = this.pathGroup.children[0];
      this.pathGroup.remove(child);
      child.geometry.dispose();
      child.material.dispose();
    }
    
    if (!this.segments || this.segments.length === 0) return;
    
    const penSize = this.currentPenSize;
    const halfThickness = penSize * 0.25;
    
    // Create vertices for the entire path with proper joins
    const vertices = [];
    const colors = [];
    
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];
      const nextSegment = this.segments[i + 1];
      
      // Calculate direction of current segment
      const dx = segment.end.x - segment.start.x;
      const dy = segment.end.y - segment.start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) continue;
      
      const dirX = dx / length;
      const dirY = dy / length;
      const perpX = -dirY;
      const perpY = dirX;
      
      // Calculate direction of next segment (if exists)
      let nextDirX = 0, nextDirY = 0, nextPerpX = 0, nextPerpY = 0;
      if (nextSegment) {
        const nextDx = nextSegment.end.x - nextSegment.start.x;
        const nextDy = nextSegment.end.y - nextSegment.start.y;
        const nextLength = Math.sqrt(nextDx * nextDx + nextDy * nextDy);
        
        if (nextLength > 0) {
          nextDirX = nextDx / nextLength;
          nextDirY = nextDy / nextLength;
          nextPerpX = -nextDirY;
          nextPerpY = nextDirX;
        }
      }
      
      // Create rectangle for this segment
      const v1 = [segment.start.x + perpX * halfThickness, segment.start.y + perpY * halfThickness, 0];
      const v2 = [segment.start.x - perpX * halfThickness, segment.start.y - perpY * halfThickness, 0];
      const v3 = [segment.end.x - perpX * halfThickness, segment.end.y - perpY * halfThickness, 0];
      const v4 = [segment.end.x + perpX * halfThickness, segment.end.y + perpY * halfThickness, 0];
      
      // Add rectangle vertices (two triangles)
      vertices.push(...v1, ...v2, ...v3, ...v1, ...v3, ...v4);
      
      // Add colors
      for (let j = 0; j < 6; j++) {
        colors.push(segment.color.r, segment.color.g, segment.color.b);
      }
      
      // If there's a next segment, create a join at the corner
      if (nextSegment && (nextDirX !== 0 || nextDirY !== 0)) {
        // Calculate the join point (where segments meet)
        const joinX = segment.end.x;
        const joinY = segment.end.y;
        
        // Create a small triangle to fill the gap at the corner
        const joinV1 = [joinX + perpX * halfThickness, joinY + perpY * halfThickness, 0];
        const joinV2 = [joinX - perpX * halfThickness, joinY - perpY * halfThickness, 0];
        const joinV3 = [joinX + nextPerpX * halfThickness, joinY + nextPerpY * halfThickness, 0];
        const joinV4 = [joinX - nextPerpX * halfThickness, joinY - nextPerpY * halfThickness, 0];
        
        // Add join triangles
        vertices.push(...joinV1, ...joinV2, ...joinV3);
        vertices.push(...joinV2, ...joinV4, ...joinV3);
        
        // Add colors for join
        for (let j = 0; j < 6; j++) {
          colors.push(segment.color.r, segment.color.g, segment.color.b);
        }
      }
    }
    
    if (vertices.length > 0) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
      
      const material = new THREE.MeshBasicMaterial({ 
        vertexColors: true,
        side: THREE.DoubleSide
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      this.pathGroup.add(mesh);
    }
  }

  clearScreen() {
    this.segCount = 0;
    this.lineGeom.setDrawRange(0, 0);
    
    // Clear path-based drawing
    this.segments = [];
    
    // Clear all path meshes
    while (this.pathGroup.children.length > 0) {
      const child = this.pathGroup.children[0];
      this.pathGroup.remove(child);
      child.geometry.dispose();
      child.material.dispose();
    }
  }

  setLineWidth(width) {
    this.currentPenSize = Math.max(1, Math.min(12, width));
    // Rebuild existing path with new pen size
    if (this.segments && this.segments.length > 0) {
      this.rebuildPathWithJoins();
    }
  }

  toggleGrid() {
    this.gridVisible = !this.gridVisible;
    this.grid.visible = this.gridVisible;
    
    // Also toggle the main axes visibility
    this.mainAxesVisible = this.gridVisible;
    this.mainAxesGroup.visible = this.mainAxesVisible;
    
    return this.gridVisible;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
