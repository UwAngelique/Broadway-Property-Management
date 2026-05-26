/**
 * Builds App Store / Play Store icons and splash from the same logo as the website.
 * Source: frontend/public/broadway-logo.png
 * Run: npm run generate-assets
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, "..", "assets");
const logoPath = path.join(__dirname, "..", "..", "frontend", "public", "broadway-logo.png");

fs.mkdirSync(assetsDir, { recursive: true });

if (!fs.existsSync(logoPath)) {
  console.error(`Logo not found: ${logoPath}`);
  console.error("Ensure frontend/public/broadway-logo.png exists.");
  process.exit(1);
}

const sharp = (await import("sharp")).default;

const bg = { r: 15, g: 23, b: 42, alpha: 1 };

async function iconWithLogo(size) {
  const logo = await sharp(logoPath)
    .resize(Math.round(size * 0.82), Math.round(size * 0.82), { fit: "inside", background: bg })
    .png()
    .toBuffer();

  return sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

async function splashWithLogo() {
  const w = 1284;
  const h = 2778;
  const logo = await sharp(logoPath)
    .resize(Math.round(w * 0.55), Math.round(h * 0.22), { fit: "inside", background: bg })
    .png()
    .toBuffer();

  return sharp({
    create: { width: w, height: h, channels: 4, background: bg },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

const icon = await iconWithLogo(1024);
fs.writeFileSync(path.join(assetsDir, "icon.png"), icon);
fs.writeFileSync(path.join(assetsDir, "adaptive-icon.png"), icon);
fs.writeFileSync(path.join(assetsDir, "splash.png"), await splashWithLogo());

console.log("Generated from Broadway Creation logo:");
console.log("  assets/icon.png (1024×1024)");
console.log("  assets/adaptive-icon.png");
console.log("  assets/splash.png");
