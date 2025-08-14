import * as THREE from 'three';

export class ThreeScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    // Zoom state
    this.zoomLevel = 1.0;
    this.minZoom = 0.1;
    this.maxZoom = 5.0;
    
    this.setupCamera();
    this.setupRenderer();
    this.setupGrid();
    this.setupTurtle();
    this.setupDrawing();
    
    this.setupResizeHandler();
    this.setupZoomControls();
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
    const grid = new THREE.GridHelper(400, 40, 0x112233, 0x0b1624);
    grid.rotation.x = Math.PI/2; // make it 2D (XZ-> XY)
    this.scene.add(grid);
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
    
    this.lineGeom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.lineGeom.setAttribute('color', new THREE.BufferAttribute(this.colorsArr, 3));
    this.lineGeom.setDrawRange(0, 0);
    
    this.lineMat = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 6 });
    this.lineMesh = new THREE.LineSegments(this.lineGeom, this.lineMat);
    this.scene.add(this.lineMesh);
  }

  setupResizeHandler() {
    window.addEventListener('resize', () => this.onResize());
  }

  setupZoomControls() {
    // Mouse wheel zoom
    this.container.addEventListener('wheel', (event) => {
      event.preventDefault();
      const zoomSpeed = 0.1;
      const zoomDelta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;
      this.zoom(zoomDelta);
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
        const zoomDelta = (currentDistance - initialDistance) * 0.01;
        this.zoom(zoomDelta);
        initialDistance = currentDistance;
      }
    });
  }

  zoom(delta) {
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoomLevel + delta));
    if (newZoom !== this.zoomLevel) {
      this.zoomLevel = newZoom;
      this.updateCamera();
      this.updateZoomSlider();
    }
  }

  setZoom(zoom) {
    this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.updateCamera();
  }

  updateCamera() {
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

  updateZoomSlider() {
    const slider = document.getElementById('zoomSlider');
    if (slider) {
      slider.value = this.zoomLevel;
    }
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
    this.ensureCapacity(this.segCount + 1);
    
    const base = this.segCount * 2 * 3;
    
    // positions
    this.positions[base+0] = start.x; 
    this.positions[base+1] = start.y; 
    this.positions[base+2] = 0;
    this.positions[base+3] = end.x; 
    this.positions[base+4] = end.y; 
    this.positions[base+5] = 0;
    
    // colors (same color for both vertices of the segment)
    this.colorsArr[base+0] = color.r; 
    this.colorsArr[base+1] = color.g; 
    this.colorsArr[base+2] = color.b;
    this.colorsArr[base+3] = color.r; 
    this.colorsArr[base+4] = color.g; 
    this.colorsArr[base+5] = color.b;
    
    this.segCount++;
    this.lineGeom.attributes.position.needsUpdate = true;
    this.lineGeom.attributes.color.needsUpdate = true;
    this.lineGeom.setDrawRange(0, this.segCount * 2);
  }

  clearScreen() {
    this.segCount = 0;
    this.lineGeom.setDrawRange(0, 0);
  }

  setLineWidth(width) {
    this.lineMat.linewidth = width;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
