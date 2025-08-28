export class Interpreter {
  constructor() {
    this.keywords = new Set([
      'FD', 'BK', 'RT', 'LT', 'PU', 'PD', 'HOME', 'CS', 
      'SETPOS', 'SETHEADING', 'PENCOLOR', 'PENSIZE', 
      'RAINBOW', 'HUESTEP', 'REPEAT', 'ZOOM', 'PLOT', 'PLOT_STEP'
    ]);
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
        
        // simple ops gather numeric args as needed
        switch (t) {
          case 'FD': 
          case 'BK': 
          case 'RT': 
          case 'LT': 
          case 'PENSIZE': 
          case 'SETHEADING': {
            const n = Number(tokens[i++]);
            if (Number.isNaN(n)) throw new Error(`Expected number after ${t}`);
            block.push({ op: t, n });
            break;
          }
          case 'SETPOS': {
            const x = Number(tokens[i++]);
            const y = Number(tokens[i++]);
            if (Number.isNaN(x) || Number.isNaN(y)) throw new Error('SETPOS x y');
            block.push({ op: 'SETPOS', x, y });
            break;
          }
          case 'PENCOLOR': {
            const r = Number(tokens[i++]);
            const g = Number(tokens[i++]);
            const b = Number(tokens[i++]);
            if ([r, g, b].some(n => Number.isNaN(n))) throw new Error('PENCOLOR r g b (0-255)');
            block.push({ op: 'PENCOLOR', r, g, b });
            break;
          }
          case 'HUESTEP': {
            const n = Number(tokens[i++]);
            if (Number.isNaN(n)) throw new Error('HUESTEP n');
            block.push({ op: 'HUESTEP', n });
            break;
          }
          case 'RAINBOW': {
            const m = (tokens[i++] || '').toUpperCase();
            if (m !== 'ON' && m !== 'OFF') throw new Error('RAINBOW ON|OFF');
            block.push({ op: 'RAINBOW', on: m === 'ON' });
            break;
          }
          case 'ZOOM': {
            const m = (tokens[i++] || '').toUpperCase();
            if (m !== 'IN' && m !== 'OUT') throw new Error('ZOOM IN|OUT');
            block.push({ op: 'ZOOM', direction: m });
            break;
          }
          case 'PLOT': {
            // Parse plotting parameters
            const expression = tokens[i++];
            if (!expression) throw new Error('PLOT requires an expression');
            
            // Parse optional parameters
            let xMin = -10, xMax = 10, steps = 100;
            let xValues = null;
            let showDots = false;
            let dotColor = null;
            let smooth = true;
            let hasAtArray = false;
            
            // Parse parameters
            while (i < tokens.length) {
              const token = tokens[i].toUpperCase();
              
              if (token === 'FROM') {
                i++; // skip FROM
                xMin = Number(tokens[i++]);
                if (Number.isNaN(xMin)) throw new Error('PLOT FROM x1 TO x2');
                smooth = true;
              } else if (token === 'TO') {
                i++; // skip TO
                xMax = Number(tokens[i++]);
                if (Number.isNaN(xMax)) throw new Error('PLOT FROM x1 TO x2');
                smooth = true;
              } else if (token === 'STEPS') {
                i++; // skip STEPS
                steps = Number(tokens[i++]);
                if (Number.isNaN(steps) || steps < 1) throw new Error('PLOT STEPS n (minimum 1)');
                if (steps > 10000) throw new Error('PLOT STEPS n (maximum 10000 for performance)');
                smooth = true;
              } else if (token === 'AT') {
                i++; // skip AT
                if (tokens[i] !== '[') throw new Error('PLOT AT [x1,x2,x3,...]');
                i++; // skip [
                
                // Parse array of x values
                xValues = [];
                console.log('Parsing AT array...');
                while (i < tokens.length && tokens[i] !== ']') {
                  console.log(`Current token at index ${i}: "${tokens[i]}"`);
                  const x = Number(tokens[i++]);
                  console.log(`Parsed x value: ${x}, isNaN: ${Number.isNaN(x)}`);
                  if (Number.isNaN(x)) throw new Error(`Invalid number in array: "${tokens[i-1]}"`);
                  xValues.push(x);
                  
                  // Skip comma if present
                  if (i < tokens.length && tokens[i] === ',') {
                    console.log('Skipping comma');
                    i++;
                  }
                }
                
                if (i >= tokens.length || tokens[i] !== ']') {
                  throw new Error('Missing closing ] in array');
                }
                i++; // skip ]
                hasAtArray = true;
                smooth = false; // AT array overrides smooth plotting
                console.log(`Parsed xValues array: [${xValues.join(', ')}]`);
              } else if (token === 'SMOOTH') {
                i++; // skip SMOOTH
                smooth = true;
              } else if (token === 'DOTS') {
                i++; // skip DOTS
                showDots = true;
                console.log('DOTS parameter detected');
              } else if (token === 'COLOR') {
                i++; // skip COLOR
                const r = Number(tokens[i++]);
                const g = Number(tokens[i++]);
                const b = Number(tokens[i++]);
                if ([r, g, b].some(n => Number.isNaN(n))) throw new Error('DOT COLOR r g b (0-255)');
                dotColor = { r, g, b };
              } else {
                break; // Unknown parameter, stop parsing
              }
            }
            
            // Create plot commands
            if (xValues) {
              // Plot at specific x values (AT takes priority over FROM/TO)
              if (hasAtArray && (xMin !== -10 || xMax !== 10)) {
                console.warn('PLOT: AT array overrides FROM/TO range. Using only the specified x values.');
              }
              console.log(`Creating ${xValues.length} PLOT_STEP commands for xValues: [${xValues.join(', ')}]`);
              for (let i = 0; i < xValues.length; i++) {
                const x = xValues[i];
                              console.log(`Creating PLOT_STEP for x=${x}, isFirst=${i === 0}, showDots=${showDots}`);
              block.push({ 
                op: 'PLOT_STEP', 
                expression, 
                x, 
                isFirst: i === 0,
                showDots,
                dotColor
              });
              }
            } else if (smooth) {
              // Smooth plot
              const stepSize = (xMax - xMin) / steps;
              for (let i = 0; i <= steps; i++) {
                const x = xMin + i * stepSize;
                block.push({ 
                  op: 'PLOT_STEP', 
                  expression, 
                  x, 
                  isFirst: i === 0,
                  showDots,
                  dotColor
                });
              }
            }
            break;
          }
          case 'PU': 
          case 'PD': 
          case 'HOME': 
          case 'CS': {
            block.push({ op: t });
            break;
          }
          default: {
            // Allow lowercase and unknowns; try to be helpful
            if (this.keywords.has(t)) throw new Error(`Malformed command near ${t}`);
            else throw new Error(`Unknown token: ${t}`);
          }
        }
      }
      return block;
    };
    
    return parseBlock();
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
