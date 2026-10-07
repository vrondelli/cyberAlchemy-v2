#!/usr/bin/env node
// Convert an exact X11 test capture without adding a runtime image dependency.
import {readFileSync, writeFileSync} from "node:fs";
import {deflateSync} from "node:zlib";

if (process.argv.length !== 4) throw new Error("Usage: ppm-to-png.mjs <capture.ppm> <new.png>");
const source = readFileSync(process.argv[2]);
const headerEnd = [];
for (let index = 0; index < source.length && headerEnd.length < 3; index++) {
  if (source[index] === 10) headerEnd.push(index);
}
if (headerEnd.length !== 3 || source.toString("ascii", 0, headerEnd[0]) !== "P6"
  || source.toString("ascii", headerEnd[1] + 1, headerEnd[2]) !== "255") {
  throw new Error("Expected a binary P6 capture with 8-bit channels");
}
const dimensions = source.toString("ascii", headerEnd[0] + 1, headerEnd[1]).split(" ").map(Number);
const [width, height] = dimensions;
if (dimensions.length !== 2 || !Number.isInteger(width) || !Number.isInteger(height)
  || width < 1 || height < 1 || width > 8192 || height > 8192) {
  throw new Error("Capture dimensions are invalid");
}
const pixels = source.subarray(headerEnd[2] + 1);
if (pixels.length !== width * height * 3) throw new Error("Capture pixel length differs from its header");
const scanlines = Buffer.alloc(height * (width * 3 + 1));
for (let row = 0; row < height; row++) {
  pixels.copy(scanlines, row * (width * 3 + 1) + 1, row * width * 3, (row + 1) * width * 3);
}
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([size, name, data, checksum]);
}
const header = Buffer.alloc(13);
header.writeUInt32BE(width, 0);
header.writeUInt32BE(height, 4);
header[8] = 8;
header[9] = 2;
const png = Buffer.concat([
  Buffer.from("89504e470d0a1a0a", "hex"),
  chunk("IHDR", header), chunk("IDAT", deflateSync(scanlines)), chunk("IEND", Buffer.alloc(0)),
]);
writeFileSync(process.argv[3], png, {flag: "wx", mode: 0o600});
process.stdout.write(JSON.stringify({width, height, png: process.argv[3]}) + "\n");
