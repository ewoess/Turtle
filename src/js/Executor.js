import * as THREE from 'three';

export class Executor {
  constructor(turtleState, threeScene) {
    this.turtleState = turtleState;
    this.threeScene = threeScene;
    
    // Command matrix - maps command names to their execution functions
    this.commandMatrix = {
      'FD': (cmd) => this.move(cmd.n),
      'BK': (cmd) => this.move(-cmd.n),
      'RT': (cmd) => this.turn(cmd.n),
      'LT': (cmd) => this.turn(-cmd.n),
      'PU': (cmd) => { this.turtleState.penDown = false; },
      'PD': (cmd) => { this.turtleState.penDown = true; },
      'HOME': (cmd) => this.home(),
      'CS': (cmd) => this.clearScreen(),
      'SETPOS': (cmd) => this.setPosition(cmd.x, cmd.y),
      'SETHEADING': (cmd) => this.setHeading(cmd.n),
      'PENCOLOR': (cmd) => this.setPenColor(cmd.r, cmd.g, cmd.b),
      'PENSIZE': (cmd) => this.setPenSize(cmd.n),
      'HUESTEP': (cmd) => this.setHueStep(cmd.n),
      'RAINBOW': (cmd) => this.setRainbow(cmd.on)
    };
  }

  execute(cmd) {
    const commandHandler = this.commandMatrix[cmd.op];
    if (commandHandler) {
      commandHandler(cmd);
    } else {
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
