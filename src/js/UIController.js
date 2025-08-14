export class UIController {
  constructor(executor, interpreter, threeScene) {
    this.executor = executor;
    this.interpreter = interpreter;
    this.threeScene = threeScene;
    this.programIterator = null;
    this.playing = false;
    
    this.setupElements();
    this.setupEventListeners();
    this.setupExamples();
  }

  setupElements() {
    this.editor = document.getElementById('editor');
    this.runBtn = document.getElementById('runBtn');
    this.stepBtn = document.getElementById('stepBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.speed = document.getElementById('speed');
    this.pensize = document.getElementById('pensize');
    this.pencolor = document.getElementById('pencolor');
    this.zoomSlider = document.getElementById('zoomSlider');
    this.statusText = document.getElementById('statusText');
    this.light = document.getElementById('light');
    this.posLbl = document.getElementById('posLbl');
    this.headLbl = document.getElementById('headLbl');
  }

  setupEventListeners() {
    this.runBtn.addEventListener('click', () => this.handleRun());
    this.stepBtn.addEventListener('click', () => this.handleStep());
    this.resetBtn.addEventListener('click', () => this.handleReset());
    
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

    this.zoomSlider.addEventListener('input', () => {
      const zoom = parseFloat(this.zoomSlider.value);
      this.threeScene.setZoom(zoom);
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
      ManyCircles: `CS HOME PD\nRAINBOW ON\nPENSIZE 2\nHUESTEP 5\nPU HOME\nREPEAT 11 [ RT 30 HOME PU FD 160 LT 90 FD 65 LT 90 PD REPEAT 51 [ FD 8 RT 7 ] PU ]\nHOME PD`
    };
    
    const examples = document.getElementById('examples');
    examples.textContent = Object.entries(samples).map(([k, v]) => `• ${k}\n${v}`).join('\n\n');
    
    // Set default program
    this.editor.value = `; Rainbow demo\nCS HOME PD\nRAINBOW ON\nHUESTEP 4\nPENSIZE 6\nREPEAT 120 [ FD 8 RT 7 ]`;
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
    if (!this.programIterator && !this.compile()) return;
    
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
  }

  stepsThisFrame() {
    const s = Math.max(0, Math.min(300, parseInt(this.speed.value, 10) || 0));
    const sv = s / 300; // 0..1
    // Adjust so that speed 0 (slowest) = ~1 step
    // Speed 150 (middle) = ~5 steps (very slow middle)
    // Speed 300 (fastest) = ~25 steps (reasonable fastest)
    return 1 + Math.floor(sv * sv * 24); // 1 to ~25 steps per frame
  }

  tickRun() {
    if (!this.playing) return;
    
    let n = this.stepsThisFrame();
    while (n-- > 0) {
      const next = this.programIterator?.next();
      if (!next || next.done) {
        this.setStatus('Program finished.');
        this.playing = false;
        this.runBtn.textContent = 'Run';
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
    
    if (this.playing) {
      requestAnimationFrame(() => this.tickRun());
    }
  }

  // Initial setup
  initialize() {
    this.compile();
    this.updatePositionDisplay();
  }
}
