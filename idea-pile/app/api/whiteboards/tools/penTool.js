import Tool from './tools';

// Pen tool implementation without React hooks (class-based state)
class PenTool extends Tool {
  constructor(size, color, x, y, data) {
    super("Pen", size, color);
    this.size = size;
    this.color = color;
    this.data = data;
    this.strokes = [];
    this.currentStroke = null;
  }

  makePath(points) {
    if (points.length < 2) return null;

    const segments = [];

    for (let i = 1; i < points.length - 1; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const p2 = points[i + 1];

      segments.push({
        start: this.midpoint(p0, p1),
        control: p1,
        end: this.midpoint(p1, p2)
      });
    }
    return {
      type: "path",
      stroke: "#000",
      strokeWidth: 2,
      segments
    };
  }

  midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
}

export default PenTool;