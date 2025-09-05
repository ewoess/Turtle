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
    console.log('TurtleApp initialize called');
    
    // Initialize core components
    const container = document.getElementById('three');
    console.log('Container element:', container);
    
    this.turtleState = new TurtleState();
    this.threeScene = new ThreeScene(container);
    this.executor = new Executor(this.turtleState, this.threeScene);
    this.uiController = new UIController(this.executor, null, this.threeScene);

    // Initialize turtle position
    this.executor.updateVisualization();

    // Start render loop
    this.startRenderLoop();
    
    // Initialize UI
    this.uiController.initialize();
    console.log('TurtleApp initialization complete');
  }

  startRenderLoop() {
    console.log('Starting render loop');
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
