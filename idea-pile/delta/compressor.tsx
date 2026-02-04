//DO NOT compress the foreign and primary keys and small things

import pako from 'pako';
import {Delta} from './deltaUtil'
import { BinaryDeltaEncoder } from './binaryEncoding';

export class DeltaCompressor {
  private encoder = new BinaryDeltaEncoder();
  
  /**
   * Called when SAVING: Delta → Binary → Compressed
   * Used in: VersionStore.saveVersion()
   */
  compress(delta: Delta): Uint8Array {
    // Step 1: Convert to binary
    const binary = this.encoder.encode(delta);
    
    // Step 2: Compress binary
    const compressed = pako.deflate(binary);
    
    return compressed;
  }
  
  /**
   * Called when LOADING: Compressed → Binary → Delta
   * Used in: VersionStore.reconstructVersion()
   */
  decompress(compressed: Uint8Array): Delta {
    // Step 1: Decompress to binary
    const binary = pako.inflate(compressed);
    
    // Step 2: Decode binary to delta
    return this.encoder.decode(binary);
  }
}