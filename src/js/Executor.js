import * as THREE from 'three';

export class Executor {
  constructor(turtleState, threeScene) {
    this.turtleState = turtleState;
    this.threeScene = threeScene;
    this.uiController = null;
  }

  setUIController(uiController) {
    this.uiController = uiController;
  }

  execute(cmd) {
    switch (cmd.op) {
      case 'FD': 
        this.move(cmd.n); 
        break;
      case 'BK': 
        this.move(-cmd.n); 
        break;
      case 'RT': 
        this.turn(cmd.n); 
        break;
      case 'LT': 
        this.turn(-cmd.n); 
        break;
      case 'PU': 
        this.turtleState.penDown = false; 
        break;
      case 'PD': 
        this.turtleState.penDown = true; 
        break;
      case 'HOME':
        this.home(); 
        break;
      case 'CS': 
        this.clearScreen(); 
        break;
      case 'SETPOS':
        this.setPosition(cmd.x, cmd.y); 
        break;
      case 'SETHEADING':
        this.setHeading(cmd.n); 
        break;
      case 'PENCOLOR':
        this.setPenColor(cmd.r, cmd.g, cmd.b); 
        break;
      case 'PENSIZE':
        this.setPenSize(cmd.n); 
        break;
      case 'HUESTEP':
        this.setHueStep(cmd.n); 
        break;
      case 'RAINBOW':
        this.setRainbow(cmd.on); 
        break;
      case 'ZOOM':
        this.zoom(cmd.direction); 
        break;
      default: 
        throw new Error('Unhandled op ' + cmd.op);
    }
  }

  turn(angle) {
    this.turtleState.turn(angle);
    this.updateVisualization();
  }

  move(distance) {
    const result = this.turtleState.move(distance);
    
    if (result.shouldDraw) {
      const color = this.turtleState.getCurrentColor();
      this.threeScene.drawSegment(result.start, result.end, color);
    }
    
    this.updateVisualization();
  }

  // Smooth movement with interpolation
  moveSmooth(distance, steps = 10) {
    const rad = THREE.MathUtils.degToRad(90 - this.turtleState.heading);
    const dir = new THREE.Vector2(Math.cos(rad), Math.sin(rad));
    const start = this.turtleState.pos.clone();
    const end = start.clone().add(dir.multiplyScalar(distance));
    
    // Calculate intermediate positions
    const positions = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pos = start.clone().lerp(end, t);
      positions.push(pos);
    }
    
    // Update turtle position to final position
    this.turtleState.pos.copy(end);
    
    // Draw segments if pen is down
    if (this.turtleState.penDown) {
      const color = this.turtleState.getCurrentColor();
      for (let i = 1; i < positions.length; i++) {
        this.threeScene.drawSegment(positions[i-1], positions[i], color);
      }
    }
    
    this.updateVisualization();
  }

  setPosition(x, y) {
    this.turtleState.setPosition(x, y);
    this.updateVisualization();
  }

  setHeading(angle) {
    this.turtleState.setHeading(angle);
    this.updateVisualization();
  }

  setPenColor(r, g, b) {
    this.turtleState.setPenColor(r, g, b);
    if (this.uiController) {
      this.uiController.updateColorPicker();
    }
  }

  setPenSize(size) {
    this.turtleState.setPenSize(size);
    this.threeScene.setLineWidth(this.turtleState.penSize);
  }

  setHueStep(step) {
    this.turtleState.setHueStep(step);
  }

  setRainbow(on) {
    this.turtleState.setRainbow(on);
    if (this.uiController) {
      this.uiController.updateColorPicker();
    }
  }

  zoom(direction) {
    if (direction === 'IN') {
      this.threeScene.zoomIn();
    } else if (direction === 'OUT') {
      this.threeScene.zoomOut();
    }
  }

  home() {
    this.turtleState.setPosition(0, 0);
    this.turtleState.setHeading(0);
    this.updateVisualization();
  }

  clearScreen() {
    this.threeScene.clearScreen();
  }

  reset() {
    this.turtleState.reset();
    this.clearScreen();
    this.updateVisualization();
  }

  updateVisualization() {
    const pos = this.turtleState.getPosition();
    const heading = this.turtleState.getHeading();
    this.threeScene.updateTurtleVisualization(pos.x, pos.y, heading);
  }

  getPosition() {
    return this.turtleState.getPosition();
  }

  getHeading() {
    return this.turtleState.getHeading();
  }

  getCurrentColorHex() {
    return this.turtleState.getCurrentColorHex();
  }

  isRainbowOn() {
    return this.turtleState.rainbow;
  }
}
