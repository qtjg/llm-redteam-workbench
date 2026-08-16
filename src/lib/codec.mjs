import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function sha256(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

export function stableStringify(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

export function digestJson(value) {
  return sha256(stableStringify(value));
}
