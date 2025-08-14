import * as THREE from 'three';

export class TurtleState {
  constructor() {
    this.pos = new THREE.Vector2(0, 0);
    this.heading = 0; // 0 = up, 90 = right
    this.penDown = true;
    this.penSize = 6;
    this.penColor = new THREE.Color('#33ffaa');
    this.rainbow = false;
    this.hue = 0;         // 0..360 degrees
    this.hueStep = 5;     // degrees per segment when rainbow is ON
  }

  reset() {
    this.pos.set(0, 0);
    this.heading = 0;
    this.penDown = true;
    this.rainbow = false;
    this.hue = 0;
    this.hueStep = 5;
  }

  turn(angle) {
    this.heading = (this.heading + angle) % 360;
    if (this.heading < 0) this.heading += 360;
  }

  move(distance) {
    const rad = THREE.MathUtils.degToRad(90 - this.heading); // 0° up
    const dir = new THREE.Vector2(Math.cos(rad), Math.sin(rad));
    const start = this.pos.clone();
    const end = start.clone().add(dir.multiplyScalar(distance));
    
    if (this.penDown) {
      return { start, end, shouldDraw: true };
    }
    
    this.pos.copy(end);
    return { start, end, shouldDraw: false };
  }

  setPosition(x, y) {
    this.pos.set(x, y);
  }

  setHeading(angle) {
    this.heading = angle;
  }

  setPenColor(r, g, b) {
    this.penColor.setRGB(r/255, g/255, b/255);
    // Seed rainbow hue from the chosen color
    const hsl = { h: 0, s: 0, l: 0 };
    this.penColor.getHSL(hsl);
    this.hue = Math.round(hsl.h * 360);
  }

  setPenSize(size) {
    this.penSize = Math.max(1, Math.min(12, size));
  }

  setHueStep(step) {
    this.hueStep = Math.max(1, Math.min(60, step));
  }

  setRainbow(on) {
    this.rainbow = !!on;
  }

  getCurrentColor() {
    const color = new THREE.Color();
    if (this.rainbow) {
      this.hue = (this.hue + this.hueStep) % 360;
      color.setHSL(this.hue/360, 1.0, 0.5);
    } else {
      color.copy(this.penColor);
    }
    return color;
  }

  getPosition() {
    return { x: this.pos.x, y: this.pos.y };
  }

  getHeading() {
    return this.heading;
  }
}
