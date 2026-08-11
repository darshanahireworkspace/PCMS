import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, "../public");
const iconsDir = path.join(publicDir, "icons");
const sourceLogo = path.join(publicDir, "police-logo.png");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcons() {
  console.log("Generating PWA icons from:", sourceLogo);

  // 1. Standard Icons
  await sharp(sourceLogo)
    .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile(path.join(publicDir, "icon-192.png"));

  await sharp(sourceLogo)
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile(path.join(publicDir, "icon-512.png"));

  // 2. Apple Touch Icon (180x180 with clean white padding)
  await sharp(sourceLogo)
    .resize(180, 180, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile(path.join(publicDir, "apple-touch-icon.png"));

  // 3. Icons inside public/icons/ directory
  await sharp(sourceLogo)
    .resize(192, 192, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile(path.join(iconsDir, "icon-192.png"));

  await sharp(sourceLogo)
    .resize(512, 512, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .toFile(path.join(iconsDir, "icon-512.png"));

  // 4. Android Maskable Icons (Safe Zone: padded by 15% on background #071b3b)
  await sharp(sourceLogo)
    .resize(150, 150, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({
      top: 21,
      bottom: 21,
      left: 21,
      right: 21,
      background: { r: 7, g: 27, b: 59, alpha: 1 },
    })
    .toFile(path.join(iconsDir, "icon-192-maskable.png"));

  await sharp(sourceLogo)
    .resize(400, 400, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .extend({
      top: 56,
      bottom: 56,
      left: 56,
      right: 56,
      background: { r: 7, g: 27, b: 59, alpha: 1 },
    })
    .toFile(path.join(iconsDir, "icon-512-maskable.png"));

  console.log("All PWA icons generated successfully!");
}

generateIcons().catch(console.error);
