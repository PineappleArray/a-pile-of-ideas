import Tool from './tools'; // adjust the import path as needed

interface Point {
  x: number;
  y: number;
}

interface PathSegment {
  start: Point;
  control: Point;
  end: Point;
}

interface Path {
  type: string;
  stroke: string;
  strokeWidth: number;
  segments: PathSegment[];
}

// Pen tool implementation without React hooks (class-based state)
class PenTool extends Tool {
  size: number;
  color: string;
  data: any; // Replace 'any' with your actual data type
  strokes: any[]; // Replace 'any' with your actual stroke type
  currentStroke: any | null; // Replace 'any' with your actual stroke type

  constructor(size: number, color: string) {
    super("Pen", size, color);
    this.size = size;
    this.color = color;
    this.strokes = [];
    this.currentStroke = null;
  }

  makePath(points: Point[]): Path | null {
    if (points.length < 2) return null;

    const segments: PathSegment[] = [];

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

  midpoint(a: Point, b: Point): Point {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }
}

export default PenTool;