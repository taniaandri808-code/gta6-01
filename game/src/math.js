/**
 * Math utilities for Maravilla
 */

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function lerpAngle(a, b, t) {
  let diff = b - a;
  diff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
  return a + diff * t;
}

export function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function distance2D(a, b) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

export function distance3D(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function angleBetween(v1, v2) {
  return Math.atan2(v2.z - v1.z, v2.x - v1.x);
}

export function rotateVec2(v, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return { x: v.x * cos - v.z * sin, z: v.x * sin + v.z * cos };
}

export function normalizeVec2(v) {
  const len = Math.sqrt(v.x * v.x + v.z * v.z);
  if (len === 0) return { x: 0, z: 0 };
  return { x: v.x / len, z: v.z / len };
}

export function vec2Length(v) {
  return Math.sqrt(v.x * v.x + v.z * v.z);
}

export function vec2Add(a, b) {
  return { x: a.x + b.x, z: a.z + b.z };
}

export function vec2Sub(a, b) {
  return { x: a.x - b.x, z: a.z - b.z };
}

export function vec2Scale(v, s) {
  return { x: v.x * s, z: v.z * s };
}

export function vec2Dot(a, b) {
  return a.x * b.x + a.z * b.z;
}

export function randomRange(min, max) {
  return min + Math.random() * (max - min);
}

export function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function degToRad(deg) {
  return deg * Math.PI / 180;
}

export function radToDeg(rad) {
  return rad * 180 / Math.PI;
}

export function wrapAngle(angle) {
  return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
}

export function angleDiff(a, b) {
  const diff = wrapAngle(a - b);
  return diff;
}

export function projectPointOnLine(point, lineStart, lineEnd) {
  const line = vec2Sub(lineEnd, lineStart);
  const lenSq = line.x * line.x + line.z * line.z;
  if (lenSq === 0) return { ...lineStart };
  const t = clamp((vec2Dot(vec2Sub(point, lineStart), line)) / lenSq, 0, 1);
  return { x: lineStart.x + line.x * t, z: lineStart.z + line.z * t };
}

export function pointInRect(point, rect) {
  return point.x >= rect.minX && point.x <= rect.maxX &&
         point.z >= rect.minZ && point.z <= rect.maxZ;
}

export function getDistrictAt(pos, districts) {
  for (const d of districts) {
    if (pointInRect(pos, d.bounds)) return d;
  }
  return null;
}
