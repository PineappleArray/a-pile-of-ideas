import { Delta } from './delta';

export class DeltaFactory {
  static insert(pos: number, text: string): Delta {
    return {
      ops: [
        { type: 'retain', count: pos },
        { type: 'insert', text }
      ]
    };
  }

  static delete(pos: number, count: number): Delta {
    return {
      ops: [
        { type: 'retain', count: pos },
        { type: 'delete', count }
      ]
    };
  }

  static replace(pos: number, delCount: number, text: string): Delta {
    return {
      ops: [
        { type: 'retain', count: pos },
        { type: 'delete', count: delCount },
        { type: 'insert', text }
      ]
    };
  }
}