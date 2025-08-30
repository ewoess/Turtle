import * as THREE from 'three';

export class Executor {
  constructor(turtleState, threeScene) {
    this.turtleState = turtleState;
    this.threeScene = threeScene;
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
