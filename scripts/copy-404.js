import fs from "node:fs";
import path from "node:path";

const src = path.join("dist", "index.html");
const dest = path.join("dist", "404.html");

fs.copyFile(src, dest, (err) => {
  if (err) {
    console.error("Failed to copy 404.html:", err);
    process.exit(1);
  } else {
    console.log("Created dist/404.html");
  }
});