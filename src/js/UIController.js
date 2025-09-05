import { Interpreter } from './Interpreter.js';

export class UIController {
  constructor(executor, interpreter, threeScene) {
    this.executor = executor;
    this.threeScene = threeScene;
    this.programIterator = null;
    this.playing = false;
    
    // Color enum system - complete C# Colors enum equivalent
    this.colors = {
      // System colors
      TRANSPARENT: { r: 0, g: 0, b: 0, a: 0 },
      
      // Basic colors
      ALICE_BLUE: { r: 240, g: 248, b: 255 },
      ANTIQUE_WHITE: { r: 250, g: 235, b: 215 },
      AQUA: { r: 0, g: 255, b: 255 },
      AQUAMARINE: { r: 127, g: 255, b: 212 },
      AZURE: { r: 240, g: 255, b: 255 },
      BEIGE: { r: 245, g: 245, b: 220 },
      BISQUE: { r: 255, g: 228, b: 196 },
      BLACK: { r: 0, g: 0, b: 0 },
      BLANCHED_ALMOND: { r: 255, g: 235, b: 205 },
      BLUE: { r: 0, g: 0, b: 255 },
      BLUE_VIOLET: { r: 138, g: 43, b: 226 },
      BROWN: { r: 165, g: 42, b: 42 },
      BURLY_WOOD: { r: 222, g: 184, b: 135 },
      CADET_BLUE: { r: 95, g: 158, b: 160 },
      CHARTREUSE: { r: 127, g: 255, b: 0 },
      CHOCOLATE: { r: 210, g: 105, b: 30 },
      CORAL: { r: 255, g: 127, b: 80 },
      CORNFLOWER_BLUE: { r: 100, g: 149, b: 237 },
      CORNSILK: { r: 255, g: 248, b: 220 },
      CRIMSON: { r: 220, g: 20, b: 60 },
      CYAN: { r: 0, g: 255, b: 255 },
      DARK_BLUE: { r: 0, g: 0, b: 139 },
      DARK_CYAN: { r: 0, g: 139, b: 139 },
      DARK_GOLDENROD: { r: 184, g: 134, b: 11 },
      DARK_GRAY: { r: 169, g: 169, b: 169 },
      DARK_GREEN: { r: 0, g: 100, b: 0 },
      DARK_KHAKI: { r: 189, g: 183, b: 107 },
      DARK_MAGENTA: { r: 139, g: 0, b: 139 },
      DARK_OLIVE_GREEN: { r: 85, g: 107, b: 47 },
      DARK_ORANGE: { r: 255, g: 140, b: 0 },
      DARK_ORCHID: { r: 153, g: 50, b: 204 },
      DARK_RED: { r: 139, g: 0, b: 0 },
      DARK_SALMON: { r: 233, g: 150, b: 122 },
      DARK_SEA_GREEN: { r: 143, g: 188, b: 143 },
      DARK_SLATE_BLUE: { r: 72, g: 61, b: 139 },
      DARK_SLATE_GRAY: { r: 47, g: 79, b: 79 },
      DARK_TURQUOISE: { r: 0, g: 206, b: 209 },
      DARK_VIOLET: { r: 148, g: 0, b: 211 },
      DEEP_PINK: { r: 255, g: 20, b: 147 },
      DEEP_SKY_BLUE: { r: 0, g: 191, b: 255 },
      DIM_GRAY: { r: 105, g: 105, b: 105 },
      DODGER_BLUE: { r: 30, g: 144, b: 255 },
      FIREBRICK: { r: 178, g: 34, b: 34 },
      FLORAL_WHITE: { r: 255, g: 250, b: 240 },
      FOREST_GREEN: { r: 34, g: 139, b: 34 },
      FUCHSIA: { r: 255, g: 0, b: 255 },
      GAINSBORO: { r: 220, g: 220, b: 220 },
      GHOST_WHITE: { r: 248, g: 248, b: 255 },
      GOLD: { r: 255, g: 215, b: 0 },
      GOLDENROD: { r: 218, g: 165, b: 32 },
      GRAY: { r: 128, g: 128, b: 128 },
      GREEN: { r: 0, g: 128, b: 0 },
      GREEN_YELLOW: { r: 173, g: 255, b: 47 },
      HONEYDEW: { r: 240, g: 255, b: 240 },
      HOT_PINK: { r: 255, g: 105, b: 180 },
      INDIAN_RED: { r: 205, g: 92, b: 92 },
      INDIGO: { r: 75, g: 0, b: 130 },
      IVORY: { r: 255, g: 255, b: 240 },
      KHAKI: { r: 240, g: 230, b: 140 },
      LAVENDER: { r: 230, g: 230, b: 250 },
      LAVENDER_BLUSH: { r: 255, g: 240, b: 245 },
      LAWN_GREEN: { r: 124, g: 252, b: 0 },
      LEMON_CHIFFON: { r: 255, g: 250, b: 205 },
      LIGHT_BLUE: { r: 173, g: 216, b: 230 },
      LIGHT_CORAL: { r: 240, g: 128, b: 128 },
      LIGHT_CYAN: { r: 224, g: 255, b: 255 },
      LIGHT_GOLDENROD_YELLOW: { r: 250, g: 250, b: 210 },
      LIGHT_GRAY: { r: 211, g: 211, b: 211 },
      LIGHT_GREEN: { r: 144, g: 238, b: 144 },
      LIGHT_PINK: { r: 255, g: 182, b: 193 },
      LIGHT_SALMON: { r: 255, g: 160, b: 122 },
      LIGHT_SEA_GREEN: { r: 32, g: 178, b: 170 },
      LIGHT_SKY_BLUE: { r: 135, g: 206, b: 250 },
      LIGHT_SLATE_GRAY: { r: 119, g: 136, b: 153 },
      LIGHT_STEEL_BLUE: { r: 176, g: 196, b: 222 },
      LIGHT_YELLOW: { r: 255, g: 255, b: 224 },
      LIME: { r: 0, g: 255, b: 0 },
      LIME_GREEN: { r: 50, g: 205, b: 50 },
      LINEN: { r: 250, g: 240, b: 230 },
      MAGENTA: { r: 255, g: 0, b: 255 },
      MAROON: { r: 128, g: 0, b: 0 },
      MEDIUM_AQUAMARINE: { r: 102, g: 205, b: 170 },
      MEDIUM_BLUE: { r: 0, g: 0, b: 205 },
      MEDIUM_ORCHID: { r: 186, g: 85, b: 211 },
      MEDIUM_PURPLE: { r: 147, g: 112, b: 219 },
      MEDIUM_SEA_GREEN: { r: 60, g: 179, b: 113 },
      MEDIUM_SLATE_BLUE: { r: 123, g: 104, b: 238 },
      MEDIUM_SPRING_GREEN: { r: 0, g: 250, b: 154 },
      MEDIUM_TURQUOISE: { r: 72, g: 209, b: 204 },
      MEDIUM_VIOLET_RED: { r: 199, g: 21, b: 133 },
      MIDNIGHT_BLUE: { r: 25, g: 25, b: 112 },
      MINT_CREAM: { r: 245, g: 255, b: 250 },
      MISTY_ROSE: { r: 255, g: 228, b: 225 },
      MOCCASIN: { r: 255, g: 228, b: 181 },
      NAVAJO_WHITE: { r: 255, g: 222, b: 173 },
      NAVY: { r: 0, g: 0, b: 128 },
      OLD_LACE: { r: 253, g: 245, b: 230 },
      OLIVE: { r: 128, g: 128, b: 0 },
      OLIVE_DRAB: { r: 107, g: 142, b: 35 },
      ORANGE: { r: 255, g: 165, b: 0 },
      ORANGE_RED: { r: 255, g: 69, b: 0 },
      ORCHID: { r: 218, g: 112, b: 214 },
      PALE_GOLDENROD: { r: 238, g: 232, b: 170 },
      PALE_GREEN: { r: 152, g: 251, b: 152 },
      PALE_TURQUOISE: { r: 175, g: 238, b: 238 },
      PALE_VIOLET_RED: { r: 219, g: 112, b: 147 },
      PAPAYA_WHIP: { r: 255, g: 239, b: 213 },
      PEACH_PUFF: { r: 255, g: 218, b: 185 },
      PERU: { r: 205, g: 133, b: 63 },
      PINK: { r: 255, g: 192, b: 203 },
      PLUM: { r: 221, g: 160, b: 221 },
      POWDER_BLUE: { r: 176, g: 224, b: 230 },
      PURPLE: { r: 128, g: 0, b: 128 },
      RED: { r: 255, g: 0, b: 0 },
      ROSY_BROWN: { r: 188, g: 143, b: 143 },
      ROYAL_BLUE: { r: 65, g: 105, b: 225 },
      SADDLE_BROWN: { r: 139, g: 69, b: 19 },
      SALMON: { r: 250, g: 128, b: 114 },
      SANDY_BROWN: { r: 244, g: 164, b: 96 },
      SEA_GREEN: { r: 46, g: 139, b: 87 },
      SEA_SHELL: { r: 255, g: 245, b: 238 },
      SIENNA: { r: 160, g: 82, b: 45 },
      SILVER: { r: 192, g: 192, b: 192 },
      SKY_BLUE: { r: 135, g: 206, b: 235 },
      SLATE_BLUE: { r: 106, g: 90, b: 205 },
      SLATE_GRAY: { r: 112, g: 128, b: 144 },
      SNOW: { r: 255, g: 250, b: 250 },
      SPRING_GREEN: { r: 0, g: 255, b: 127 },
      STEEL_BLUE: { r: 70, g: 130, b: 180 },
      TAN: { r: 210, g: 180, b: 140 },
      TEAL: { r: 0, g: 128, b: 128 },
      THISTLE: { r: 216, g: 191, b: 216 },
      TOMATO: { r: 255, g: 99, b: 71 },
      TURQUOISE: { r: 64, g: 224, b: 208 },
      VIOLET: { r: 238, g: 130, b: 238 },
      WHEAT: { r: 245, g: 222, b: 179 },
      WHITE: { r: 255, g: 255, b: 255 },
      WHITE_SMOKE: { r: 245, g: 245, b: 245 },
      YELLOW: { r: 255, g: 255, b: 0 },
      YELLOW_GREEN: { r: 154, g: 205, b: 50 },
      
      // Turtle graphics classic colors (keeping these for compatibility)
      TURTLE_GREEN: { r: 51, g: 255, b: 170 }
    };
    
         // Create interpreter with colors
     this.interpreter = new Interpreter(this.colors);
    
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
    this.toggleGridBtn = document.getElementById('toggleGridBtn');
    this.statusText = document.getElementById('statusText');
    this.light = document.getElementById('light');
    this.posLbl = document.getElementById('posLbl');
    this.headLbl = document.getElementById('headLbl');
    this.commandsDetails = document.getElementById('commandsDetails');
    this.splitter = document.getElementById('splitter');
  }

  setupEventListeners() {
    this.runBtn.addEventListener('click', () => this.handleRun());
    this.stepBtn.addEventListener('click', () => this.handleStep());
    this.resetBtn.addEventListener('click', () => this.handleReset());
    this.toggleGridBtn.addEventListener('click', () => this.toggleGrid());
    
    // Setup splitter functionality
    this.setupSplitter();
  }

  setupExamples() {
    const samples = {
      Square: `REPEAT 4 [ FD 40 RT 90 ]`,
      Star: `REPEAT 5 [ FD 60 RT 144 ]`,
      Spiral: `CS HOME PD REPEAT 60 [ FD 3 RT 10 FD 3 ]`,
      RainbowSpiral: `CS HOME PD\nRAINBOW ON\nHUESTEP 4\nPENSIZE 2\nREPEAT 80 [ FD 4 RT 11 ]`,
      Nested: `CS HOME PD\nRAINBOW ON\nREPEAT 12 [\n  REPEAT 8 [ FD 30 RT 45 ]\n  RT 30\n]`,
      Snowflake: `CS HOME PD\nPENCOLOR 160 220 255\nREPEAT 6 [\n  REPEAT 3 [ FD 40 RT 60 ]\n  RT 60\n]`,
      PerfCircle: `CS HOME PD\nRAINBOW ON\nHUESTEP 3\nREPEAT 1200 [ FD 2 RT 5 ]`,
      ManyCircles: `CS HOME PD\nRAINBOW ON\nPENSIZE 2\nHUESTEP 5\nPU HOME\nREPEAT 11 [ RT 30 HOME PU FD 60 LT 90 FD 25 LT 90 PD REPEAT 51 [ FD 4 RT 7 ] PU ]\nHOME PD`,
      ColorDemo: `CS HOME PD\nPENCOLOR 255 0 0\nREPEAT 4 [ FD 30 RT 90 ]\nPENCOLOR 0 255 0\nREPEAT 4 [ FD 30 RT 90 ]\nPENCOLOR 0 0 255\nREPEAT 4 [ FD 30 RT 90 ]\nPENCOLOR 255 255 0\nREPEAT 4 [ FD 30 RT 90 ]`,
      ColorEnumDemo: `CS HOME PD\nPENCOLOR 255 0 0\nREPEAT 4 [ FD 25 RT 90 ]\nPENCOLOR 0 255 0\nREPEAT 4 [ FD 25 RT 90 ]\nPENCOLOR 0 0 255\nREPEAT 4 [ FD 25 RT 90 ]\nPENCOLOR 255 255 0\nREPEAT 4 [ FD 25 RT 90 ]\nPENCOLOR 255 0 255\nREPEAT 4 [ FD 25 RT 90 ]\nPENCOLOR 0 255 255\nREPEAT 4 [ FD 25 RT 90 ]`,
      CSharpColors: `CS HOME PD\nPENCOLOR 255 0 0\nREPEAT 3 [ FD 20 RT 120 ]\nPENCOLOR 0 255 0\nREPEAT 3 [ FD 20 RT 120 ]\nPENCOLOR 0 0 255\nREPEAT 3 [ FD 20 RT 120 ]\nPENCOLOR 255 255 0\nREPEAT 3 [ FD 20 RT 120 ]\nPENCOLOR 255 0 255\nREPEAT 3 [ FD 20 RT 120 ]\nPENCOLOR 0 255 255\nREPEAT 3 [ FD 20 RT 120 ]\nPENCOLOR 255 165 0\nREPEAT 3 [ FD 20 RT 120 ]\nPENCOLOR 128 0 128\nREPEAT 3 [ FD 20 RT 120 ]`,
      ColorNames: `CS HOME PD\nPENCOLOR RED\nREPEAT 4 [ FD 20 RT 90 ]\nPENCOLOR GREEN\nREPEAT 4 [ FD 20 RT 90 ]\nPENCOLOR BLUE\nREPEAT 4 [ FD 20 RT 90 ]\nPENCOLOR YELLOW\nREPEAT 4 [ FD 20 RT 90 ]\nPENCOLOR PURPLE\nREPEAT 4 [ FD 20 RT 90 ]\nPENCOLOR ORANGE\nREPEAT 4 [ FD 20 RT 90 ]`
    };
    
    const examples = document.getElementById('examples');
    examples.textContent = Object.entries(samples).map(([k, v]) => `• ${k}\n${v}`).join('\n\n');
    
    // Set default program
    this.editor.value = `; Rainbow demo\nCS HOME PD\nRAINBOW ON\nHUESTEP 4\nPENSIZE 6\nREPEAT 80 [ FD 6 RT 7 ]`;
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





  toggleGrid() {
    const isVisible = this.threeScene.toggleGrid();
    // Update button text to indicate state
    this.toggleGridBtn.textContent = isVisible ? '⊞' : '⊟';
    this.toggleGridBtn.title = isVisible ? 'Hide Grid' : 'Show Grid';
  }

  setupSplitter() {
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    this.splitter.addEventListener('mousedown', (e) => {
      isResizing = true;
      startY = e.clientY;
      const editorSection = document.querySelector('.editor-section');
      startHeight = editorSection.offsetHeight;
      document.body.style.cursor = 'ns-resize';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      
      const deltaY = e.clientY - startY;
      const editorSection = document.querySelector('.editor-section');
      const leftPane = document.querySelector('.left');
      const toolbarHeight = document.querySelector('.toolbar').offsetHeight;
      const splitterHeight = this.splitter.offsetHeight;
      
      // Calculate available space
      const availableHeight = leftPane.offsetHeight - toolbarHeight - splitterHeight;
      
      // Calculate new height with constraints
      const newHeight = Math.max(150, Math.min(availableHeight - 150, startHeight + deltaY));
      
      editorSection.style.height = newHeight + 'px';
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
      }
    });
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
    
    if (this.playing) {
      requestAnimationFrame(() => this.tickRun());
    }
  }

  // Helper method to get color enum values
  getColor(colorName) {
    const color = this.colors[colorName.toUpperCase()];
    if (!color) {
      throw new Error(`Unknown color: ${colorName}. Available colors: ${Object.keys(this.colors).join(', ')}`);
    }
    return color;
  }

  // Helper method to convert color enum to PENCOLOR command
  setColor(colorName) {
    const color = this.getColor(colorName);
    return `PENCOLOR ${color.r} ${color.g} ${color.b}`;
  }

  // Initial setup
  initialize() {
    this.compile();
    this.updatePositionDisplay();
  }
}
