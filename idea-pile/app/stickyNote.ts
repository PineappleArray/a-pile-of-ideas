import stickyNote from "../shared/notes";

export function getOverlapArea(a: stickyNote, x: number, y: number, width: number, height: number): number {
  const xOverlap = Math.max(0, Math.min(a.centerX + a.box_width, x + width) - Math.max(a.centerX, x));
  const yOverlap = Math.max(0, Math.min(a.centerY + a.box_height, y + height) - Math.max(a.centerY, y));
  return xOverlap * yOverlap;
}

export function findOverlaps(notes: stickyNote[], x: number, y: number, width: number, height: number, threshold = 0.5): boolean {
  for (let i = 0; i < notes.length; i++) {
    const a = notes[i];

      const overlapArea = getOverlapArea(a, x, y, width, height);
      if (overlapArea === 0) continue;

      const areaA = a.box_width * a.box_height;
      const areaB = width * height;
      console.log(`Overlap ${overlapArea}px², Threshold: ${threshold * areaA}px²`)

      if (overlapArea >= threshold * areaA || overlapArea >= threshold * areaB) {
        return true; //Found a pair that overlaps beyond the threshold
      }
    }

  return false;
}