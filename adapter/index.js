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
import path2 from "node:path";
import { readFile, writeFile, rename } from "node:fs/promises";

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

// adapter/src/utils/routing.ts
function findRouteForNavPath(builder, navPath) {
  const withSlash = navPath.endsWith("/") ? navPath : `${navPath}/`;
  const withoutSlash = navPath.endsWith("/") ? navPath.slice(0, -1) : navPath;
  const matches = builder.routes.filter((r) => r.pattern?.test(withSlash) || r.pattern?.test(withoutSlash)).sort((a, b) => (b.id?.length ?? 0) - (a.id?.length ?? 0));
  return matches[0] ?? null;
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

// adapter/src/utils/html.ts
function detectInlineDataModeFromHtml(html) {
  const patterns = ["const data", "data:"];
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
  const patterns = ["const data", "data:"];
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
        return `${before} <?php echo $__SK_DATA; ?>${after}`;
      }
      startPos = startIdx + 1;
    }
  }
  return null;
}

// adapter/src/utils/fs.ts
import { access } from "node:fs/promises";
async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

// adapter/src/runtime/php-templates.ts
function getDataPhp(includes) {
  return `<?php
/**
 * Generated by @ryanspice/sveltekit-adapter-php
 * - Serves /__data.php requests (client navigation + invalidations)
 * - Provides sk_build_embed_data() for index.php hydration
 *
 * Template shape comes from prerendered __data.json (so it matches your Kit version).
 */

declare(strict_types=1);

${includes.join(`
`)}

final class __SK_Deferred {
	public function __construct(public $fn) {}
}
function sk_defer(callable $fn): __SK_Deferred { return new __SK_Deferred($fn); }

/**
 * Locates the "nodes" array within the template payload.
 * Supports:
 *   A) { "type":"data", "nodes":[ ... ] }
 *   B) devalue-like: [ { "type":1, "nodes":2 }, ..., <nodes at index 2>, ... ]
 */
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

function sk_set_node_data(array &$node, mixed $server_data): void {
	// If existing node.data is an array, we treat [0] as the "server" slot (best-effort).
	if (array_key_exists('data', $node)) {
		if (is_array($node['data'])) {
			if (count($node['data']) === 0) $node['data'] = [$server_data];
			else $node['data'][0] = $server_data;
			return;
		}
		$node['data'] = $server_data;
		return;
	}

	$node['type'] = $node['type'] ?? 'data';
	$node['data'] = $server_data;
	$node['uses'] = $node['uses'] ?? (object)[];
}

function sk_apply_loads(string $routeid, array $loadFns, array &$payload, string $inline_mode): array {
	$base = [];
	$server_results = [];
	$deferred = []; // [id => callable]
	$next_chunk_id = 1;

	foreach ($loadFns as $i => $fn) {
		if (!function_exists($fn)) {
			continue;
		}
		$res = $fn([
			'routeid' => $routeid,
			'parentdata' => $base,
			'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
			'query' => $_GET,
			'server' => $_SERVER
		]);

		if ($res === null) {
			continue;
		}

		// Streaming support: values wrapped in sk_defer(fn) become chunk references
		if (is_array($res)) {
			$res2 = $res;
			array_walk_recursive($res2, function (&$v) use (&$deferred, &$next_chunk_id) {
				if ($v instanceof __SK_Deferred) {
					$id = $next_chunk_id++;
					$deferred[$id] = $v->fn;
					$v = $id; // placeholder id
				}
			});
			$res = $res2;
		}

		$server_results[$i] = $res;

		if (is_array($res)) {
			foreach ($res as $k => $v) $base[$k] = $v;
		}
	}

	// Patch nodes
	$nodesRef = sk_get_nodes_ref($payload);

	$nodes = null;
	if ($nodesRef['kind'] === 'assoc') $nodes = &$payload[$nodesRef['key']];
	else if ($nodesRef['kind'] === 'index') $nodes = &$payload[$nodesRef['idx']];
	else $nodes = &$payload;

	foreach ($server_results as $i => $res) {
		// ensure enough nodes exist
		while (count($nodes) <= $i) {
			$nodes[] = null;
		}

		if ($nodes[$i] === null) {
			$nodes[$i] = ['type' => 'data', 'data' => null, 'uses' => (object)[]];
		}

		if (is_array($nodes[$i])) {
			sk_set_node_data($nodes[$i], $res);
		}
	}

	return ['deferred' => $deferred];
}

/**
 * Build the "data" value embedded into index.php.
 * If the HTML had \`const data = [...]\`, we return nodes; if it had \`{ ... }\`, we return payload.
 */
function sk_build_embed_data(string $routeid, array $loadFns, string $template_json, string $inline_mode): string {
	$payload = json_decode($template_json, true);
	if (!is_array($payload)) $payload = [];

	sk_apply_loads($routeid, $loadFns, $payload, $inline_mode);

	if ($inline_mode === 'nodes') {
		$nodesRef = sk_get_nodes_ref($payload);
		$nodes = null;
		if ($nodesRef['kind'] === 'assoc') $nodes = $payload[$nodesRef['key']];
		else if ($nodesRef['kind'] === 'index') $nodes = $payload[$nodesRef['idx']];
		else $nodes = $payload;

		return json_encode($nodes, JSON_UNESCAPED_SLASHES);
	}

	return json_encode($payload, JSON_UNESCAPED_SLASHES);
}

function sk_handle_data_request(string $routeid, array $loadFns, string $template_json, string $inline_mode): void {
	$payload = json_decode($template_json, true);
	if (!is_array($payload)) $payload = [];

	$meta = sk_apply_loads($routeid, $loadFns, $payload, $inline_mode);
	$deferred = $meta['deferred'];

	// If we have deferred chunks, stream in the documented format.
	// Otherwise, regular JSON response.
	if (count($deferred) > 0) {
		header('content-type: text/x-sveltekit-data');
		header('cache-control: no-store');

		echo json_encode($payload, JSON_UNESCAPED_SLASHES) . "\\n";
		@ob_flush(); @flush();

		foreach ($deferred as $id => $fn) {
			$value = $fn();
			$chunk = ['type' => 'chunk', 'id' => $id, 'data' => [$value]];
			echo json_encode($chunk, JSON_UNESCAPED_SLASHES) . "\\n";
			@ob_flush(); @flush();
		}
		return;
	}

	header('content-type: application/json');
	header('cache-control: no-store');
	echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

// If requested directly as /__data.php, serve data; if included from index.php, do nothing.
if (php_sapi_name() !== 'cli' && realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
	$routeid = 'PLACEHOLDER_ROUTE_ID';
	$template_json = <<<'JSON'
PLACEHOLDER_TEMPLATE_JSON
JSON;

	$loadFns = PLACEHOLDER_LOAD_FNS;
	$inline_mode = 'PLACEHOLDER_INLINE_MODE';
	sk_handle_data_request($routeid, $loadFns, $template_json, $inline_mode);
}
?>`;
}
function getActionPhp(includes, navPath, pagePrefix) {
  const fnBase = pagePrefix ? `${pagePrefix}_action_` : "";
  return `<?php
/**
 * Generated by @ryanspice/sveltekit-adapter-php
 * - Handles POST form actions (enhanced + best-effort non-JS)
 */

declare(strict_types=1);

${includes.join(`
`)}

final class __SK_Fail {
	public function __construct(public int $status, public array $data) {}
}
final class __SK_Redirect {
	public function __construct(public int $status, public string $location) {}
}

function sk_fail(int $status, array $data = []): __SK_Fail { return new __SK_Fail($status, $data); }
function sk_redirect(int $status, string $location): __SK_Redirect { return new __SK_Redirect($status, $location); }

function sk_header(string $name): ?string {
	$key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
	return $_SERVER[$key] ?? null;
}

function sk_action_name(): string {
	$qs = $_SERVER['QUERY_STRING'] ?? '';
	// SvelteKit uses ?/actionName
	if (strlen($qs) > 0 && $qs[0] === '/') {
		$raw = substr($qs, 1);
		$raw = explode('&', $raw, 2)[0];
		$raw = trim($raw);
		return $raw !== '' ? $raw : 'default';
	}
	return 'default';
}

function sk_is_action_request(): bool {
	if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') return false;
	// Enhanced submissions include x-sveltekit-action and usually accept: application/json
	// but we also treat a ?/name POST as an action for progressive enhancement.
	$qs = $_SERVER['QUERY_STRING'] ?? '';
	return sk_header('x-sveltekit-action') === 'true' || (strlen($qs) > 0 && $qs[0] === '/');
}

function sk_action_param(string $routeid): array {
	return [
		'routeid' => $routeid,
		'method' => $_SERVER['REQUEST_METHOD'] ?? 'POST',
		'query' => $_GET,
		'post' => $_POST,
		'files' => $_FILES,
		'server' => $_SERVER
	];
}

function sk_send_action_json(string $type, int $status, mixed $data = null, ?string $location = null): void {
	header('cache-control: no-store');
	header('content-type: application/json');

	$out = ['type' => $type, 'status' => $status];

	if ($location !== null) $out['location'] = $location;

	// Match common SvelteKit behavior: data is a stringified payload
	// (client uses $app/forms deserialize/applyAction).
	if ($data !== null) {
		$out['data'] = json_encode([$data, $type === 'success'], JSON_UNESCAPED_SLASHES);
	}

	echo json_encode($out, JSON_UNESCAPED_SLASHES);
}

if (sk_is_action_request()) {
	$routeid = ${JSON.stringify(navPath)};
	$action = sk_action_name();
	$param = sk_action_param($routeid);

	$fn_base = ${JSON.stringify(fnBase)};

	if ($fn_base === '') {
		// No +page.server.php, nothing to do
		http_response_code(404);
		exit;
	}

	$fn = $fn_base . $action;
	$fallback = $fn_base . 'default';

	$call = function_exists($fn) ? $fn : (function_exists($fallback) ? $fallback : null);

	if ($call === null) {
		http_response_code(404);
		exit;
	}

	$res = $call($param);

	// Enhanced?
	$accept = sk_header('accept') ?? '';
	$enhanced = (strpos($accept, 'application/json') !== false) || sk_header('x-sveltekit-action') === 'true';

	if ($res instanceof __SK_Redirect) {
		if ($enhanced) {
			sk_send_action_json('redirect', $res->status, null, $res->location);
			exit;
		}
		http_response_code($res->status);
		header('location: ' . $res->location);
		exit;
	}

	if ($res instanceof __SK_Fail) {
		if ($enhanced) {
			sk_send_action_json('failure', $res->status, $res->data, null);
			exit;
		}
		// Non-JS fallback: redirect back (best-effort)
		http_response_code(303);
		header('location: ' . strtok($_SERVER['REQUEST_URI'] ?? '/', '?'));
		exit;
	}

	// success
	if ($enhanced) {
		sk_send_action_json('success', 200, is_array($res) ? $res : ['ok' => true]);
		exit;
	}

	// Non-JS: PRG redirect back
	http_response_code(303);
	header('location: ' . strtok($_SERVER['REQUEST_URI'] ?? '/', '?'));
	exit;
}
?>`;
}
function getBootstrapPhp(navPath, loadFnsPhp, templateJson, inlineMode, requirePrefix) {
  return `<?php
require __DIR__ . '${requirePrefix}/__action.php';
require __DIR__ . '${requirePrefix}/__data.php';

$routeid = ${JSON.stringify(navPath)};
$template_json = <<<'JSON'
${templateJson}
JSON;

$__SK_DATA = sk_build_embed_data($routeid, ${loadFnsPhp}, $template_json, ${JSON.stringify(inlineMode)});
?>
`;
}

// adapter/src/index.ts
function sveltekitPhpAdapter(options = {}) {
  const {
    ssr = true,
    out = "./build",
    assets = "./build",
    precompress = false,
    fallback = false,
    strict = true
  } = options;
  return {
    name: "@ryanspice/sveltekit-adapter-php",
    async adapt(builder) {
      if (!fallback && strict !== false) {
        const dynamic = builder.routes.filter((r) => r.prerender !== true);
        if (dynamic.length) {
          const prefix = path2.relative(".", builder.config.kit.files.routes);
          const errorLines = [
            "All routes must be prerenderable for this adapter output.",
            "Found non-prerenderable routes:"
          ];
          dynamic.forEach((r) => {
            errorLines.push("- " + path2.posix.join(prefix, r.id));
          });
          errorLines.push("Fix: set prerender per-route, or configure SvelteKit prerender entries appropriately, or implement a fallback strategy.");
          builder.log.error(errorLines.join(`
`));
          throw new Error("Encountered non-prerenderable routes");
        }
      }
      const outDir = path2.resolve(out);
      const assetsDir = path2.resolve(assets);
      const tmpDir = builder.getBuildDirectory("sveltekit-php");
      builder.log.minor("Cleaning output/temp");
      builder.rimraf(outDir);
      builder.rimraf(assetsDir);
      builder.rimraf(tmpDir);
      builder.mkdirp(outDir);
      builder.mkdirp(assetsDir);
      builder.mkdirp(tmpDir);
      builder.log.minor("Writing client assets");
      const writtenClientFiles = builder.writeClient(assetsDir);
      if (ssr) {
        const startCandidates = writtenClientFiles.filter((p) => /entry\/start.*\.js$/.test(posixify(p)));
        for (const startFileRel of startCandidates) {
          const startFilePath = path2.join(assetsDir, startFileRel);
          let startFile = await readFile(startFilePath, "utf8");
          startFile = startFile.replaceAll("__data.json", "__data.php");
          await writeFile(startFilePath, startFile, "utf8");
          builder.log.minor("Patched client data endpoint: " + startFilePath);
        }
      }
      builder.log.minor("Prerendering pages");
      const prerenderedRoot = path2.join(tmpDir, "prerendered");
      builder.writePrerendered(prerenderedRoot);
      builder.log.minor("Prerendered pages: " + Array.from(builder.prerendered.pages.entries()).map(([k, v]) => k + " -> " + v.file).join(", "));
      const routesBaseFs = path2.resolve(builder.config.kit.files.routes);
      const routesBasePosix = posixify(routesBaseFs);
      const allServerPhpFs = await import_tiny_glob.default("**/+*.server.php", { cwd: routesBaseFs, absolute: true });
      const allServerRelPosix = new Set(allServerPhpFs.map(posixify).map((abs) => {
        const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
        return rel.startsWith("/") ? rel : "/" + rel;
      }));
      const protectedMap = new Map;
      const fnPrefixMap = new Map;
      for (const rel of allServerRelPosix) {
        const prefix = fnPrefixForServerFile(rel);
        fnPrefixMap.set(rel, prefix);
        const protectedRel = "/_protected/" + rel.replace(/^\//, "").replace(/\//g, "__").replace(/\+layout\.server\.php$/i, "_layout.php").replace(/\+page\.server\.php$/i, "_page.php").replace(/\.server\.php$/i, ".php");
        protectedMap.set(rel, protectedRel);
      }
      const usedServerFiles = new Set;
      function depsForRoute(routeIdPosix) {
        const deps = [];
        const chain = buildLayoutChainCandidates(routeIdPosix);
        for (const seg of chain.reverse()) {
          const base = seg ? "/" + seg : "";
          const layoutStd = base + "/+layout.server.php";
          const layoutResetA = base + "/+layout@.server.php";
          const layoutResetB = base + "/+layout.server@.php";
          if (allServerRelPosix.has(layoutResetA)) {
            deps.push(layoutResetA);
            break;
          }
          if (allServerRelPosix.has(layoutResetB)) {
            deps.push(layoutResetB);
            break;
          }
          if (allServerRelPosix.has(layoutStd))
            deps.push(layoutStd);
        }
        const rid = stripLeadingSlash(routeIdPosix);
        const pageStd = "/" + (rid ? rid + "/" : "") + "+page.server.php";
        const pageResetA = "/" + (rid ? rid + "/" : "") + "+page@.server.php";
        const pageResetB = "/" + (rid ? rid + "/" : "") + "+page.server@.php";
        if (allServerRelPosix.has(pageStd))
          deps.push(pageStd);
        else if (allServerRelPosix.has(pageResetA))
          deps.push(pageResetA);
        else if (allServerRelPosix.has(pageResetB))
          deps.push(pageResetB);
        return deps;
      }
      for (const [navPathRaw, filePath] of builder.prerendered.pages) {
        const navPath = navPathRaw;
        builder.log.minor("Preparing PHP route: " + navPath);
        const route = findRouteForNavPath(builder, navPath);
        const routeId = route?.id ?? navPath;
        const deps = depsForRoute(routeId);
        for (const d of deps)
          usedServerFiles.add(d);
        const htmlFs = path2.join(prerenderedRoot, filePath.file);
        const htmlDir = path2.dirname(htmlFs);
        if (!await exists(htmlFs)) {
          builder.log.warn("HTML file not found: " + htmlFs + ". Skipping route.");
          continue;
        }
        const templateJsonFs = path2.join(htmlDir, "__data.json");
        let html = await readFile(htmlFs, "utf8");
        const inlineMode = detectInlineDataModeFromHtml(html);
        let templateJson = "{}";
        let nodeCount = 0;
        if (await exists(templateJsonFs)) {
          templateJson = await readFile(templateJsonFs, "utf8");
          try {
            const payload = JSON.parse(templateJson);
            if (payload.nodes)
              nodeCount = payload.nodes.length;
          } catch {}
        }
        if (nodeCount === 0) {
          const subDirData = path2.join(prerenderedRoot, stripLeadingSlash(navPath), "__data.json");
          if (await exists(subDirData)) {
            templateJson = await readFile(subDirData, "utf8");
            try {
              const payload = JSON.parse(templateJson);
              if (payload.nodes)
                nodeCount = payload.nodes.length;
            } catch {}
          }
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
        const relToRoot = phpRelToRootFromNav(navPath);
        const includes = deps.map((d) => {
          const protectedRel = protectedMap.get(d);
          return protectedRel ? "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, "") + "';" : "";
        }).filter(Boolean);
        const loadMap = [];
        for (const d of deps) {
          const prefix = fnPrefixMap.get(d);
          if (!prefix)
            continue;
          const fnName = prefix + "_load";
          if (d.endsWith("page.server.php")) {
            loadMap.push("'" + (nodeCount - 1) + "' => '" + fnName + "'");
          } else if (d.endsWith("layout.server.php")) {
            if (d === "/+layout.server.php" || d === "+layout.server.php") {
              loadMap.push("'0' => '" + fnName + "'");
            }
          }
        }
        const loadFnsPhp = "[" + loadMap.join(", ") + "]";
        const pageDep = deps.find((d) => d.includes("+page.server"));
        const pagePrefix = pageDep ? fnPrefixMap.get(pageDep) : null;
        const dataPhp = getDataPhp(includes).replace("PLACEHOLDER_ROUTE_ID", JSON.stringify(navPath)).replace("PLACEHOLDER_TEMPLATE_JSON", templateJson).replace("PLACEHOLDER_LOAD_FNS", loadFnsPhp).replace("PLACEHOLDER_INLINE_MODE", JSON.stringify(inlineMode));
        const actionPhp = getActionPhp(includes, navPath, pagePrefix ?? null);
        let dataDir = htmlDir;
        let requirePrefix = "";
        const htmlBasename = path2.basename(htmlFs);
        const isIndex = htmlBasename === "index.html" || htmlBasename === "index.php";
        if (!isIndex) {
          const name = htmlBasename.replace(/\.(html|php)$/i, "");
          dataDir = path2.join(htmlDir, name);
          builder.mkdirp(dataDir);
          requirePrefix = "/" + name;
        }
        await writeFile(path2.join(dataDir, "__data.php"), dataPhp, "utf8");
        await writeFile(path2.join(dataDir, "__action.php"), actionPhp, "utf8");
        if (ssr) {
          const replaced = replaceInlineConstData(html);
          if (replaced)
            html = replaced;
          const bootstrap = getBootstrapPhp(navPath, loadFnsPhp, templateJson, inlineMode, requirePrefix);
          html = bootstrap + html;
          if (await exists(templateJsonFs)) {
            await rename(templateJsonFs, path2.join(htmlDir, "__data.template.json"));
          }
          const subDirData = path2.join(prerenderedRoot, stripLeadingSlash(navPath), "__data.json");
          if (await exists(subDirData)) {
            if (path2.resolve(subDirData) !== path2.resolve(templateJsonFs)) {
              await rename(subDirData, path2.join(path2.dirname(subDirData), "__data.template.json"));
            }
          }
          if (await exists(htmlFs)) {
            if (htmlFs.endsWith(".html")) {
              const phpFs = htmlFs.replace(/\.html$/i, ".php");
              await writeFile(htmlFs, html, "utf8");
              await rename(htmlFs, phpFs);
            } else {
              await writeFile(htmlFs, html, "utf8");
            }
          }
        }
      }
      builder.log.minor("Converting PHP server files");
      const protectedRoot = path2.join(prerenderedRoot, "_protected");
      builder.mkdirp(protectedRoot);
      const conversions = [];
      for (const relPosix of usedServerFiles) {
        const absFs = path2.join(routesBaseFs, stripLeadingSlash(relPosix));
        const protectedRel = protectedMap.get(relPosix);
        const prefix = fnPrefixMap.get(relPosix);
        if (!protectedRel || !prefix)
          continue;
        const outFs = path2.join(prerenderedRoot, protectedRel.replace(/^\//, ""));
        const outDir2 = path2.dirname(outFs);
        builder.mkdirp(outDir2);
        conversions.push((async () => {
          let src = await readFile(absFs, "utf8");
          src = src.replace(/function\s+load\s*\(/m, "function " + prefix + "_load(");
          src = src.replace(/function\s+action_([A-Za-z0-9_]+)\s*\(/g, (_, name) => "function " + prefix + "_action_" + name + "(");
          await writeFile(outFs, src, "utf8");
        })());
      }
      await Promise.all(conversions);
      builder.log.minor("Copying build to output");
      builder.copy(prerenderedRoot, outDir);
      if (precompress) {
        builder.log.minor("Precompressing");
        builder.compress(outDir);
      }
      builder.log.minor("Done");
    }
  };
}
export {
  sveltekitPhpAdapter as default
};
