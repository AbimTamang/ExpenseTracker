const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "..", "src");

function walk(dir) {
  for (const file of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!/\.(jsx|js)$/.test(file) || fullPath.includes("config" + path.sep + "api.js")) {
      continue;
    }

    let content = fs.readFileSync(fullPath, "utf8");
    if (!content.includes("VITE_API_URL")) continue;

    const relFromFile = path.relative(path.dirname(fullPath), path.join(srcDir, "config", "api.js"));
    const importPath = relFromFile.replace(/\\/g, "/").replace(/\.js$/, "");
    const importLine = `import { apiUrl } from "${importPath.startsWith(".") ? importPath : "./" + importPath}";\n`;

    if (!content.includes("apiUrl")) {
      content = importLine + content;
    }

    content = content.replace(
      /`\$\{import\.meta\.env\.VITE_API_URL\}([^`]+)`/g,
      (_, pathPart) => `apiUrl(\`${pathPart}\`)`
    );

    fs.writeFileSync(fullPath, content, "utf8");
    console.log("Updated:", fullPath);
  }
}

walk(srcDir);
