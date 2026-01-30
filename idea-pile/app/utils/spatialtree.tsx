import RBush from 'rbush';

export interface BoxItem {
  minX: number;
  minY: number;
  texts: Text;
  id: string;
}

export class SpatialTree {
  private tree: RBush<BoxItem>;

  constructor() {
    this.tree = new RBush<BoxItem>();
  }

  // Insert a box into the tree
  insert(x: number, y: number, width: number, height: number, text: Text): BoxItem {
    const item: BoxItem = {
      minX: x,
      minY: y,
      texts : text,
      id: Math.random().toString(36)
    };
    
    this.tree.insert(item);
    return item;
  }

  // Check if a box would overlap with existing boxes
  hasOverlap(x: number, y: number, width: number, height: number): boolean {
    const results = this.tree.search({
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height
    });
    
    return results.length > 0;
  }

  // Get all overlapping boxes
  getOverlapping(x: number, y: number, width: number, height: number): BoxItem[] {
    return this.tree.search({
      minX: x,
      minY: y,
      maxX: x + width,
      maxY: y + height
    });
  }

  // Remove a box from the tree
  remove(item: BoxItem): void {
    this.tree.remove(item);
  }

  // Clear all boxes
  clear(): void {
    this.tree.clear();
  }

  // Get all items
  all(): BoxItem[] {
    return this.tree.all();
  }
}