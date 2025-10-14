import fs from "node:fs";
import path from "node:path";

const distDir = "dist";
const shellPath = path.join(distDir, "index.html");
const categories = ["anime", "cartoons", "cute", "lgbtq"];

const shell = fs.readFileSync(shellPath, "utf8");

// 404 fallback
fs.writeFileSync(path.join(distDir, "404.html"), shell, "utf8");
console.log("Created dist/404.html");

// category entry points that boot the SPA
for (const cat of categories) {
  const dir = path.join(distDir, cat);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), shell, "utf8");
  console.log(`Created dist/${cat}/index.html`);
}
