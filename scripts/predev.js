/**
 * ConsoleNinja 兼容脚本
 * ConsoleNinja VS Code 扩展在 dev 模式下会尝试读取
 * .next/routes-manifest.json, 但 next dev 不会生成它。
 * 这个脚本在启动 dev 前生成一个最小有效版本。
 */
const fs = require("fs");
const path = require("path");

const manifestPath = path.resolve(__dirname, "..", ".next", "routes-manifest.json");

if (!fs.existsSync(manifestPath)) {
  const minimal = {
    version: 3,
    caseSensitive: false,
    basePath: "",
    rewrites: { beforeFiles: [], afterFiles: [], fallback: [] },
    redirects: [],
    headers: [],
    dynamicRoutes: [],
    staticRoutes: [],
    dataRoutes: [],
    i18n: null,
    rsc: { basePath: "", nav: true },
  };

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify(minimal));
  console.log("✓ 已生成 .next/routes-manifest.json (ConsoleNinja 兼容)");
}
