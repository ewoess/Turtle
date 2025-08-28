import * as THREE from 'three';

export class UIController {
  constructor(executor, interpreter, threeScene) {
    this.executor = executor;
    this.interpreter = interpreter;
    this.threeScene = threeScene;
    this.programIterator = null;
    this.playing = false;
    this.rainbowUpdateInterval = null;
    
    this.setupElements();
    this.setupEventListeners();
    this.setupExamples();
  }

  setupElements() {
    this.editor = document.getElementById('editor');
    this.runBtn = document.getElementById('runBtn');
    this.stepBtn = document.getElementById('stepBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.toggleCommandsBtn = document.getElementById('toggleCommandsBtn');
    this.speed = document.getElementById('speed');
    this.pensize = document.getElementById('pensize');
    this.pencolor = document.getElementById('pencolor');
    this.rainbowIndicator = document.getElementById('rainbowIndicator');
    this.zoomOutBtn = document.getElementById('zoomOutBtn');
    this.zoomInBtn = document.getElementById('zoomInBtn');
    this.toggleGridBtn = document.getElementById('toggleGridBtn');
    this.resetViewBtn = document.getElementById('resetViewBtn');
    this.statusText = document.getElementById('statusText');
    this.light = document.getElementById('light');
    this.posLbl = document.getElementById('posLbl');
    this.headLbl = document.getElementById('headLbl');
    this.commandsDetails = document.getElementById('commandsDetails');
    this.examples = document.getElementById('examples');
  }

  setupEventListeners() {
    this.runBtn.addEventListener('click', () => this.handleRun());
    this.stepBtn.addEventListener('click', () => this.handleStep());
    this.resetBtn.addEventListener('click', () => this.handleReset());
    if (this.toggleCommandsBtn) {
      this.toggleCommandsBtn.addEventListener('click', () => this.toggleCommands());
    }
    this.toggleGridBtn.addEventListener('click', () => this.toggleGrid());
    this.resetViewBtn.addEventListener('click', () => this.resetView());
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.toggleCommands();
      }
      // Zoom shortcuts
      if (e.ctrlKey && e.key === '=') {
        e.preventDefault();
        this.threeScene.zoomIn();
      }
      if (e.ctrlKey && e.key === '-') {
        e.preventDefault();
        this.threeScene.zoomOut();
      }
      if (e.ctrlKey && e.key === '0') {
        e.preventDefault();
        this.threeScene.setZoom(1.0);
      }
      // Reset view shortcut
      if (e.ctrlKey && e.key === 'Home') {
        e.preventDefault();
        this.resetView();
      }
      // Pan shortcuts for touchpad users
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (e.shiftKey) {
          e.preventDefault();
          this.panWithArrowKeys(e.key);
        }
      }
    });
    
    this.pensize.addEventListener('change', () => {
      const size = Math.max(1, Math.min(12, parseInt(this.pensize.value || '2', 10)));
      this.executor.setPenSize(size);
    });
    
    this.pencolor.addEventListener('input', () => {
      const color = this.pencolor.value;
      // Convert hex to RGB
      const r = parseInt(color.substr(1, 2), 16);
      const g = parseInt(color.substr(3, 2), 16);
      const b = parseInt(color.substr(5, 2), 16);
      this.executor.setPenColor(r, g, b);
    });

    this.zoomOutBtn.addEventListener('click', () => {
      this.threeScene.zoomOut();
    });
    
    this.zoomInBtn.addEventListener('click', () => {
      this.threeScene.zoomIn();
    });
  }

  setupExamples() {
    const samples = {
      Square: `REPEAT 4 [ FD 120 RT 90 ]`,
      Star: `REPEAT 5 [ FD 180 RT 144 ]`,
      Spiral: `CS HOME PD REPEAT 60 [ FD 5 RT 10 FD 5 ]`,
      RainbowSpiral: `CS HOME PD\nRAINBOW ON\nHUESTEP 4\nPENSIZE 2\nREPEAT 150 [ FD 6 RT 11 ]`,
      Nested: `CS HOME PD\nRAINBOW ON\nREPEAT 12 [\n  REPEAT 8 [ FD 80 RT 45 ]\n  RT 30\n]`,
      Snowflake: `CS HOME PD\nPENCOLOR 160 220 255\nREPEAT 6 [\n  REPEAT 3 [ FD 100 RT 60 ]\n  RT 60\n]`,
      PerfCircle: `CS HOME PD\nRAINBOW ON\nHUESTEP 3\nREPEAT 2000 [ FD 3 RT 5 ]`,
      ManyCircles: `CS HOME PD\nRAINBOW ON\nPENSIZE 2\nHUESTEP 5\nPU HOME\nREPEAT 11 [ RT 30 HOME PU FD 160 LT 90 FD 65 LT 90 PD REPEAT 51 [ FD 8 RT 7 ] PU ]\nHOME PD`,
      ZoomTest: `CS HOME PD\nREPEAT 4 [ FD 50 RT 90 ]\nZOOM IN\nREPEAT 4 [ FD 30 RT 90 ]\nZOOM OUT\nREPEAT 4 [ FD 80 RT 90 ]`,
      Parabola: `CS HOME PD\nPENCOLOR 255 100 100\nPENSIZE 3\nPLOT x^2 FROM -5 TO 5 STEPS 100`,
      SineWave: `CS HOME PD\nPENCOLOR 100 255 100\nPENSIZE 2\nPLOT sin(x) FROM -2*pi TO 2*pi STEPS 200`,
      Circle: `CS HOME PD\nPENCOLOR 100 100 255\nPENSIZE 2\nPLOT sqrt(25-x^2) FROM -5 TO 5 STEPS 100\nPLOT -sqrt(25-x^2) FROM -5 TO 5 STEPS 100`,
      Complex: `CS HOME PD\nPENCOLOR 255 150 50\nPENSIZE 2\nPLOT x^3 - 2*x FROM -3 TO 3 STEPS 150`,
      Exponential: `CS HOME PD\nPENCOLOR 255 100 255\nPENSIZE 2\nPLOT exp(x/3) FROM -5 TO 5 STEPS 150`,
      Logarithm: `CS HOME PD\nPENCOLOR 255 255 100\nPENSIZE 2\nPLOT log(x+1) FROM -0.9 TO 10 STEPS 150`,
      Spiral: `CS HOME PD\nPENCOLOR 100 255 255\nPENSIZE 2\nPLOT x*sin(x) FROM 0 TO 4*pi STEPS 200`,
      Points: `CS HOME PD\nPENCOLOR 255 255 100\nPENSIZE 3\nPLOT x^2 AT [1,2,3,4,5] DOTS`,
      SmoothDots: `CS HOME PD\nPENCOLOR 100 255 100\nPENSIZE 2\nPLOT sin(x) FROM -2*pi TO 2*pi STEPS 50 DOTS COLOR 255 100 100`
    };
    
    if (this.examples) {
      this.examples.textContent = Object.entries(samples).map(([k, v]) => `• ${k}\n${v}`).join('\n\n');
    } else {
      console.error('Examples element not found!');
    }
    
    // Set default program
    this.editor.value = `; Test plotting\nCS HOME PD\nPENCOLOR 255 100 100\nPENSIZE 1\nPLOT x^2 AT [-3,-2,-1,0,1,2,3]`;
  }

  setStatus(message, isError = false) {
    this.statusText.textContent = message;
    this.light.className = `light ${isError ? 'err' : 'ok'}`;
  }

  updatePositionDisplay() {
    const pos = this.executor.getPosition();
    const heading = this.executor.getHeading();
    this.posLbl.textContent = `${pos.x.toFixed(0)},${pos.y.toFixed(0)}`;
    this.headLbl.textContent = `${heading.toFixed(0)}°`;
  }

  updateColorPicker() {
    const currentColor = this.executor.getCurrentColorHex();
    this.pencolor.value = currentColor;
    
    const isRainbow = this.executor.isRainbowOn();
    if (this.rainbowIndicator) {
      this.rainbowIndicator.style.display = isRainbow ? 'inline' : 'none';
    }
    
    // If rainbow is on, update the color picker periodically to show the cycling
    if (isRainbow) {
      if (!this.rainbowUpdateInterval) {
        this.rainbowUpdateInterval = setInterval(() => {
          if (this.executor.isRainbowOn()) {
            this.pencolor.value = this.executor.getCurrentColorHex();
          } else {
            clearInterval(this.rainbowUpdateInterval);
            this.rainbowUpdateInterval = null;
          }
        }, 100); // Update every 100ms to show the color cycling
      }
    } else {
      if (this.rainbowUpdateInterval) {
        clearInterval(this.rainbowUpdateInterval);
        this.rainbowUpdateInterval = null;
      }
    }
  }

  toggleCommands() {
    this.commandsDetails.open = !this.commandsDetails.open;
    // Update button text to indicate state
    if (this.toggleCommandsBtn) {
      this.toggleCommandsBtn.textContent = this.commandsDetails.open ? '📋' : '📖';
      this.toggleCommandsBtn.title = this.commandsDetails.open ? 'Hide Commands List (Ctrl+Shift+C)' : 'Show Commands List (Ctrl+Shift+C)';
    }
  }

  toggleGrid() {
    const isVisible = this.threeScene.toggleGrid();
    this.toggleGridBtn.title = isVisible ? 'Hide Grid' : 'Show Grid';
    this.toggleGridBtn.style.opacity = isVisible ? '1' : '0.5';
  }

  resetView() {
    this.threeScene.resetView();
    this.setStatus('View reset to center.');
  }

  panWithArrowKeys(key) {
    const panAmount = 50; // Pan by 50 units
    const currentPos = this.threeScene.camera.position;
    
    switch (key) {
      case 'ArrowUp':
        this.threeScene.camera.position.y += panAmount;
        break;
      case 'ArrowDown':
        this.threeScene.camera.position.y -= panAmount;
        break;
      case 'ArrowLeft':
        this.threeScene.camera.position.x -= panAmount;
        break;
      case 'ArrowRight':
        this.threeScene.camera.position.x += panAmount;
        break;
    }
    
    this.threeScene.camera.lookAt(this.threeScene.camera.position.x, this.threeScene.camera.position.y, 0);
  }

  compile() {
    const result = this.interpreter.compile(this.editor.value);
    if (result.success) {
      this.programIterator = result.iterator;
      this.setStatus('Compiled.');
      return true;
    } else {
      this.setStatus(result.error, true);
      this.programIterator = null;
      return false;
    }
  }

  handleRun() {
    // If program has finished (no iterator), automatically reset first
    if (!this.programIterator) {
      this.handleReset();
      if (!this.compile()) return;
    }
    
    this.playing = !this.playing;
    this.runBtn.textContent = this.playing ? 'Pause' : 'Run';
    
    if (this.playing) {
      this.tickRun();
    }
  }

  handleStep() {
    if (!this.programIterator) {
      if (!this.compile()) return;
    }
    
    const next = this.programIterator.next();
    if (!next.done) {
      try {
        this.executor.execute(next.value);
        this.setStatus('Step: ' + this.interpreter.formatCommand(next.value));
        this.updatePositionDisplay();
      } catch (e) {
        this.setStatus(e.message, true);
        this.playing = false;
        this.runBtn.textContent = 'Run';
      }
    } else {
      this.setStatus('Program finished.');
      this.playing = false;
      this.runBtn.textContent = 'Run';
      this.programIterator = null;
    }
  }

  handleReset() {
    this.playing = false;
    this.programIterator = null;
    this.executor.reset();
    this.runBtn.textContent = 'Run';
    this.setStatus('Reset.');
    this.updatePositionDisplay();
    this.updateColorPicker();
    
    // Clear rainbow update interval
    if (this.rainbowUpdateInterval) {
      clearInterval(this.rainbowUpdateInterval);
      this.rainbowUpdateInterval = null;
    }
    
    // Reset fractional step accumulator
    this.fractionalStepAccumulator = 0;
  }

  stepsThisFrame() {
    const speed = parseInt(this.speed.value, 10) || 1;
    // Speed values are 1-9, map to 0.25-24 steps per frame
    // Speed 1 (Ultra Slow) = 0.25 steps per frame (very slow)
    // Speed 2 = 2 steps per frame
    // Speed 5 (Medium) = 4 steps per frame (same as Speed 2)
    // Speed 9 (Ultra Fast) = 24 steps per frame
    let stepsPerFrame;
    if (speed === 1) {
      // Speed 1: very slow (0.25 steps per frame = 1 step every 4 frames)
      stepsPerFrame = 0.25;
    } else if (speed <= 5) {
      // Speeds 2-5: linear from 2 to 4
      stepsPerFrame = 2 + Math.floor((speed - 2) * (2 / 3));
    } else {
      // Speeds 6-9: linear from 4 to 24
      stepsPerFrame = 4 + Math.floor((speed - 5) * (20 / 4));
    }
    return Math.max(0.25, Math.min(24, stepsPerFrame));
  }

  tickRun() {
    if (!this.playing) return;
    
    const stepsPerFrame = this.stepsThisFrame();
    
    // Handle fractional steps for very slow speeds
    if (stepsPerFrame < 1) {
      // For fractional steps, we need to accumulate until we reach 1 full step
      if (!this.fractionalStepAccumulator) {
        this.fractionalStepAccumulator = 0;
      }
      this.fractionalStepAccumulator += stepsPerFrame;
      
      if (this.fractionalStepAccumulator >= 1) {
        // Execute one step with delay for smoothness
        const next = this.programIterator?.next();
        if (!next || next.done) {
          this.setStatus('Program finished.');
          this.playing = false;
          this.runBtn.textContent = 'Run';
          this.programIterator = null;
          this.fractionalStepAccumulator = 0;
          return;
        }
        
        try {
          this.executor.execute(next.value);
          this.updatePositionDisplay();
          
          // Add a small delay for smoother movement
          const speed = parseInt(this.speed.value, 10) || 1;
          const delay = Math.max(10, 100 - speed * 8); // More delay for slower speeds
          setTimeout(() => {
            if (this.playing) {
              requestAnimationFrame(() => this.tickRun());
            }
          }, delay);
          return;
        } catch (e) {
          this.setStatus(e.message, true);
          this.playing = false;
          this.runBtn.textContent = 'Run';
          this.fractionalStepAccumulator = 0;
          return;
        }
        
        this.fractionalStepAccumulator -= 1;
      }
    } else {
      // Handle integer steps (normal case)
      let n = Math.floor(stepsPerFrame);
      while (n-- > 0) {
        const next = this.programIterator?.next();
        if (!next || next.done) {
          this.setStatus('Program finished.');
          this.playing = false;
          this.runBtn.textContent = 'Run';
          this.programIterator = null;
          break;
        }
        
        try {
          this.executor.execute(next.value);
          this.updatePositionDisplay();
        } catch (e) {
          this.setStatus(e.message, true);
          this.playing = false;
          this.runBtn.textContent = 'Run';
          break;
        }
      }
    }
    
    if (this.playing) {
      requestAnimationFrame(() => this.tickRun());
    }
  }



  // Initial setup
  initialize() {
    this.compile();
    this.updatePositionDisplay();
    this.updateColorPicker();
  }
}
