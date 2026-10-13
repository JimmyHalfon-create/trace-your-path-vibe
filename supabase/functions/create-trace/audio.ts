// Reads real audio duration (seconds) from the container, without decoding.
// WebM: walks EBML and takes the latest block timestamp (MediaRecorder omits Duration).
// MP4: reads mvhd duration, or sums fragment sample durations (Safari writes fragmented MP4).
// Returns null when the duration cannot be determined — callers must reject.

export type AudioKind = "webm" | "mp4";

export function sniffKind(b: Uint8Array): AudioKind | null {
  if (b.length > 4 && b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "webm";
  if (b.length > 8 && String.fromCharCode(b[4], b[5], b[6], b[7]) === "ftyp") return "mp4";
  return null;
}

export function audioDuration(b: Uint8Array, kind: AudioKind): number | null {
  try {
    return kind === "webm" ? webmDuration(b) : mp4Duration(b);
  } catch {
    return null;
  }
}

// ---------- WebM / EBML ----------
function readId(b: Uint8Array, p: number): [number, number] {
  const first = b[p];
  let len = 1;
  while (len <= 4 && !(first & (0x80 >> (len - 1)))) len++;
  if (len > 4) throw new Error("bad id");
  let v = 0;
  for (let i = 0; i < len; i++) v = v * 256 + b[p + i];
  return [v, len];
}
function readSize(b: Uint8Array, p: number): [number, number] {
  const first = b[p];
  let len = 1;
  while (len <= 8 && !(first & (0x80 >> (len - 1)))) len++;
  if (len > 8) throw new Error("bad size");
  let v = first & (0xff >> len);
  let allOnes = v === (0xff >> len);
  for (let i = 1; i < len; i++) {
    v = v * 256 + b[p + i];
    if (b[p + i] !== 0xff) allOnes = false;
  }
  return [allOnes ? -1 : v, len]; // -1 = unknown size
}
const uint = (b: Uint8Array, p: number, n: number) => {
  let v = 0;
  for (let i = 0; i < n; i++) v = v * 256 + b[p + i];
  return v;
};
// Master elements we descend into: Segment, Cluster, Info, BlockGroup
const WEBM_MASTERS = new Set([0x18538067, 0x1f43b675, 0x1549a966, 0xa0]);

function webmDuration(b: Uint8Array): number | null {
  let p = 0;
  let scale = 1_000_000; // ns per tick
  let headerDuration = 0;
  let clusterTime = 0;
  let maxTick = -1;
  while (p < b.length - 2) {
    const [id, idLen] = readId(b, p);
    const [size, sizeLen] = readSize(b, p + idLen);
    const data = p + idLen + sizeLen;
    if (id === 0x1a45dfa3 && size >= 0) { p = data + size; continue; } // EBML header
    if (WEBM_MASTERS.has(id)) { p = data; continue; }
    if (size < 0 || data + size > b.length) break;
    if (id === 0x2ad7b1) scale = uint(b, data, size);
    else if (id === 0x4489) {
      const dv = new DataView(b.buffer, b.byteOffset + data, size);
      headerDuration = size === 4 ? dv.getFloat32(0) : dv.getFloat64(0);
    } else if (id === 0xe7) clusterTime = uint(b, data, size);
    else if (id === 0xa3 || id === 0xa1) {
      const [, tLen] = readSize(b, data); // track number vint
      const rel = new DataView(b.buffer, b.byteOffset + data + tLen, 2).getInt16(0);
      maxTick = Math.max(maxTick, clusterTime + rel);
    }
    p = data + size;
  }
  const fromBlocks = maxTick >= 0 ? (maxTick * scale) / 1e9 + 0.02 : 0; // + last Opus frame
  const fromHeader = (headerDuration * scale) / 1e9;
  const d = Math.max(fromBlocks, fromHeader);
  return d > 0 ? d : null;
}

// ---------- MP4 / ISO-BMFF ----------
const MP4_CONTAINERS = new Set(["moov", "trak", "mdia", "moof", "traf", "mvex"]);

function mp4Duration(b: Uint8Array): number | null {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  let mvhd = 0;
  let timescale = 0;
  let trexDefault = 0;
  let tfhdDefault = 0;
  let fragTicks = 0;

  const walk = (start: number, end: number) => {
    let p = start;
    while (p + 8 <= end) {
      let size = dv.getUint32(p);
      const type = String.fromCharCode(b[p + 4], b[p + 5], b[p + 6], b[p + 7]);
      let hdr = 8;
      if (size === 1) { size = Number(dv.getBigUint64(p + 8)); hdr = 16; }
      else if (size === 0) size = end - p;
      if (size < hdr || p + size > end) break;
      const d = p + hdr;
      if (MP4_CONTAINERS.has(type)) walk(d, p + size);
      else if (type === "mvhd") {
        const v = b[d];
        const ts = v === 1 ? dv.getUint32(d + 20) : dv.getUint32(d + 12);
        const du = v === 1 ? Number(dv.getBigUint64(d + 24)) : dv.getUint32(d + 16);
        if (ts) mvhd = du / ts;
      } else if (type === "mdhd") {
        timescale = b[d] === 1 ? dv.getUint32(d + 20) : dv.getUint32(d + 12);
      } else if (type === "trex") trexDefault = dv.getUint32(d + 12);
      else if (type === "tfhd") {
        const flags = dv.getUint32(d) & 0xffffff;
        let q = d + 8;
        if (flags & 0x01) q += 8;
        if (flags & 0x02) q += 4;
        tfhdDefault = flags & 0x08 ? dv.getUint32(q) : trexDefault;
      } else if (type === "trun") {
        const flags = dv.getUint32(d) & 0xffffff;
        const count = dv.getUint32(d + 4);
        let q = d + 8;
        if (flags & 0x01) q += 4;
        if (flags & 0x04) q += 4;
        const per = [0x100, 0x200, 0x400, 0x800].filter((f) => flags & f).length * 4;
        for (let i = 0; i < count; i++) {
          fragTicks += flags & 0x100 ? dv.getUint32(q) : tfhdDefault;
          q += per;
        }
      }
      p += size;
    }
  };
  walk(0, b.length);
  const frag = timescale ? fragTicks / timescale : 0;
  const d = Math.max(mvhd, frag);
  return d > 0 ? d : null;
}
