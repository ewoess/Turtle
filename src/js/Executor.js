import * as THREE from 'three';

export class Executor {
  constructor(turtleState, threeScene, interpreter) {
    this.turtleState = turtleState;
    this.threeScene = threeScene;
    this.interpreter = interpreter;
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
      case 'PLOT':
        this.plot(cmd.expression, cmd.xMin, cmd.xMax, cmd.steps); 
        break;
      case 'PLOT_STEP':
        this.plotStep(cmd.expression, cmd.x, cmd.isFirst); 
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

  plot(expression, xMin, xMax, steps) {
    console.log(`Plotting: ${expression} from ${xMin} to ${xMax} with ${steps} steps`);
    
    // Save current turtle state
    const originalPos = this.turtleState.getPosition();
    const originalHeading = this.turtleState.getHeading();
    const originalPenDown = this.turtleState.penDown;
    
    console.log(`Original turtle state: pos=${originalPos.x},${originalPos.y}, heading=${originalHeading}, penDown=${originalPenDown}`);
    
    // Set pen down for plotting
    this.turtleState.penDown = true;
    
    // Use the interpreter to evaluate expressions
    if (!this.interpreter) {
      throw new Error('Interpreter not available for plotting');
    }
    
    // Calculate step size
    const stepSize = (xMax - xMin) / steps;
    console.log(`Step size: ${stepSize}`);
    
    // Find first valid point
    let firstPoint = null;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * stepSize;
      const y = this.interpreter.evaluateExpression(expression, x);
      if (y !== null) {
        firstPoint = { x, y };
        console.log(`First valid point: (${x}, ${y})`);
        break;
      }
    }
    
    if (!firstPoint) {
      throw new Error(`Could not evaluate expression: ${expression}`);
    }
    
    // Move to first point without drawing
    console.log(`Moving to first point: (${firstPoint.x}, ${firstPoint.y})`);
    this.turtleState.setPosition(firstPoint.x, firstPoint.y);
    
    // Plot the curve by drawing segments
    let pointsPlotted = 0;
    let previousPoint = firstPoint;
    
    for (let i = 1; i <= steps; i++) {
      const x = xMin + i * stepSize;
      const y = this.interpreter.evaluateExpression(expression, x);
      
      if (y !== null) {
        const currentPoint = { x, y };
        
        // Draw segment from previous point to current point
        const start = new THREE.Vector2(previousPoint.x, previousPoint.y);
        const end = new THREE.Vector2(currentPoint.x, currentPoint.y);
        const color = this.turtleState.getCurrentColor();
        
        this.threeScene.drawSegment(start, end, color);
        
        // Update turtle position
        this.turtleState.setPosition(currentPoint.x, currentPoint.y);
        previousPoint = currentPoint;
        pointsPlotted++;
      }
    }
    
    console.log(`Plotted ${pointsPlotted} points`);
    
    // The turtle is already at the last point of the plot
    // Just lift the pen so it doesn't draw when moved
    this.turtleState.penDown = false;
    
    // Update visualization to show the turtle in its final position
    this.updateVisualization();
  }

  plotStep(expression, x, isFirst) {
    // Use the interpreter to evaluate expressions
    if (!this.interpreter) {
      throw new Error('Interpreter not available for plotting');
    }
    
    const y = this.interpreter.evaluateExpression(expression, x);
    
    if (y !== null) {
      if (isFirst) {
        // First point: just move there without drawing
        this.turtleState.penDown = true;
        this.turtleState.setPosition(x, y);
      } else {
        // Subsequent points: draw line from current position to new point
        const currentPos = this.turtleState.getPosition();
        const start = new THREE.Vector2(currentPos.x, currentPos.y);
        const end = new THREE.Vector2(x, y);
        const color = this.turtleState.getCurrentColor();
        
        // Calculate the direction the turtle should face
        const dx = x - currentPos.x;
        const dy = y - currentPos.y;
        const angle = Math.atan2(dx, dy) * 180 / Math.PI; // Convert to degrees, Logo-style (0° is up)
        
        // Turn turtle to face the direction of movement
        this.turtleState.setHeading(angle);
        
        // Draw the segment
        this.threeScene.drawSegment(start, end, color);
        
        // Move to the new position
        this.turtleState.setPosition(x, y);
      }
    }
    
    this.updateVisualization();
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
