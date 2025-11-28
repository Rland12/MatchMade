import fs from "node:fs";
import path from "node:path";

const distDir = "dist";
const shellPath = path.join(distDir, "index.html");
const shell = fs.readFileSync(shellPath, "utf8");

// Try to load categories from the generated JSON
let categories = [];
const categoriesJsonPath = path.join(distDir, "data", "categories.json");

if (fs.existsSync(categoriesJsonPath)) {
  const data = JSON.parse(fs.readFileSync(categoriesJsonPath, "utf8"));
  // remove "home" because "/" already handles it
  categories = (data.categories || []).filter((c) => c && c !== "home");
  console.log("Using categories from categories.json:", categories);
} else {
  // fallback if something goes wrong
  categories = ["anime", "cartoons", "cute", "lgbtq"];
  console.warn("categories.json not found, using fallback:", categories);
}

// 404 fallback
fs.writeFileSync(path.join(distDir, "404.html"), shell, "utf8");
console.log("Created dist/404.html");

// SPA entry points for each category
for (const cat of categories) {
  const dir = path.join(distDir, cat);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), shell, "utf8");
  console.log(`Created dist/${cat}/index.html`);
}
