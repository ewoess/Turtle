export class Interpreter {
  constructor() {
    this.keywords = new Set([
      'FD', 'BK', 'RT', 'LT', 'PU', 'PD', 'HOME', 'CS', 
      'SETPOS', 'SETHEADING', 'PENCOLOR', 'PENSIZE', 
      'RAINBOW', 'HUESTEP', 'REPEAT', 'ZOOM'
    ]);
  }

  tokenize(src) {
    // Convert Apple/Logo style to tokens, keep brackets
    const replaced = src
      .replace(/;.*$/gm, '') // strip ; comments
      .replace(/\[/g, ' [ ') // pad brackets
      .replace(/\]/g, ' ] ')
      .replace(/\s+/g, ' ')
      .trim();
    return replaced.length ? replaced.split(' ') : [];
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
    return k;
  }
}
