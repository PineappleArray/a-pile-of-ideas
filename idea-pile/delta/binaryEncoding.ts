//~
import {Delta} from './deltaUtil'
import {DeltaOp} from './deltaUtil'
import { serialize, deserialize } from "bson";   //Used for mongodb compatibility
export class BinaryDeltaEncoder {
  
  //Checks to make sure that x is delta to ensure type safety
  static isDelta(x: unknown): x is Delta {
    return (
      typeof x === "object" &&
      x !== null &&
      "ops" in x &&
      Array.isArray((x as any).ops)
   );
  }

  //This will turn the deltas into bytes for eff storage
  static encode(delta: Delta): Uint8Array {
    return serialize(delta)
  }
  

  //deserializes the data after it is taken from the DB
  static decode(bytes: Uint8Array): Delta {
    const raw: unknown = deserialize(bytes);

    //since the return is a raw type it will need to be checked to sure it is a delta
    if(!BinaryDeltaEncoder.isDelta(raw)){
      throw new Error("WRONG DATA DATA IS NOT CORRECT TYPE");
    }
    const toReturn: Delta = raw;
    return toReturn;
  }
  
}