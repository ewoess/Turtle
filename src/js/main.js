import { TurtleState } from './TurtleState.js';
import { ThreeScene } from './ThreeScene.js';
import { Interpreter } from './Interpreter.js';
import { Executor } from './Executor.js';
import { UIController } from './UIController.js';

class TurtleApp {
  constructor() {
    this.initialize();
  }

  initialize() {
    // Initialize core components
    const container = document.getElementById('three');
    this.turtleState = new TurtleState();
    this.threeScene = new ThreeScene(container);
    this.interpreter = new Interpreter();
    this.executor = new Executor(this.turtleState, this.threeScene);
    this.uiController = new UIController(this.executor, this.interpreter, this.threeScene);

    // Start render loop
    this.startRenderLoop();
    
    // Initialize UI
    this.uiController.initialize();
  }

  startRenderLoop() {
    const render = () => {
      this.threeScene.render();
      requestAnimationFrame(render);
    };
    render();
  }
}

// Start the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TurtleApp();
});
