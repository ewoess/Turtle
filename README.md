# Turtle Graphics App

A modern, modular implementation of a Turtle graphics application inspired by Apple II Logo, built with Three.js and ES6 modules.

## Features

- **Logo-like Programming Language**: Supports classic turtle graphics commands like `FD`, `BK`, `RT`, `LT`, `PU`, `PD`, `HOME`, `CS`, etc.
- **Rainbow Mode**: Automatic color cycling for beautiful visual effects
- **Real-time Execution**: Step-by-step or continuous execution with adjustable speed
- **Modern UI**: Clean, responsive interface with dark theme
- **Performance Optimized**: Efficient line rendering with batched geometry
- **Modular Architecture**: Clean separation of concerns with ES6 modules

## Commands

| Command | Description | Example |
|---------|-------------|---------|
| `FD n` | Forward n pixels | `FD 100` |
| `BK n` | Backward n pixels | `BK 50` |
| `RT a` | Turn right a degrees | `RT 90` |
| `LT a` | Turn left a degrees | `LT 45` |
| `PU` | Pen up (stop drawing) | `PU` |
| `PD` | Pen down (start drawing) | `PD` |
| `HOME` | Go to (0,0) with heading 0 | `HOME` |
| `CS` | Clear screen | `CS` |
| `SETPOS x y` | Move to position (x,y) | `SETPOS 100 200` |
| `SETHEADING d` | Set heading to d degrees | `SETHEADING 90` |
| `PENCOLOR r g b` | Set pen color (0-255) | `PENCOLOR 255 0 0` |
| `PENSIZE n` | Set pen size (1-12) | `PENSIZE 3` |
| `RAINBOW ON/OFF` | Enable/disable rainbow mode | `RAINBOW ON` |
| `HUESTEP n` | Set hue step for rainbow | `HUESTEP 10` |
| `REPEAT n [ ... ]` | Repeat commands n times | `REPEAT 4 [ FD 100 RT 90 ]` |

## Examples

### Square
```
REPEAT 4 [ FD 120 RT 90 ]
```

### Star
```
REPEAT 5 [ FD 180 RT 144 ]
```

### Rainbow Spiral
```
CS HOME PD
RAINBOW ON
HUESTEP 4
PENSIZE 2
REPEAT 150 [ FD 6 RT 11 ]
```

### Snowflake
```
CS HOME PD
PENCOLOR 160 220 255
REPEAT 6 [
  REPEAT 3 [ FD 100 RT 60 ]
  RT 60
]
```

## Project Structure

```
src/
├── js/
│   ├── main.js           # Main application entry point
│   ├── TurtleState.js    # Turtle state management
│   ├── ThreeScene.js     # Three.js scene and rendering
│   ├── Interpreter.js    # Logo command parsing and interpretation
│   ├── Executor.js       # Command execution
│   └── UIController.js   # UI event handling and controls
└── styles/
    └── main.css          # Application styles
```

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

### Build

To build for production:
```bash
npm run build
```

The built files will be in the `dist/` directory.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Architecture

The application is built with a modular architecture:

- **TurtleState**: Manages the turtle's position, heading, and drawing properties
- **ThreeScene**: Handles Three.js scene setup, camera, renderer, and drawing operations
- **Interpreter**: Parses and interprets Logo-like commands
- **Executor**: Executes individual commands and updates the turtle state
- **UIController**: Manages UI interactions and program execution flow

This separation makes the code maintainable, testable, and easy to extend.

## Technologies Used

- **Three.js**: 3D graphics rendering
- **ES6 Modules**: Modern JavaScript module system
- **Vite**: Fast build tool and development server
- **CSS Custom Properties**: Modern styling with CSS variables

## License

MIT License - feel free to use this project for educational or commercial purposes.
