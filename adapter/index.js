import { createRequire } from "node:module";
var __create = Object.create;
var __getProtoOf = Object.getPrototypeOf;
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __toESM = (mod, isNodeMode, target) => {
  target = mod != null ? __create(__getProtoOf(mod)) : {};
  const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
  for (let key of __getOwnPropNames(mod))
    if (!__hasOwnProp.call(to, key))
      __defProp(to, key, {
        get: () => mod[key],
        enumerable: true
      });
  return to;
};
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/globrex/index.js
var require_globrex = __commonJS((exports, module) => {
  var isWin = process.platform === "win32";
  var SEP = isWin ? `\\\\+` : `\\/`;
  var SEP_ESC = isWin ? `\\\\` : `/`;
  var GLOBSTAR = `((?:[^/]*(?:/|$))*)`;
  var WILDCARD = `([^/]*)`;
  var GLOBSTAR_SEGMENT = `((?:[^${SEP_ESC}]*(?:${SEP_ESC}|$))*)`;
  var WILDCARD_SEGMENT = `([^${SEP_ESC}]*)`;
  function globrex(glob, { extended = false, globstar = false, strict = false, filepath = false, flags = "" } = {}) {
    let regex = "";
    let segment = "";
    let path = { regex: "", segments: [] };
    let inGroup = false;
    let inRange = false;
    const ext = [];
    function add(str, { split, last, only } = {}) {
      if (only !== "path")
        regex += str;
      if (filepath && only !== "regex") {
        path.regex += str === "\\/" ? SEP : str;
        if (split) {
          if (last)
            segment += str;
          if (segment !== "") {
            if (!flags.includes("g"))
              segment = `^${segment}$`;
            path.segments.push(new RegExp(segment, flags));
          }
          segment = "";
        } else {
          segment += str;
        }
      }
    }
    let c, n;
    for (let i = 0;i < glob.length; i++) {
      c = glob[i];
      n = glob[i + 1];
      if (["\\", "$", "^", ".", "="].includes(c)) {
        add(`\\${c}`);
        continue;
      }
      if (c === "/") {
        add(`\\${c}`, { split: true });
        if (n === "/" && !strict)
          regex += "?";
        continue;
      }
      if (c === "(") {
        if (ext.length) {
          add(c);
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === ")") {
        if (ext.length) {
          add(c);
          let type = ext.pop();
          if (type === "@") {
            add("{1}");
          } else if (type === "!") {
            add("([^/]*)");
          } else {
            add(type);
          }
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === "|") {
        if (ext.length) {
          add(c);
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === "+") {
        if (n === "(" && extended) {
          ext.push(c);
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === "@" && extended) {
        if (n === "(") {
          ext.push(c);
          continue;
        }
      }
      if (c === "!") {
        if (extended) {
          if (inRange) {
            add("^");
            continue;
          }
          if (n === "(") {
            ext.push(c);
            add("(?!");
            i++;
            continue;
          }
          add(`\\${c}`);
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === "?") {
        if (extended) {
          if (n === "(") {
            ext.push(c);
          } else {
            add(".");
          }
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === "[") {
        if (inRange && n === ":") {
          i++;
          let value = "";
          while (glob[++i] !== ":")
            value += glob[i];
          if (value === "alnum")
            add("(\\w|\\d)");
          else if (value === "space")
            add("\\s");
          else if (value === "digit")
            add("\\d");
          i++;
          continue;
        }
        if (extended) {
          inRange = true;
          add(c);
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === "]") {
        if (extended) {
          inRange = false;
          add(c);
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === "{") {
        if (extended) {
          inGroup = true;
          add("(");
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === "}") {
        if (extended) {
          inGroup = false;
          add(")");
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === ",") {
        if (inGroup) {
          add("|");
          continue;
        }
        add(`\\${c}`);
        continue;
      }
      if (c === "*") {
        if (n === "(" && extended) {
          ext.push(c);
          continue;
        }
        let prevChar = glob[i - 1];
        let starCount = 1;
        while (glob[i + 1] === "*") {
          starCount++;
          i++;
        }
        let nextChar = glob[i + 1];
        if (!globstar) {
          add(".*");
        } else {
          let isGlobstar = starCount > 1 && (prevChar === "/" || prevChar === undefined) && (nextChar === "/" || nextChar === undefined);
          if (isGlobstar) {
            add(GLOBSTAR, { only: "regex" });
            add(GLOBSTAR_SEGMENT, { only: "path", last: true, split: true });
            i++;
          } else {
            add(WILDCARD, { only: "regex" });
            add(WILDCARD_SEGMENT, { only: "path" });
          }
        }
        continue;
      }
      add(c);
    }
    if (!flags.includes("g")) {
      regex = `^${regex}$`;
      segment = `^${segment}$`;
      if (filepath)
        path.regex = `^${path.regex}$`;
    }
    const result = { regex: new RegExp(regex, flags) };
    if (filepath) {
      path.segments.push(new RegExp(segment, flags));
      path.regex = new RegExp(path.regex, flags);
      path.globstar = new RegExp(!flags.includes("g") ? `^${GLOBSTAR_SEGMENT}$` : GLOBSTAR_SEGMENT, flags);
      result.path = path;
    }
    return result;
  }
  module.exports = globrex;
});

// node_modules/globalyzer/src/index.js
var require_src = __commonJS((exports, module) => {
  var os = __require("os");
  var path = __require("path");
  var isWin = os.platform() === "win32";
  var CHARS = { "{": "}", "(": ")", "[": "]" };
  var STRICT = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\)|(\\).|([@?!+*]\(.*\)))/;
  var RELAXED = /\\(.)|(^!|[*?{}()[\]]|\(\?)/;
  function isglob(str, { strict = true } = {}) {
    if (str === "")
      return false;
    let match, rgx = strict ? STRICT : RELAXED;
    while (match = rgx.exec(str)) {
      if (match[2])
        return true;
      let idx = match.index + match[0].length;
      let open = match[1];
      let close = open ? CHARS[open] : null;
      if (open && close) {
        let n = str.indexOf(close, idx);
        if (n !== -1)
          idx = n + 1;
      }
      str = str.slice(idx);
    }
    return false;
  }
  function parent(str, { strict = false } = {}) {
    if (isWin && str.includes("/"))
      str = str.split("\\").join("/");
    if (/[\{\[].*[\/]*.*[\}\]]$/.test(str))
      str += "/";
    str += "a";
    do {
      str = path.dirname(str);
    } while (isglob(str, { strict }) || /(^|[^\\])([\{\[]|\([^\)]+$)/.test(str));
    return str.replace(/\\([\*\?\|\[\]\(\)\{\}])/g, "$1");
  }
  function globalyzer(pattern, opts = {}) {
    let base = parent(pattern, opts);
    let isGlob = isglob(pattern, opts);
    let glob;
    if (base != ".") {
      glob = pattern.substr(base.length);
      if (glob.startsWith("/"))
        glob = glob.substr(1);
    } else {
      glob = pattern;
    }
    if (!isGlob) {
      base = path.dirname(pattern);
      glob = base !== "." ? pattern.substr(base.length) : pattern;
    }
    if (glob.startsWith("./"))
      glob = glob.substr(2);
    if (glob.startsWith("/"))
      glob = glob.substr(1);
    return { base, glob, isGlob };
  }
  module.exports = globalyzer;
});

// node_modules/tiny-glob/index.js
var require_tiny_glob = __commonJS((exports, module) => {
  var fs = __require("fs");
  var globrex = require_globrex();
  var { promisify } = __require("util");
  var globalyzer = require_src();
  var { join, resolve, relative } = __require("path");
  var isHidden = /(^|[\\\/])\.[^\\\/\.]/g;
  var readdir = promisify(fs.readdir);
  var stat = promisify(fs.stat);
  var CACHE = {};
  async function walk(output, prefix, lexer, opts, dirname = "", level = 0) {
    const rgx = lexer.segments[level];
    const dir = resolve(opts.cwd, prefix, dirname);
    const files = await readdir(dir);
    const { dot, filesOnly } = opts;
    let i = 0, len = files.length, file;
    let fullpath, relpath, stats, isMatch;
    for (;i < len; i++) {
      fullpath = join(dir, file = files[i]);
      relpath = dirname ? join(dirname, file) : file;
      if (!dot && isHidden.test(relpath))
        continue;
      isMatch = lexer.regex.test(relpath);
      if ((stats = CACHE[relpath]) === undefined) {
        CACHE[relpath] = stats = fs.lstatSync(fullpath);
      }
      if (!stats.isDirectory()) {
        isMatch && output.push(relative(opts.cwd, fullpath));
        continue;
      }
      if (rgx && !rgx.test(file))
        continue;
      !filesOnly && isMatch && output.push(join(prefix, relpath));
      await walk(output, prefix, lexer, opts, relpath, rgx && rgx.toString() !== lexer.globstar && level + 1);
    }
  }
  module.exports = async function(str, opts = {}) {
    if (!str)
      return [];
    let glob = globalyzer(str);
    opts.cwd = opts.cwd || ".";
    if (!glob.isGlob) {
      try {
        let resolved = resolve(opts.cwd, str);
        let dirent = await stat(resolved);
        if (opts.filesOnly && !dirent.isFile())
          return [];
        return opts.absolute ? [resolved] : [str];
      } catch (err) {
        if (err.code != "ENOENT")
          throw err;
        return [];
      }
    }
    if (opts.flush)
      CACHE = {};
    let matches = [];
    const { path } = globrex(glob.glob, { filepath: true, globstar: true, extended: true });
    path.globstar = path.globstar.toString();
    await walk(matches, glob.base, path, opts, ".", 0);
    return opts.absolute ? matches.map((x) => resolve(opts.cwd, x)) : matches;
  };
});

// adapter/src/index.ts
var import_tiny_glob = __toESM(require_tiny_glob(), 1);
import path3 from "node:path";
import { fileURLToPath } from "node:url";
import { readFile as readFile2, writeFile, rename, stat } from "node:fs/promises";

// adapter/src/utils/paths.ts
import path from "node:path";
var posixify = (p) => p.split(path.sep).join(path.posix.sep);
var stripLeadingSlash = (s) => s.startsWith("/") ? s.slice(1) : s;
function toPhpIdentifier(s) {
  const t = s.replace(/[^A-Za-z0-9_]/g, "_");
  return /^\d/.test(t) ? `_${t}` : t;
}
function fnPrefixForServerFile(serverRelPosix) {
  const base = serverRelPosix.replace(/^\//, "").replace(/\.php$/i, "").replace(/\//g, "_").replace(/\+/g, "").replace(/\./g, "_");
  return `sk_${toPhpIdentifier(base)}`;
}
function phpRelToRootFromNav(navPath) {
  const depth = navPath.split("/").filter(Boolean).length;
  return depth === 0 ? "./" : `./${"../".repeat(depth)}`;
}
function phpArrayString(obj) {
  if (obj === null || obj === undefined)
    return "null";
  if (typeof obj === "boolean")
    return obj ? "true" : "false";
  if (typeof obj === "number")
    return String(obj);
  if (typeof obj === "string")
    return `'${obj.replace(/'/g, "\\'")}'`;
  if (Array.isArray(obj)) {
    const items = obj.map((item) => phpArrayString(item)).join(", ");
    return `[${items}]`;
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj).map(([key, value]) => {
      const phpKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? `'${key}'` : `'${key}'`;
      return `${phpKey} => ${phpArrayString(value)}`;
    }).join(", ");
    return `[${entries}]`;
  }
  return "null";
}

// adapter/src/utils/routing.ts
import { readFile, access } from "fs/promises";
import path2 from "path";
function findRouteForNavPath(builder, navPath) {
  const withSlash = navPath.endsWith("/") ? navPath : `${navPath}/`;
  const withoutSlash = navPath.endsWith("/") ? navPath.slice(0, -1) : navPath;
  const matches = builder.routes.filter((r) => r.pattern?.test(withSlash) || r.pattern?.test(withoutSlash)).sort((a, b) => (b.id?.length ?? 0) - (a.id?.length ?? 0));
  return matches[0] ?? null;
}
function escapeRegexSegment(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function compilePhpRouteMatcher(routeId) {
  const id = routeId.startsWith("/") ? routeId : `/${routeId}`;
  const parts = stripLeadingSlash(id).split("/").filter(Boolean);
  let re = "^";
  const map = [];
  let groupIdx = 0;
  for (let i = 0;i < parts.length; i++) {
    const seg = parts[i];
    if (seg.startsWith("(") && seg.endsWith(")"))
      continue;
    const restMatch = seg.match(/^\[\.\.\.(.+)\]$/);
    if (restMatch) {
      groupIdx += 1;
      map.push({ idx: groupIdx, name: restMatch[1] });
      re += `(?:/(.*))?`;
      continue;
    }
    const optMatch = seg.match(/^\[\[(.+)\]\]$/);
    if (optMatch) {
      groupIdx += 1;
      map.push({ idx: groupIdx, name: optMatch[1] });
      re += `(?:/([^/]+))?`;
      continue;
    }
    const dynMatch = seg.match(/^\[(.+)\]$/);
    if (dynMatch) {
      groupIdx += 1;
      map.push({ idx: groupIdx, name: dynMatch[1] });
      re += `/([^/]+)`;
      continue;
    }
    re += `/${escapeRegexSegment(seg)}`;
  }
  if (re === "^")
    re += "/";
  re += "/?$";
  const phpRegex = `~${re}~`;
  const phpMap = `[${map.map((m) => `'${m.idx}' => '${m.name}'`).join(", ")}]`;
  return { phpRegex, phpMap };
}
function buildLayoutChainCandidates(routeIdPosix) {
  const parts = stripLeadingSlash(routeIdPosix).split("/").filter(Boolean);
  const chain = [];
  for (let i = parts.length;i >= 0; i--) {
    const seg = parts.slice(0, i).join("/");
    chain.push(seg);
  }
  return chain;
}
async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function hasServerFile(routeId, routesBasePath) {
  try {
    const strippedRouteId = stripLeadingSlash(routeId);
    const serverJsPath = path2.join(routesBasePath, strippedRouteId, "+server.js");
    const serverTsPath = path2.join(routesBasePath, strippedRouteId, "+server.ts");
    const serverPhpPath = path2.join(routesBasePath, strippedRouteId, "+server.php");
    if (await fileExists(serverJsPath))
      return true;
    if (await fileExists(serverTsPath))
      return true;
    if (await fileExists(serverPhpPath))
      return true;
    return false;
  } catch (error) {
    return false;
  }
}
async function generateRouteManifest(builder) {
  const manifest = [];
  const sortedRoutes = [...builder.routes].sort((a, b) => (b.id?.length ?? 0) - (a.id?.length ?? 0));
  for (const route of sortedRoutes) {
    const routeId = route.id.startsWith("/") ? route.id : `/${route.id}`;
    const { phpRegex } = compilePhpRouteMatcher(route.id);
    const routesBasePath = path2.resolve(builder.config.kit.files.routes);
    let trailingSlash = await readTrailingSlashFromRoute(routeId, routesBasePath);
    if (!trailingSlash) {
      trailingSlash = builder.config.kit.trailingSlash || "never";
    }
    const base = builder.config.kit.paths.base;
    let checkPath = routeId;
    if (base) {
      checkPath = path2.posix.join(base, routeId);
    }
    const hasPage = builder.prerendered.pages.has(routeId) || builder.prerendered.pages.has(`${routeId}/`) || builder.prerendered.pages.has(checkPath) || builder.prerendered.pages.has(`${checkPath}/`);
    let hasServerEndpoint = false;
    try {
      hasServerEndpoint = await hasServerFile(routeId, routesBasePath);
    } catch (error) {
      hasServerEndpoint = false;
    }
    if (hasPage && hasServerEndpoint) {
      manifest.push({
        re: phpRegex,
        type: "negotiate",
        page: path2.posix.join(base || "", `/${stripLeadingSlash(route.id)}/index.html`),
        endpoint: path2.posix.join(base || "", `/${stripLeadingSlash(route.id)}/index.php`),
        trailingSlash
      });
    } else if (hasServerEndpoint) {
      manifest.push({
        re: phpRegex,
        type: "endpoint",
        shim: path2.posix.join(base || "", `/${stripLeadingSlash(route.id)}/index.php`),
        trailingSlash
      });
    } else {
      manifest.push({
        re: phpRegex,
        type: "page",
        shim: path2.posix.join(base || "", `/${stripLeadingSlash(route.id)}/index.php`),
        trailingSlash
      });
    }
  }
  return manifest;
}
async function readTrailingSlashFromRoute(routeId, routesBasePath) {
  const chain = buildLayoutChainCandidates(routeId);
  for (const currentId of chain) {
    const dir = path2.join(routesBasePath, currentId);
    const normalizedRouteId = stripLeadingSlash(routeId);
    const normalizedCurrentId = currentId;
    if (normalizedCurrentId === normalizedRouteId) {
      const pageConfig = await checkFileForTrailingSlash(dir, "+page");
      if (pageConfig)
        return pageConfig;
    }
    const layoutConfig = await checkFileForTrailingSlash(dir, "+layout");
    if (layoutConfig)
      return layoutConfig;
  }
  return;
}
async function checkFileForTrailingSlash(dir, prefix) {
  for (const ext of [".js", ".ts"]) {
    try {
      const content = await readFile(path2.join(dir, prefix + ext), "utf-8");
      const match = content.match(/export\s+const\s+trailingSlash\s*=\s*['"](never|always|ignore)['"]/);
      if (match) {
        return match[1];
      }
    } catch (error) {}
  }
  return;
}

// adapter/src/utils/html.ts
function detectInlineDataModeFromHtml(html) {
  const patterns = ["const data", "let data", "var data", "data:"];
  for (const p of patterns) {
    let startPos = 0;
    while (true) {
      const idx = html.indexOf(p, startPos);
      if (idx === -1)
        break;
      for (let i = idx + p.length;i < html.length; i++) {
        const c = html[i];
        if (c === "=" || c === ":" || c === " " || c === "\t" || c === "\r" || c === `
`)
          continue;
        if (c === "[")
          return "nodes";
        if (c === "{")
          return "payload";
        break;
      }
      startPos = idx + 1;
    }
  }
  return "unknown";
}
function replaceInlineConstData(html) {
  const patterns = ["const data", "let data", "var data", "data:"];
  for (const p of patterns) {
    let startPos = 0;
    while (true) {
      const startIdx = html.indexOf(p, startPos);
      if (startIdx === -1)
        break;
      let openIdx = -1;
      let openChar = "";
      let closeChar = "";
      let isValid = false;
      for (let i = startIdx + p.length;i < html.length; i++) {
        const c = html[i];
        if (c === " " || c === "\t" || c === "\r" || c === `
` || c === "=" || c === ":")
          continue;
        if (c === "[") {
          openIdx = i;
          openChar = "[";
          closeChar = "]";
          isValid = true;
          break;
        }
        if (c === "{") {
          openIdx = i;
          openChar = "{";
          closeChar = "}";
          isValid = true;
          break;
        }
        break;
      }
      if (!isValid) {
        startPos = startIdx + 1;
        continue;
      }
      let balance = 1;
      let closeIdx = -1;
      let inString = false;
      let stringChar = "";
      let escape = false;
      for (let i = openIdx + 1;i < html.length; i++) {
        const c = html[i];
        if (escape) {
          escape = false;
          continue;
        }
        if (c === "\\") {
          escape = true;
          continue;
        }
        if (inString) {
          if (c === stringChar)
            inString = false;
          continue;
        }
        if (c === '"' || c === "'" || c === "`") {
          inString = true;
          stringChar = c;
          continue;
        }
        if (c === openChar) {
          balance++;
        } else if (c === closeChar) {
          balance--;
          if (balance === 0) {
            closeIdx = i;
            break;
          }
        }
      }
      if (closeIdx !== -1) {
        const before = html.slice(0, openIdx);
        const after = html.slice(closeIdx + 1);
        const isProperty = /data\s*:\s*$/.test(before);
        if (isProperty) {
          return `${before} (function(){ const d = <?php echo $dataPayload; ?>; return d; })() , hydrate: true ${after}`;
        } else {
          return `${before} (function(){ const d = <?php echo $dataPayload; ?>; return d; })()${after}`;
        }
      }
      startPos = startIdx + 1;
    }
  }
  return null;
}

// adapter/src/utils/fs.ts
import { access as access2 } from "node:fs/promises";
async function exists(p) {
  try {
    await access2(p);
    return true;
  } catch {
    return false;
  }
}

// adapter/src/runtime/router/js-ssr.ts
function getRouterJsSsrPhp() {
  return `
// 0. Try to serve exact file match; preserves base path nesting
$full_path = __DIR__ . $uri;
if ($uri !== '/' && file_exists($full_path)) {
    if (is_file($full_path)) {
        $real = realpath($full_path);
        if ($real === false || strpos($real, realpath(__DIR__)) !== 0) {
            http_response_code(403);
            return;
        }

        $ext = pathinfo($full_path, PATHINFO_EXTENSION);
        switch ($ext) {
            case 'js': $mime = 'application/javascript'; break;
            case 'css': $mime = 'text/css'; break;
            case 'html': $mime = 'text/html'; break;
            case 'json': $mime = 'application/json'; break;
            case 'png': $mime = 'image/png'; break;
            case 'jpg': $mime = 'image/jpeg'; break;
            case 'svg': $mime = 'image/svg+xml'; break;
            case 'ico': $mime = 'image/x-icon'; break;
            case 'txt': $mime = 'text/plain'; break;
            case 'xml': $mime = 'text/xml'; break;
            default: $mime = 'application/octet-stream';
        }

        header("Content-Type: $mime");
        readfile($full_path);
        return;
    } elseif (is_dir($full_path)) {
        // If accessing directory, check for index
        foreach (["/index.php", "/index.html"] as $idx) {
            $candidate = $full_path . $idx;
            if (is_file($candidate)) {
                if (substr($uri, -1) !== '/') {
                    // Redirect to slash
                    $target = $uri . '/';
                    if (isset($_SERVER["QUERY_STRING"]) && $_SERVER["QUERY_STRING"] !== "") {
                        $target .= "?" . $_SERVER["QUERY_STRING"];
                    }
                    header("Location: $target", true, 301);
                    return;
                }

                if (substr($candidate, -4) === ".php") {
                    $_SERVER["SCRIPT_FILENAME"] = realpath($candidate);
                    require $candidate;
                    return;
                }
                header("Content-Type: text/html; charset=utf-8");
                readfile($candidate);
                return;
            }
        }
    }
}

if ($base !== '' && strpos($uri, $base) === 0) {
    $uri = substr($uri, strlen($base));
    if ($uri === '' || $uri === false) $uri = '/';
}
if (strlen($uri) > 0 && $uri[0] !== '/') {
    $uri = '/' . $uri;
}
$path = __DIR__ . $uri;
if ($uri !== '/' && is_dir($path)) {
    foreach (["/index.html", "/index.php"] as $idx) {
        $candidate = $path . $idx;
        if (is_file($candidate)) {
            if (substr($candidate, -4) === ".php") {
                $requested_file = realpath($candidate);
                if ($requested_file) {
                    $_SERVER["SCRIPT_FILENAME"] = $requested_file;
                    require $requested_file;
                    return;
                }
            }
            header("Content-Type: text/html; charset=utf-8");
            readfile($candidate);
            return;
        }
    }
}
if (file_exists($path) && is_file($path)) {
    $real = realpath($path);
    if ($real === false || strpos($real, realpath(__DIR__)) !== 0) {
        http_response_code(403);
        return;
    }

    $ext = pathinfo($path, PATHINFO_EXTENSION);
    switch ($ext) {
        case 'js': $mime = 'application/javascript'; break;
        case 'css': $mime = 'text/css'; break;
        case 'html': $mime = 'text/html'; break;
        case 'json': $mime = 'application/json'; break;
        case 'png': $mime = 'image/png'; break;
        case 'jpg': $mime = 'image/jpeg'; break;
        case 'svg': $mime = 'image/svg+xml'; break;
        case 'ico': $mime = 'image/x-icon'; break;
        case 'txt': $mime = 'text/plain'; break;
        case 'xml': $mime = 'text/xml'; break;
        default: $mime = 'application/octet-stream';
    }

    header("Content-Type: $mime");
    readfile($path);
    return;
}

// Fallback to index.php
$_SERVER["SCRIPT_FILENAME"] = __DIR__ . "/index.php";
require __DIR__ . "/index.php";
`;
}

// adapter/src/runtime/router/php-static.ts
function getRouterPhpStaticPhp(fallback, fallbackFile) {
  const hasFallback = Boolean(fallback);
  const resolvedFallback = fallbackFile ?? "index.php";
  return `
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (strpos($path, '/../') !== false || strpos($path, '/..\\\\') !== false) {
	http_response_code(400);
	echo "Bad Request";
	return;
}

if ($base !== '' && strpos($uri, $base) === 0) {
	$uri = substr($uri, strlen($base));
	if ($uri === '' || $uri === false) $uri = '/';
	router_log("Stripped URI: $uri");
}

if (strlen($uri) > 0 && $uri[0] !== '/') {
    $uri = '/' . $uri;
}

$root = __DIR__;
$q = $_SERVER['QUERY_STRING'] ?? '';

// Load Route Manifest
$manifest_file = $root . '/adapter/route-manifest.php';
$manifest = file_exists($manifest_file) ? require $manifest_file : [];

// Check Manifest Routes
foreach ($manifest as $route) {
    if (preg_match($route['re'], $uri)) {
        router_log("Matched regex: {$route['re']} for URI: $uri");

        // Enforce canonical trailing slash redirects (308)
        // If manifest entry says "always" but URI lacks slash -> 308 redirect
        // If manifest entry says "never" but URI has slash -> 308 redirect
        // Note: The regex usually handles matching both, but we need to enforce the canonical version.

        $trailingSlash = $route['trailingSlash'] ?? 'ignore'; // 'always', 'never', 'ignore'

        if ($trailingSlash === 'always' && substr($uri, -1) !== '/') {
            // Redirect to slash
            // Use 308 for Permanent Redirect (preserves method)
            $target = $base . $uri . '/';
            if ($q !== '') {
                $target .= '?' . $q;
            }
            header("Location: $target", true, 308);
            http_response_code(308); // Explicitly set response code
            return;
        } elseif ($trailingSlash === 'never' && substr($uri, -1) === '/' && $uri !== '/') {
            // Redirect to no slash
            $target = $base . substr($uri, 0, -1);
            if ($q !== '') {
                $target .= '?' . $q;
            }
            header("Location: $target", true, 308);
            http_response_code(308); // Explicitly set response code
            return;
        }

        if ($route['type'] === 'page' || $route['type'] === 'endpoint') {
            // ...
            $shim = $root . $route['shim'];
            router_log("Checking shim: $shim");
            // If we are serving a directory index, we must ensure trailing slash is correct.
            // But if we've reached here, the trailing slash check above should have handled it if manifest knows about it.
            // If manifest didn't catch it (e.g. regex too broad or 'ignore'), and it's a directory...
            // Actually, shim points to a file.
            if (file_exists($shim)) {
                // For directories, ensure we have trailing slash if required by manifest or typical convention
                // But for pages/endpoints, the regex should handle it.
                $_SERVER['SCRIPT_FILENAME'] = realpath($shim);
                require $shim;
                return;
            } else {
                router_log("Shim not found: $shim");
            }
        } elseif ($route['type'] === 'negotiate') {
            // Negotiation logic
            // Check Accept header
            $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
            $prefersHtml = (strpos($accept, 'text/html') !== false);

            // Also check method. GET/HEAD can be page or endpoint. POST/PUT/etc usually endpoint.
            $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
            $isRead = ($method === 'GET' || $method === 'HEAD');

            $served = false;

            if ($isRead && $prefersHtml) {
                // Try page first
                $page = $root . $route['page'];
                if (file_exists($page)) {
                    // Check if it's .html or .php
                    if (substr($page, -4) === '.php') {
                        $_SERVER['SCRIPT_FILENAME'] = realpath($page);
                        require $page;
                        $served = true;
                    } else {
                        // Serve static HTML
                        // We must serve it with correct headers?
                        // Actually, just readfile. Apache/PHP handles content-type usually?
                        // We should set Content-Type: text/html explicitly to be safe
                        header('Content-Type: text/html; charset=utf-8');
                        readfile($page);
                        $served = true;
                    }
                }
            }

            if (!$served) {
                // Try endpoint
                $endpoint = $root . $route['endpoint'];
                if (file_exists($endpoint)) {
                    $_SERVER['SCRIPT_FILENAME'] = realpath($endpoint);
                    require $endpoint;
                    $served = true;
                }
            }

            // Fallback to page if endpoint missing? Or 404?
            // If we preferred HTML but page missing, try endpoint?
            // If we preferred JSON but endpoint missing, try page?
            // For now, simple priority.

            if ($served) {
                // $out = ob_get_clean();
                // echo $out;
                return;
            }
        }
    }
}

// Special handling for SvelteKit __data.json requests
// Map /path/__data.json to /path/__data.php
$suffix = '/__data.json';
if (substr($uri, -strlen($suffix)) === $suffix) {
    $php_file_rel = str_replace($suffix, '/__data.php', $uri);
    // If base path is set, the data files are nested under it (created by adapter)
    $prefix = ($base !== '' && $base !== '/') ? $base : '';
    $php_file = $root . $prefix . $php_file_rel;

    if (file_exists($php_file)) {
		header('Content-Type: application/json');
		header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
		$_SERVER['SCRIPT_FILENAME'] = realpath($php_file);
		require $php_file;
		return;
	} else {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode(["error" => "Data not found", "path" => $uri]);
        $out = ob_get_clean();
        echo $out;
        return;
    }
}

$action_suffix = '/__action';
if (substr($uri, -strlen($action_suffix)) === $action_suffix) {
    $php_file_rel = str_replace($action_suffix, '/__action.php', $uri);
    // If base path is set, the action files are nested under it (created by adapter)
    $prefix = ($base !== '' && $base !== '/') ? $base : '';
    $php_file = $root . $prefix . $php_file_rel;

    if (file_exists($php_file)) {
        $_SERVER['SCRIPT_FILENAME'] = realpath($php_file);
        require $php_file;
        // Same here
        return;
    } else {
        http_response_code(404);
        return;
    }
}

// 0. Try to serve exact file match - nested under base path
// This handles cases where static files are nested under the base path in the build output.
// We use stripped URI but reconstructed path including base.
$nested_path = __DIR__ . ($base === '/' ? '' : $base) . $uri;
if ($uri !== '/' && file_exists($nested_path)) {
	if (is_file($nested_path)) {
		$real = realpath($nested_path);
		if ($real === false || strpos($real, realpath(__DIR__)) !== 0) {
			http_response_code(403);
			return;
		}

		$ext = pathinfo($nested_path, PATHINFO_EXTENSION);
        $mime = 'application/octet-stream';
        if ($ext === 'html') $mime = 'text/html';
        elseif ($ext === 'css') $mime = 'text/css';
        elseif ($ext === 'js') $mime = 'application/javascript';
        elseif ($ext === 'json') $mime = 'application/json';
        elseif ($ext === 'png') $mime = 'image/png';
        elseif ($ext === 'jpg') $mime = 'image/jpeg';
        elseif ($ext === 'svg') $mime = 'image/svg+xml';

		if ($_SERVER['REQUEST_METHOD'] === 'HEAD') {
			header('Content-Type: '.$mime);
			header('Content-Length: '.filesize($nested_path));
			return;
		}

		if ($ext === 'php') {
			$_SERVER['SCRIPT_FILENAME'] = $real;
			require $real;
			return;
		}

		header('Content-Type: '.$mime);
		header('Content-Length: '.filesize($nested_path));
		readfile($nested_path);
		return;
	} elseif (is_dir($nested_path)) {
		// If accessing directory, check for index
		foreach (['/index.php', '/index.html'] as $idx) {
			$candidate = $nested_path . $idx;
			if (is_file($candidate)) {
				if (substr($uri, -1) !== '/') {
					// Redirect to slash
                    // We use $base . $uri because $uri is stripped
					$target = $base . $uri . '/';
					if (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '') {
						$target .= '?' . $_SERVER['QUERY_STRING'];
					}
					header("Location: $target", true, 301);
					return;
				}

				if (substr($candidate, -4) === '.php') {
					$_SERVER['SCRIPT_FILENAME'] = realpath($candidate);
					require $candidate;
					return;
				}

				header('Content-Type: text/html; charset=utf-8');
				readfile($candidate);
				return;
			}
		}
	}
}

// 1. Serve static files if they exist
$path = __DIR__.$uri;
if ($uri !== '/' && file_exists($path) && is_file($path)) {
    $real = realpath($path);
    if ($real === false || strpos($real, realpath(__DIR__)) !== 0) {
        http_response_code(403);
        echo "Access Denied";
        return;
    }

	$ext = pathinfo($path, PATHINFO_EXTENSION);
	$mimes = [
		'js' => 'application/javascript',
		'mjs' => 'application/javascript',
		'cjs' => 'application/javascript',
		'css' => 'text/css',
		'json' => 'application/json',
		'html' => 'text/html',
		'htm' => 'text/html',
		'xml' => 'text/xml',
		'txt' => 'text/plain',
		'svg' => 'image/svg+xml',
		'png' => 'image/png',
		'jpg' => 'image/jpeg',
		'jpeg' => 'image/jpeg',
		'gif' => 'image/gif',
		'webp' => 'image/webp',
		'ico' => 'image/x-icon',
		'woff2' => 'font/woff2',
		'woff' => 'font/woff',
		'ttf' => 'font/ttf',
		'eot' => 'application/vnd.ms-fontobject'
	];
	$mime = $mimes[$ext] ?? (function_exists('mime_content_type') ? mime_content_type($path) : 'application/octet-stream');

	if ($_SERVER['REQUEST_METHOD'] === 'HEAD') {
		header('Content-Type: '.$mime);
		header('Content-Length: '.filesize($path));
		return;
	}

	header('Content-Type: '.$mime);
	header('Content-Length: '.filesize($path));
	readfile($path);
	return;
}

if (strpos($uri, '/_app/') === 0) {
	http_response_code(404);
	return;
}

if (preg_match('/\\.(css|js|map|mjs|cjs|json|png|jpg|jpeg|gif|webp|svg|ico|txt|xml|woff2|woff|ttf|eot)$/', $uri)) {
	http_response_code(404);
	return;
}

// 2. If it's a directory, manually serve index.php or index.html
if ($uri !== '/' && is_dir($path)) {
    // If manifest said "never" for this route, we should have already redirected.
    // If we are here, and it's a directory, and the URI ends in slash (which is_dir implies usually unless trailing slash missing but is_dir still works on some OS?),
    // actually, if URI doesn't end in slash but is_dir is true, we should redirect to slash IF we want canonical directories.
    // But let's check manifest logic first.

    // Check if we need to redirect to slash for directory if missing
    if (substr($uri, -1) !== '/') {
         // This is a directory but accessed without slash.
         // Apache/Nginx usually do this automatically (301).
         // We should probably do it too if we are the router.
         $target = $base . $uri . '/';
         if (isset($_SERVER['QUERY_STRING']) && $_SERVER['QUERY_STRING'] !== '') {
             $target .= '?' . $_SERVER['QUERY_STRING'];
         }
         header("Location: $target", true, 301); // 301 for directory canonicalization (standard)
         return;
    }

    foreach (['/index.php', '/index.html'] as $idx) {
        $candidate = $path . $idx;
        if (is_file($candidate)) {
            // Check for trailing slash policy if it's a directory serving index
            // If the URI doesn't end in slash, we should have redirected above.

            if (substr($candidate, -4) === '.php') {
                $requested_file = realpath($candidate);
                if ($requested_file) {
                    $_SERVER['SCRIPT_FILENAME'] = $requested_file;
                    require $requested_file;
                    return;
                }
            }

            // Fix: If serving directory index.html, we must redirect non-slash URI to slash first
            // Otherwise relative links in that HTML will be broken.
            // (We did a 301 redirect check above, but that was generic. The previous block handles generic dir redirect.)
            // But if we are here, it means we found an index file.

            header('content-type: text/html; charset=utf-8');
            readfile($candidate);
            return;
        }
    }
}

// 3. Extensionless matching: /foo -> /foo.php or /foo.html
// But NOT if URI ends with slash (already handled by directory check above)
if ($uri !== '/' && substr($uri, -1) !== '/') {
    $candidate_path = __DIR__ . $uri;
    foreach (['.php', '.html'] as $ext) {
        $candidate = $candidate_path . $ext;
        if (is_file($candidate)) {
            if ($ext === '.php') {
                $requested_file = realpath($candidate);
                if ($requested_file) {
                    $_SERVER['SCRIPT_FILENAME'] = $requested_file;
                    require $requested_file;
                    return;
                }
            }

            header('content-type: text/html; charset=utf-8');
            readfile($candidate);
            return;
        }
    }
}

${hasFallback ? `
$fallback_file = __DIR__ . '/${resolvedFallback}';
$fallback_php_ext = str_replace('.html', '.php', $fallback_file);

if (is_file($fallback_php_ext)) {
    $_SERVER['SCRIPT_FILENAME'] = realpath($fallback_php_ext);
    require $fallback_php_ext;
    $out = ob_get_clean();
    echo $out;
    return;
}
if (is_file($fallback_file)) {
    header('content-type: text/html; charset=utf-8');
    readfile($fallback_file);
    $out = ob_get_clean();
    echo $out;
    return;
}
router_log("Fallback enabled but file not found. Checked: $fallback_file and $fallback_php_ext");
` : 'router_log("Fallback disabled");'}

// Explicit 404 for non-existent routes when no fallback is configured
http_response_code(404);
echo "404 Not Found";
$out = ob_get_clean();
echo $out;
`;
}

// adapter/src/runtime/router/shared.ts
function getRouterSharedPhp(base) {
  return `<?php
// Simple router to emulate Apache .htaccess mod_rewrite
// for the PHP built-in server.
// Generated by @ryanspice/sveltekit-adapter-php

require_once __DIR__ . '/_runtime/compat.php';

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri_raw = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$base_env = getenv('SK_BASE_PATH');
$base = $base_env !== false ? $base_env : '${base}';
$uri = $uri_raw;

if (strpos($path, '/../') !== false || strpos($path, '/..\\\\') !== false) {
	http_response_code(400);
	echo "Bad Request";
	return;
}

if (strpos($path, '/_protected/') !== false) {
	http_response_code(403);
	echo "Access Denied";
	return;
}

$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
	return false;
}

// Router Runtime Hardening
if (!defined('SK_ROUTER_HARDENED')) {
    define('SK_ROUTER_HARDENED', 1);

    ob_start();
    ini_set('display_errors', '0');
    ini_set('log_errors', '1');
    ini_set('error_log', 'php://stderr');
    error_reporting(E_ALL);

    set_error_handler(function($severity, $message, $file, $line) {
        if (!(error_reporting() & $severity)) {
            return false;
        }
        error_log("[php-warning] $message in $file:$line");
        return true; // Don't execute PHP internal error handler
    });
}

if (!function_exists('router_log')) {
    function router_log($msg) {
        file_put_contents(__DIR__ . '/../router.log', "[Router] ".$msg. "
", FILE_APPEND);
    }
}

router_log("Request: $uri");
router_log("Base Env: '$base_env'");
router_log("Base Used: '$base'");

if ($base !== '' && ($uri === '/' || $uri === '')) {
    $target = $base . '/';
    $q = $_SERVER['QUERY_STRING'] ?? '';
    if ($q !== '') {
        $target .= '?' . $q;
    }
    header("Location: $target", true, 308);
    http_response_code(308);
    return;
}

if (strpos($uri, '/_protected/') === 0 || ($base !== '' && strpos($uri, $base . '/_protected/') === 0)) {
	http_response_code(403);
    echo "Access Denied";
	return;
}
`;
}

// adapter/src/runtime/php-templates.ts
function getDataPhp(includes, base = "", compatRel = "./_runtime/compat.php", relToRoot = "./") {
  return `<?php
/**
 * Generated by @ryanspice/sveltekit-adapter-php
 * - Serves /__data.php requests (client navigation + invalidations)
 * - Provides sk_build_embed_data() for index.php hydration
 *
 * Template shape comes from prerendered __data.json (so it matches your Kit version).
 */

declare(strict_types=1);

// Runtime Hardening
if (!defined('SK_HARDENED')) {
	define('SK_HARDENED', 1);
	// 1. Output Buffering
	if (ob_get_level() === 0) ob_start();

	// 2. Error Output Policy
	ini_set('display_errors', '0');
	ini_set('log_errors', '1');
	ini_set('error_log', 'php://stderr');

	// 3. Capture warnings/notices
	set_error_handler(function($severity, $message, $file, $line) {
		if (!(error_reporting() & $severity)) {
			return false;
		}
		error_log("[php-warning] $message in $file:$line");
		return true;
	});
}

require_once __DIR__ . '/${compatRel}';

// Define relative path to root for runtime base detection
if (!defined('SK_REL_TO_ROOT')) {
	define('SK_REL_TO_ROOT', '${relToRoot}');
}

// Allow env override for base path (e.g. for different dev/prod paths)
// Fallback to build-time base
if (!defined('SK_BASE_PATH')) {
	define('SK_BASE_PATH', getenv('SK_BASE_PATH') ?: '${base}');
}
if (!defined('SK_ROUTE_REGEX')) {
	define('SK_ROUTE_REGEX', 'PLACEHOLDER_ROUTE_REGEX');
}
if (!defined('SK_ROUTE_PARAM_MAP')) {
	define('SK_ROUTE_PARAM_MAP', PLACEHOLDER_ROUTE_PARAM_MAP);
}

${includes.join(`
`)}

if (!function_exists('sk_json_encode')) {
function sk_json_encode($value): string {
	$json = json_encode(
		$value,
		JSON_UNESCAPED_SLASHES
			| JSON_UNESCAPED_UNICODE
			| JSON_HEX_TAG
			| JSON_HEX_AMP
			| JSON_HEX_APOS
			| JSON_HEX_QUOT
	);
	return $json === false ? 'null' : $json;
}
}

if (!class_exists('SK_URLSearchParams')) {
final class SK_URLSearchParams {
	private array $pairs = [];

	public function __construct(string $queryString) {
		$qs = ltrim($queryString, '?');
		if ($qs === '') return;
		foreach (explode('&', $qs) as $part) {
			if ($part === '') continue;
			$kv = explode('=', $part, 2);
			$key = urldecode($kv[0]);
			$val = urldecode($kv[1] ?? '');
			if (!array_key_exists($key, $this->pairs)) $this->pairs[$key] = [];
			$this->pairs[$key][] = $val;
		}
	}

	public function get(string $key): ?string {
		$vals = $this->pairs[$key] ?? null;
		if (!$vals) return null;
		return $vals[0] ?? null;
	}

	public function has(string $key): bool {
		return array_key_exists($key, $this->pairs);
	}

	public function __get(string $key): ?string {
		return $this->get($key);
	}

	public function __isset(string $key): bool {
		return $this->has($key);
	}

	public function all(string $key): array {
		return $this->pairs[$key] ?? [];
	}

	public function toString(): string {
		$out = [];
		foreach ($this->pairs as $k => $vals) {
			foreach ($vals as $v) {
				$out[] = rawurlencode($k) . '=' . rawurlencode($v);
			}
		}
		return implode('&', $out);
	}
}
}

if (!class_exists('__SK_Deferred')) {
final class __SK_Deferred {
	public $fn;
	public function __construct($fn) {
		$this->fn = $fn;
	}
}
}
if (!class_exists('__SK_Deferred_Placeholder')) {
final class __SK_Deferred_Placeholder {
	public int $id;
	public function __construct(int $id) {
		$this->id = $id;
	}
}
}

if (!function_exists('sk_defer')) {
function sk_defer(callable $fn): __SK_Deferred { return new __SK_Deferred($fn); }
}


if (!function_exists('sk_assert_jsonable')) {
function sk_assert_jsonable($value, string $path = ''): void {
	if ($value instanceof __SK_Deferred || $value instanceof __SK_Deferred_Placeholder) return;
	if (is_null($value) || is_bool($value) || is_int($value) || is_string($value)) return;
	if (is_float($value)) {
		if (is_nan($value) || is_infinite($value)) {
			throw new RuntimeException("Non-JSON float at $path");
		}
		return;
	}
	if (is_array($value)) {
		foreach ($value as $k => $v) {
			$next = $path === '' ? (string)$k : ($path . '.' . (string)$k);
			sk_assert_jsonable($v, $next);
		}
		return;
	}
	if (is_object($value)) {
		if ($value instanceof JsonSerializable) {
			sk_assert_jsonable($value->jsonSerialize(), $path);
			return;
		}
		throw new RuntimeException("Non-JSON object at $path");
	}
	if (is_resource($value)) throw new RuntimeException("Non-JSON resource at $path");
	throw new RuntimeException("Non-JSON value at $path");
}
}

if (!function_exists('sk_recursive_resolve')) {
function sk_recursive_resolve($data, ?array &$deferreds = null) {
	if ($data instanceof __SK_Deferred) {
		if ($deferreds !== null) {
			$id = count($deferreds) + 1;
			$deferreds[$id] = $data;
			return new __SK_Deferred_Placeholder($id);
		}
		$fn = $data->fn;
		return sk_recursive_resolve($fn(), $deferreds);
	}
	if (is_array($data)) {
		foreach ($data as $k => $v) {
			$data[$k] = sk_recursive_resolve($v, $deferreds);
		}
	}
	return $data;
}
}

/**
 * Locates the "nodes" array within the template payload.
 * Supports:
 *   A) { "type":"data", "nodes":[ ... ] }
 *   B) devalue-like: [ { "type":1, "nodes":2 }, ..., <nodes at index 2>, ... ]
 */
if (!function_exists('sk_get_nodes_ref')) {
function sk_get_nodes_ref(array &$payload): array {
	// A) associative with nodes
	if (array_key_exists('nodes', $payload) && is_array($payload['nodes'])) {
		return ['kind' => 'assoc', 'key' => 'nodes'];
	}

	// B) packed array with header object at 0
	if (isset($payload[0]) && is_array($payload[0]) && array_key_exists('nodes', $payload[0]) && is_int($payload[0]['nodes'])) {
		$idx = $payload[0]['nodes'];
		if (isset($payload[$idx]) && is_array($payload[$idx])) {
			return ['kind' => 'index', 'idx' => $idx];
		}
	}

	// fallback: treat as already nodes
	return ['kind' => 'self'];
}
}

if (!function_exists('sk_serialize')) {
function sk_serialize($value): array {
	$flattened = [];
	$map = [];

	$add_primitive = function($val) use (&$flattened, &$map) {
		$key = is_string($val)
			? 's_'.$val
			: (is_int($val)
				? 'i_'.$val
				: (is_float($val) ? 'f_'.$val : json_encode($val)));
		if (array_key_exists($key, $map)) {
			return $map[$key];
		}

		$flattened[] = $val;
		$idx = count($flattened) - 1;
		$map[$key] = $idx;
		return $idx;
	};

	// Recursive closure to flatten the structure
	// We use a reference for $flattened to append values
	$fn = function($val) use (&$flattened, &$map, &$fn, $add_primitive) {
		// Primitives
		if (is_string($val) || is_int($val) || is_float($val) || is_bool($val) || is_null($val)) {
			return $add_primitive($val);
		}

		if ($val instanceof __SK_Deferred_Placeholder) {
			$id_idx = $add_primitive($val->id);
			$flattened[] = ["Promise", $id_idx];
			return count($flattened) - 1;
		}

		// Arrays / Objects
		// Detect if it's a list (array) or object (associative)
		$is_list = is_array($val) && array_is_list($val);
		$flattened[] = $is_list ? [] : (object)[];
		$idx = count($flattened) - 1;
		$map['o_'.$idx] = $idx; // Object identity is hard to dedupe perfectly, simplified

		foreach ($val as $k => $v) {
			$vIdx = $fn($v);
			if (is_array($flattened[$idx])) {
				$flattened[$idx][] = $vIdx;
			} else {
				$flattened[$idx]->{$k} = $vIdx;
			}
		}
		return $idx;
	};

	$fn($value);
	return $flattened;
}
}

/**
 * Unflattens a Devalue-serialized array back into a PHP structure (array/object).
 * This is used to provide hydrated data to the client in a format SvelteKit's start() accepts (objects).
 */
if (!function_exists('sk_unflatten')) {
function sk_unflatten(array $data) {
	if (empty($data)) return null;

	$resolve = function($idx) use ($data, &$resolve) {
		$val = $data[$idx] ?? null;

		// Primitives are returned as-is
		if (!is_array($val) && !is_object($val)) {
			return $val;
		}

		// Handle stdClass (from sk_serialize)
		if (is_object($val)) {
			$val = (array)$val;
			$res = (object)[];
			foreach ($val as $k => $i) {
				$res->{$k} = $resolve($i);
			}
			return $res;
		}

		// Handle arrays (from json_decode or sk_serialize)
		// Check for array vs object (associative)
		// Polyfill for array_is_list: keys are 0..count-1
		$is_list = $val === [] || (array_keys($val) === range(0, count($val) - 1));

		if ($is_list) {
			$res = [];
			foreach ($val as $i) {
				$res[] = $resolve($i);
			}
			return $res;
		} else {
			$res = (object)[];
			foreach ($val as $k => $i) {
				$res->{$k} = $resolve($i);
			}
			return $res;
		}
	};

	// Devalue root is always at index 0
	return $resolve(0);
}
}

if (!function_exists('sk_set_node_data')) {
function sk_set_node_data(&$node, $server_data): void {
	if (!is_array($node)) {
		$node = [];
	}

	$node['type'] = 'data';

	sk_assert_jsonable($server_data);

	// SvelteKit expects data to be the serialized array (devalue format).
	// We use sk_serialize to produce a devalue-compatible flattened array.
	// We force array_values to ensure it's encoded as a JSON list, not an object.
	$encoded = sk_serialize($server_data);
	$node['data'] = array_values($encoded);

	$node['uses'] = $node['uses'] ?? (object)[];
	// Force uses to be an object if it's an empty array
	if (is_array($node['uses']) && count($node['uses']) === 0) {
		$node['uses'] = (object)[];
	}
}
}

if (!function_exists('sk_set_payload_form')) {
function sk_set_payload_form(&$payload, $form): void {
	if (is_array($payload) && isset($payload[0]) && is_array($payload[0])) {
		$payload[0]['form'] = $form;
		return;
	}

	if (is_array($payload)) {
		$payload['form'] = $form;
	}
}
}

if (!function_exists('sk_apply_loads')) {
function sk_apply_loads(string $routeid, array $loadFns, array &$payload, string $inline_mode, ?array &$deferreds = null): array {
	$base = [];
	$server_results = [];
	$next_chunk_id = 1;
	$params = sk_extract_params($_SERVER['REQUEST_URI'] ?? '', SK_BASE_PATH, SK_ROUTE_REGEX, SK_ROUTE_PARAM_MAP);

	// Loop through load functions (from root layout to leaf page)
	foreach ($loadFns as $i => $fn) {
		if (!function_exists($fn)) {
			continue;
		}

		// Prepare URL object to match dev environment
		$qs = $_SERVER['QUERY_STRING'] ?? '';
		$searchParams = new SK_URLSearchParams($qs);
		sk_debug_log("DEBUG: sk_apply_loads - route: $routeid, fn: $fn, qs: $qs");

		// Execute the load function
		// Pass $base (merged parent data) as 'parentdata' if needed, though SvelteKit usually
		// passes a parent() function. For this simple adapter, we simulate parent merging
		// by accumulating data in $base.
		$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
		$locals = &sk_locals();

		try {
			$res = $fn([
				'params' => $params,
				'url' => (object)[
					'searchParams' => $searchParams,
					'pathname' => $_SERVER['REQUEST_URI'] ?? ''
				],
				'request' => (object)[
					'method' => $method,
					'headers' => (object)[
						'cookie' => $_SERVER['HTTP_COOKIE'] ?? ''
					]
				],
				'cookies' => new SK_Cookies($_COOKIE),
				'route' => (object)[
					'id' => $routeid
				],
				'parent' => function() use (&$base) {
					return $base;
				},
				'locals' => &$locals,
				'depends' => function(...$deps) {
					return null;
				},
				'fetch' => function($input, $init = []) {
					return sk_fetch($input, $init ?? []);
				},
				'routeid' => $routeid,
				'parentdata' => $base,
				'method' => $method,
				'query' => $_GET,
				'server' => $_SERVER
			]);
		} catch (SK_Redirect $e) {
			header('Location: ' . $e->location, true, $e->status);
			exit;
		} catch (SK_Error $e) {
			http_response_code($e->status);
			echo sk_json_encode(['error' => $e->body]);
			exit;
		}

		// Merge result into base for next level
		if (is_array($res)) {
			$res = sk_recursive_resolve($res, $deferreds);
			$base = array_merge($base, $res);
			$server_results[$i] = $res;
		} else {
			// Handle non-array results? (e.g. redirect/error usually throw)
			$res = sk_recursive_resolve($res, $deferreds);
			$server_results[$i] = $res;
		}
	}

    sk_debug_log("DEBUG: server_results=" . json_encode($server_results));

	// Update the payload with server results
	$ref = sk_get_nodes_ref($payload);

	// Helper to access nodes array by reference
	$nodes = [];
	if ($ref['kind'] === 'assoc') {
		$nodes = &$payload[$ref['key']];
	} else if ($ref['kind'] === 'index') {
		$nodes = &$payload[$ref['idx']];
	} else {
		$nodes = &$payload;
	}

	foreach ($server_results as $i => $data) {
		// Map load index to node index
		// $i is string (key from loadFns)
		$nodeIdx = $i;

		if (array_key_exists($nodeIdx, $nodes)) {
			sk_set_node_data($nodes[$nodeIdx], $data);
		}
	}

	// Inline Mode: return full payload (no streaming needed for now)
	return $payload;
}
}

if (!function_exists('sk_build_embed_data')) {
function sk_build_embed_data(string $routeid, array $loadFns, string $templateJson, string $inline_mode, bool $streaming = false): array {
	$payload = json_decode($templateJson, true);
	if (!$payload) return ['[]', []];

	$deferreds = $streaming ? [] : null;
	$finalPayload = sk_apply_loads($routeid, $loadFns, $payload, $inline_mode, $deferreds);
	if (array_key_exists('__SK_ACTION_RESULT', $GLOBALS)) {
		sk_set_payload_form($finalPayload, $GLOBALS['__SK_ACTION_RESULT']);
	}

	// Extract nodes to generate the hydration array
	$ref = sk_get_nodes_ref($finalPayload);
	$nodes = [];
	if ($ref['kind'] === 'assoc') {
		$nodes = $finalPayload[$ref['key']];
	} elseif ($ref['kind'] === 'index') {
		$nodes = $finalPayload[$ref['idx']];
	} else {
		$nodes = $finalPayload;
	}

	$outputPayload = $finalPayload;

	// If inline_mode is 'nodes', we want the parallel array of data objects
	// SvelteKit hydration expects [ data_0, data_1, ... ] matching node_ids
	// The nodes are usually objects like { type: 'data', data: [...], uses: ... }
	// We should return them AS IS (preserving Devalue structure) because SvelteKit client will deserialize them.
	if ($inline_mode === 'nodes' || $inline_mode === 'unknown') {
		$outputPayload = $nodes;
	}

	$json = sk_json_encode($outputPayload);
	if (sk_debug_enabled()) {
		file_put_contents('debug_payload.json', $json . "
", FILE_APPEND);
	}

	// Replace deferred placeholders with JS calls
	if ($streaming && $deferreds) {
		// We need to be careful not to replace things inside strings that look like our marker,
		// but our marker is very specific.
		// The marker is "%%%SK_DEFER_ID%%%" (quoted in JSON).
		// We want to replace "%%%SK_DEFER_ID%%%" with PLACEHOLDER_APP_ID.defer(ID).
		// Note the lack of quotes in the replacement.

		$json = preg_replace_callback('/"%%%SK_DEFER_(\\d+)%%%"/', function($matches) {
			$id = (int)$matches[1];
			// sk_recursive_resolve uses 1-based IDs to match SvelteKit chunk ids.
			return "PLACEHOLDER_APP_ID.defer($id)";
		}, $json);
	}

	return [$json, $deferreds];
}
}

// Main execution if called directly (client navigation)
if (basename($_SERVER['SCRIPT_FILENAME']) === '__data.php') {
	header('Content-Type: application/json; charset=utf-8');

    // Intercept redirects to ensure they point to __data.json
    // This fixes the issue where SvelteKit client navigation receives HTML instead of JSON
    // when a load function redirects to a page URL.
    register_shutdown_function(function() {
        if (headers_sent()) return;

        $headers = headers_list();
        foreach ($headers as $h) {
            // Case-insensitive check for Location header
            if (stripos($h, 'Location:') === 0) {
                $location = trim(substr($h, 9));

                // If redirecting to a page (not already __data.json)
                if (strpos($location, '__data.json') === false) {
                    // Only rewrite local paths (starting with /)
                    // This covers most SvelteKit redirects.
                    if (strpos($location, '/') === 0) {
                         $parts = parse_url($location);
                         $path = $parts['path'] ?? '';

                         // Append /__data.json
                         // SvelteKit normalization usually strips trailing slash, but we are appending a file.
                         // /foo -> /foo/__data.json
                         // /foo/ -> /foo/__data.json
                         $newPath = rtrim($path, '/') . '/__data.json';
						 if (SK_BASE_PATH !== '' && strpos($newPath, SK_BASE_PATH . '/') !== 0 && $newPath !== SK_BASE_PATH) {
							 $newPath = SK_BASE_PATH . $newPath;
						 }

                         $newLocation = $newPath;
                         if (isset($parts['query'])) $newLocation .= '?' . $parts['query'];
                         if (isset($parts['fragment'])) $newLocation .= '#' . $parts['fragment'];

                         // Replace the Location header
                         header("Location: $newLocation", true);
                    }
                }
            }
        }
	});

	// Execute loads
	$templateJson = base64_decode('PLACEHOLDER_TEMPLATE_B64');
	$payload = json_decode(is_string($templateJson) ? $templateJson : '', true);
	$loadFns = PLACEHOLDER_LOAD_FNS;
	$routeId = PLACEHOLDER_ROUTE_ID;
	$inlineMode = PLACEHOLDER_INLINE_MODE;

	// Blocking mode for client navigation
	sk_debug_log("DEBUG: __data.php processing request for $routeId");
	$finalPayload = sk_apply_loads($routeId, $loadFns, $payload, $inlineMode);
	$json = sk_json_encode($finalPayload);

	header('Content-Length: ' . strlen($json));

	if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') {
		echo $json;
	}
	sk_debug_log("DEBUG: __data.php response sent");
}
`;
}
function getActionPhp(includes, routeId, pagePrefix, compatRel = "./_runtime/compat.php") {
  return `<?php
/**
 * Generated by @ryanspice/sveltekit-adapter-php
 * - Handles form actions (POST)
 */

declare(strict_types = 1);

require_once __DIR__ . '/${compatRel}';

${includes.join(`
`)}

require_once __DIR__ . '/__data.php';

// Helper for SvelteKit fail()
if (!function_exists('sk_fail')) {
function sk_fail(int $status, $data): array {
	return ['type' => 'failure', 'status' => $status, 'data' => $data];
}
}

if (!function_exists('sk_action_serialize')) {
function sk_action_serialize($value): string {
	return sk_json_encode(array_values(sk_serialize($value)));
}
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
	http_response_code(405);
	exit('Method Not Allowed');
}

// 1. Determine Action Name
// SvelteKit passes action name in query string usually ?/actionName
// Or default action if ?/
$actionName = 'default';
foreach($_GET as $key => $val) {
	if (str_starts_with($key, '/')) {
		$name = substr($key, 1);
		$actionName = $name === '' ? 'default' : $name;
		break;
	}
}

// 2. Call the action
$isEnhanced = (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true');
$pagePrefix = ${pagePrefix ? `'${pagePrefix}'` : "''"};
$fnName = $pagePrefix . '_action_' . $actionName;

if (!function_exists($fnName)) {
	http_response_code(404);
	header('Content-Type: application/json; charset=utf-8');
	echo sk_json_encode(['type' => 'error', 'error' => ['message' => 'Action not found']]);
	exit;
}

// 3. Execute
// We need to parse body (multipart or urlencoded)
// PHP does this automatically into $_POST and $_FILES

try {
	$params = sk_extract_params($_SERVER['REQUEST_URI'] ?? '', SK_BASE_PATH, SK_ROUTE_REGEX, SK_ROUTE_PARAM_MAP);
	$method = $_SERVER['REQUEST_METHOD'] ?? 'POST';
	$locals = &sk_locals();

	$result = $fnName([
		'request' => (object)[
			'method' => $method,
			'formData' => function () {
				return array_merge($_POST, $_FILES);
			}
		],
		'url' => (object)[
			'searchParams' => new SK_URLSearchParams($_SERVER['QUERY_STRING'] ?? ''),
			'pathname' => parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH)
		],
		'params' => $params,
		'route' => (object)[
			'id' => ${JSON.stringify(routeId)}
		],
		'locals' => &$locals,
		'depends' => function(...$deps) {
			return null;
		},
		'fetch' => function($input, $init = []) {
			return sk_fetch($input, $init ?? []);
		},
		'cookies' => new SK_Cookies($_COOKIE),
		'post' => $_POST,
		'files' => $_FILES
    ]);

	// 4. Return result
	// SvelteKit actions return { type: 'success'|'failure'|'redirect'|'error', data: ... }
	// We assume the PHP code returns an array/object matching this.

	if ($isEnhanced) {
		header('Content-Type: application/json; charset=utf-8');
		echo sk_action_serialize($result);
		exit;
	}

	$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
	$expectsJson = strpos($accept, 'application/json') !== false;

	if (isset($result['type']) && $result['type'] === 'redirect') {
		if ($expectsJson) {
			header('Content-Type: application/json; charset=utf-8');
			echo sk_json_encode($result);
			exit;
		}

		header('Location: '.$result['location']);
		http_response_code($result['status'] ?? 303);
		exit;
	}

	if ($expectsJson) {
		header('Content-Type: application/json; charset=utf-8');
		echo sk_json_encode($result);
		exit;
	}

	if (isset($result['type']) && $result['type'] === 'failure') {
		http_response_code($result['status'] ?? 400);
		$GLOBALS['__SK_ACTION_RESULT'] = $result['data'] ?? null;
		return;
	}

	if (isset($result['type']) && $result['type'] === 'error') {
		http_response_code($result['status'] ?? 500);
		$GLOBALS['__SK_ACTION_RESULT'] = $result['error'] ?? null;
		return;
	}

	if (isset($result['type']) && $result['type'] === 'success') {
		$GLOBALS['__SK_ACTION_RESULT'] = $result['data'] ?? null;
		return;
	}

	if (is_array($result)) {
		$GLOBALS['__SK_ACTION_RESULT'] = $result;
		return;
	}

	http_response_code(500);

} catch (SK_Redirect $e) {
	if (!$isEnhanced) {
		header('Location: ' . $e->location, true, $e->status);
		exit;
	}
	header('Content-Type: application/json; charset=utf-8');
	echo sk_json_encode(['type' => 'redirect', 'location' => $e->location, 'status' => $e->status]);
	exit;
} catch (SK_Error $e) {
	http_response_code($e->status);
	if ($isEnhanced) {
		header('Content-Type: application/json; charset=utf-8');
		echo sk_json_encode(['type' => 'error', 'error' => $e->body, 'status' => $e->status]);
		exit;
	}
	$GLOBALS['__SK_ACTION_RESULT'] = $e->body;
	return;
} catch (Throwable $e) {
	http_response_code(500);
	header('Content-Type: application/json; charset=utf-8');
    echo sk_json_encode(['type' => 'error', 'error' => ['message' => $e -> getMessage()]]);
}
`;
}
function getBootstrapPhp(routeId, loadFns, templateJson, inlineMode, requirePrefix = "") {
  const templateB64 = Buffer.from(templateJson, "utf8").toString("base64");
  return `<?php
require_once __DIR__ . '${requirePrefix}/__data.php';

ini_set('output_buffering', '0');
ini_set('zlib.output_compression', '0');
ini_set('implicit_flush', '1');
while (ob_get_level()) ob_end_flush();

// Handle Actions (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    sk_debug_log("DEBUG: index.php handling POST for " . $_SERVER['REQUEST_URI']);
    if (file_exists(__DIR__ . '${requirePrefix}/__action.php')) {
        require __DIR__ . '${requirePrefix}/__action.php';
    } else {
        sk_debug_log("DEBUG: __action.php not found in " . __DIR__ . '${requirePrefix}');
    }
}

$routeId = ${JSON.stringify(routeId)};
$loadFns = ${loadFns};
$templateJson = base64_decode('${templateB64}');
$inlineMode = ${JSON.stringify(inlineMode)};

// Build data with streaming support
list($data, $sk_deferreds) = sk_build_embed_data($routeId, $loadFns, $templateJson, $inlineMode, true);

$dataPayload = $data;
sk_debug_log("DEBUG: dataPayload=" . substr($dataPayload, 0, 500));

// Fix PLACEHOLDER_APP_ID in streaming promises
// We can't do this in sk_build_embed_data because we don't know the appId yet
// But wait, sk_build_embed_data returns JSON string with placeholders if we used PLACEHOLDER_APP_ID.
// The regex in sk_build_embed_data replaced the deferred marker with a JS call.
// We need to replace PLACEHOLDER_APP_ID with the actual appId found in HTML.
// But we find appId AFTER generating this PHP block.
// Solution: We inject a PHP variable for appId, or we rely on the client-side variable being available.
// SvelteKit usually assigns the app to a variable like '__sveltekit_xyz'.
// We need to ensure our injected script uses the CORRECT variable.
// But we are prepending PHP.
// We can use a JS variable that we define? No, SvelteKit defines it.

// Let's assume we can replace it in the output HTML buffer or we inject a script that defines a bridge.
// OR we just use 'document.currentScript.parentElement' context? No, defer calls are global.

// Revert to using a known variable if possible, or parsing it.
// The adapter index.ts finds the appHash and passes it to getFooterPhp.
// Can we pass it to getBootstrapPhp?
// Yes, we call getBootstrapPhp in index.ts. We should pass appHash there.
?>`;
}
function getFooterPhp(appId) {
  return `<?php
// Footer to handle streaming
// Flush HTML
while (ob_get_level()) ob_end_flush();
flush();

sk_debug_log("DEBUG: Footer running. deferreds count: " . (isset($sk_deferreds) ? count($sk_deferreds) : '0'));

if (!empty($sk_deferreds)) {
	foreach($sk_deferreds as $id => $deferred) {
		$fn = $deferred -> fn;
		// Resolve
		// We use sk_recursive_resolve to resolve the deferred value (blocking for this chunk)
		$data = sk_recursive_resolve($fn());

		// Serialize
		// TODO: Support full Devalue serialization for deferreds (requires client-side unflattening)
		// For now, we use simple JSON encoding to avoid the need for unflattening on the client.
		$serialized = sk_json_encode($data);

		echo '<script>if(typeof ${appId} !== "undefined") { ${appId}.resolve('.$id. ', () => ['.$serialized.', null]); } else { console.error("App ID undefined: ${appId}"); }</script>';
		flush();
	}
}
?>`;
}
function getMinimalBootstrapPhp(requirePrefix = "") {
  return `<?php
// Minimal bootstrap for actions only (SSR=false or no data)
// We still might need __action.php included if we want to support actions on this page
// (even if data loading is client-side).
if (file_exists(__DIR__ . '${requirePrefix}/__action.php')) {
		require __DIR__ . '${requirePrefix}/__action.php';
	}
`;
}
function getApiPhp(includes, prefix, base, routeRegex, routeParamMapPhp, compatRel = "./_runtime/compat.php", relToRoot = "./") {
  return `<?php
/**
 * Generated by @ryanspice/sveltekit-adapter-php
 * - Handles API endpoints (+server.php)
 */
declare(strict_types=1);

require_once __DIR__ . '/${compatRel}';

// Define relative path to root for runtime base detection
if (!defined('SK_REL_TO_ROOT')) {
	define('SK_REL_TO_ROOT', '${relToRoot}');
}

// Allow env override for base path
define('SK_BASE_PATH', getenv('SK_BASE_PATH') ?: '${base}');
const SK_ROUTE_REGEX = '${routeRegex}';
const SK_ROUTE_PARAM_MAP = ${routeParamMapPhp};

${includes.join(`
`)}

if (!function_exists('sk_json_encode')) {
function sk_json_encode($value): string {
	$json = json_encode(
		$value,
		JSON_UNESCAPED_SLASHES
			| JSON_UNESCAPED_UNICODE
			| JSON_HEX_TAG
			| JSON_HEX_AMP
			| JSON_HEX_APOS
			| JSON_HEX_QUOT
	);
	return $json === false ? 'null' : $json;
}
}

if (!class_exists('SK_URLSearchParams')) {
final class SK_URLSearchParams {
	private array $pairs = [];

	public function __construct(string $queryString) {
		$qs = ltrim($queryString, '?');
		if ($qs === '') return;
		foreach (explode('&', $qs) as $part) {
			if ($part === '') continue;
			$kv = explode('=', $part, 2);
			$key = urldecode($kv[0]);
			$val = urldecode($kv[1] ?? '');
			if (!array_key_exists($key, $this->pairs)) $this->pairs[$key] = [];
			$this->pairs[$key][] = $val;
		}
	}

	public function get(string $key): ?string {
		$vals = $this->pairs[$key] ?? null;
		if (!$vals) return null;
		return $vals[0] ?? null;
	}

	public function has(string $key): bool {
		return array_key_exists($key, $this->pairs);
	}

	public function __get(string $key): ?string {
		return $this->get($key);
	}

	public function __isset(string $key): bool {
		return $this->has($key);
	}

	public function all(string $key): array {
		return $this->pairs[$key] ?? [];
	}

	public function toString(): string {
		$out = [];
		foreach ($this->pairs as $k => $vals) {
			foreach ($vals as $v) {
				$out[] = rawurlencode($k) . '=' . rawurlencode($v);
			}
		}
		return implode('&', $out);
	}
}
}

if (!function_exists('sk_extract_params')) {
function sk_extract_params(string $request_uri, string $base, string $regex, array $map): array {
	$path = parse_url($request_uri, PHP_URL_PATH) ?? '';
	if ($base !== '' && str_starts_with($path, $base)) {
		$path = substr($path, strlen($base));
		if ($path === '') $path = '/';
	}
	if ($path !== '/' && str_ends_with($path, '/')) $path = rtrim($path, '/');
	if ($path === '') $path = '/';

	$m = [];
	if (!preg_match($regex, $path, $m)) return [];

	$params = [];
	foreach ($map as $idx => $name) {
		$i = (int)$idx;
		if (!isset($m[$i])) continue;
		if ($m[$i] === '') continue;
		$params[(string)$name] = rawurldecode($m[$i]);
	}
	return $params;
}
}

$__SK_RAW_BODY = null;
if (!function_exists('sk_request_body')) {
function sk_request_body(): string {
	global $__SK_RAW_BODY;
	if ($__SK_RAW_BODY === null) $__SK_RAW_BODY = file_get_contents('php://input') ?: '';
	return $__SK_RAW_BODY;
}
}

if (!function_exists('sk_json_body')) {
function sk_json_body() {
	$raw = sk_request_body();
	return json_decode($raw, true);
}
}

// Build param object similar to RequestEvent
if (!function_exists('sk_api_param')) {
function sk_api_param(): array {
	$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
	$headers = [];
	if (function_exists('getallheaders')) {
		$headers = getallheaders();
	} else {
		foreach ($_SERVER as $name => $value) {
			if (substr($name, 0, 5) == 'HTTP_') {
				$headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
			}
		}
	}

	$url = (object)[
		'searchParams' => new SK_URLSearchParams($_SERVER['QUERY_STRING'] ?? ''),
		'pathname' => parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH)
	];
	$locals = &sk_locals();

	return [
		'request' => (object)[
			'method' => $method,
			'headers' => $headers,
			'body' => sk_json_body(), // Default to parsed JSON for convenience
			'rawBody' => sk_request_body()
		],
		'url' => $url,
		'cookies' => new SK_Cookies($_COOKIE),
		'params' => sk_extract_params($_SERVER['REQUEST_URI'] ?? '', SK_BASE_PATH, SK_ROUTE_REGEX, SK_ROUTE_PARAM_MAP),
		'route' => (object)[
			'id' => '${prefix}'
		],
		'locals' => &$locals,
		'depends' => function(...$deps) {
			return null;
		},
		'fetch' => function($input, $init = []) {
			return sk_fetch($input, $init ?? []);
		}
	];
}
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$fn_name = '${prefix}_'.$method;

if (!function_exists($fn_name)) {
	// HEAD fallback to GET
	if ($method === 'HEAD' && function_exists('${prefix}_GET')) {
		$fn_name = '${prefix}_GET';
	} else {
		http_response_code(405);
		exit;
	}
}

$param = sk_api_param();

try {
	$res = $fn_name($param);
} catch (SK_Redirect $e) {
	header('Location: ' . $e->location, true, $e->status);
	exit;
} catch (SK_Error $e) {
	http_response_code($e->status);
	header('Content-Type: application/json; charset=utf-8');
	echo sk_json_encode(['type' => 'error', 'error' => $e->body, 'status' => $e->status]);
	exit;
} catch (Throwable $e) {
	http_response_code(500);
	// In dev, show error. In prod, maybe generic?
	// For now, simple text output
	echo "Internal Server Error: ".$e -> getMessage();
	exit;
}

// Normalize response
$status = $res['status'] ?? 200;
$headers = $res['headers'] ?? [];
$body = $res['body'] ?? null;

// Apply headers
http_response_code((int)$status);
foreach($headers as $k => $v) {
	if (is_array($v)) {
		foreach($v as $val) {
			header("$k: $val", false);
		}
	} else {
		header("$k: $v");
	}
}

if ($body !== null) {
	$content = '';
	if (is_array($body) || is_object($body)) {
		if (!isset($headers['Content-Type']) && !isset($headers['content-type'])) {
			header('Content-Type: application/json');
		}
		$content = sk_json_encode($body);
	} else {
		$content = (string)$body;
	}

	if (!isset($headers['Content-Length']) && !isset($headers['content-length'])) {
		header('Content-Length: '.strlen($content));
	}

	if ($method !== 'HEAD') {
		echo $content;
	}
}
`;
}
function getRouterPhp(base, mode, fallback) {
  let fallbackFile = "index.php";
  if (typeof fallback === "string" && fallback) {
    fallbackFile = fallback;
  } else if (fallback === true) {
    fallbackFile = "200.html";
  }
  const shared = getRouterSharedPhp(base);
  const routerBody = mode === "php-static" ? getRouterPhpStaticPhp(fallback, fallbackFile) : getRouterJsSsrPhp();
  return `${shared}${routerBody}
?>`;
}

// adapter/src/runtime/js-ssr-templates.ts
function getNodeHandlerMjs(base = "") {
  return `
import { Server } from './index.js';
import { manifest } from './manifest.js';
import http from 'node:http';

const server = new Server(manifest);
await server.init({ env: process.env });

const PORT = process.env.PORT || 3000;
const DEBUG = process.env.SK_DEBUG === 'true' || process.env.ADAPTER_DEBUG === 'true';
const debugLog = (...args) => {
    if (DEBUG) console.log(...args);
};

http.createServer(async (req, res) => {
	try {
		const protocol = req.headers['x-forwarded-proto'] || 'http';
		const host = req.headers['x-forwarded-host'] || req.headers.host;
		let url = new URL(req.url, \`\${protocol}://\${host}\`);

    // Health/Ready Checks
    const base = '${base}';
    const pathname = url.pathname;
    const ensureBase = (rawPathname, basePath) => {
        if (!basePath) return rawPathname;
        if (rawPathname === basePath || rawPathname.startsWith(basePath + '/')) return rawPathname;
        if (rawPathname === '/') return basePath + '/';
        return basePath + rawPathname;
    };
    const prefixBase = (location, basePath) => {
        if (!basePath || !location) return location;
        if (/^https?:\\/\\//i.test(location)) return location;
        if (!location.startsWith('/')) return location;
        if (location === basePath || location.startsWith(basePath + '/')) return location;
        if (location === '/') return basePath + '/';
        return basePath + location;
    };
    const healthPath = base + '/__health';
    const readyPath = base + '/__ready';

    if (pathname === '/__health' || pathname === '/__ready' ||
        (base && (pathname === healthPath || pathname === readyPath))) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            ok: true,
            mode: 'js-ssr',
            ts: Date.now()
        }));
        return;
    }

    const routedPathname = ensureBase(pathname, base);
    if (routedPathname !== pathname) {
        url.pathname = routedPathname;
    }

    debugLog('[Handler] Request: ' + req.method + ' ' + pathname + ' -> ' + url.pathname);

    // Polyfill: SvelteKit may not handle HEAD for __data.json, so we simulate it by doing GET and stripping body
    const isHead = req.method === 'HEAD';
    const isDataRequest = url.pathname.endsWith('__data.json');
    const method = (isHead && isDataRequest) ? 'GET' : req.method;

    if (isHead && isDataRequest) {
        debugLog('[Handler] Converting HEAD to GET for ' + url.pathname);
    }

    const request = new Request(url, {
        method: method,
        headers: req.headers,
        body: method === 'GET' || method === 'HEAD' ? undefined : req,
        duplex: 'half'
    });

    const response = await server.respond(request, {
        getClientAddress: () => {
            return req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
        },
        platform: { req, res }
    });

    res.statusCode = response.status;

    for (const [key, value] of response.headers) {
        // Handle Set-Cookie as array
        if (key === 'set-cookie') {
            const cookies = response.headers.getSetCookie();
            res.setHeader('set-cookie', cookies);
        } else if (key === 'location') {
            res.setHeader('location', prefixBase(value, base));
        } else {
            res.setHeader(key, value);
        }
    }

    if (response.body && (!isHead || !isDataRequest)) {
        const reader = response.body.getReader();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
        } finally {
            res.end();
        }
    } else {
        res.end();
    }

} catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.end('Internal Server Error');
}
}).listen(PORT, () => {
    console.log(\`Listening on port \${PORT}\`);
});
`;
}
function getPhpProxy(sidecarUrl, base = "") {
  return `<?php
require_once __DIR__ . '/_runtime/compat.php';
/**
 * SvelteKit Node Sidecar Proxy
 * - Forwards requests to the running Node/Bun sidecar
 * - Preserves Method, Headers, Cookies
 * - Streams Response
 * - Fallback: Uses fopen/stream_context if curl is missing
 */

// Configuration
$timeoutMs = getenv('PROXY_TIMEOUT_MS') ?: 10000;
$connectTimeoutMs = getenv('PROXY_CONNECT_TIMEOUT_MS') ?: 500;
$maxBodyBytes = getenv('MAX_BODY_BYTES') ?: 10485760; // 10MB default

// Disable output buffering for streaming
ini_set('output_buffering', '0');
ini_set('zlib.output_compression', '0');
ini_set('implicit_flush', '1');
ini_set('display_errors', '0'); // Suppress notices/warnings from breaking output
while (ob_get_level()) ob_end_clean();

// Configuration & Validation (Security: Prevent SSRF)
$sidecar = getenv('PHP_SIDECAR_URL');

if (!$sidecar) {
    $sidecarHost = getenv('SIDECAR_HOST') ?: '127.0.0.1';
    $sidecarPort = getenv('SIDECAR_PORT') ?: '3000';
    $allowNonLocal = getenv('ALLOW_NONLOCAL_SIDECAR') ?: '0';

    if ($allowNonLocal !== '1' && $sidecarHost !== '127.0.0.1' && $sidecarHost !== 'localhost') {
        file_put_contents('php://stderr', "[Proxy Config Error] SIDECAR_HOST must be local unless ALLOW_NONLOCAL_SIDECAR=1
", FILE_APPEND);
        http_response_code(500);
        echo "Configuration Error: Insecure SIDECAR_HOST";
        exit;
    }

    if (!is_numeric($sidecarPort)) {
        file_put_contents('php://stderr', "[Proxy Config Error] SIDECAR_PORT must be numeric
", FILE_APPEND);
        http_response_code(500);
        echo "Configuration Error: Invalid SIDECAR_PORT";
        exit;
    }
    $sidecar = "http://$sidecarHost:$sidecarPort";
}

$sidecar = rtrim($sidecar, '/');
$base = '${base}';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);
// Normalize path for matching (e.g. // -> /)
if ($path && $path !== '/') {
    $path = preg_replace('#/+#', '/', $path);
}

// 1. Prerendered Home Page Support
if (($path === '/' || $path === '/index.php')) {
    if (file_exists(__DIR__ . '/_home.php')) {
        require __DIR__ . '/_home.php';
        exit;
    }

    $htmlPath = __DIR__ . '/index.html';
    if (file_exists($htmlPath)) {
        header('Content-Type: text/html; charset=utf-8');
        readfile($htmlPath);
        exit;
    } else {
        // Debugging why index.html is not found
        proxy_log("Debug: index.html not found at $htmlPath");
    }
}

// 2. Prerendered Data Support
// If we have a local __data.php corresponding to the request, serve it directly.
// This handles /__data.json -> /__data.php (Root)
// And /about/__data.json -> /about/__data.php (Subdir)
if (substr($path, -12) === '/__data.json') {
    $phpDataRel = substr($path, 0, -12) . '/__data.php';
    // Prevent directory traversal attacks if someone requests /../../__data.json (though parse_url cleans some)
    // Realpath check is good.
    $phpData = __DIR__ . $phpDataRel;
    if (file_exists($phpData)) {
         $real = realpath($phpData);
         if ($real && strpos($real, realpath(__DIR__)) === 0) {
             $_SERVER['SCRIPT_FILENAME'] = $real;
             require $real;
             exit;
         }
    }
}

$reqId = uniqid('req_', true);

// Logging Helper
if (!function_exists('proxy_log')) {
    function proxy_log($msg) {
        global $reqId;
        $log = json_encode([
            'ts' => date('c'),
            'id' => $reqId,
            'msg' => $msg
        ]);
        file_put_contents('php://stderr', $log . "\\n", FILE_APPEND);
    }
}

if (!function_exists('proxy_debug_enabled')) {
    function proxy_debug_enabled() {
        $value = getenv('PROXY_DEBUG');
        if ($value === false) $value = getenv('SK_DEBUG');
        if ($value === false) $value = getenv('ADAPTER_DEBUG');
        if ($value === false) return false;
        return in_array(strtolower((string)$value), ['1', 'true', 'yes', 'on'], true);
    }
}

if (!function_exists('proxy_debug')) {
    function proxy_debug($msg) {
        if (proxy_debug_enabled()) proxy_log($msg);
    }
}

proxy_debug("Proxy Start: Method=$method, URI=$uri, Sidecar=$sidecar");

// Max Body Check
$len = $_SERVER['CONTENT_LENGTH'] ?? 'unknown';
proxy_debug("Body Check: Length=$len, Max=$maxBodyBytes");

if (isset($_SERVER['CONTENT_LENGTH']) && (int)$_SERVER['CONTENT_LENGTH'] > $maxBodyBytes) {
    proxy_log("Payload Too Large: " . $_SERVER['CONTENT_LENGTH']);
    http_response_code(413);
    header("Status: 413 Payload Too Large"); // Explicit header for some SAPI
    echo "Payload Too Large";
    exit;
}

// Note: We do NOT strip base path here because SvelteKit sidecar (built with base path) expects the full URL.
// The base path is only stripped when mapping to the filesystem in php-static mode.

$url = $sidecar . $uri;

if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

// Gather headers to forward
$headers = [];

// Explicitly ignore client-provided Forwarded headers to prevent spoofing
$headersToIgnore = [
    'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-host', 'x-forwarded-prefix',
    'x-request-id', 'connection', 'keep-alive', 'proxy-authenticate',
    'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade', 'host', 'content-length'
];

// Reuse existing ID if valid, else generate (User requirement: generate if missing)
// But we must overwrite any client-provided X-Request-Id header in the loop below to ensure we control it?
// Actually, standard practice is to trust X-Request-Id from client for tracing, but here we want to ensure it is consistent.
// The user prompt said: "X-Request-Id (generate if missing)".
// Let's check if we have one.
$clientReqId = $_SERVER['HTTP_X_REQUEST_ID'] ?? null;
if ($clientReqId && preg_match('/^[a-zA-Z0-9-_]{1,200}$/', $clientReqId)) {
    $reqId = $clientReqId;
}
$headers[] = "X-Request-Id: $reqId";

foreach (getallheaders() as $name => $value) {
    if (in_array(strtolower($name), $headersToIgnore)) continue;
    $headers[] = "$name: $value";
}

$headers[] = "X-Forwarded-For: " . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
$headers[] = "X-Forwarded-Proto: " . ((isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http');
$headers[] = "X-Forwarded-Host: " . ($_SERVER['HTTP_HOST'] ?? 'localhost');
if ($base) {
    $headers[] = "X-Forwarded-Prefix: " . $base;
}

// Use Curl if available (better for streaming/control)
if (function_exists('curl_init')) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, false); // We handle output manually
    curl_setopt($ch, CURLOPT_HEADER, false); // Headers handled by callback
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false); // Do not follow redirects
    curl_setopt($ch, CURLOPT_BUFFERSIZE, 16384); // Smaller buffer for streaming?
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); // Force IPv4 to avoid localhost ::1 issues on Windows

    // Timeouts
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, (int)$connectTimeoutMs);
    curl_setopt($ch, CURLOPT_TIMEOUT_MS, (int)$timeoutMs);

    if ($method !== 'GET' && $method !== 'HEAD') {
        $input = @fopen('php://input', 'r');
        curl_setopt($ch, CURLOPT_UPLOAD, true);
        curl_setopt($ch, CURLOPT_INFILE, $input);
    }

    if ($method === 'HEAD') {
        curl_setopt($ch, CURLOPT_NOBODY, true);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

        $response = curl_exec($ch);

        if ($response !== false) {
              // Parse headers from response
              $headers = explode("\\r\\n", $response);
              foreach ($headers as $header) {
                  $parts = explode(':', $header, 2);
                  if (count($parts) < 2) {
                      if (str_starts_with(strtoupper($header), 'HTTP/')) {
                          $status_parts = explode(' ', trim($header), 3);
                          if (count($status_parts) >= 2) {
                              http_response_code((int)$status_parts[1]);
                          }
                      }
                      continue;
                  }
                  $name = trim($parts[0]);
                  $value = trim($parts[1]);
                  $hopByHop = [
                     'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
                     'te', 'trailer', 'transfer-encoding', 'upgrade'
                  ];
                  if (in_array(strtolower($name), $hopByHop)) continue;
                  header("$name: $value", false);
              }
         } else {
             $error = curl_error($ch);
             proxy_log("Proxy HEAD Error: $error");
             http_response_code(502);
         }
        curl_close($ch);
        exit;
    }

    // Handle Response Headers
    curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($curl, $header) {
        $len = strlen($header);

        $parts = explode(':', $header, 2);

        // Status line
        if (count($parts) < 2) {
            if (str_starts_with(strtoupper($header), 'HTTP/')) {
                $status_parts = explode(' ', trim($header), 3);
                if (count($status_parts) >= 2) {
                    http_response_code((int)$status_parts[1]);
                }
            }
            return $len;
        }

        $name = trim($parts[0]);
        $value = trim($parts[1]);

        $hopByHop = [
            'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
            'te', 'trailer', 'transfer-encoding', 'upgrade'
        ];

        if (in_array(strtolower($name), $hopByHop)) return $len;

        // Important: false as second arg to append instead of replace (for Set-Cookie)
        header("$name: $value", false);
        return $len;
    });

    // Handle Response Body (Streaming)
    curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($curl, $data) {
        echo $data;
        flush();
        return strlen($data);
    });

    $result = curl_exec($ch);

    if ($result === false) {
        $error = curl_error($ch);
        $errno = curl_errno($ch);
        proxy_log("Proxy Error (origin=$sidecar, errno=$errno): $error");

        // If we haven't sent headers yet, we can send 502/504
        if (!headers_sent()) {
            // Ensure we Vary on Accept if we are returning error, as negotiation might have happened or client expects specific format
            header('Vary: Accept', false);

            if ($errno == 28) { // CURLE_OPERATION_TIMEDOUT
                 http_response_code(504);
                 echo "Gateway Timeout";
            } else {
                 http_response_code(502);
                 echo "Bad Gateway: Upstream failed";
            }
        }
    }

    curl_close($ch);
    exit;
}

// Fallback: stream_context_create
$opts = [
    'http' => [
        'method' => $method,
        'header' => $headers,
        'follow_location' => false,
        'ignore_errors' => true,
        'timeout' => $timeoutMs / 1000
    ]
];

if ($method !== 'GET' && $method !== 'HEAD') {
    $opts['http']['content'] = file_get_contents('php://input');
}

$context = stream_context_create($opts);
$fp = @fopen($url, 'rb', false, $context);

if ($fp) {
    // Headers
    $meta = stream_get_meta_data($fp);
    if (isset($meta['wrapper_data'])) {
        foreach ($meta['wrapper_data'] as $h) {
            if (str_starts_with(strtoupper($h), 'HTTP/')) {
                $parts = explode(' ', $h, 3);
                if (count($parts) >= 2) http_response_code((int)$parts[1]);
            } else {
                $parts = explode(':', $h, 2);
                if (count($parts) === 2) {
                    $name = trim($parts[0]);
                    $hopByHop = [
                        'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
                        'te', 'trailer', 'transfer-encoding', 'upgrade'
                    ];
                    if (in_array(strtolower($name), $hopByHop)) continue;
                    header($h, false);
                }
            }
        }
    }
    fpassthru($fp);
    fclose($fp);
} else {
    proxy_log("Proxy Fallback Error: Failed to connect to sidecar");
    http_response_code(502);
    echo "Bad Gateway: Failed to connect to sidecar";
}
?>`;
}
function getStandaloneApiPhp(serverFilePath, relativePathToRoot) {
  const negotiationLogic = relativePathToRoot ? `
// Content Negotiation: If HTML requested, proxy to Node (Page)
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
header('Vary: Accept');
if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    $proxy = __DIR__ . '/${relativePathToRoot}/index.php';
    if (file_exists($proxy)) {
        $_SERVER['SCRIPT_FILENAME'] = realpath($proxy);
        require $proxy;
        return;
    }
}
if (!function_exists('sk_prefers_html')) {
    function sk_prefers_html($accept) {
        if (trim($accept) === '' || trim($accept) === '*/*') return false;
        $types = explode(',', $accept);
        $htmlQ = 0.0; $jsonQ = 0.0;
        foreach ($types as $type) {
            $parts = explode(';', $type);
            $mime = trim($parts[0]);
            $q = 1.0;
            for ($i = 1; $i < count($parts); $i++) {
                 $p = trim($parts[$i]);
                 if (strncmp($p, 'q=', 2) === 0) $q = (float)substr($p, 2);
            }
            if ($mime === 'text/html' || $mime === 'application/xhtml+xml') $htmlQ = max($htmlQ, $q);
            elseif ($mime === 'application/json') $jsonQ = max($jsonQ, $q);
        }
        return $htmlQ > $jsonQ;
    }
}

if (sk_prefers_html($accept)) {
    // 1. Check for Prerendered HTML
    $html = __DIR__ . '/index.html';
    if (file_exists($html)) {
        header('Content-Type: text/html');
        readfile($html);
        return;
    }

    // 2. Proxy to Node (Dynamic SSR)
    $proxy = __DIR__ . '/${relativePathToRoot}/index.php';
    if (file_exists($proxy)) {
        $_SERVER['SCRIPT_FILENAME'] = realpath($proxy);
        require $proxy;
        return;
    }
}
` : "";
  return `<?php
/**
 * SvelteKit PHP Adapter - Standalone API Wrapper
 * Wraps ${serverFilePath}
 */
${negotiationLogic}
require_once __DIR__ . '/${serverFilePath}';

// Helper to access request body
if (!function_exists('sk_request_body')) {
function sk_request_body(): string {
    return file_get_contents('php://input') ?: '';
}
}

if (!function_exists('sk_json_body')) {
function sk_json_body() {
    $raw = sk_request_body();
    return json_decode($raw, true);
}
}

// Build param object similar to RequestEvent
if (!function_exists('sk_api_param')) {
function sk_api_param(): array {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            }
        }
    }

    $url = (object)[
        'searchParams' => (object)$_GET,
        'pathname' => parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH)
    ];

    return [
        'request' => (object)[
            'method' => $method,
            'headers' => $headers,
            'body' => sk_json_body(),
            'rawBody' => sk_request_body()
        ],
        'url' => $url,
        'cookies' => $_COOKIE,
        'params' => []
    ];
}
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$fn_name = $method; // e.g. GET, POST

if (!function_exists($fn_name)) {
    // HEAD fallback to GET
    if ($method === 'HEAD' && function_exists('GET')) {
        $fn_name = 'GET';
    } else {
        http_response_code(405);
        exit;
    }
}

$param = sk_api_param();

try {
    $res = $fn_name($param);
} catch (Throwable $e) {
    http_response_code(500);
    echo "Internal Server Error: " . $e->getMessage();
    exit;
}

// Normalize response
$status = $res['status'] ?? 200;
$headers = $res['headers'] ?? [];
$body = $res['body'] ?? null;

// Apply headers
http_response_code((int)$status);
foreach ($headers as $k => $v) {
    header("$k: $v");
}

if ($body !== null) {
    $content = '';
    if (is_array($body) || is_object($body)) {
        if (!isset($headers['Content-Type']) && !isset($headers['content-type'])) {
            header('Content-Type: application/json');
        }
        $content = json_encode($body);
    } else {
        $content = (string)$body;
    }

    if (!isset($headers['Content-Length']) && !isset($headers['content-length'])) {
        header('Content-Length: ' . strlen($content));
    }

    if ($method !== 'HEAD') {
        echo $content;
    }
}
?>`;
}

// adapter/src/runtime/htaccess/trailing-slash.ts
function htaccessTrailingSlashBlock(options) {
  const { basePath, trailingSlash } = options;
  if (trailingSlash === "ignore") {
    return "# trailingSlash: ignore";
  }
  if (trailingSlash === "always") {
    return `
	# trailingSlash: always
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]
	RewriteCond %{REQUEST_URI} !/__action$ [NC]
	RewriteCond %{REQUEST_URI} !/_app/ [NC]
	RewriteCond %{REQUEST_URI} !/$
	RewriteRule ^(.*[^/])$ ${basePath}$1/ [L,R=308]
`.trim();
  }
  if (trailingSlash === "never") {
    return `
	# trailingSlash: never
	# We don't check !-d because Apache DirectorySlash On handles directories,
	# but SvelteKit wants 'never'.
	# Use THE_REQUEST to avoid loops with DirectorySlash On.
	# It ensures we only redirect if the client actually requested the slash.
	RewriteCond %{THE_REQUEST} \\s([^?]*)/+(\\s|\\?)
	RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]
	RewriteCond %{REQUEST_URI} !/__action$ [NC]
	RewriteCond %{REQUEST_URI} !/_app/ [NC]
	RewriteRule ^(.*)/$ ${basePath}$1 [L,R=308]
`.trim();
  }
  return "";
}

// adapter/src/runtime/htaccess/php-static.ts
var trimSlashes = (s) => s.replace(/^\/+|\/+$/g, "");
var escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function joinRoot(rootPrefix, target) {
  const t = trimSlashes(target);
  return `${rootPrefix}${t}`;
}
function normalizeFallback(rootPrefix, fallback) {
  if (fallback === false)
    return null;
  if (typeof fallback === "string" && fallback.trim())
    return joinRoot(rootPrefix, fallback);
  return joinRoot(rootPrefix, "index.php");
}
function getHtaccessPhpStatic(base, precompress = false, fallback, trailingSlash = "ignore") {
  const baseTrimmed = trimSlashes(base);
  const baseRe = baseTrimmed ? escapeRe(baseTrimmed) : "";
  const basePrefix = baseTrimmed ? `${baseTrimmed}/` : "";
  const baseOptional = baseTrimmed ? `(?:${baseRe}/)?` : "";
  const rootPrefix = baseTrimmed ? `/${basePrefix}` : `/`;
  const fallbackTarget = normalizeFallback(rootPrefix, fallback);
  const redirectRules = htaccessTrailingSlashBlock({ basePath: rootPrefix, trailingSlash });
  const guardRules = `
	# deny dotfiles anywhere
	RewriteRule (^|/)\\. - [F,L]
`;
  const precompressRules = precompress ? `
	# precompressed assets (br > gz) — EXCLUDES __data.json + __action
	RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]
	RewriteCond %{REQUEST_URI} !/__action$ [NC]
	RewriteCond %{HTTP:Accept-Encoding} br [NC]
	RewriteCond %{REQUEST_FILENAME}\\.br -f
	RewriteRule ^(.+\\.(?:css|js|mjs|json|map|svg|txt|wasm|woff2?))$ $1.br [QSA,L]

	RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]
	RewriteCond %{REQUEST_URI} !/__action$ [NC]
	RewriteCond %{HTTP:Accept-Encoding} gzip [NC]
	RewriteCond %{REQUEST_FILENAME}\\.gz -f
	RewriteRule ^(.+\\.(?:css|js|mjs|json|map|svg|txt|wasm|woff2?))$ $1.gz [QSA,L]
` : "";
  const headerRules = `
<IfModule mod_headers.c>
	Header always set X-Content-Type-Options "nosniff"

	<IfModule mod_setenvif.c>
		SetEnvIf Request_URI "^${rootPrefix}_app/" SK_ASSET=1
		SetEnvIf Request_URI "__data\\.json$" SK_DATA=1
		SetEnvIf Request_URI "__action$"    SK_ACTION=1
	</IfModule>

	Header set Cache-Control "public, max-age=31536000, immutable" env=SK_ASSET
	Header set Cache-Control "no-store" env=SK_DATA
	Header set Cache-Control "no-store" env=SK_ACTION

	${precompress ? `Header append Vary "Accept-Encoding"
` : ""}
</IfModule>
${precompress ? `<IfModule mod_mime.c>
	AddEncoding br .br
	AddEncoding gzip .gz

	# map content-types for double-extensions
	AddType text/css              .css.br  .css.gz
	AddType application/javascript .js.br   .js.gz
	AddType application/javascript .mjs.br  .mjs.gz
	AddType application/json      .json.br .json.gz
	AddType application/json      .map.br  .map.gz
	AddType image/svg+xml         .svg.br  .svg.gz
	AddType application/wasm      .wasm.br .wasm.gz
	AddType font/woff2            .woff2.br .woff2.gz
</IfModule>
` : ""}`.trim();
  const commonRules = `
	RewriteEngine On
	Options -MultiViews

${redirectRules}

	# Prefer PHP when a directory contains both index.php and index.html
	DirectoryIndex index.php index.html

${guardRules}
	# deny adapter private area (convention)
	RewriteRule ^${baseOptional}_protected/ - [F,L]

	# stop rewrite loops / direct hits
	RewriteRule ^${baseOptional}(?:index\\.php|router\\.php)$ - [L]
	RewriteRule ^${baseOptional}__data\\.php$ - [L]
	RewriteRule ^${baseOptional}__action\\.php$ - [L]

	# ALWAYS resolve SvelteKit data/action first
	RewriteRule ^${baseOptional}(.*/)?__data\\.json$ ${rootPrefix}$1__data.php [QSA,L]
	RewriteRule ^${baseOptional}(.*/)?__action$    ${rootPrefix}$1__action.php [QSA,L]

${precompressRules}
	# normalize nested /_app asset hits to rootPrefix/_app
	RewriteCond %{REQUEST_URI} !^${rootPrefix}_app/ [NC]
	RewriteRule ^${baseOptional}.+/_app/(.*)$ ${rootPrefix}_app/$1 [L]
	RewriteCond %{REQUEST_URI} !^${rootPrefix}_app/ [NC]
	RewriteRule ^.+/_app/(.*)$ ${rootPrefix}_app/$1 [L]

	# let real _app assets through (after normalization)
	RewriteRule ^${baseOptional}_app/ - [L]

	# let existing files through
	RewriteCond %{REQUEST_FILENAME} -f
	RewriteRule ^ - [L]
${trailingSlash !== "never" ? `
	# let existing directories through (if not 'never')
	RewriteCond %{REQUEST_FILENAME} -d
	RewriteRule ^ - [L]
` : ""}
`;
  const dirAndFallbackRules = fallbackTarget ? `
	# directory index resolution (php > html)
	RewriteCond %{REQUEST_FILENAME} -d
	RewriteCond %{REQUEST_FILENAME}/index.php -f
	RewriteRule ^${baseOptional}(.+?)/?$ ${rootPrefix}$1/index.php [QSA,L]

	# base root -> index.php (covers /dev/sveltekit/)
	RewriteCond %{REQUEST_FILENAME} -d
	RewriteCond %{REQUEST_FILENAME}/index.php -f
	RewriteRule ^${baseOptional}$ ${rootPrefix}index.php [QSA,L]

	RewriteCond %{REQUEST_FILENAME} -d
	RewriteCond %{REQUEST_FILENAME}/index.html -f
	RewriteRule ^${baseOptional}(.+?)/?$ ${rootPrefix}$1/index.html [QSA,L]

	# extension-less to .php (route/page endpoints emitted by adapter)
	RewriteCond %{REQUEST_FILENAME}.php -f
	RewriteRule ^${baseOptional}(.+?)/?$ ${rootPrefix}$1.php [QSA,L]

	# final fallback (router or index)
	RewriteRule ^${baseOptional}.*$ ${fallbackTarget} [QSA,L]
` : `
	# no fallback (explicit)
`;
  return `
<IfModule mod_rewrite.c>
${commonRules}
${dirAndFallbackRules}
</IfModule>
${headerRules}
`.trimStart();
}

// adapter/src/runtime/htaccess-templates.ts
function getHtaccess(mode, base, precompress = false, fallback, trailingSlash = "ignore") {
  return getHtaccessPhpStatic(base, precompress, fallback, trailingSlash);
}

// adapter/src/index.ts
function sveltekitPhpAdapter(options = {}) {
  const {
    ssr = true,
    out = "./build",
    assets = "./build",
    precompress = false,
    fallback = false,
    strict = true,
    baseMode = "fixed"
  } = options;
  const mode = options.mode ?? "php-static";
  const debugEnabled = process.env.ADAPTER_DEBUG === "true" || process.env.SK_DEBUG === "true";
  return {
    name: "@ryanspice/sveltekit-adapter-php",
    async adapt(builder) {
      const debug = (...args) => {
        if (debugEnabled)
          console.log(...args);
      };
      const debugMinor = (message) => {
        if (debugEnabled)
          builder.log.minor(message);
      };
      if (debugEnabled) {
        await writeFile("adapter_debug.log", JSON.stringify(options, null, 2));
      }
      const outDir = path3.resolve(out);
      const assetsDir = path3.resolve(assets);
      const tmpDir = builder.getBuildDirectory("sveltekit-php");
      const basePath = baseMode === "fixed" ? options.basePath ?? builder.config.kit.paths.base ?? "" : "";
      const trailingSlash = builder.config.kit.trailingSlash || "never";
      debug(`DEBUG: trailingSlash from config: ${trailingSlash}`);
      const buildTimeBase = options.basePath ?? builder.config.kit.paths.base ?? "";
      const compatCandidates = [
        fileURLToPath(new URL("./runtime/php-compat.php", import.meta.url)),
        fileURLToPath(new URL("./src/runtime/php-compat.php", import.meta.url))
      ];
      const compatSource = await exists(compatCandidates[0]) ? compatCandidates[0] : compatCandidates[1];
      const compatPhp = await readFile2(compatSource, "utf8");
      const assertPhp74Safe = (php, label) => {
        const banned = [
          [/\b__construct\s*\(\s*(public|protected|private)\s+/i, "constructor property promotion"],
          [/\(\s*mixed\s+\$/i, "mixed type param"],
          [/:\\s*mixed\\b/i, "mixed return type"],
          [/\bmatch\s*\(/i, "match expression"],
          [/\?->/i, "nullsafe operator"],
          [/\breadonly\b/i, "readonly"],
          [/#\[/, "attributes"]
        ];
        for (const [re, name] of banned) {
          if (re.test(php)) {
            throw new Error(`Generated PHP is not PHP 7.4-safe (${name}) in ${label}`);
          }
        }
      };
      const isDevProxyServerFile = async (abs) => {
        const code = await readFile2(abs, "utf8");
        return code.includes("getPhpData") && code.includes("php-dev");
      };
      const isFile = async (abs) => {
        try {
          return (await stat(abs)).isFile();
        } catch {
          return false;
        }
      };
      builder.log.minor(`Adapting for mode: ${mode}`);
      builder.log.minor("Cleaning output/temp");
      const robustRimraf = async (dir) => {
        try {
          const fs = await import("node:fs");
          if (fs.existsSync(dir)) {
            try {
              fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
            } catch (e) {
              await new Promise((r) => setTimeout(r, 200));
              fs.rmSync(dir, { recursive: true, force: true });
            }
          }
        } catch (e) {
          builder.log.warn(`Failed to clean ${dir}: ${e}`);
        }
      };
      await robustRimraf(outDir);
      await robustRimraf(assetsDir);
      await robustRimraf(tmpDir);
      builder.mkdirp(outDir);
      builder.mkdirp(assetsDir);
      builder.mkdirp(tmpDir);
      builder.log.minor("Writing client assets");
      builder.writeClient(assetsDir);
      if (mode === "js-ssr" && assetsDir !== outDir) {
        builder.log.minor("Copying client assets to outDir for js-ssr");
        builder.writeClient(outDir);
      }
      builder.log.minor("Prerendering pages");
      const prerenderedRoot = path3.join(tmpDir, "prerendered");
      builder.mkdirp(prerenderedRoot);
      builder.writePrerendered(prerenderedRoot);
      if (fallback) {
        const fallbackFile = typeof fallback === "string" ? fallback : "200.html";
        builder.log.minor(`Generating fallback page: ${fallbackFile}`);
        const fallbackSrc = path3.join(prerenderedRoot, fallbackFile);
        await builder.generateFallback(fallbackSrc);
        const fallbackDest = path3.join(outDir, fallbackFile);
        await builder.copy(fallbackSrc, fallbackDest);
      }
      const normalizeServerRel = (rel) => {
        if (rel.endsWith("/+page.server@.php"))
          return rel.replace("/+page.server@.php", "/+page@.server.php");
        if (rel.endsWith("/+layout.server@.php"))
          return rel.replace("/+layout.server@.php", "/+layout@.server.php");
        return rel;
      };
      const routesBaseFs = path3.resolve(builder.config.kit.files.routes);
      const routesBasePosix = posixify(routesBaseFs);
      const phpServerFilesAll = await import_tiny_glob.default("**/+*.server.php", {
        cwd: routesBaseFs,
        absolute: true
      });
      const phpEndpointFilesAll = await import_tiny_glob.default("**/+server.php", {
        cwd: routesBaseFs,
        absolute: true
      });
      const allPhpRel = new Set([...phpServerFilesAll, ...phpEndpointFilesAll].map(posixify).map((abs) => {
        const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
        return rel.startsWith("/") ? rel : "/" + rel;
      }));
      const allServerRelPosix = new Set([...phpServerFilesAll, ...phpEndpointFilesAll].map(posixify).map((abs) => {
        const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
        return normalizeServerRel(rel.startsWith("/") ? rel : "/" + rel);
      }));
      const protectedMap = new Map;
      const fnPrefixMap = new Map;
      for (const rel of allServerRelPosix) {
        const prefix = fnPrefixForServerFile(rel);
        fnPrefixMap.set(rel, prefix);
        const protectedRel = "/_protected/" + rel.replace(/^\//, "").replace(/\//g, "__").replace(/\+layout\.server\.php$/i, "_layout.php").replace(/\+page\.server\.php$/i, "_page.php").replace(/\+server\.php$/i, "_server.php").replace(/\.server\.php$/i, ".php");
        protectedMap.set(rel, protectedRel);
      }
      const usedServerFiles = new Set;
      debugMinor(`DEBUG: Searching for JS/TS files in: ${routesBaseFs}`);
      const tsServerFiles = await import_tiny_glob.default("**/+*.server.{js,ts}", {
        cwd: routesBaseFs,
        absolute: true
      });
      const tsEndpointFiles = await import_tiny_glob.default("**/+server.{js,ts}", {
        cwd: routesBaseFs,
        absolute: true
      });
      const allServerTsJsFs = [...tsServerFiles, ...tsEndpointFiles];
      debugMinor(`DEBUG: Found ${tsServerFiles.length} +*.server.{js,ts} files`);
      debugMinor(`DEBUG: Found ${tsEndpointFiles.length} +server.{js,ts} files`);
      debugMinor(`DEBUG: Total allServerTsJsFs files: ${allServerTsJsFs.length}`);
      allServerTsJsFs.forEach((file) => {
        debugMinor(`DEBUG: Discovered JS/TS file: ${file}`);
      });
      const allServerTsJsRel = new Set(allServerTsJsFs.map(posixify).map((abs) => {
        const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
        return normalizeServerRel(rel.startsWith("/") ? rel : "/" + rel);
      }));
      for (const rel of allServerTsJsRel) {
        const prefix = fnPrefixForServerFile(rel);
        fnPrefixMap.set(rel, prefix);
        const protectedRel = "/_protected/" + rel.replace(/^\//, "").replace(/\//g, "__").replace(/\+layout\.server\.(js|ts)$/i, "_layout.php").replace(/\+page\.server\.(js|ts)$/i, "_page.php").replace(/\+server\.(js|ts)$/i, "_server.php");
        protectedMap.set(rel, protectedRel);
      }
      const validTsFiles = new Set;
      for (const abs of allServerTsJsFs) {
        if (await isDevProxyServerFile(abs))
          continue;
        const rel = posixify(abs);
        const sliced = rel.startsWith(routesBasePosix) ? rel.slice(routesBasePosix.length) : rel;
        const normalized = normalizeServerRel(sliced.startsWith("/") ? sliced : "/" + sliced);
        validTsFiles.add(normalized);
      }
      const serverKey = (rel) => {
        const normalized = normalizeServerRel(rel);
        const lastSlash = normalized.lastIndexOf("/");
        const dir = lastSlash === -1 ? "" : normalized.slice(0, lastSlash);
        const file = lastSlash === -1 ? normalized : normalized.slice(lastSlash + 1);
        let kind = "server";
        if (file.startsWith("+page"))
          kind = "page";
        if (file.startsWith("+layout"))
          kind = "layout";
        return `${dir}:${kind}`;
      };
      const conflicts = [];
      const phpMap = new Map;
      for (const rel of allPhpRel) {
        const key = serverKey(rel);
        if (!phpMap.has(key))
          phpMap.set(key, []);
        phpMap.get(key).push(rel);
      }
      const tsMap = new Map;
      for (const rel of validTsFiles) {
        const key = serverKey(rel);
        if (!tsMap.has(key))
          tsMap.set(key, []);
        tsMap.get(key).push(rel);
      }
      const effectivePhpFiles = new Set;
      const effectiveTsFiles = new Set;
      const allKeys = new Set([...phpMap.keys(), ...tsMap.keys()]);
      for (const key of allKeys) {
        const phps = phpMap.get(key) || [];
        const tss = tsMap.get(key) || [];
        if (phps.length > 1) {
          conflicts.push(`Multiple PHP modules for ${key}: ${phps.join(", ")}`);
        }
        if (tss.length > 1) {
          conflicts.push(`Multiple TS/JS modules for ${key}: ${tss.join(", ")}`);
        }
        if (phps.length > 0 && tss.length > 0) {
          if (mode === "php-static") {
            effectivePhpFiles.add(phps[0]);
            builder.log.minor(`Mode ${mode}: Precedence -> Using PHP (${phps[0]}) for ${key}, ignoring TS/JS (${tss[0]})`);
          } else if (mode === "js-ssr") {
            effectiveTsFiles.add(tss[0]);
            builder.log.minor(`Mode ${mode}: Precedence -> Using TS/JS (${tss[0]}) for ${key}, ignoring PHP (${phps[0]})`);
          } else {
            conflicts.push(`${phps[0]} <-> ${tss[0]}`);
          }
        } else if (phps.length > 0) {
          effectivePhpFiles.add(phps[0]);
        } else if (tss.length > 0) {
          effectiveTsFiles.add(tss[0]);
        }
      }
      if (conflicts.length) {
        const prefix = path3.relative(".", builder.config.kit.files.routes);
        const errorLines = [
          "Conflicting PHP and TS/JS server modules detected:",
          ...conflicts.map((c) => "- " + path3.posix.join(prefix, c))
        ];
        if (strict) {
          builder.log.error(errorLines.join(`
`));
          throw new Error("Conflicting server modules detected");
        } else {
          builder.log.warn(errorLines.join(`
`));
          builder.log.warn("Continuing because strict mode is disabled.");
        }
      }
      function getRouteDeps(routeIdPosix) {
        const chain = buildLayoutChainCandidates(routeIdPosix);
        const activeSegments = [];
        let stop = false;
        for (const seg of chain) {
          activeSegments.push(seg);
          const base = seg ? "/" + seg : "";
          const rid = stripLeadingSlash(seg);
          const isPage = seg === chain[0];
          if (isPage) {
            const pageResetA = "/" + (rid ? rid + "/" : "") + "+page@.server.php";
            const pageResetB = "/" + (rid ? rid + "/" : "") + "+page.server@.php";
            if (allServerRelPosix.has(pageResetA) || allServerRelPosix.has(pageResetB)) {
              stop = true;
            }
          } else {
            const layoutResetA = base + "/+layout@.server.php";
            const layoutResetB = base + "/+layout.server@.php";
            if (allServerRelPosix.has(layoutResetA) || allServerRelPosix.has(layoutResetB)) {
              stop = true;
            }
          }
          if (stop)
            break;
        }
        const hierarchy = activeSegments.reverse();
        const files = [];
        const loadMapItems = [];
        hierarchy.forEach((seg, i) => {
          const base = seg ? "/" + seg : "";
          const rid = stripLeadingSlash(seg);
          const isLast = i === hierarchy.length - 1;
          const layoutCandidates = [
            base + "/+layout.server.php",
            base + "/+layout@.server.php",
            base + "/+layout.server@.php"
          ];
          const layoutFound = layoutCandidates.find((c) => allServerRelPosix.has(c));
          if (layoutFound) {
            files.push(layoutFound);
            const prefix = fnPrefixMap.get(layoutFound);
            if (prefix) {
              loadMapItems.push({ index: i, fn: prefix + "_load" });
            }
          }
          if (isLast) {
            const pageCandidates = [
              "/" + (rid ? rid + "/" : "") + "+page.server.php",
              "/" + (rid ? rid + "/" : "") + "+page@.server.php",
              "/" + (rid ? rid + "/" : "") + "+page.server@.php"
            ];
            const pageFound = pageCandidates.find((c) => allServerRelPosix.has(c));
            if (pageFound) {
              files.push(pageFound);
              const prefix = fnPrefixMap.get(pageFound);
              if (prefix) {
                loadMapItems.push({ index: "PAGE", fn: prefix + "_load" });
              }
            }
          }
        });
        return { files, loadMapItems };
      }
      for (const [navPathRaw, filePath] of builder.prerendered.pages) {
        const navPath = navPathRaw;
        builder.log.minor("Preparing PHP route: " + navPath);
        debug(`DEBUG: Processing prerendered route: ${navPath}`);
        let routePath = navPath;
        if (buildTimeBase && routePath.startsWith(buildTimeBase)) {
          routePath = routePath.slice(buildTimeBase.length);
          if (!routePath.startsWith("/"))
            routePath = "/" + routePath;
        }
        const route = findRouteForNavPath(builder, routePath);
        const routeId = route?.id ?? routePath;
        if (navPath.includes("matrix")) {
          debug(`DEBUG: Route for ${navPath}:`, JSON.stringify(route, null, 2));
          debug(`DEBUG: Route config for ${navPath}:`, JSON.stringify(route?.config, null, 2));
        }
        const { phpRegex: routeRegex, phpMap: routeParamMapPhp } = compilePhpRouteMatcher(routeId);
        const { files: deps, loadMapItems } = getRouteDeps(routeId);
        for (const d of deps)
          usedServerFiles.add(d);
        const htmlFs = path3.join(prerenderedRoot, filePath.file);
        let htmlDir = path3.dirname(htmlFs);
        const htmlBasename = path3.basename(htmlFs);
        if (!/\.(html|php)$/i.test(htmlBasename)) {
          debug(`DEBUG: Skipping non-page prerendered output: ${filePath.file}`);
          continue;
        }
        const isIndex = htmlBasename === "index.html" || htmlBasename === "index.php";
        let fallbackFile = "200.html";
        if (typeof fallback === "string" && fallback)
          fallbackFile = fallback;
        const isFallback = htmlBasename === fallbackFile;
        if (isFallback) {
          const fallbackDest = path3.join(outDir, htmlBasename);
          await builder.copy(htmlFs, fallbackDest);
          continue;
        }
        let targetDir = htmlDir;
        let targetHtmlFs = htmlFs;
        let requirePrefix = "";
        if (!isIndex && !isFallback) {
          const name = htmlBasename.replace(/\.(html|php)$/i, "");
          targetDir = path3.join(htmlDir, name);
          targetHtmlFs = path3.join(targetDir, "index.html");
          requirePrefix = "";
        }
        builder.mkdirp(targetDir);
        if (!await exists(htmlFs)) {
          builder.log.warn("HTML file not found: " + htmlFs + ". Skipping route.");
          continue;
        }
        if (mode === "js-ssr") {
          if (htmlFs !== targetHtmlFs) {
            await builder.copy(htmlFs, targetHtmlFs);
          }
          continue;
        }
        const candidates = [
          path3.join(htmlDir, "__data.json"),
          path3.join(prerenderedRoot, stripLeadingSlash(navPath), "__data.json")
        ];
        if (!htmlFs.endsWith("index.html") && htmlFs.endsWith(".html")) {
          const baseName = path3.basename(htmlFs, ".html");
          candidates.push(path3.join(htmlDir, baseName, "__data.json"));
        }
        let html = await readFile2(htmlFs, "utf8");
        const inlineMode = detectInlineDataModeFromHtml(html);
        const injectBaseHref = (html2, basePath2) => {
          if (baseMode === "auto") {
            html2 = html2.replace(/<base\s[^>]*>/i, "");
          }
          if (/<base\s/i.test(html2))
            return html2;
          if (baseMode === "auto") {
            const phpHref = "<?php echo htmlspecialchars(sk_base_href(), ENT_QUOTES); ?>";
            return html2.replace(/<head(\s[^>]*)?>/i, (m) => `${m}
  <base href="${phpHref}">`);
          } else {
            if (!basePath2)
              return html2;
            const href = basePath2.replace(/\/$/, "") + "/";
            return html2.replace(/<head(\s[^>]*)?>/i, (m) => `${m}
  <base href="${href}">`);
          }
        };
        const rewriteAssetUrls = (html2) => {
          if (baseMode === "auto") {
            const phpBaseHref = "<?php echo htmlspecialchars(sk_base_href(), ENT_QUOTES); ?>";
            if (buildTimeBase && buildTimeBase !== "/") {
              const basePattern = buildTimeBase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              const regex = new RegExp(`\\s(src|href)=(["'])${basePattern}/_app/`, "g");
              html2 = html2.replace(regex, (match, attr, quote) => {
                return ` ${attr}=${quote}${phpBaseHref}_app/`;
              });
            }
            html2 = html2.replace(/\s(src|href)="(\/|\.\/)?_app\//g, (match, attr) => {
              return ` ${attr}="${phpBaseHref}_app/`;
            });
            html2 = html2.replace(/\s(src|href)='(\/|\.\/)?_app\//g, (match, attr) => {
              return ` ${attr}='${phpBaseHref}_app/`;
            });
          }
          return html2;
        };
        const patchBootConfig = (html2) => {
          if (baseMode !== "auto")
            return html2;
          return html2.replace(/<script[^>]*>([\s\S]*?)<\/script>/g, (match, content) => {
            if (!content.includes("__sveltekit_"))
              return match;
            let newContent = content;
            newContent = newContent.replace(/(["']?)base\1:\s*(["']).*?\2/g, (m, q1) => {
              return `${q1}base${q1}: <?php echo json_encode(sk_base_path()); ?>`;
            });
            newContent = newContent.replace(/(["']?)assets\1:\s*(["']).*?\2/g, (m, q1) => {
              return `${q1}assets${q1}: <?php echo json_encode(sk_base_path()); ?>`;
            });
            return match.replace(content, newContent);
          });
        };
        html = injectBaseHref(html, basePath);
        html = rewriteAssetUrls(html);
        html = patchBootConfig(html);
        let templateJsonFs = null;
        let templateJson = '{"type":"data","nodes":[]}';
        let nodeCount = 0;
        for (const c of candidates) {
          if (await exists(c)) {
            templateJsonFs = c;
            break;
          }
        }
        if (templateJsonFs) {
          try {
            templateJson = await readFile2(templateJsonFs, "utf8");
          } catch (e) {
            builder.log.warn(`Failed to read ${templateJsonFs} despite existence check: ${e}. Using synthesized template.`);
            templateJsonFs = null;
          }
        }
        if (templateJsonFs) {
          try {
            const parsed = JSON.parse(templateJson);
            if (Array.isArray(parsed.nodes)) {
              nodeCount = parsed.nodes.length;
            }
          } catch (e) {
            if (templateJson.includes(`
`)) {
              const firstLine = templateJson.split(`
`)[0];
              try {
                const parsed = JSON.parse(firstLine);
                if (Array.isArray(parsed.nodes)) {
                  nodeCount = parsed.nodes.length;
                  templateJson = firstLine;
                  builder.log.minor(`Detected streaming JSON for ${templateJsonFs}, using first line as template.`);
                }
              } catch (e2) {
                builder.log.warn(`Failed to parse first line of ${templateJsonFs}: ${e2}`);
              }
            } else {
              builder.log.warn(`Failed to parse ${templateJsonFs}: ${e}`);
            }
          }
        } else {
          const nodeIdsMatch = html.match(/node_ids\s*:\s*\[([\d,\s]+)\]/);
          if (nodeIdsMatch) {
            const ids = nodeIdsMatch[1].split(",").filter((s) => s.trim() !== "");
            nodeCount = ids.length;
          } else {
            nodeCount = 2;
          }
          const nodes = new Array(nodeCount).fill(null);
          const synthTemplate = { type: "data", nodes };
          templateJson = JSON.stringify(synthTemplate);
          const synthPath = path3.join(htmlDir, "__data.template.json");
          await writeFile(synthPath, templateJson);
        }
        if (nodeCount === 0) {
          const nodeIdsMatch = html.match(/node_ids:\s*\[([\d,\s]+)\]/);
          if (nodeIdsMatch) {
            const ids = nodeIdsMatch[1].split(",").filter((s) => s.trim() !== "");
            nodeCount = ids.length;
          }
        }
        if (nodeCount === 0) {
          nodeCount = 2;
        }
        let fsPath = navPath;
        targetDir = path3.join(prerenderedRoot, stripLeadingSlash(fsPath));
        builder.mkdirp(targetDir);
        const relToRoot = phpRelToRootFromNav(fsPath);
        const includes = deps.map((d) => {
          const protectedRel = protectedMap.get(d);
          return protectedRel ? "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, "") + "';" : "";
        }).filter(Boolean);
        const loadMapStrings = loadMapItems.map((item) => {
          let idx = item.index;
          if (idx === "PAGE") {
            idx = nodeCount - 1;
          }
          return `'${idx}' => '${item.fn}'`;
        });
        const loadFnsPhp = "[" + loadMapStrings.join(", ") + "]";
        const pageDep = deps.find((d) => d.includes("+page.server"));
        const pagePrefix = pageDep ? fnPrefixMap.get(pageDep) : null;
        const appHashMatch = html.match(/__sveltekit_(\w+)/);
        const appHash = appHashMatch ? `__sveltekit_${appHashMatch[1]}` : "__sveltekit_unknown";
        const compatRel = relToRoot + "_runtime/compat.php";
        const dataPhp = getDataPhp(includes, basePath, compatRel, relToRoot).replace("PLACEHOLDER_ROUTE_ID", JSON.stringify(navPath)).replace("PLACEHOLDER_TEMPLATE_B64", Buffer.from(templateJson, "utf8").toString("base64")).replace("PLACEHOLDER_ROUTE_REGEX", routeRegex).replace("PLACEHOLDER_ROUTE_PARAM_MAP", routeParamMapPhp).replace("PLACEHOLDER_LOAD_FNS", loadFnsPhp).replace("PLACEHOLDER_INLINE_MODE", JSON.stringify(inlineMode)).replaceAll("PLACEHOLDER_APP_ID", appHash);
        const actionPhp = getActionPhp(includes, navPath, pagePrefix ?? null, compatRel);
        const dataDir = targetDir;
        requirePrefix = "";
        assertPhp74Safe(dataPhp, `__data.php (${navPath})`);
        assertPhp74Safe(actionPhp, `__action.php (${navPath})`);
        await writeFile(path3.join(dataDir, "__data.php"), dataPhp, "utf8");
        await writeFile(path3.join(dataDir, "__action.php"), actionPhp, "utf8");
        if (ssr) {
          debug(`DEBUG: SSR is enabled for ${navPath}. Converting HTML to PHP.`);
          const replaced = replaceInlineConstData(html);
          if (replaced) {
            const inlineMode2 = detectInlineDataModeFromHtml(html);
            html = replaced;
            html = html.replace(/<script>__sveltekit_[A-Za-z0-9_]+\.resolve\([\s\S]*?<\/script>\s*/g, "");
            const bootstrap = getBootstrapPhp(navPath, loadFnsPhp, templateJson, inlineMode2, requirePrefix).replace("PLACEHOLDER_APP_ID", appHash);
            const footer = getFooterPhp(appHash);
            html = bootstrap + html.replace(/<\/body>/i, `${footer}
</body>`);
          } else {
            const bootstrap = getMinimalBootstrapPhp(requirePrefix);
            html = bootstrap + html;
          }
          if (templateJsonFs && await exists(templateJsonFs)) {
            try {
              await rename(templateJsonFs, path3.join(path3.dirname(templateJsonFs), "__data.template.json"));
            } catch (e) {
              if (e.code !== "ENOENT") {
                throw e;
              }
              builder.log.warn(`Could not rename ${templateJsonFs} (ENOENT). Ignoring.`);
            }
          }
          const targetPhp = path3.join(targetDir, "index.php");
          debug(`DEBUG: Writing converted PHP to ${targetPhp}`);
          await writeFile(targetPhp, html, "utf8");
          if (await exists(htmlFs)) {
            debug(`DEBUG: Removing original HTML ${htmlFs}`);
            await builder.rimraf(htmlFs);
          }
        } else {
          const targetPhp = path3.join(targetDir, "index.php");
          if (htmlFs !== targetPhp) {
            await rename(htmlFs, targetPhp);
          }
        }
      }
      debugMinor(`DEBUG: About to check mode. Current mode: ${mode}`);
      debug(`DEBUG: About to check mode. Current mode: ${mode}`);
      if (mode === "js-ssr") {
        builder.log.minor("Generating JavaScript SSR sidecar output");
        builder.copy(prerenderedRoot, outDir);
        const possibleRootPhp = path3.join(outDir, "index.php");
        if (await exists(possibleRootPhp)) {
          builder.log.minor("Renaming prerendered root index.php to _home.php for js-ssr mode");
          await rename(possibleRootPhp, path3.join(outDir, "_home.php"));
        }
        builder.mkdirp(path3.join(outDir, "_runtime"));
        await writeFile(path3.join(outDir, "_runtime", "compat.php"), compatPhp, "utf8");
        const serverDir = path3.join(outDir, "server");
        builder.mkdirp(serverDir);
        builder.writeServer(serverDir);
        const manifest = builder.generateManifest({ relativePath: "." });
        await writeFile(path3.join(serverDir, "manifest.js"), `export const manifest = ${manifest};
`);
        const handler = getNodeHandlerMjs(basePath);
        await writeFile(path3.join(serverDir, "handler.mjs"), handler);
        const sidecarUrl = process.env.PHP_SIDECAR_URL || "http://127.0.0.1:3000";
        const proxy = getPhpProxy(sidecarUrl);
        await writeFile(path3.join(outDir, "index.php"), proxy);
        const htaccess = getHtaccess("js-ssr", basePath || "", precompress, undefined, trailingSlash);
        await writeFile(path3.join(outDir, ".htaccess"), htaccess.trim());
        if (precompress) {
          builder.log.minor("Compressing assets");
          await builder.compress(outDir);
          if (assetsDir !== outDir) {
            await builder.compress(assetsDir);
          }
        }
        const phpApiFiles = await import_tiny_glob.default("**/+server.php", { cwd: routesBaseFs });
        for (const file of phpApiFiles) {
          const srcFile = path3.join(routesBaseFs, file);
          const rel = posixify(srcFile);
          const sliced = rel.startsWith(routesBasePosix) ? rel.slice(routesBasePosix.length) : rel;
          const normalized = sliced.startsWith("/") ? sliced : "/" + sliced;
          if (!effectivePhpFiles.has(normalized)) {
            builder.log.minor(`Skipping shadowed/ignored PHP file: ${file}`);
            continue;
          }
          const routeDir = path3.dirname(file);
          const destDir = path3.join(outDir, routeDir);
          builder.mkdirp(destDir);
          await builder.copy(srcFile, path3.join(destDir, "_server.php"));
          const siblingPageCandidates = [
            path3.join(routesBaseFs, routeDir, "+page.svelte"),
            path3.join(routesBaseFs, routeDir, "+page.js"),
            path3.join(routesBaseFs, routeDir, "+page.ts"),
            path3.join(routesBaseFs, routeDir, "+page.server.js"),
            path3.join(routesBaseFs, routeDir, "+page.server.ts")
          ];
          let hasSiblingPage = false;
          for (const c of siblingPageCandidates) {
            if (await exists(c)) {
              hasSiblingPage = true;
              break;
            }
          }
          const relToRoot = path3.relative(destDir, outDir).replace(/\\/g, "/");
          const possibleHtml = destDir + ".html";
          if (await exists(possibleHtml)) {
            builder.log.minor(`Moving conflicting prerendered file ${possibleHtml} to ${path3.join(destDir, "index.html")}`);
            await rename(possibleHtml, path3.join(destDir, "index.html"));
            hasSiblingPage = true;
          }
          const wrapper = getStandaloneApiPhp("_server.php", hasSiblingPage ? relToRoot : undefined);
          await writeFile(path3.join(destDir, "index.php"), wrapper);
        }
        builder.log.minor("Generating router.php");
        const router = getRouterPhp(basePath, "js-ssr", fallback);
        assertPhp74Safe(router, "router.php (js-ssr)");
        await writeFile(path3.join(outDir, "router.php"), router, "utf8");
        builder.log.minor("Generating route manifest for js-ssr");
        const routeManifest = await generateRouteManifest(builder);
        const manifestPhp = `<?php
return ${phpArrayString(routeManifest)};
`;
        const manifestDir = path3.join(outDir, "adapter");
        builder.mkdirp(manifestDir);
        await writeFile(path3.join(manifestDir, "route-manifest.php"), manifestPhp, "utf8");
        builder.log.minor("Writing build stamp");
        const stamp = {
          mode,
          basePath: basePath || "",
          adapterVersion: "0.0.1",
          builtAt: new Date().toISOString()
        };
        builder.mkdirp(path3.join(outDir, "_runtime"));
        await writeFile(path3.join(outDir, "_runtime", "build-stamp.json"), JSON.stringify(stamp, null, 2), "utf8");
        if (mode === "js-ssr") {
          if (strict !== false) {
            const dynamic = builder.routes.filter((r) => r.prerender !== true);
            const trulyDynamic = dynamic.filter((r) => {
              const id = r.id.startsWith("/") ? r.id : "/" + r.id;
              const candidateServer = id + "/+server.php";
              const candidatePageServer = id + "/+page.server.php";
              if (allServerRelPosix.has(candidateServer) || allServerRelPosix.has(candidatePageServer)) {
                return false;
              }
              return true;
            });
            if (trulyDynamic.length) {
              const prefix = path3.relative(".", builder.config.kit.files.routes);
              const errorLines = [
                "Non-prerenderable routes detected:",
                "This adapter will build, but these routes require a fallback strategy to render at runtime."
              ];
              trulyDynamic.forEach((r) => {
                errorLines.push("- " + path3.posix.join(prefix, r.id));
              });
              if (!fallback) {
                errorLines.push("Set kit.prerender.fallback or adapter fallback if you want SPA-style fallback.");
              }
              builder.log.warn(errorLines.join(`
`));
            }
          }
          builder.log.minor("Prerendered pages: " + Array.from(builder.prerendered.pages.entries()).map(([k, v]) => k + " -> " + v.file).join(", "));
          builder.log.minor("Generating API endpoints");
          for (const relPosix of allServerRelPosix) {
            if (relPosix.endsWith("+server.php")) {
              const routeDir = path3.dirname(relPosix);
              const prefix = fnPrefixMap.get(relPosix);
              const protectedRel = protectedMap.get(relPosix);
              if (!prefix || !protectedRel)
                continue;
              usedServerFiles.add(relPosix);
              const outDir2 = path3.join(prerenderedRoot, stripLeadingSlash(routeDir));
              if (await isFile(outDir2)) {
                builder.log.minor(`Skipping prerendered PHP endpoint file: ${routeDir}`);
                continue;
              }
              builder.log.minor(`Creating output directory: ${outDir2}`);
              builder.mkdirp(outDir2);
              const relToRoot = phpRelToRootFromNav(routeDir + "/");
              const include = "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, "") + "';";
              builder.log.minor(`Generated include: ${include}`);
              const { phpRegex: routeRegex, phpMap: routeParamMapPhp } = compilePhpRouteMatcher(routeDir);
              const apiPhp = getApiPhp([include], prefix, basePath || "", routeRegex, routeParamMapPhp, relToRoot + "_runtime/compat.php");
              const indexPhp = path3.join(outDir2, "index.php");
              let pageFile = null;
              if (await exists(indexPhp)) {
                pageFile = indexPhp;
              } else if (stripLeadingSlash(routeDir) !== "" && stripLeadingSlash(routeDir) !== ".") {
                const buildRoot = prerenderedRoot;
                const routeName = path3.basename(routeDir);
                const routeParent = path3.dirname(routeDir);
                const siblingPhp = path3.join(buildRoot, stripLeadingSlash(routeParent), routeName + ".php");
                const siblingHtml = path3.join(buildRoot, stripLeadingSlash(routeParent), routeName + ".html");
                if (await exists(siblingPhp)) {
                  pageFile = siblingPhp;
                } else if (await exists(siblingHtml)) {
                  pageFile = siblingHtml;
                }
              }
              builder.log.minor(`Checking for collision at ${indexPhp} or sibling`);
              builder.log.minor(`Route dir: ${routeDir}, outDir: ${outDir2}`);
              if (stripLeadingSlash(routeDir) !== "" && stripLeadingSlash(routeDir) !== ".") {
                const buildRoot = prerenderedRoot;
                const routeName = path3.basename(routeDir);
                const routeParent = path3.dirname(routeDir);
                const siblingPhp = path3.join(buildRoot, stripLeadingSlash(routeParent), routeName + ".php");
                const siblingHtml = path3.join(buildRoot, stripLeadingSlash(routeParent), routeName + ".html");
                builder.log.minor(`Sibling PHP check: ${siblingPhp}`);
                builder.log.minor(`Sibling HTML check: ${siblingHtml}`);
              }
              builder.log.minor(`Page file found: ${pageFile}`);
              if (pageFile) {
                builder.log.minor(`Collision found at ${pageFile}`);
                if (pageFile === indexPhp) {
                  await rename(pageFile, path3.join(outDir2, "_page.php"));
                } else {
                  let content = await readFile2(pageFile, "utf8");
                  if (pageFile.endsWith(".html")) {
                    content = `<?php
// Generated HTML content from ${path3.basename(pageFile)}
header('Content-Type: text/html; charset=utf-8');
echo <<<HTML
${content}
HTML;
?>`;
                  } else {
                    content = content.replace(/require_once __DIR__ \. '\//g, "require_once __DIR__ . '/../");
                  }
                  await writeFile(path3.join(outDir2, "_page.php"), content, "utf8");
                  await builder.rimraf(pageFile);
                }
                await writeFile(path3.join(outDir2, "_server_dispatch.php"), apiPhp, "utf8");
                const negotiationPhp = `<?php
// SvelteKit-style Content Negotiation
// Generated by @ryanspice/sveltekit-adapter-php

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';

if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    require __DIR__ . '/_page.php';
    return;
}

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
// POST also goes to +server if it exists (conflicts with actions are not allowed by Kit)
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
    require __DIR__ . '/_server_dispatch.php';
    return;
}

// 2. Accept Header Negotiation (for GET/POST/HEAD)
// Always set Vary: Accept so CDNs/proxies cache HTML vs JSON separately
header('Vary: Accept');

function sk_prefers_html($accept) {
    if (trim($accept) === '' || trim($accept) === '*/*') return false;

    $types = explode(',', $accept);
    $htmlQ = 0.0;
    $jsonQ = 0.0;

    foreach ($types as $type) {
        $parts = explode(';', $type);
        $mime = trim($parts[0]);
        $q = 1.0;

        for ($i = 1; $i < count($parts); $i++) {
            $part = trim($parts[$i]);
            if (strncmp($part, 'q=', 2) === 0) {
                $q = (float)substr($part, 2);
            }
        }

        if ($mime === 'text/html' || $mime === 'application/xhtml+xml') {
            $htmlQ = max($htmlQ, $q);
        } elseif ($mime === 'application/json') {
            $jsonQ = max($jsonQ, $q);
        }
    }

    return $htmlQ > $jsonQ;
}

if (sk_prefers_html($accept)) {
    require __DIR__ . '/_page.php';
} else {
    require __DIR__ . '/_server_dispatch.php';
}
?>`;
                assertPhp74Safe(apiPhp, `API dispatch (${routeDir})`);
                assertPhp74Safe(negotiationPhp, `Negotiation index.php (${routeDir})`);
                await writeFile(indexPhp, negotiationPhp, "utf8");
              } else {
                builder.log.minor(`Writing index.php to ${indexPhp}`);
                assertPhp74Safe(apiPhp, `API index.php (${routeDir})`);
                await writeFile(indexPhp, apiPhp, "utf8");
              }
            }
          }
          builder.log.minor("Processing JS/TS server endpoints");
          debugMinor(`DEBUG: Starting JS/TS endpoint processing loop with ${allServerTsJsFs.length} files`);
          for (const absPath of allServerTsJsFs) {
            debugMinor(`DEBUG: Checking file: ${absPath}`);
            const relPosixPath = posixify(absPath);
            const sliced = relPosixPath.startsWith(routesBasePosix) ? relPosixPath.slice(routesBasePosix.length) : relPosixPath;
            const relative = sliced.startsWith("/") ? sliced : "/" + sliced;
            const normalized = normalizeServerRel(relative);
            if (!effectiveTsFiles.has(normalized)) {
              builder.log.minor(`Skipping ignored TS/JS file: ${absPath}`);
              continue;
            }
            if (absPath.endsWith("+server.js") || absPath.endsWith("+server.ts")) {
              builder.log.minor(`Processing JS/TS endpoint: ${absPath}`);
              const routeDir = path3.dirname(normalized);
              const prefix = fnPrefixMap.get(normalized);
              const protectedRel = protectedMap.get(normalized);
              if (!prefix || !protectedRel) {
                builder.log.minor(`Skipping ${normalized} - missing prefix or protectedRel`);
                continue;
              }
              usedServerFiles.add(normalized);
              const outDir2 = path3.join(prerenderedRoot, stripLeadingSlash(routeDir));
              if (await isFile(outDir2)) {
                builder.log.minor(`Skipping prerendered JS/TS endpoint file: ${routeDir}`);
                continue;
              }
              debugMinor(`DEBUG: Creating output directory: ${outDir2}`);
              debug(`DEBUG: Creating output directory: ${outDir2}`);
              builder.mkdirp(outDir2);
              const relToRoot = phpRelToRootFromNav(routeDir + "/");
              const include = "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, "") + "';";
              const { phpRegex: routeRegex, phpMap: routeParamMapPhp } = compilePhpRouteMatcher(routeDir);
              const apiPhp = getApiPhp([include], prefix, basePath || "", routeRegex, routeParamMapPhp, relToRoot + "_runtime/compat.php");
              const indexPhp = path3.join(outDir2, "index.php");
              let pageFile = null;
              if (await exists(indexPhp)) {
                pageFile = indexPhp;
              } else if (stripLeadingSlash(routeDir) !== "" && stripLeadingSlash(routeDir) !== ".") {
                const siblingPhp = outDir2 + ".php";
                if (await exists(siblingPhp)) {
                  pageFile = siblingPhp;
                }
              }
              builder.log.minor(`Checking for collision at ${indexPhp} or sibling for JS/TS endpoint`);
              if (pageFile) {
                builder.log.minor(`Collision found at ${pageFile} for JS/TS endpoint`);
                if (pageFile === indexPhp) {
                  await rename(pageFile, path3.join(outDir2, "_page.php"));
                } else {
                  let content = await readFile2(pageFile, "utf8");
                  content = content.replace(/require_once __DIR__ \. '\//g, "require_once __DIR__ . '/../");
                  await writeFile(path3.join(outDir2, "_page.php"), content, "utf8");
                  await builder.rimraf(pageFile);
                }
                await writeFile(path3.join(outDir2, "_server_dispatch.php"), apiPhp, "utf8");
                const negotiationPhp = `<?php
// SvelteKit-style Content Negotiation
// Generated by @ryanspice/sveltekit-adapter-php

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';

if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    require __DIR__ . '/_page.php';
    return;
}

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
// POST also goes to +server if it exists (conflicts with actions are not allowed by Kit)
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
    require __DIR__ . '/_server_dispatch.php';
    return;
}

// 2. Accept Header Negotiation (for GET/POST/HEAD)
// Always set Vary: Accept so CDNs/proxies cache HTML vs JSON separately
header('Vary: Accept');

function sk_prefers_html($accept) {
    if (trim($accept) === '' || trim($accept) === '*/*') return false;

    $types = explode(',', $accept);
    $htmlQ = 0.0;
    $jsonQ = 0.0;

    foreach ($types as $type) {
        $parts = explode(';', $type);
        $mime = trim($parts[0]);
        $q = 1.0;

        for ($i = 1; $i < count($parts); $i++) {
            $part = trim($parts[$i]);
            if (strncmp($part, 'q=', 2) === 0) {
                $q = (float)substr($part, 2);
            }
        }

        if ($mime === 'text/html' || $mime === 'application/xhtml+xml') {
            $htmlQ = max($htmlQ, $q);
        } elseif ($mime === 'application/json') {
            $jsonQ = max($jsonQ, $q);
        }
    }

    return $htmlQ > $jsonQ;
}

if (sk_prefers_html($accept)) {
    require __DIR__ . '/_page.php';
} else {
    require __DIR__ . '/_server_dispatch.php';
}
?>`;
                assertPhp74Safe(apiPhp, `API dispatch (${routeDir})`);
                assertPhp74Safe(negotiationPhp, `Negotiation index.php (${routeDir})`);
                await writeFile(indexPhp, negotiationPhp, "utf8");
              } else {
                assertPhp74Safe(apiPhp, `API index.php (${routeDir})`);
                await writeFile(indexPhp, apiPhp, "utf8");
              }
            }
          }
          builder.log.minor("Converting PHP server files");
          const protectedRoot = path3.join(prerenderedRoot, "_protected");
          builder.mkdirp(protectedRoot);
          await writeFile(path3.join(protectedRoot, ".htaccess"), `Require all denied
`, "utf8");
          const conversions = [];
          for (const relPosix of usedServerFiles) {
            const absFs = path3.join(routesBaseFs, stripLeadingSlash(relPosix));
            const protectedRel = protectedMap.get(relPosix);
            const prefix = fnPrefixMap.get(relPosix);
            if (!protectedRel || !prefix)
              continue;
            const outFs = path3.join(prerenderedRoot, protectedRel.replace(/^\//, ""));
            const outDir2 = path3.dirname(outFs);
            builder.mkdirp(outDir2);
            conversions.push((async () => {
              let src = await readFile2(absFs, "utf8");
              src = src.replace(/function\s+load\s*\(/m, "function " + prefix + "_load(");
              src = src.replace(/function\s+action_([A-Za-z0-9_]+)\s*\(/g, (_, name) => "function " + prefix + "_action_" + name + "(");
              src = src.replace(/function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s*\(/g, (_, name) => "function " + prefix + "_" + name + "(");
              await writeFile(outFs, src, "utf8");
            })());
          }
          await Promise.all(conversions);
          builder.log.minor("Generating route manifest");
          debug("DEBUG: About to call generateRouteManifest for php-static mode");
          const routeManifest2 = await generateRouteManifest(builder);
          debug("DEBUG: generateRouteManifest returned:", JSON.stringify(routeManifest2, null, 2));
          const manifestPhp2 = `<?php
return ${phpArrayString(routeManifest2)};
`;
          const manifestDir2 = path3.join(prerenderedRoot, "adapter");
          builder.mkdirp(manifestDir2);
          await writeFile(path3.join(manifestDir2, "route-manifest.php"), manifestPhp2, "utf8");
        }
      } else if (mode === "php-static") {
        builder.log.minor("Generating php-static output");
        debugMinor(`DEBUG: Entering php-static mode section. Mode: ${mode}`);
        debug(`DEBUG: Entering php-static mode section. Mode: ${mode}`);
        builder.log.minor("Generating runtime shims for non-prerendered pages");
        debug(`DEBUG: allServerRelPosix size: ${allServerRelPosix.size}`);
        debug(`DEBUG: allServerRelPosix content:`, Array.from(allServerRelPosix));
        for (const r of builder.routes) {
          if (r.prerender === true)
            continue;
          const routeId = r.id.startsWith("/") ? r.id : "/" + r.id;
          if (routeId === "/" || routeId === "")
            continue;
          const pageServerRel = routeId + "/+page.server.php";
          debug(`DEBUG: Checking route ${routeId}, looking for ${pageServerRel}`);
          if (!allServerRelPosix.has(pageServerRel)) {
            debug(`DEBUG: ${pageServerRel} NOT found in allServerRelPosix`);
            continue;
          }
          debug(`DEBUG: Found ${pageServerRel}, generating shims`);
          let fsPath = routeId;
          if (buildTimeBase && buildTimeBase !== "/") {
            const normalizedBase = buildTimeBase.startsWith("/") ? buildTimeBase : "/" + buildTimeBase;
            fsPath = normalizedBase + (routeId.startsWith("/") ? routeId : "/" + routeId);
          }
          const outDirForRoute = path3.join(prerenderedRoot, stripLeadingSlash(fsPath));
          const outIndexPhp = path3.join(outDirForRoute, "index.php");
          const outSiblingPhp = outDirForRoute + ".php";
          const outSiblingHtml = outDirForRoute + ".html";
          if (await exists(outIndexPhp))
            continue;
          if (await exists(outSiblingPhp))
            continue;
          if (await exists(outSiblingHtml))
            continue;
          const { files: deps, loadMapItems } = getRouteDeps(routeId);
          for (const d of deps)
            usedServerFiles.add(d);
          const fsPathForRel = fsPath.endsWith("/") ? fsPath : fsPath + "/";
          const relToRoot = phpRelToRootFromNav(fsPathForRel);
          const compatRel = relToRoot + "_runtime/compat.php";
          const includes = deps.map((d) => {
            const protectedRel = protectedMap.get(d);
            return protectedRel ? "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, "") + "';" : "";
          }).filter(Boolean);
          const loadFnList = loadMapItems.map((i) => i.fn);
          const loadFnsPhp = "[" + loadFnList.map((fn) => `'${fn}'`).join(", ") + "]";
          const { phpRegex: routeRegex, phpMap: routeParamMapPhp } = compilePhpRouteMatcher(routeId);
          const shimPhp = `<?php
declare(strict_types = 1);

require_once __DIR__ . '/${compatRel}';

if (!defined('SK_BASE_PATH')) {
					define('SK_BASE_PATH', getenv('SK_BASE_PATH') ?: ${JSON.stringify(basePath || "")});
}

const SK_ROUTE_REGEX = '${routeRegex}';
const SK_ROUTE_PARAM_MAP = ${routeParamMapPhp};

${includes.join(`
`)}

// Handle Actions (POST) for this route
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	if (file_exists(__DIR__ . '/__action.php')) {
		require __DIR__ . '/__action.php';
		// If action returned (did not exit), we continue to render the page (shim).
		// We must prevent the fallback root index.php from trying to handle the POST again.
		$_SERVER['REQUEST_METHOD'] = 'GET';
	}
}

$loadFns = ${loadFnsPhp};
$routeid = ${JSON.stringify(routeId)};

final class SK_URLSearchParams {
	private array $pairs = [];

	public function __construct(string $queryString) {
		$qs = ltrim($queryString, '?');
		if ($qs === '') return;
		foreach (explode('&', $qs) as $part) {
			if ($part === '') continue;
			$kv = explode('=', $part, 2);
			$key = urldecode($kv[0]);
			$val = urldecode($kv[1] ?? '');
			if (!array_key_exists($key, $this->pairs)) $this->pairs[$key] = [];
			$this->pairs[$key][] = $val;
		}
	}

	public function get(string $key): ?string {
		$vals = $this->pairs[$key] ?? null;
		if (!$vals) return null;
		return $vals[0] ?? null;
	}

	public function has(string $key): bool {
		return array_key_exists($key, $this->pairs);
	}

	public function __get(string $key): ?string {
		return $this->get($key);
	}

	public function __isset(string $key): bool {
		return $this->has($key);
	}

	public function all(string $key): array {
		return $this->pairs[$key] ?? [];
	}

	public function toString(): string {
		$out = [];
		foreach ($this->pairs as $k => $vals) {
			foreach ($vals as $v) {
				$out[] = rawurlencode($k) . '=' . rawurlencode($v);
			}
		}
		return implode('&', $out);
	}
}


$params = sk_extract_params($_SERVER['REQUEST_URI'] ?? '', SK_BASE_PATH, SK_ROUTE_REGEX, SK_ROUTE_PARAM_MAP);

$base = [];
foreach ($loadFns as $fn) {
	if (!function_exists($fn)) continue;

	$event = [
		'params' => $params,
		'url' => (object)[
			'searchParams' => new SK_URLSearchParams($_SERVER['QUERY_STRING'] ?? ''),
			'pathname' => parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH)
		],
		'request' => (object)[
			'headers' => (object)[
				'cookie' => $_SERVER['HTTP_COOKIE'] ?? ''
			]
		],
		'cookies' => new SK_Cookies($_COOKIE),
		'routeid' => $routeid,
		'parentdata' => $base,
		'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
		'query' => $_GET,
		'server' => $_SERVER
	];

	$res = $fn($event);
	if (is_array($res)) {
		$base = array_merge($base, $res);
	}
}

$fallback_php = __DIR__ . '/${relToRoot.replace(/^\.\//, "")}${basePath ? stripLeadingSlash(basePath) + "/" : ""}index.php';
$fallback_html = __DIR__ . '/${relToRoot.replace(/^\.\//, "")}${basePath ? stripLeadingSlash(basePath) + "/" : ""}index.html';
$fallback_200 = __DIR__ . '/${relToRoot.replace(/^\.\//, "")}${basePath ? stripLeadingSlash(basePath) + "/" : ""}200.html';

if (is_file($fallback_php)) {
	$_SERVER['SCRIPT_FILENAME'] = realpath($fallback_php);
	require $fallback_php;
	exit;
}

if (is_file($fallback_html)) {
	header('content-type: text/html; charset=utf-8');
	readfile($fallback_html);
	exit;
}

if (is_file($fallback_200)) {
	header('content-type: text/html; charset=utf-8');
	readfile($fallback_200);
	exit;
}

					http_response_code(404);
					echo '404 Not Found (PHP Router)';
`;
          builder.mkdirp(outDirForRoute);
          assertPhp74Safe(shimPhp, `Route shim index.php (${routeId})`);
          await writeFile(outIndexPhp, shimPhp, "utf8");
          const nodeCount = loadMapItems.length > 0 ? loadMapItems.length : 2;
          const nodes = new Array(nodeCount).fill(null);
          const templateJson = JSON.stringify({ type: "data", nodes });
          const inlineMode = "unknown";
          const appHash = "__sveltekit_unknown";
          const dataPhp = getDataPhp(includes, basePath, compatRel, relToRoot).replace("PLACEHOLDER_ROUTE_ID", JSON.stringify(routeId)).replace("PLACEHOLDER_TEMPLATE_B64", Buffer.from(templateJson, "utf8").toString("base64")).replace("PLACEHOLDER_ROUTE_REGEX", routeRegex).replace("PLACEHOLDER_ROUTE_PARAM_MAP", routeParamMapPhp).replace("PLACEHOLDER_LOAD_FNS", loadFnsPhp).replace("PLACEHOLDER_INLINE_MODE", JSON.stringify(inlineMode)).replaceAll("PLACEHOLDER_APP_ID", appHash);
          const pageDep = deps.find((d) => d.includes("+page.server"));
          const pagePrefix = pageDep ? fnPrefixMap.get(pageDep) : null;
          const actionPhp = getActionPhp(includes, routeId, pagePrefix ?? null, compatRel);
          assertPhp74Safe(dataPhp, `__data.php (${routeId})`);
          assertPhp74Safe(actionPhp, `__action.php (${routeId})`);
          await writeFile(path3.join(outDirForRoute, "__data.php"), dataPhp, "utf8");
          await writeFile(path3.join(outDirForRoute, "__action.php"), actionPhp, "utf8");
        }
        builder.log.minor("Generating API endpoints");
        for (const relPosix of allServerRelPosix) {
          if (relPosix.endsWith("+server.php")) {
            const routeDir = path3.dirname(relPosix);
            const prefix = fnPrefixMap.get(relPosix);
            const protectedRel = protectedMap.get(relPosix);
            if (!prefix || !protectedRel)
              continue;
            usedServerFiles.add(relPosix);
            let fsPath = routeDir;
            if (buildTimeBase && buildTimeBase !== "/") {
              const normalizedBase = buildTimeBase.startsWith("/") ? buildTimeBase : "/" + buildTimeBase;
              const routePart = routeDir.startsWith("/") ? routeDir : "/" + routeDir;
              fsPath = normalizedBase + routePart;
            }
            const outDir2 = path3.join(prerenderedRoot, stripLeadingSlash(fsPath));
            if (await isFile(outDir2)) {
              builder.log.minor(`Skipping prerendered PHP endpoint file: ${routeDir}`);
              continue;
            }
            builder.log.minor(`Creating output directory: ${outDir2}`);
            builder.mkdirp(outDir2);
            const relToRoot = phpRelToRootFromNav(fsPath + "/");
            const include = "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, "") + "';";
            builder.log.minor(`Generated include: ${include}`);
            const { phpRegex: routeRegex, phpMap: routeParamMapPhp } = compilePhpRouteMatcher(routeDir);
            const apiPhp = getApiPhp([include], prefix, basePath || "", routeRegex, routeParamMapPhp, relToRoot + "_runtime/compat.php");
            const indexPhp = path3.join(outDir2, "index.php");
            let pageFile = null;
            const indexHtml = path3.join(outDir2, "index.html");
            if (await exists(indexPhp)) {
              pageFile = indexPhp;
            } else if (await exists(indexHtml)) {
              pageFile = indexHtml;
            } else if (stripLeadingSlash(routeDir) !== "" && stripLeadingSlash(routeDir) !== ".") {
              const siblingPhp = outDir2 + ".php";
              const siblingHtml = outDir2 + ".html";
              if (await exists(siblingPhp)) {
                pageFile = siblingPhp;
              } else if (await exists(siblingHtml)) {
                pageFile = siblingHtml;
              }
            }
            builder.log.minor(`Checking for collision at ${indexPhp}, ${indexHtml} or sibling`);
            if (pageFile) {
              builder.log.minor(`Collision found at ${pageFile}`);
              if (pageFile === indexPhp) {
                await rename(pageFile, path3.join(outDir2, "_page.php"));
              } else {
                let content = await readFile2(pageFile, "utf8");
                content = content.replace(/require_once __DIR__ \. '\//g, "require_once __DIR__ . '/../");
                await writeFile(path3.join(outDir2, "_page.php"), content, "utf8");
                await builder.rimraf(pageFile);
              }
              await writeFile(path3.join(outDir2, "_server_dispatch.php"), apiPhp, "utf8");
              const negotiationPhp = `<?php
// SvelteKit-style Content Negotiation
// Generated by @ryanspice/sveltekit-adapter-php

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';

if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    require __DIR__ . '/_page.php';
    return;
}

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
// POST also goes to +server if it exists (conflicts with actions are not allowed by Kit)
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
    require __DIR__ . '/_server_dispatch.php';
    return;
}

// 2. Accept Header Negotiation (for GET/POST/HEAD)
// Always set Vary: Accept so CDNs/proxies cache HTML vs JSON separately
header('Vary: Accept');

function sk_prefers_html($accept) {
    if (trim($accept) === '' || trim($accept) === '*/*') return false;

    $types = explode(',', $accept);
    $htmlQ = 0.0;
    $jsonQ = 0.0;

    foreach ($types as $type) {
        $parts = explode(';', $type);
        $mime = trim($parts[0]);
        $q = 1.0;

        for ($i = 1; $i < count($parts); $i++) {
            $part = trim($parts[$i]);
            if (strncmp($part, 'q=', 2) === 0) {
                $q = (float)substr($part, 2);
            }
        }

        if ($mime === 'text/html' || $mime === 'application/xhtml+xml') {
            $htmlQ = max($htmlQ, $q);
        } elseif ($mime === 'application/json') {
            $jsonQ = max($jsonQ, $q);
        }
    }

    return $htmlQ > $jsonQ;
}

if (sk_prefers_html($accept)) {
    require __DIR__ . '/_page.php';
} else {
    require __DIR__ . '/_server_dispatch.php';
}
?>`;
              assertPhp74Safe(apiPhp, `API dispatch (${routeDir})`);
              assertPhp74Safe(negotiationPhp, `Negotiation index.php (${routeDir})`);
              await writeFile(indexPhp, negotiationPhp, "utf8");
            } else {
              builder.log.minor(`Writing index.php to ${indexPhp}`);
              assertPhp74Safe(apiPhp, `API index.php (${routeDir})`);
              await writeFile(indexPhp, apiPhp, "utf8");
            }
          }
        }
        builder.log.minor("Processing JS/TS server endpoints");
        debugMinor(`DEBUG: Starting JS/TS endpoint processing loop with ${allServerTsJsFs.length} files`);
        debug(`DEBUG: Starting JS/TS endpoint processing loop with ${allServerTsJsFs.length} files`);
        for (const absPath of allServerTsJsFs) {
          debugMinor(`DEBUG: Checking file: ${absPath}`);
          debug(`DEBUG: Checking file: ${absPath}`);
          const relPosixPath = posixify(absPath);
          const sliced = relPosixPath.startsWith(routesBasePosix) ? relPosixPath.slice(routesBasePosix.length) : relPosixPath;
          const relative = sliced.startsWith("/") ? sliced : "/" + sliced;
          const normalized = normalizeServerRel(relative);
          if (!effectiveTsFiles.has(normalized)) {
            builder.log.minor(`Skipping ignored TS/JS file: ${absPath}`);
            continue;
          }
          if (absPath.endsWith("+server.js") || absPath.endsWith("+server.ts")) {
            builder.log.minor(`Processing JS/TS endpoint: ${absPath}`);
            debug(`Processing JS/TS endpoint: ${absPath}`);
            debugMinor(`DEBUG: Converted to normalized path: ${normalized}`);
            debug(`DEBUG: Converted to normalized path: ${normalized}`);
            const routeDir = path3.dirname(normalized);
            const prefix = fnPrefixMap.get(normalized);
            const protectedRel = protectedMap.get(normalized);
            debug(`DEBUG: Looking up ${normalized} in maps`);
            debug(`DEBUG: prefix: ${prefix}, protectedRel: ${protectedRel}`);
            debug(`DEBUG: fnPrefixMap has ${fnPrefixMap.size} entries`);
            debug(`DEBUG: protectedMap has ${protectedMap.size} entries`);
            if (!prefix || !protectedRel) {
              builder.log.minor(`Skipping ${normalized} - missing prefix or protectedRel`);
              debug(`DEBUG: Skipping ${normalized} - prefix: ${prefix}, protectedRel: ${protectedRel}`);
              continue;
            }
            usedServerFiles.add(normalized);
            let fsPath = routeDir;
            if (buildTimeBase && buildTimeBase !== "/") {
              const normalizedBase = buildTimeBase.startsWith("/") ? buildTimeBase : "/" + buildTimeBase;
              const routePart = routeDir.startsWith("/") ? routeDir : "/" + routeDir;
              fsPath = normalizedBase + routePart;
            }
            const outDir2 = path3.join(prerenderedRoot, stripLeadingSlash(fsPath));
            if (await isFile(outDir2)) {
              builder.log.minor(`Skipping prerendered JS/TS endpoint file: ${routeDir}`);
              continue;
            }
            builder.mkdirp(outDir2);
            const relToRoot = phpRelToRootFromNav(fsPath + "/");
            const include = "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, "") + "';";
            const { phpRegex: routeRegex, phpMap: routeParamMapPhp } = compilePhpRouteMatcher(routeDir);
            const apiPhp = getApiPhp([include], prefix, basePath || "", routeRegex, routeParamMapPhp, relToRoot + "_runtime/compat.php");
            const indexPhp = path3.join(outDir2, "index.php");
            let pageFile = null;
            if (await exists(indexPhp)) {
              pageFile = indexPhp;
            } else if (stripLeadingSlash(routeDir) !== "" && stripLeadingSlash(routeDir) !== ".") {
              const siblingPhp = outDir2 + ".php";
              if (await exists(siblingPhp)) {
                pageFile = siblingPhp;
              }
            }
            builder.log.minor(`Checking for collision at ${indexPhp} or sibling for JS/TS endpoint`);
            if (pageFile) {
              builder.log.minor(`Collision found at ${pageFile} for JS/TS endpoint`);
              if (pageFile === indexPhp) {
                await rename(pageFile, path3.join(outDir2, "_page.php"));
              } else {
                let content = await readFile2(pageFile, "utf8");
                content = content.replace(/require_once __DIR__ \. '\//g, "require_once __DIR__ . '/../");
                await writeFile(path3.join(outDir2, "_page.php"), content, "utf8");
                await builder.rimraf(pageFile);
              }
              await writeFile(path3.join(outDir2, "_server_dispatch.php"), apiPhp, "utf8");
              const negotiationPhp = `<?php
// SvelteKit-style Content Negotiation
// Generated by @ryanspice/sveltekit-adapter-php

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';

if (($_SERVER['HTTP_X_SVELTEKIT_ACTION'] ?? '') === 'true') {
    require __DIR__ . '/_page.php';
    return;
}

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
// POST also goes to +server if it exists (conflicts with actions are not allowed by Kit)
if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
    require __DIR__ . '/_server_dispatch.php';
    return;
}

// 2. Accept Header Negotiation (for GET/POST/HEAD)
// Always set Vary: Accept so CDNs/proxies cache HTML vs JSON separately
header('Vary: Accept');

function sk_prefers_html($accept) {
    if (trim($accept) === '' || trim($accept) === '*/*') return false;

    $types = explode(',', $accept);
    $htmlQ = 0.0;
    $jsonQ = 0.0;

    foreach ($types as $type) {
        $parts = explode(';', $type);
        $mime = trim($parts[0]);
        $q = 1.0;

        for ($i = 1; $i < count($parts); $i++) {
            $part = trim($parts[$i]);
            if (strncmp($part, 'q=', 2) === 0) {
                $q = (float)substr($part, 2);
            }
        }

        if ($mime === 'text/html' || $mime === 'application/xhtml+xml') {
            $htmlQ = max($htmlQ, $q);
        } elseif ($mime === 'application/json') {
            $jsonQ = max($jsonQ, $q);
        }
    }

    return $htmlQ > $jsonQ;
}

if (sk_prefers_html($accept)) {
    require __DIR__ . '/_page.php';
} else {
    require __DIR__ . '/_server_dispatch.php';
}
?>`;
              assertPhp74Safe(apiPhp, `API dispatch (${routeDir})`);
              assertPhp74Safe(negotiationPhp, `Negotiation index.php (${routeDir})`);
              await writeFile(indexPhp, negotiationPhp, "utf8");
            } else {
              debugMinor(`DEBUG: No collision found, writing index.php to ${indexPhp}`);
              debug(`DEBUG: No collision found, writing index.php to ${indexPhp}`);
              assertPhp74Safe(apiPhp, `API index.php (${routeDir})`);
              await writeFile(indexPhp, apiPhp, "utf8");
              debugMinor(`DEBUG: Successfully wrote index.php to ${indexPhp}`);
              debug(`DEBUG: Successfully wrote index.php to ${indexPhp}`);
            }
          }
        }
        builder.log.minor("Converting PHP server files");
        const protectedRoot = path3.join(prerenderedRoot, "_protected");
        builder.mkdirp(protectedRoot);
        await writeFile(path3.join(protectedRoot, ".htaccess"), `Require all denied
`, "utf8");
        const conversions = [];
        for (const relPosix of usedServerFiles) {
          const absFs = path3.join(routesBaseFs, stripLeadingSlash(relPosix));
          const protectedRel = protectedMap.get(relPosix);
          const prefix = fnPrefixMap.get(relPosix);
          if (!protectedRel || !prefix)
            continue;
          const outFs = path3.join(prerenderedRoot, protectedRel.replace(/^\//, ""));
          const outDir2 = path3.dirname(outFs);
          builder.mkdirp(outDir2);
          conversions.push((async () => {
            let src = await readFile2(absFs, "utf8");
            src = src.replace(/function\s+load\s*\(/m, "function " + prefix + "_load(");
            src = src.replace(/function\s+action_([A-Za-z0-9_]+)\s*\(/g, (_, name) => "function " + prefix + "_action_" + name + "(");
            src = src.replace(/function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s*\(/g, (_, name) => "function " + prefix + "_" + name + "(");
            await writeFile(outFs, src, "utf8");
          })());
        }
        await Promise.all(conversions);
        builder.log.minor("Generating route manifest");
        debug("DEBUG: About to call generateRouteManifest for php-static mode");
        const routeManifestRaw = await generateRouteManifest(builder);
        const filteredManifest = [];
        for (const entry of routeManifestRaw) {
          const checkExists = async (relPath) => {
            if (!relPath)
              return false;
            const safeRel = relPath.startsWith("/") ? relPath.slice(1) : relPath;
            return await exists(path3.join(prerenderedRoot, safeRel));
          };
          let exists_ = true;
          if (entry.type === "page" || entry.type === "endpoint") {
            if (entry.shim) {
              if (!await checkExists(entry.shim)) {
                exists_ = false;
              }
            }
          } else if (entry.type === "negotiate") {
            let pExists = false;
            let eExists = false;
            if (entry.page && await checkExists(entry.page))
              pExists = true;
            if (entry.endpoint && await checkExists(entry.endpoint))
              eExists = true;
            if (!pExists && !eExists)
              exists_ = false;
          }
          if (exists_)
            filteredManifest.push(entry);
          else {
            builder.log.minor(`Removing phantom route manifest entry type=${entry.type}`);
          }
        }
        debug("DEBUG: generateRouteManifest returned:", JSON.stringify(filteredManifest, null, 2));
        const manifestPhp = `<?php
return ${phpArrayString(filteredManifest)};
`;
        const manifestDir = path3.join(prerenderedRoot, "adapter");
        builder.mkdirp(manifestDir);
        await writeFile(path3.join(manifestDir, "route-manifest.php"), manifestPhp, "utf8");
        builder.log.minor("Copying build to output");
        builder.copy(prerenderedRoot, outDir);
        builder.mkdirp(path3.join(outDir, "_runtime"));
        await writeFile(path3.join(outDir, "_runtime", "compat.php"), compatPhp, "utf8");
        builder.log.minor("Generating .htaccess");
        const htaccess = getHtaccess("php-static", basePath || "", precompress, "router.php", trailingSlash);
        await writeFile(path3.join(outDir, ".htaccess"), htaccess.trim(), "utf8");
        builder.log.minor("Generating router.php");
        const routerFallback = fallback;
        const router = getRouterPhp(basePath, "php-static", routerFallback);
        assertPhp74Safe(router, "router.php");
        await writeFile(path3.join(outDir, "router.php"), router, "utf8");
        builder.log.minor("Compressing assets");
        await builder.compress(outDir);
        builder.log.minor("Writing build stamp");
        const stamp = {
          mode,
          basePath: basePath || "",
          adapterVersion: "0.0.1",
          builtAt: new Date().toISOString()
        };
        await writeFile(path3.join(outDir, "_runtime", "build-stamp.json"), JSON.stringify(stamp, null, 2), "utf8");
      }
      builder.log.minor("Done");
    }
  };
}
export {
  sveltekitPhpAdapter as default
};
