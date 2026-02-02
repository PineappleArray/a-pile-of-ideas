import { diffChars } from 'diff';
import {Operation} from "./types"
import {Delta} from './types'

export class DeltaManager {
  private deltas: Delta[] = [];
  private currentIndex: number = -1;
  private maxDeltas: number = 100; // Keep last 100 deltas

  // Add a new delta
  addDelta(userId: string, operations: Operation[]): void {
    // Remove any deltas after current index (when undoing then making new changes)
    this.deltas = this.deltas.slice(0, this.currentIndex + 1);

    const delta: Delta = {
      timestamp: Date.now(),
      userId,
      operations
    };

    this.deltas.push(delta);
    this.currentIndex++;

    // Limit history size
    if (this.deltas.length > this.maxDeltas) {
      this.deltas.shift();
      this.currentIndex--;
    }
  }

  // Undo: return the delta to reverse
  undo(): Delta | null {
    if (this.currentIndex < 0) {
      return null;
    }

    const delta = this.deltas[this.currentIndex];
    this.currentIndex--;
    return delta;
  }

  // Redo: return the delta to reapply
  redo(): Delta | null {
    if (this.currentIndex >= this.deltas.length - 1) {
      return null;
    }

    this.currentIndex++;
    return this.deltas[this.currentIndex];
  }

  // Get all deltas (for sync)
  getAllDeltas(): Delta[] {
    return [...this.deltas];
  }

  // Apply deltas from remote (e.g., when joining a session)
  applyRemoteDeltas(deltas: Delta[]): void {
    deltas.forEach(delta => {
      this.deltas.push(delta);
      this.currentIndex++;
    });
  }

  // Clear history
  clear(): void {
    this.deltas = [];
    this.currentIndex = -1;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.deltas.length - 1;
  }

    private compareTexts(textBoxId: string, oldText: string, newText: string): Operation[] {
        const operations: Operation[] = [];
        const res = diffChars(oldText,newText)

        let position = 0; // Track current position in the text
        res.forEach(change => {
            if (change.added) {
                // Text was inserted
                operations.push({
                    type: 'insert_text',
                    textBoxId,
                    position,              // Where to insert
                    content: change.value  // What was inserted
                });
                position += change.value.length;
            } else if (change.removed) {
                operations.push({
                    type: 'delete_text',
                    textBoxId,
                    position,                    // Where deletion started
                    length: change.value.length, // How many chars deleted
                    deletedContent: change.value // What was deleted (for undo)
                });
            } else {
                position += change.value.length;
            }
        });
        return operations;  
    }
}

