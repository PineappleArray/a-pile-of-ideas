//DO NOT compress the foreign and primary keys and small things

import pako from 'pako';
import {Delta} from './deltaUtil'
import { BinaryDeltaEncoder } from './binaryEncoding';

export class DeltaCompressor {
  private encoder = new BinaryDeltaEncoder();
  
  //This compresses the delta first by making this binary and then making it 
  //compressed to save pace
  compress(delta: Delta): Uint8Array {
    const binary = this.encoder.encode(delta);
    return pako.deflate(binary);
  }
  
  //This will uncompress the binary and then decode the binary
  decompress(compressed: Uint8Array): Delta {
    return this.encoder.decode(pako.inflate(compressed));
  }
}