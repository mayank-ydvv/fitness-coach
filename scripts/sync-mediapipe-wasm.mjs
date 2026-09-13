// prebuild step: copies node_modules/@mediapipe/tasks-vision/wasm/* into
// public/mediapipe/wasm/ and writes a VERSION file. The JS comes from npm
// (bundled normally), the wasm is served as a static asset from /public —
// self-hosted rather than CDN-loaded for availability/supply-chain reasons
// (M5 plan decision), not for offline support (the form screen needs the
// network for /api/form/summarize anyway). CI should fail if this drifts
// from package.json's pinned version — see the check below.
import { cpSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
const pinnedVersion = pkg.dependencies["@mediapipe/tasks-vision"];
if (pinnedVersion.startsWith("^") || pinnedVersion.startsWith("~")) {
  console.error(`@mediapipe/tasks-vision must be pinned exactly (no ^/~) — got "${pinnedVersion}". A caret lets npm silently bump the JS without the wasm, causing a LinkError (MediaPipe issue #5195).`);
  process.exit(1);
}

const srcWasmDir = path.join(root, "node_modules/@mediapipe/tasks-vision/wasm");
const destWasmDir = path.join(root, "public/mediapipe/wasm");

if (!existsSync(srcWasmDir)) {
  console.error(`Can't find ${srcWasmDir} — run npm install first.`);
  process.exit(1);
}

mkdirSync(destWasmDir, { recursive: true });
cpSync(srcWasmDir, destWasmDir, { recursive: true });
writeFileSync(path.join(destWasmDir, "VERSION"), pinnedVersion + "\n");

console.log(`Synced @mediapipe/tasks-vision wasm@${pinnedVersion} -> public/mediapipe/wasm/`);
