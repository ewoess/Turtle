import * as THREE from 'three';

export class ThreeScene {
  constructor(container) {
    console.log('ThreeScene constructor called');
    console.log('THREE object:', THREE);
    
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    console.log('Scene created with black background');
    
    this.setupCamera();
    this.setupRenderer();
    this.setupGrid();
    this.setupTurtle();
    this.setupDrawing();
    
    this.setupResizeHandler();
    console.log('ThreeScene setup complete');
  }

  setupCamera() {
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
    // Ensure top-down view (looking straight down the Z-axis)
    this.camera.position.set(0, 0, 10);
    this.camera.lookAt(0, 0, 0);
    this.camera.up.set(0, 1, 0); // Y-axis is up
    
    // Set initial camera bounds
    this.updateCamera();
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(this.getWidth(), this.getHeight());
    this.container.appendChild(this.renderer.domElement);
  }

  setupGrid() {
    // Grid to match the viewport with 10-unit spacing
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
    
    // Create a small triangle turtle
    const triGeom = new THREE.BufferGeometry();
    const size = 3; // Smaller size for the turtle (half the previous size)
    const verts = new Float32Array([
      0, size, 0,           // Top point (front of turtle)
      -size*0.6, -size*0.8, 0,  // Bottom left
      size*0.6, -size*0.8, 0,   // Bottom right
    ]);
    triGeom.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    
    // Create black outline mesh (slightly larger) - add first so it renders behind
    const outlineGeom = new THREE.BufferGeometry();
    const outlineSize = size + 0.5; // Slightly larger for outline
    const outlineVerts = new Float32Array([
      0, outlineSize, 0,           // Top point
      -outlineSize*0.6, -outlineSize*0.8, 0,  // Bottom left
      outlineSize*0.6, -outlineSize*0.8, 0,   // Bottom right
    ]);
    outlineGeom.setAttribute('position', new THREE.BufferAttribute(outlineVerts, 3));
    const outlineMat = new THREE.MeshBasicMaterial({ 
      color: 0x000000,  // Black color for outline
      transparent: false,
      side: THREE.DoubleSide
    });
    this.turtleOutline = new THREE.Mesh(outlineGeom, outlineMat);
    this.turtleGroup.add(this.turtleOutline);
    
    // Create the main turtle mesh (aqua color) - add second so it renders on top
    const triMat = new THREE.MeshBasicMaterial({ 
      color: 0x7fffd4,  // Aqua color (classic turtle color)
      transparent: false,
      side: THREE.DoubleSide
    });
    this.turtleMesh = new THREE.Mesh(triGeom, triMat);
    this.turtleGroup.add(this.turtleMesh);
    
    this.scene.add(this.turtleGroup);
    console.log('Turtle triangle with outline created and added to scene');
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



  updateCamera() {
    const width = this.getWidth();
    const height = this.getHeight();
    const aspect = width / height;
    
    // Fixed viewport without zoom
    const viewHeight = 200;
    const viewWidth = viewHeight * aspect;
    
    this.camera.left = -viewWidth/2;
    this.camera.right = viewWidth/2;
    this.camera.top = viewHeight/2;
    this.camera.bottom = -viewHeight/2;
    this.camera.updateProjectionMatrix();
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
    
    // Update camera
    this.updateCamera();
  }

  updateTurtleVisualization(x, y, heading) {
    this.turtleGroup.position.set(x, y, 10); // Higher Z position to be on top
    this.turtleGroup.rotation.z = THREE.MathUtils.degToRad(-heading);
    console.log('Turtle positioned at:', x, y, 'heading:', heading);
    console.log('Camera bounds:', this.camera.left, this.camera.right, this.camera.top, this.camera.bottom);
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
    // Debug: check scene contents
    console.log('Scene children count:', this.scene.children.length);
    console.log('Turtle group visible:', this.turtleGroup ? this.turtleGroup.visible : 'no turtle group');
    console.log('Grid visible:', this.grid ? this.grid.visible : 'no grid');
  }
}
