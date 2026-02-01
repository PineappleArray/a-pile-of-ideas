import RBush from 'rbush';

export interface BoxItem {
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  id: string;
}

export class SpatialTree {
  private tree: RBush<BoxItem>;

  constructor() {
    this.tree = new RBush<BoxItem>();
  }

  // Insert a box into the tree 
  //x,y is the position of the upper left corner 
  insert(maxX: number, maxY: number, minX: number, minY: number, id: string): BoxItem {
    const item: BoxItem = {
      maxX: maxX,
      maxY: maxY,
      minX : minX,
      minY : minY,
      id: id,//Math.random().toString(36)
    };
    if (this.hasOverlap(maxX,maxY,minX,minY)!)
      this.tree.insert(item);
    return item;
  }

  overlapPercent(boxA: BoxItem, boxB: BoxItem): number {
    return Math.max(0, Math.min(boxA.maxX, boxB.maxX) - Math.max(boxA.minX, boxB.minX)) * Math.max(0, Math.min(boxA.maxY, boxB.maxY) - Math.max(boxA.minY, boxB.minY));
   }

  // Check if a box would overlap with existing boxes
  hasOverlap(maxX: number, maxY: number, minX: number, minY: number): boolean {
    const results = this.tree.search({
      minX: minX,
      minY: minY,
      maxX: maxX,
      maxY: maxY
    });
    
    return results.length > 0;
  }


canInsert(toAdd: BoxItem): boolean {
  // 1. Narrow down candidates
  const candidates = this.tree.search(toAdd);

  // 2. Exact geometry checks
  for (const inTree of candidates) {
    // Any overlap
    if (this.overlapPercent(inTree, toAdd) > 0) {
      return false;
    }

    // New box fully inside existing
    if (toAdd.minX >= inTree.minX && toAdd.maxX <= inTree.minX && toAdd.minY >= inTree.minY && toAdd.maxY <= inTree.maxY) {
      return false;
    }
  }

  return true;
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