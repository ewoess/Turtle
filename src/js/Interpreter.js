export class Interpreter {
  constructor() {
    this.keywords = new Set([
      'FD', 'BK', 'RT', 'LT', 'PU', 'PD', 'HOME', 'CS', 
      'SETPOS', 'SETHEADING', 'PENCOLOR', 'PENSIZE', 
      'RAINBOW', 'HUESTEP', 'REPEAT', 'ZOOM', 'PLOT', 'PLOT_STEP'
    ]);
    
    // Command parsing matrix - defines the structure of each command
    this.commandMatrix = {
      // Simple commands with no parameters
      'PU': { params: [], handler: 'simple' },
      'PD': { params: [], handler: 'simple' },
      'HOME': { params: [], handler: 'simple' },
      'CS': { params: [], handler: 'simple' },
      
      // Commands with single numeric parameter
      'FD': { params: ['number'], handler: 'singleNumber' },
      'BK': { params: ['number'], handler: 'singleNumber' },
      'RT': { params: ['number'], handler: 'singleNumber' },
      'LT': { params: ['number'], handler: 'singleNumber' },
      'PENSIZE': { params: ['number'], handler: 'singleNumber' },
      'SETHEADING': { params: ['number'], handler: 'singleNumber' },
      'HUESTEP': { params: ['number'], handler: 'singleNumber' },
      
      // Commands with two numeric parameters
      'SETPOS': { params: ['number', 'number'], handler: 'twoNumbers' },
      
      // Commands with three numeric parameters
      'PENCOLOR': { params: ['number', 'number', 'number'], handler: 'threeNumbers' },
      
      // Commands with string parameter
      'RAINBOW': { params: ['string'], handler: 'stringParam', validStrings: ['ON', 'OFF'] },
      'ZOOM': { params: ['string'], handler: 'stringParam', validStrings: ['IN', 'OUT'] },
      
      // Complex commands
      'REPEAT': { params: ['number', 'block'], handler: 'repeat' },
      'PLOT': { params: ['expression', 'options'], handler: 'plot' }
    };
    
    // PLOT command option matrix
    this.plotOptionsMatrix = {
      'FROM': { params: ['number'], next: ['TO'] },
      'TO': { params: ['number'], next: ['STEPS', 'SMOOTH', 'DOTS', 'COLOR'] },
      'STEPS': { params: ['number'], next: ['DOTS', 'COLOR'] },
      'SMOOTH': { params: [], next: ['DOTS', 'COLOR'] },
      'AT': { params: ['array'], next: ['DOTS', 'COLOR'] },
      'DOTS': { params: [], next: ['COLOR'] },
      'COLOR': { params: ['number', 'number', 'number'], next: [] }
    };
  }

  // Mathematical expression evaluator
  evaluateExpression(expression, x) {
    // Replace x^2 with x**2 for JavaScript compatibility
    let jsExpression = expression
      .replace(/x\^(\d+)/g, 'x**$1')
      .replace(/x\^(\w+)/g, 'x**$1')
      .replace(/\^/g, '**')
      .replace(/pi/g, 'Math.PI')
      .replace(/e/g, 'Math.E')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/asin\(/g, 'Math.asin(')
      .replace(/acos\(/g, 'Math.acos(')
      .replace(/atan\(/g, 'Math.atan(')
      .replace(/log\(/g, 'Math.log(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/exp\(/g, 'Math.exp(')
      .replace(/floor\(/g, 'Math.floor(')
      .replace(/ceil\(/g, 'Math.ceil(')
      .replace(/round\(/g, 'Math.round(')
      .replace(/min\(/g, 'Math.min(')
      .replace(/max\(/g, 'Math.max(');
    
    try {
      // Create a safe evaluation context
      const result = Function('x', 'Math', `return ${jsExpression}`)(x, Math);
      const validResult = typeof result === 'number' && !isNaN(result) && isFinite(result) ? result : null;
      return validResult;
    } catch (error) {
      console.warn(`Expression evaluation failed for "${expression}" at x=${x}:`, error);
      return null;
    }
  }

  tokenize(src) {
    // Convert Apple/Logo style to tokens, keep brackets
    const replaced = src
      .replace(/;.*$/gm, '') // strip ; comments
      .replace(/\[/g, ' [ ') // pad brackets
      .replace(/\]/g, ' ] ')
      .replace(/,/g, ' , ') // pad commas
      .replace(/\s+/g, ' ')
      .trim();
    
    const tokens = replaced.length ? replaced.split(' ') : [];
    console.log('Tokenized:', tokens);
    return tokens;
  }

    parse(tokens) {
    let i = 0;
    
    const parseBlock = () => {
      const block = [];
      while (i < tokens.length) {
        const t = tokens[i++].toUpperCase();
        if (t === ']') break;
        if (t === '[') {
          block.push({ op: 'BLOCK', body: parseBlock() });
          continue;
        }
        if (t === 'REPEAT') {
          const count = Number(tokens[i++]);
          if (tokens[i++] !== '[') throw new Error('Expected [ after REPEAT');
          const body = parseBlock();
          block.push({ op: 'REPEAT', count, body });
          continue;
        }
        
        // Use command matrix for parsing
        const command = this.parseCommand(t, tokens, i);
        if (command) {
          if (Array.isArray(command.result)) {
            // Handle multiple commands (like PLOT_STEP commands)
            block.push(...command.result);
          } else {
            block.push(command.result);
          }
          i = command.newIndex;
        } else {
          // Allow lowercase and unknowns; try to be helpful
          if (this.keywords.has(t)) throw new Error(`Malformed command near ${t}`);
          else throw new Error(`Unknown token: ${t}`);
        }
      }
      return block;
    };
    
    return parseBlock();
  }

  parseCommand(command, tokens, startIndex) {
    const cmdDef = this.commandMatrix[command];
    if (!cmdDef) return null;
    
    let i = startIndex;
    const params = [];
    
    // Parse parameters based on command matrix
    for (const paramType of cmdDef.params) {
      if (i >= tokens.length) {
        throw new Error(`Missing parameter for ${command}`);
      }
      
      switch (paramType) {
        case 'number':
          const num = Number(tokens[i++]);
          if (Number.isNaN(num)) throw new Error(`Expected number for ${command}`);
          params.push(num);
          break;
          
        case 'string':
          const str = tokens[i++].toUpperCase();
          if (cmdDef.validStrings && !cmdDef.validStrings.includes(str)) {
            throw new Error(`${command} expects one of: ${cmdDef.validStrings.join(', ')}`);
          }
          params.push(str);
          break;
          
        case 'expression':
          if (i >= tokens.length) throw new Error(`${command} requires an expression`);
          params.push(tokens[i++]);
          break;
          
        case 'options':
          const options = this.parsePlotOptions(tokens, i);
          params.push(options.result);
          i = options.newIndex;
          break;
          
        case 'array':
          const array = this.parseArray(tokens, i);
          params.push(array.result);
          i = array.newIndex;
          break;
      }
    }
    
    // Create command object based on handler
    const result = this.createCommand(command, cmdDef.handler, params);
    
    return { result, newIndex: i };
  }

  parsePlotOptions(tokens, startIndex) {
    let i = startIndex;
    const options = {
      xMin: -10, xMax: 10, steps: 100,
      xValues: null, showDots: false, dotColor: null, smooth: true
    };
    
    while (i < tokens.length) {
      const token = tokens[i].toUpperCase();
      const optionDef = this.plotOptionsMatrix[token];
      
      if (!optionDef) break; // Unknown option, stop parsing
      
      // Parse option parameters
      for (const paramType of optionDef.params) {
        if (i >= tokens.length) break;
        
        switch (paramType) {
          case 'number':
            const num = Number(tokens[++i]);
            if (Number.isNaN(num)) throw new Error(`Expected number for ${token}`);
            
            if (token === 'FROM') options.xMin = num;
            else if (token === 'TO') options.xMax = num;
            else if (token === 'STEPS') options.steps = num;
            else if (token === 'COLOR') {
              const g = Number(tokens[++i]);
              const b = Number(tokens[++i]);
              if ([num, g, b].some(n => Number.isNaN(n))) throw new Error('COLOR r g b (0-255)');
              options.dotColor = { r: num, g, b };
            }
            break;
            
          case 'array':
            const array = this.parseArray(tokens, i + 1);
            options.xValues = array.result;
            options.smooth = false;
            i = array.newIndex;
            break;
        }
      }
      
      // Handle special cases
      if (token === 'SMOOTH') {
        options.smooth = true;
        i++;
      } else if (token === 'DOTS') {
        options.showDots = true;
        i++;
      } else {
        i++; // Move past the option token
      }
    }
    
    return { result: options, newIndex: i };
  }

  parseArray(tokens, startIndex) {
    let i = startIndex;
    if (tokens[i] !== '[') throw new Error('Expected [ for array');
    i++;
    
    const array = [];
    while (i < tokens.length && tokens[i] !== ']') {
      const num = Number(tokens[i++]);
      if (Number.isNaN(num)) throw new Error('Invalid number in array');
      array.push(num);
      
      if (i < tokens.length && tokens[i] === ',') {
        i++;
      }
    }
    
    if (i >= tokens.length || tokens[i] !== ']') {
      throw new Error('Missing closing ] in array');
    }
    i++; // skip ]
    
    return { result: array, newIndex: i };
  }

  createCommand(command, handler, params) {
    switch (handler) {
      case 'simple':
        return { op: command };
        
      case 'singleNumber':
        return { op: command, n: params[0] };
        
      case 'twoNumbers':
        return { op: command, x: params[0], y: params[1] };
        
      case 'threeNumbers':
        return { op: command, r: params[0], g: params[1], b: params[2] };
        
      case 'stringParam':
        if (command === 'RAINBOW') {
          return { op: command, on: params[0] === 'ON' };
        } else if (command === 'ZOOM') {
          return { op: command, direction: params[0] };
        }
        break;
        
      case 'plot':
        return this.createPlotCommands(params[0], params[1]);
    }
  }

  createPlotCommands(expression, options) {
    const commands = [];
    
    if (options.xValues) {
      // Plot at specific x values
      for (let i = 0; i < options.xValues.length; i++) {
        commands.push({
          op: 'PLOT_STEP',
          expression,
          x: options.xValues[i],
          isFirst: i === 0,
          showDots: options.showDots,
          dotColor: options.dotColor
        });
      }
    } else if (options.smooth) {
      // Smooth plot
      const stepSize = (options.xMax - options.xMin) / options.steps;
      for (let i = 0; i <= options.steps; i++) {
        const x = options.xMin + i * stepSize;
        commands.push({
          op: 'PLOT_STEP',
          expression,
          x,
          isFirst: i === 0,
          showDots: options.showDots,
          dotColor: options.dotColor
        });
      }
    }
    
    return commands;
  }

  *evalBlock(block) {
    for (const cmd of block) {
      if (cmd.op === 'REPEAT') {
        for (let k = 0; k < cmd.count; k++) {
          yield* this.evalBlock(cmd.body);
        }
        continue;
      }
      yield cmd; // atomic step
    }
  }

  compile(source) {
    try {
      const tokens = this.tokenize(source);
      const ast = this.parse(tokens);
      return { success: true, iterator: this.evalBlock(ast) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  formatCommand(cmd) {
    if (!cmd) return '';
    const k = cmd.op;
    if ('FD BK RT LT PENSIZE SETHEADING HUESTEP'.split(' ').includes(k)) return `${k} ${cmd.n}`;
    if (k === 'SETPOS') return `${k} ${cmd.x} ${cmd.y}`;
    if (k === 'PENCOLOR') return `${k} ${cmd.r} ${cmd.g} ${cmd.b}`;
    if (k === 'RAINBOW') return `${k} ${cmd.on ? 'ON' : 'OFF'}`;
    if (k === 'PLOT') return `${k} ${cmd.expression} FROM ${cmd.xMin} TO ${cmd.xMax} STEPS ${cmd.steps}`;
    if (k === 'PLOT_STEP') return `${k} ${cmd.expression} at x=${cmd.x}`;
    return k;
  }
}
