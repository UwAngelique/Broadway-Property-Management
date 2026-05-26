/**
 * Generates App Store / Play Store icons and splash (pure Node, no native deps).
 * Run: npm run generate-assets
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(assetsDir, { recursive: true });

function fillPng(width, height, rgb) {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (width * y + x) << 2;
      const band = y < height * 0.35 ? [30, 58, 95] : rgb;
      png.data[i] = band[0];
      png.data[i + 1] = band[1];
      png.data[i + 2] = band[2];
      png.data[i + 3] = 255;
      if (x > width * 0.1 && x < width * 0.9 && y > height * 0.25 && y < height * 0.75) {
        png.data[i] = 51;
        png.data[i + 1] = 65;
        png.data[i + 2] = 85;
      }
    }
  }
  return PNG.sync.write(png);
}

const icon = fillPng(1024, 1024, [15, 23, 42]);
const splash = fillPng(1284, 2778, [15, 23, 42]);

fs.writeFileSync(path.join(assetsDir, "icon.png"), icon);
fs.writeFileSync(path.join(assetsDir, "adaptive-icon.png"), icon);
fs.writeFileSync(path.join(assetsDir, "splash.png"), splash);
console.log("Generated assets/icon.png, adaptive-icon.png, splash.png");
