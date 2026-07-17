import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";

const svg = readFileSync(new URL("./fox-icon.svg", import.meta.url));
mkdirSync(new URL("../public/icons/", import.meta.url), { recursive: true });
const out = (name) => new URL(`../public/icons/${name}`, import.meta.url).pathname;

await sharp(svg).resize(512, 512).png().toFile(out("icon-512.png"));
await sharp(svg).resize(192, 192).png().toFile(out("icon-192.png"));
await sharp(svg).resize(512, 512).png().toFile(out("icon-maskable-512.png"));
await sharp(svg).resize(180, 180).png().toFile(out("apple-touch-icon.png"));
// favicon e apple-icon (convenções do Next: app/icon.png e app/apple-icon.png)
await sharp(svg).resize(512, 512).png().toFile(new URL("../src/app/icon.png", import.meta.url).pathname);
await sharp(svg).resize(180, 180).png().toFile(new URL("../src/app/apple-icon.png", import.meta.url).pathname);
console.log("icones gerados: public/icons/, src/app/icon.png, src/app/apple-icon.png");
