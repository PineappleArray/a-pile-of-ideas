import { DeltaCompressor } from "./compressor.js";
import { Delta } from "./deltaUtil.js";
import { DeltaOp } from "./deltaUtil.js"
import { DeltaEngine } from "./deltaUtil.js"
import { BinaryDeltaEncoder } from "./binaryEncoding.js"

const nD1 = { type: 'retain', count: 1 }
const nD2 = { type: 'delete', count: 2 }

//DeltaEngine.toString(DeltaEngine.diff("aaaa", "aaa"));
DeltaEngine.toString(BinaryDeltaEncoder.decode(BinaryDeltaEncoder.encode(DeltaEngine.diff("aaaa", "aaa"))))