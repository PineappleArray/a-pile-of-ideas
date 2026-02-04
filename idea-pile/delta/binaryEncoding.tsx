import {Delta} from './deltaUtil'
import {DeltaOp} from './deltaUtil'
export class BinaryDeltaEncoder {
  /**
   * Called BEFORE storing delta in database
   * Converts Delta object → Uint8Array (binary)
   */
  encode(delta: Delta): Uint8Array {
    const parts: number[] = [];
    
    for (const op of delta.ops) {
      if (op.type === 'retain') {
        parts.push(0x00);  // Type byte
        parts.push(...this.encodeVarint(op.count));
      } 
      else if (op.type === 'delete') {
        parts.push(0x02);
        parts.push(...this.encodeVarint(op.count));
      }
      else if (op.type === 'insert') {
        parts.push(0x01);
        const textBytes = new TextEncoder().encode(op.text);
        parts.push(...this.encodeVarint(textBytes.length));
        parts.push(...textBytes);
      }
    }
    
    return new Uint8Array(parts);
  }
  
  /**
   * Called AFTER reading delta from database
   * Converts Uint8Array (binary) → Delta object
   */
  decode(bytes: Uint8Array): Delta {
    const ops: DeltaOp[] = [];
    let i = 0;
    
    while (i < bytes.length) {
      const opType = bytes[i++];
      
      if (opType === 0x00) {  // retain
        const [count, bytesRead] = this.decodeVarint(bytes, i);
        ops.push({ type: 'retain', count });
        i += bytesRead;
      }
      else if (opType === 0x02) {  // delete
        const [count, bytesRead] = this.decodeVarint(bytes, i);
        ops.push({ type: 'delete', count });
        i += bytesRead;
      }
      else if (opType === 0x01) {  // insert
        const [length, bytesRead1] = this.decodeVarint(bytes, i);
        i += bytesRead1;
        const textBytes = bytes.slice(i, i + length);
        const text = new TextDecoder().decode(textBytes);
        ops.push({ type: 'insert', text });
        i += length;
      }
    }
    
    return { ops };
  }
  
  private encodeVarint(value: number): number[] {
    const bytes: number[] = [];
    while (value > 127) {
      bytes.push((value & 0x7F) | 0x80);
      value >>>= 7;
    }
    bytes.push(value & 0x7F);
    return bytes;
  }
  
  private decodeVarint(bytes: Uint8Array, offset: number): [number, number] {
    let value = 0;
    let shift = 0;
    let bytesRead = 0;
    
    while (offset + bytesRead < bytes.length) {
      const byte = bytes[offset + bytesRead];
      bytesRead++;
      value |= (byte & 0x7F) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }
    
    return [value, bytesRead];
  }
}