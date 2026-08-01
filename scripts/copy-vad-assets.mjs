import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const destDir = path.join(root, "public", "vad");

mkdirSync(destDir, { recursive: true });

function copyAllFiles(srcDir, patterns) {
  if (!existsSync(srcDir)) {
    console.warn(`copy-vad-assets: source not found, skipping: ${srcDir}`);
    return;
  }
  for (const file of readdirSync(srcDir)) {
    if (patterns.some((p) => p.test(file))) {
      cpSync(path.join(srcDir, file), path.join(destDir, file));
    }
  }
}

// Silero VAD model + worklet from @ricky0123/vad-web
copyAllFiles(path.join(root, "node_modules", "@ricky0123", "vad-web", "dist"), [
  /\.onnx$/,
  /worklet.*\.js$/,
]);

// onnxruntime-web WASM/JS runtime assets used by vad-web in the browser
copyAllFiles(path.join(root, "node_modules", "onnxruntime-web", "dist"), [
  /\.wasm$/,
  /ort.*\.min\.js$/,
  /ort.*\.mjs$/,
]);

console.log(`copy-vad-assets: populated ${destDir}`);
