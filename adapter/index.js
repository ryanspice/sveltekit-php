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
        return `${before} <?php echo $dataPayload; ?>${after}`;
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
function getDataPhp(includes, base = "") {
  return `<?php
/**
 * Generated by @ryanspice/sveltekit-adapter-php
 * - Serves /__data.php requests (client navigation + invalidations)
 * - Provides sk_build_embed_data() for index.php hydration
 *
 * Template shape comes from prerendered __data.json (so it matches your Kit version).
 */

declare(strict_types=1);

const SK_BASE_PATH = '${base}';

${includes.join(`
`)}

final class __SK_Deferred {
	public function __construct(public $fn) {}
}
final class __SK_Deferred_Placeholder {
	public function __construct(public int $id) {}
}

function sk_defer(callable $fn): __SK_Deferred { return new __SK_Deferred($fn); }

function sk_recursive_resolve(mixed $data, ?array &$deferreds = null): mixed {
	if ($data instanceof __SK_Deferred) {
		if ($deferreds !== null) {
			$id = count($deferreds);
			$deferreds[] = $data;
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

function sk_serialize(mixed $value): array {
	$flattened = [];
	$map = [];

	// Recursive closure to flatten the structure
	// We use a reference for $flattened to append values
	$fn = function($val) use (&$flattened, &$map, &$fn) {
		// Primitives
		if (is_string($val) || is_int($val) || is_float($val) || is_bool($val) || is_null($val)) {
			$key = is_string($val) ? 's_'.$val : (is_int($val) ? 'i_'.$val : (is_float($val) ? 'f_'.$val : json_encode($val)));
			if (array_key_exists($key, $map)) {
				return $map[$key];
			}

			$flattened[] = $val;
			$idx = count($flattened) - 1;
			$map[$key] = $idx;
			return $idx;
		}

		if ($val instanceof __SK_Deferred_Placeholder) {
			// Placeholder for deferred promise
			// We return a unique string that we can replace later
			$placeholder = "%%%SK_DEFER_" . $val->id . "%%%";
			$flattened[] = $placeholder;
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

/**
 * Unflattens a Devalue-serialized array back into a PHP structure (array/object).
 * This is used to provide hydrated data to the client in a format SvelteKit's start() accepts (objects).
 */
function sk_unflatten(array $data): mixed {
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

function sk_set_node_data(mixed &$node, mixed $server_data): void {
	if (!is_array($node)) {
		$node = [];
	}

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

function sk_apply_loads(string $routeid, array $loadFns, array &$payload, string $inline_mode, ?array &$deferreds = null): array {
	$base = [];
	$server_results = [];
	$next_chunk_id = 1;

	// Loop through load functions (from root layout to leaf page)
	foreach ($loadFns as $i => $fn) {
		if (!function_exists($fn)) {
			continue;
		}

		// Prepare URL object to match dev environment
		$searchParams = (object)$_GET;

		// Execute the load function
		// Pass $base (merged parent data) as 'parentdata' if needed, though SvelteKit usually
		// passes a parent() function. For this simple adapter, we simulate parent merging
		// by accumulating data in $base.
		$res = $fn([
			'params' => [], // TODO: Extract route params if possible
			'url' => (object)[
				'searchParams' => $searchParams,
				'pathname' => $_SERVER['REQUEST_URI'] ?? ''
			],
			'request' => (object)[
				'headers' => (object)[
					'cookie' => $_SERVER['HTTP_COOKIE'] ?? ''
				]
			],
			'cookies' => $_COOKIE,
			'routeid' => $routeid,
			'parentdata' => $base, // Pass accumulated parent data
			'method' => $_SERVER['REQUEST_METHOD'] ?? 'GET',
			'query' => $_GET, // Keep legacy support
			'server' => $_SERVER
		]);

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

	// Update the payload with server results
	$ref = sk_get_nodes_ref($payload);

	// Helper to access nodes array by reference
	$nodes = [];
	if ($ref['kind'] === 'assoc') {
		$nodes = &$payload[$ref['key']];
	} elseif ($ref['kind'] === 'index') {
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

function sk_build_embed_data(string $routeid, array $loadFns, string $templateJson, string $inline_mode, bool $streaming = false): array {
	$payload = json_decode($templateJson, true);
	if (!$payload) return ['[]', []];

	$deferreds = $streaming ? [] : null;
	$finalPayload = sk_apply_loads($routeid, $loadFns, $payload, $inline_mode, $deferreds);

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
	// We must unflatten the Devalue structure to provide plain objects to SvelteKit's start()
	if ($inline_mode === 'nodes' || $inline_mode === 'unknown') {
		$hydrationData = [];
		if (is_array($nodes)) {
			foreach ($nodes as $node) {
				$data = $node['data'] ?? null;
				$newNode = $node;
				if (is_array($data)) {
					$newNode['data'] = sk_unflatten($data);
				}
				$hydrationData[] = $newNode;
			}
		}
		$outputPayload = $hydrationData;
	}

	$json = json_encode($outputPayload);

	// Replace deferred placeholders with JS calls
	if ($streaming && $deferreds) {
		// We need to be careful not to replace things inside strings that look like our marker,
		// but our marker is very specific.
		// The marker is "%%%SK_DEFER_ID%%%" (quoted in JSON).
		// We want to replace "%%%SK_DEFER_ID%%%" with PLACEHOLDER_APP_ID.defer(ID).
		// Note the lack of quotes in the replacement.

		$json = preg_replace_callback('/"%%%SK_DEFER_(\\\\d+)%%%"/', function($matches) {
			$id = $matches[1];
			// SvelteKit uses 1-based IDs usually? We used 0-based index in array, so +1?
			// sk_recursive_resolve used count($deferreds) BEFORE push. So 0-based.
			// Let's use the ID as is.
			return "PLACEHOLDER_APP_ID.defer($id)";
		}, $json);
	}

	return [$json, $deferreds];
}

// Main execution if called directly (client navigation)
if (basename($_SERVER['SCRIPT_FILENAME']) === '__data.php') {
	header('Content-Type: application/json');

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
	$payload = json_decode('PLACEHOLDER_TEMPLATE_JSON', true);
	$loadFns = PLACEHOLDER_LOAD_FNS;
	$routeId = PLACEHOLDER_ROUTE_ID;
	$inlineMode = PLACEHOLDER_INLINE_MODE;

	// Blocking mode for client navigation
	$finalPayload = sk_apply_loads($routeId, $loadFns, $payload, $inlineMode);
	$json = json_encode($finalPayload);

    header('Content-Length: ' . strlen($json));

    if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') {
        echo $json;
    }
}
`;
}
function getActionPhp(includes, routeId, pagePrefix) {
  return `<?php
/**
 * Generated by @ryanspice/sveltekit-adapter-php
 * - Handles form actions (POST)
 */

declare(strict_types = 1);

${includes.join(`
`)}

// Helper for SvelteKit fail()
function sk_fail(int $status, mixed $data): array {
	return ['type' => 'failure', 'status' => $status, 'data' => $data];
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
		$actionName = substr($key, 1);
		break;
	}
}

// 2. Call the action
$fnName = '${pagePrefix ? pagePrefix + "_action_" : ""}'.$actionName;
if ($actionName === 'default') {
	$fnName = '${pagePrefix ? pagePrefix + "_action_default" : ""}';
	// If default action not defined, check if there is a generic 'actions' export?
	// In PHP adapter, we mapped named exports.
	// If user didn't export 'default', maybe they exported others?
}

if (!function_exists($fnName)) {
	http_response_code(404);
	echo json_encode(['type' => 'error', 'error' => ['message' => 'Action not found']]);
	exit;
}

// 3. Execute
// We need to parse body (multipart or urlencoded)
// PHP does this automatically into $_POST and $_FILES

try {
	$result = $fnName([
		'request' => (object)[
			'formData' => function () {
				// Simulate FormData
				// We need to merge $_POST and $_FILES
				// Note: $_FILES structure is complex. SvelteKit/Web API expects File objects.
				// We can't fully simulate File objects in PHP without a library.
				// For now, we return a merged array which the user's PHP code seems to expect.
				return array_merge($_POST, $_FILES);
			}
		],
		'url' => (object)[
			'searchParams' => (object)$_GET
		],
		'cookies' => $_COOKIE,
		'post' => $_POST, // Direct access as expected by some fixture routes
		'files' => $_FILES // Direct access as expected by some fixture routes
    ]);

	// 4. Return result
	// SvelteKit actions return { type: 'success'|'failure'|'redirect'|'error', data: ... }
	// We assume the PHP code returns an array/object matching this.

	if (isset($result['type']) && $result['type'] === 'redirect') {
		// Check if client expects JSON (SvelteKit enhance)
		$expectsJson = false;
		if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
			$expectsJson = true;
		}

		if ($expectsJson) {
			// Return JSON redirect instruction
			header('Content-Type: application/json');
			echo json_encode($result);
			exit;
		} else {
			// Perform HTTP redirect
			header('Location: '.$result['location']);
			http_response_code($result['status'] ?? 303);
			exit;
		}
	}

	header('Content-Type: application/json');
    echo json_encode($result);

} catch (Throwable $e) {
	http_response_code(500);
	header('Content-Type: application/json');
    echo json_encode(['type' => 'error', 'error' => ['message' => $e -> getMessage()]]);
}
`;
}
function getBootstrapPhp(routeId, loadFns, templateJson, inlineMode, requirePrefix = "") {
  return `<?php
require_once __DIR__ . '${requirePrefix}/__data.php';

ini_set('output_buffering', '0');
ini_set('zlib.output_compression', '0');
ini_set('implicit_flush', '1');
while (ob_get_level()) ob_end_flush();

// Handle Actions (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (file_exists(__DIR__ . '${requirePrefix}/__action.php')) {
        require __DIR__ . '${requirePrefix}/__action.php';
        exit;
    }
}

$routeId = ${JSON.stringify(routeId)};
$loadFns = ${loadFns};
$templateJson = '${templateJson.replace(/'/g, "\\'")}';
$inlineMode = ${JSON.stringify(inlineMode)};

// Build data with streaming support
list($dataPayload, $sk_deferreds) = sk_build_embed_data($routeId, $loadFns, $templateJson, $inlineMode, true);

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

if (!empty($sk_deferreds)) {
	foreach($sk_deferreds as $id => $deferred) {
		$fn = $deferred -> fn;
		// Resolve
		// We use sk_recursive_resolve to resolve the deferred value (blocking for this chunk)
		$data = sk_recursive_resolve($fn());

		// Serialize
		$serialized = json_encode(array_values(sk_serialize($data)), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

		// Output script to resolve the promise on the client
		// We use the global variable '${appId}' detected during build.
		echo '<script>if(typeof ${appId} !== "undefined") ${appId}.resolve('.$id. ', () => '.$serialized. ');</script>';
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
if (file_exists(__DIR__. '${requirePrefix}/__action.php')) {
	// require_once __DIR__ . '${requirePrefix}/__action.php';
	// Actually, actions are POST requests to ?/action, handled by __action.php directly?
	// Or does the page need to know about them?
	// Usually no.
}
`;
}
function getApiPhp(includes, prefix) {
  return `<?php
/**
 * Generated by @ryanspice/sveltekit-adapter-php
 * - Handles API endpoints (+server.php)
 */
declare(strict_types=1);

${includes.join(`
`)}

// Helper to access request body
function sk_request_body(): string {
	return file_get_contents('php://input') ?: '';
}

function sk_json_body(): mixed {
	$raw = sk_request_body();
	return json_decode($raw, true);
}

// Build param object similar to RequestEvent
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
			'body' => sk_json_body(), // Default to parsed JSON for convenience
			'rawBody' => sk_request_body()
		],
		'url' => $url,
		'cookies' => $_COOKIE,
		'params' => [] // TODO: Route params
	];
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
		header('Content-Length: '.strlen($content));
	}

	if ($method !== 'HEAD') {
		echo $content;
	}
}
`;
}
function getRouterPhp(base, mode) {
  return `<?php
// Simple router to emulate Apache .htaccess mod_rewrite
// for the PHP built-in server.
// Generated by @ryanspice/sveltekit-adapter-php

// Helper for logging
function router_log($msg) {
	file_put_contents('php://stderr', "[Router] ".$msg. "\\n", FILE_APPEND);
}

$uri = urldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH));
$base = '${base}';

router_log("Request: $uri");

// Strip base path
if ($base !== '' && strpos($uri, $base) === 0) {
	$uri = substr($uri, strlen($base));
	if ($uri === '' || $uri === false) $uri = '/';
	router_log("Stripped URI: $uri");
}

// Security: Block _protected directory
if (strpos($uri, '/_protected/') === 0) {
	http_response_code(403);
    echo "Access Denied";
	return;
}

${mode === "php-static" ? `
// Canonicalize /foo/ -> /foo (prevents relative asset paths breaking hydration)
if ($uri !== '/' && str_ends_with($uri, '/')) {
    $qs = $_SERVER['QUERY_STRING'] ?? '';
    $location = $base . rtrim($uri, '/');
    if ($location === '') $location = $base ?: '/';
    if ($qs !== '') $location .= '?' . $qs;
    header('Location: ' . $location, true, 308);
    return;
}

// Normalize: treat /foo and /foo/ identically
$uri = rtrim($uri, '/');
if ($uri === '') $uri = '/';

// Special handling for SvelteKit __data.json requests
// Map /path/__data.json to /path/__data.php
$suffix = '/__data.json';
if (substr($uri, -strlen($suffix)) === $suffix) {
    $php_file_rel = str_replace($suffix, '/__data.php', $uri);
    $php_file = __DIR__ . $php_file_rel; // Flat build structure

    if (file_exists($php_file)) {
        router_log("Mapping JSON to PHP: $uri -> $php_file");
        header('Content-Type: application/json');
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        $_SERVER['SCRIPT_FILENAME'] = realpath($php_file);
        require $php_file;
        return;
    } else {
        // Do not fallback to index.php for __data.json
        http_response_code(404);
        echo json_encode(["error" => "Data not found", "path" => $uri]);
        return;
    }
}
` : `
// node-ssr mode: Do NOT rewrite __data.json to __data.php
// Instead, let it fall through to the Proxy (index.php) which forwards to sidecar.
`}

// 1. Serve static files if they exist
$path = __DIR__.$uri;
if ($uri !== '/' && file_exists($path) && is_file($path)) {
	// HEAD Support for static files
	if ($_SERVER['REQUEST_METHOD'] === 'HEAD') {
		$ext = pathinfo($path, PATHINFO_EXTENSION);
		$mime = match($ext) {
			'js', 'mjs', 'cjs' => 'application/javascript',
				'css' => 'text/css',
					'json' => 'application/json',
						'html', 'htm' => 'text/html',
							'xml' => 'text/xml',
								'txt' => 'text/plain',
									'svg' => 'image/svg+xml',
										'png' => 'image/png',
											'jpg', 'jpeg' => 'image/jpeg',
												'gif' => 'image/gif',
													'webp' => 'image/webp',
														'ico' => 'image/x-icon',
            default => mime_content_type($path) ?: 'application/octet-stream'
		};
		header('Content-Type: '.$mime);
		header('Content-Length: '.filesize($path));
		return;
	}
	return false; // serve as-is
}

${mode === "php-static" ? `
// 2. If it's a directory, manually serve index.php or index.html
if ($uri !== '/' && is_dir($path)) {
    foreach (['/index.php', '/index.html'] as $idx) {
        $candidate = $path . $idx;
        if (is_file($candidate)) {
            if (str_ends_with($candidate, '.php')) {
                $requested_file = realpath($candidate);
                if ($requested_file) {
                    router_log("Serving Directory Index PHP: $requested_file");
                    $_SERVER['SCRIPT_FILENAME'] = $requested_file;
                    require $requested_file;
                    return;
                }
            }

            router_log("Serving Directory Index HTML: $candidate");
            header('content-type: text/html; charset=utf-8');
            readfile($candidate);
            return;
        }
    }
}

// 3. Extensionless matching: /foo -> /foo.php or /foo.html
if ($uri !== '/') {
    foreach (['.php', '.html'] as $ext) {
        $candidate = $path . $ext;
        if (is_file($candidate)) {
            if ($ext === '.php') {
                $requested_file = realpath($candidate);
                if ($requested_file) {
                    router_log("Serving PHP file: $requested_file");
                    $_SERVER['SCRIPT_FILENAME'] = $requested_file;
                    require $requested_file;
                    return;
                }
            }

            router_log("Serving HTML file: $candidate");
            header('content-type: text/html; charset=utf-8');
            readfile($candidate);
            return;
        }
    }
}

// 4. Do not fallback API 404s to HTML
if ($uri === '/api' || str_starts_with($uri, '/api/')) {
    http_response_code(404);
    echo "404 Not Found (PHP Router)";
    return;
}

// 5. SPA/dynamic fallback for non-prerendered routes:
// prefer index.php if present, otherwise index.html
$fallback_php = __DIR__ . '/index.php';
$fallback_html = __DIR__ . '/index.html';

if (is_file($fallback_php)) {
    router_log("Serving Root Index PHP (Fallback): $fallback_php");
    $_SERVER['SCRIPT_FILENAME'] = realpath($fallback_php);
    require $fallback_php;
    return;
}

if (is_file($fallback_html)) {
    router_log("Serving Root Index HTML (Fallback): $fallback_html");
    header('content-type: text/html; charset=utf-8');
    readfile($fallback_html);
    return;
}

http_response_code(404);
echo "404 Not Found (PHP Router)";
return;
` : `
// 2. Serve PHP endpoints (directories with index.php)
// This handles +server.php which are copied to out/path/index.php
if (file_exists($path) && is_dir($path) && file_exists($path . '/index.php')) {
    // Check if it's a wrapper (has _server.php)
    if (file_exists($path . '/_server.php')) {
        $file = realpath($path . '/index.php');
        $_SERVER['SCRIPT_FILENAME'] = $file;
        require $file;
        return;
    }

    // If not a wrapper, it might be the Proxy (at root).
    // If index.html exists, serve it (Prerendered Page takes precedence over Proxy for HTML)
    if (file_exists($path . '/index.html')) {
        header('Content-Type: text/html');
        readfile($path . '/index.html');
        return;
    }

    $file = realpath($path . '/index.php');
    $_SERVER['SCRIPT_FILENAME'] = $file;
    require $file;
    return;
}

// Mode B: Fallback to Proxy (index.php)

// Check for index.html in the requested directory (Prerendered)
router_log("Checking index.html in path: $path");
if (is_dir($path)) {
    $index = rtrim($path, '/') . '/index.html';
    if (file_exists($index)) {
        router_log("Serving Prerendered Index: $index");
        header('Content-Type: text/html');
        readfile($index);
        return;
    } else {
        router_log("Prerendered Index not found: $index");
    }
} else {
    router_log("Not a directory: $path");
}

if (file_exists(__DIR__ . '/index.php')) {
    $file = realpath(__DIR__ . '/index.php');
    $_SERVER['SCRIPT_FILENAME'] = $file;
    // We must pass the original URI to the proxy (or stripped? Proxy expects stripped if base is set)
    // Actually, if we require index.php, it will read $_SERVER['REQUEST_URI'].
    // If router.php strips it, it only affects local $uri variable.
    // We should probably rely on index.php to handle the URI.
    require $file;
    return;
}
`}
`;
}

// adapter/src/runtime/node-ssr-templates.ts
function getNodeHandlerMjs(base = "") {
  return `
import { Server } from './index.js';
import { manifest } from './manifest.js';
import http from 'node:http';

const server = new Server(manifest);
await server.init({ env: process.env });

const PORT = process.env.PORT || 3000;

http.createServer(async (req, res) => {
	try {
		const protocol = req.headers['x-forwarded-proto'] || 'http';
		const host = req.headers['x-forwarded-host'] || req.headers.host;
		const url = new URL(req.url, \`\${protocol}://\${host}\`);

    // Health/Ready Checks
    const pathname = url.pathname;
    const base = '${base}';
    const healthPath = base + '/__health';
    const readyPath = base + '/__ready';

    if (pathname === '/__health' || pathname === '/__ready' ||
        (base && (pathname === healthPath || pathname === readyPath))) {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            ok: true,
            mode: 'node-ssr',
            ts: Date.now()
        }));
        return;
    }

    console.log('[Handler] Request: ' + req.method + ' ' + url.pathname);

    // Polyfill: SvelteKit may not handle HEAD for __data.json, so we simulate it by doing GET and stripping body
    const isHead = req.method === 'HEAD';
    const isDataRequest = url.pathname.endsWith('__data.json');
    const method = (isHead && isDataRequest) ? 'GET' : req.method;

    if (isHead && isDataRequest) {
        console.log('[Handler] Converting HEAD to GET for ' + url.pathname);
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
$base = '${base}';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'];
$reqId = uniqid('req_', true);

// Logging Helper
function proxy_log($msg) {
    global $reqId;
    $log = json_encode([
        'ts' => date('c'),
        'id' => $reqId,
        'msg' => $msg
    ]);
    file_put_contents('php://stderr', $log . "\\n", FILE_APPEND);
}

proxy_log("Proxy Start: Method=$method, URI=$uri");

// Max Body Check
$len = $_SERVER['CONTENT_LENGTH'] ?? 'unknown';
proxy_log("Body Check: Length=$len, Max=$maxBodyBytes");

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
        proxy_log("Proxy Error ($errno): $error");

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
function getHtaccess(mode, base = "", precompress = false) {
  let commonRules = `
    RewriteEngine On

    # 1. Serve static files if they exist
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]
`;
  if (precompress) {
    commonRules = `
    RewriteEngine On

    # 0. Precompression (Brotli)
    RewriteCond %{HTTP:Accept-Encoding} br
    RewriteCond %{REQUEST_FILENAME}.br -f
    RewriteRule ^(.*)$ $1.br [L]

    # 0. Precompression (Gzip)
    RewriteCond %{HTTP:Accept-Encoding} gzip
    RewriteCond %{REQUEST_FILENAME}.gz -f
    RewriteRule ^(.*)$ $1.gz [L]

    # Ensure Content-Type is correct for compressed files
    # This usually requires mod_mime and mod_headers.
    <IfModule mod_headers.c>
        <FilesMatch ".js.br$">
            Header set Content-Type "application/javascript"
            Header set Content-Encoding br
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch ".js.gz$">
            Header set Content-Type "application/javascript"
            Header set Content-Encoding gzip
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch ".css.br$">
            Header set Content-Type "text/css"
            Header set Content-Encoding br
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch ".css.gz$">
            Header set Content-Type "text/css"
            Header set Content-Encoding gzip
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch ".html.br$">
            Header set Content-Type "text/html"
            Header set Content-Encoding br
            Header append Vary Accept-Encoding
        </FilesMatch>
        <FilesMatch ".html.gz$">
            Header set Content-Type "text/html"
            Header set Content-Encoding gzip
            Header append Vary Accept-Encoding
        </FilesMatch>
    </IfModule>

    # 1. Serve static files if they exist
    RewriteCond %{REQUEST_FILENAME} -f
    RewriteRule ^ - [L]
`;
  }
  const cacheRules = `
    <IfModule mod_headers.c>
        # Immutable assets (hashed)
        <FilesMatch "^immutable/.*$">
            Header set Cache-Control "public, max-age=31536000, immutable"
        </FilesMatch>

        # Other assets in _app (not immutable)
        <FilesMatch "^_app/(?!immutable/).*$">
            Header set Cache-Control "public, max-age=0, must-revalidate"
        </FilesMatch>

        # HTML/PHP Pages and Data
        <FilesMatch ".(php|html)$">
            Header set Cache-Control "no-store, no-cache, must-revalidate, max-age=0"
        </FilesMatch>
    </IfModule>
`;
  if (mode === "node-ssr") {
    return `
<IfModule mod_rewrite.c>
${commonRules}
    # 2. Serve directory index if it exists (e.g. index.php)
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteCond %{REQUEST_FILENAME}/index.php -f
    RewriteRule ^ %{REQUEST_URI}/index.php [L]

    # 3. Proxy everything else to index.php (which proxies to Node)
    RewriteRule ^ index.php [L]
</IfModule>
${cacheRules}
`;
  }
  return `
<IfModule mod_rewrite.c>
${commonRules}
    # 2. SvelteKit __data.json Bridge
    # Rewrite /path/__data.json -> /path/__data.php
    RewriteRule ^(.*)/__data\\.json$ $1/__data.php [L]

    # 3. Handle Prerendered HTML / PHP
    # If request is /foo, check for /foo.php (prerendered)
    RewriteCond %{REQUEST_FILENAME}.php -f
    RewriteRule ^(.*)$ $1.php [L]

    # 4. Fallback to index.php (SPA / Dynamic)
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^ index.php [L]
</IfModule>
${cacheRules}
`;
}
function getStandaloneApiPhp(serverFilePath, relativePathToRoot) {
  const negotiationLogic = relativePathToRoot ? `
// Content Negotiation: If HTML requested, proxy to Node (Page)
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
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
                 if (str_starts_with(trim($parts[$i]), 'q=')) $q = (float)substr(trim($parts[$i]), 2);
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
function sk_request_body(): string {
    return file_get_contents('php://input') ?: '';
}

function sk_json_body(): mixed {
    $raw = sk_request_body();
    return json_decode($raw, true);
}

// Build param object similar to RequestEvent
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

// adapter/src/index.ts
function sveltekitPhpAdapter(options = {}) {
  const {
    mode = "php-static",
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
      const outDir = path2.resolve(out);
      const assetsDir = path2.resolve(assets);
      const tmpDir = builder.getBuildDirectory("sveltekit-php");
      builder.log.minor(`Adapting for mode: ${mode}`);
      console.log("--- USING UPDATED ADAPTER ---");
      builder.log.minor("Cleaning output/temp");
      builder.rimraf(outDir);
      builder.rimraf(assetsDir);
      builder.rimraf(tmpDir);
      builder.mkdirp(outDir);
      builder.mkdirp(assetsDir);
      builder.mkdirp(tmpDir);
      builder.log.minor("Writing client assets");
      const writtenClientFiles = builder.writeClient(assetsDir);
      builder.log.minor("Prerendering pages");
      const prerenderedRoot = path2.join(tmpDir, "prerendered");
      builder.writePrerendered(prerenderedRoot);
      if (mode === "node-ssr") {
        builder.log.minor("Generating Node SSR output");
        builder.copy(prerenderedRoot, outDir);
        const serverDir = path2.join(outDir, "server");
        builder.mkdirp(serverDir);
        builder.writeServer(serverDir);
        const manifest = builder.generateManifest({ relativePath: "." });
        await writeFile(path2.join(serverDir, "manifest.js"), `export const manifest = ${manifest};
`);
        const handler = getNodeHandlerMjs(builder.config.kit.paths.base);
        await writeFile(path2.join(serverDir, "handler.mjs"), handler);
        const proxy = getPhpProxy("http://127.0.0.1:3000");
        await writeFile(path2.join(outDir, "index.php"), proxy);
        const htaccess = getHtaccess("node-ssr", builder.config.kit.paths.base, precompress);
        await writeFile(path2.join(outDir, ".htaccess"), htaccess.trim());
        const routesBaseFs = path2.resolve(builder.config.kit.files.routes);
        const phpApiFiles = await import_tiny_glob.default("**/+server.php", { cwd: routesBaseFs });
        for (const file of phpApiFiles) {
          const routeDir = path2.dirname(file);
          const destDir = path2.join(outDir, routeDir);
          const srcFile = path2.join(routesBaseFs, file);
          builder.mkdirp(destDir);
          await builder.copy(srcFile, path2.join(destDir, "_server.php"));
          const siblingPageCandidates = [
            path2.join(routesBaseFs, routeDir, "+page.svelte"),
            path2.join(routesBaseFs, routeDir, "+page.js"),
            path2.join(routesBaseFs, routeDir, "+page.ts"),
            path2.join(routesBaseFs, routeDir, "+page.server.js"),
            path2.join(routesBaseFs, routeDir, "+page.server.ts")
          ];
          let hasSiblingPage = false;
          for (const c of siblingPageCandidates) {
            if (await exists(c)) {
              hasSiblingPage = true;
              break;
            }
          }
          const relToRoot = path2.relative(destDir, outDir).replace(/\\/g, "/");
          const possibleHtml = destDir + ".html";
          if (await exists(possibleHtml)) {
            builder.log.minor(`Moving conflicting prerendered file ${possibleHtml} to ${path2.join(destDir, "index.html")}`);
            await rename(possibleHtml, path2.join(destDir, "index.html"));
            hasSiblingPage = true;
          }
          const wrapper = getStandaloneApiPhp("_server.php", hasSiblingPage ? relToRoot : undefined);
          await writeFile(path2.join(destDir, "index.php"), wrapper);
        }
        builder.log.minor("Generating router.php");
        const router = getRouterPhp(builder.config.kit.paths.base, "node-ssr");
        await writeFile(path2.join(outDir, "router.php"), router, "utf8");
      } else {
        let getRouteDeps = function(routeIdPosix) {
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
        };
        const routesBaseFs = path2.resolve(builder.config.kit.files.routes);
        const routesBasePosix = posixify(routesBaseFs);
        const files1 = await import_tiny_glob.default("**/+*.server.php", { cwd: routesBaseFs, absolute: true });
        const files2 = await import_tiny_glob.default("**/+server.php", { cwd: routesBaseFs, absolute: true });
        const allServerPhpFs = [...files1, ...files2];
        const allServerRelPosix = new Set(allServerPhpFs.map(posixify).map((abs) => {
          const rel = abs.startsWith(routesBasePosix) ? abs.slice(routesBasePosix.length) : abs;
          return rel.startsWith("/") ? rel : "/" + rel;
        }));
        if (!fallback && strict !== false) {
          const dynamic = builder.routes.filter((r) => r.prerender !== true);
          const trulyDynamic = dynamic.filter((r) => {
            const id = r.id.startsWith("/") ? r.id : "/" + r.id;
            const candidate = id + "/+server.php";
            if (allServerRelPosix.has(candidate))
              return false;
            return true;
          });
          if (trulyDynamic.length) {
            const prefix = path2.relative(".", builder.config.kit.files.routes);
            const errorLines = [
              "All routes must be prerenderable for this adapter output.",
              "Found non-prerenderable routes:"
            ];
            trulyDynamic.forEach((r) => {
              errorLines.push("- " + path2.posix.join(prefix, r.id));
            });
            errorLines.push("Fix: set prerender per-route, or configure SvelteKit prerender entries appropriately, or implement a fallback strategy.");
            builder.log.error(errorLines.join(`
`));
            throw new Error("Encountered non-prerenderable routes");
          }
        }
        builder.log.minor("Prerendered pages: " + Array.from(builder.prerendered.pages.entries()).map(([k, v]) => k + " -> " + v.file).join(", "));
        const protectedMap = new Map;
        const fnPrefixMap = new Map;
        for (const rel of allServerRelPosix) {
          const prefix = fnPrefixForServerFile(rel);
          fnPrefixMap.set(rel, prefix);
          const protectedRel = "/_protected/" + rel.replace(/^\//, "").replace(/\//g, "__").replace(/\+layout\.server\.php$/i, "_layout.php").replace(/\+page\.server\.php$/i, "_page.php").replace(/\+server\.php$/i, "_server.php").replace(/\.server\.php$/i, ".php");
          protectedMap.set(rel, protectedRel);
        }
        const usedServerFiles = new Set;
        for (const [navPathRaw, filePath] of builder.prerendered.pages) {
          const navPath = navPathRaw;
          builder.log.minor("Preparing PHP route: " + navPath);
          let routePath = navPath;
          const basePath = builder.config.kit.paths.base;
          if (basePath && routePath.startsWith(basePath)) {
            routePath = routePath.slice(basePath.length);
            if (!routePath.startsWith("/"))
              routePath = "/" + routePath;
          }
          const route = findRouteForNavPath(builder, routePath);
          const routeId = route?.id ?? routePath;
          if (navPath.includes("matrix")) {
            console.log(`DEBUG: Route for ${navPath}:`, JSON.stringify(route, null, 2));
          }
          const { files: deps, loadMapItems } = getRouteDeps(routeId);
          for (const d of deps)
            usedServerFiles.add(d);
          const htmlFs = path2.join(prerenderedRoot, filePath.file);
          const htmlDir = path2.dirname(htmlFs);
          if (!await exists(htmlFs)) {
            builder.log.warn("HTML file not found: " + htmlFs + ". Skipping route.");
            continue;
          }
          const candidates = [
            path2.join(htmlDir, "__data.json"),
            path2.join(prerenderedRoot, stripLeadingSlash(navPath), "__data.json")
          ];
          if (!htmlFs.endsWith("index.html") && htmlFs.endsWith(".html")) {
            const baseName = path2.basename(htmlFs, ".html");
            candidates.push(path2.join(htmlDir, baseName, "__data.json"));
          }
          let html = await readFile(htmlFs, "utf8");
          const inlineMode = detectInlineDataModeFromHtml(html);
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
            templateJson = await readFile(templateJsonFs, "utf8");
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
            const nodeIdsMatch = html.match(/node_ids:\s*\[([\d,\s]+)\]/);
            if (nodeIdsMatch) {
              const ids = nodeIdsMatch[1].split(",").filter((s) => s.trim() !== "");
              nodeCount = ids.length;
            } else {
              nodeCount = 2;
            }
            const nodes = new Array(nodeCount).fill(null);
            const synthTemplate = { type: "data", nodes };
            templateJson = JSON.stringify(synthTemplate);
            const synthPath = path2.join(htmlDir, "__data.template.json");
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
          const base = builder.config.kit.paths.base;
          if (base && fsPath.startsWith(base)) {
            fsPath = fsPath.slice(base.length);
            if (!fsPath.startsWith("/"))
              fsPath = "/" + fsPath;
          }
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
          const dataPhp = getDataPhp(includes, builder.config.kit.paths.base).replace("PLACEHOLDER_ROUTE_ID", JSON.stringify(navPath)).replace("PLACEHOLDER_TEMPLATE_JSON", templateJson).replace("PLACEHOLDER_LOAD_FNS", loadFnsPhp).replace("PLACEHOLDER_INLINE_MODE", JSON.stringify(inlineMode)).replaceAll("PLACEHOLDER_APP_ID", appHash);
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
            if (replaced) {
              const inlineMode2 = detectInlineDataModeFromHtml(html);
              html = replaced;
              html = html.replace(/<script>__sveltekit_[A-Za-z0-9_]+\.resolve\([\s\S]*?<\/script>\s*/g, "");
              const bootstrap = getBootstrapPhp(navPath, loadFnsPhp, templateJson, inlineMode2, requirePrefix).replace("PLACEHOLDER_APP_ID", appHash);
              const footer = getFooterPhp(appHash);
              html = bootstrap + html + footer;
            } else {
              const bootstrap = getMinimalBootstrapPhp(requirePrefix);
              html = bootstrap + html;
            }
            if (templateJsonFs && await exists(templateJsonFs)) {
              await rename(templateJsonFs, path2.join(path2.dirname(templateJsonFs), "__data.template.json"));
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
          } else {
            if (await exists(htmlFs) && htmlFs.endsWith(".html")) {
              const phpFs = htmlFs.replace(/\.html$/i, ".php");
              await rename(htmlFs, phpFs);
            }
          }
        }
        builder.log.minor("Generating runtime shims for non-prerendered pages");
        for (const r of builder.routes) {
          if (r.prerender === true)
            continue;
          const routeId = r.id.startsWith("/") ? r.id : "/" + r.id;
          if (routeId === "/" || routeId === "")
            continue;
          if (routeId === "/api" || routeId.startsWith("/api/"))
            continue;
          const pageServerRel = routeId + "/+page.server.php";
          if (!allServerRelPosix.has(pageServerRel))
            continue;
          const outDirForRoute = path2.join(prerenderedRoot, stripLeadingSlash(routeId));
          const outIndexPhp = path2.join(outDirForRoute, "index.php");
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
          const fsPath = routeId.endsWith("/") ? routeId : routeId + "/";
          const relToRoot = phpRelToRootFromNav(fsPath);
          const includes = deps.map((d) => {
            const protectedRel = protectedMap.get(d);
            return protectedRel ? "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, "") + "';" : "";
          }).filter(Boolean);
          const loadFnList = loadMapItems.map((i) => i.fn);
          const loadFnsPhp = "[" + loadFnList.map((fn) => `'${fn}'`).join(", ") + "]";
          const shimPhp = `<?php
declare(strict_types = 1);

if (!defined('SK_BASE_PATH')) {
	define('SK_BASE_PATH', ${JSON.stringify(builder.config.kit.paths.base || "")});
}

${includes.join(`
`)}

$loadFns = ${loadFnsPhp};
$routeid = ${JSON.stringify(routeId)};

$base = [];
foreach ($loadFns as $fn) {
	if (!function_exists($fn)) continue;

	$event = [
		'params' => [],
		'url' => (object)[
			'searchParams' => (object)$_GET,
			'pathname' => parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH)
		],
		'request' => (object)[
			'headers' => (object)[
				'cookie' => $_SERVER['HTTP_COOKIE'] ?? ''
			]
		],
		'cookies' => $_COOKIE,
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

$fallback_php = __DIR__ . '/${relToRoot.replace(/^\.\//, "")}index.php';
$fallback_html = __DIR__ . '/${relToRoot.replace(/^\.\//, "")}index.html';

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

http_response_code(404);
echo '404 Not Found (PHP Router)';
`;
          builder.mkdirp(outDirForRoute);
          await writeFile(outIndexPhp, shimPhp, "utf8");
        }
        builder.log.minor("Generating API endpoints");
        for (const relPosix of allServerRelPosix) {
          if (relPosix.endsWith("+server.php")) {
            const routeDir = path2.dirname(relPosix);
            const prefix = fnPrefixMap.get(relPosix);
            const protectedRel = protectedMap.get(relPosix);
            if (!prefix || !protectedRel)
              continue;
            usedServerFiles.add(relPosix);
            const outDir2 = path2.join(prerenderedRoot, stripLeadingSlash(routeDir));
            builder.mkdirp(outDir2);
            const relToRoot = phpRelToRootFromNav(routeDir + "/");
            const include = "require_once __DIR__ . '/" + relToRoot + protectedRel.replace(/^\//, "") + "';";
            const apiPhp = getApiPhp([include], prefix);
            const indexPhp = path2.join(outDir2, "index.php");
            let pageFile = null;
            if (await exists(indexPhp)) {
              pageFile = indexPhp;
            } else if (stripLeadingSlash(routeDir) !== "" && stripLeadingSlash(routeDir) !== ".") {
              const siblingPhp = outDir2 + ".php";
              if (await exists(siblingPhp)) {
                pageFile = siblingPhp;
              }
            }
            builder.log.minor(`Checking for collision at ${indexPhp} or sibling`);
            if (pageFile) {
              builder.log.minor(`Collision found at ${pageFile}`);
              if (pageFile === indexPhp) {
                await rename(pageFile, path2.join(outDir2, "_page.php"));
              } else {
                let content = await readFile(pageFile, "utf8");
                content = content.replace(/require_once __DIR__ \. '\//g, "require_once __DIR__ . '/../");
                await writeFile(path2.join(outDir2, "_page.php"), content, "utf8");
                await builder.rimraf(pageFile);
              }
              await writeFile(path2.join(outDir2, "_server_dispatch.php"), apiPhp, "utf8");
              const negotiationPhp = `<?php
// SvelteKit-style Content Negotiation
// Generated by @ryanspice/sveltekit-adapter-php

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';

// 1. Method Precedence
// SvelteKit rules: PUT/PATCH/DELETE/OPTIONS -> always +server
if (in_array($method, ['PUT', 'PATCH', 'DELETE', 'OPTIONS'])) {
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
            if (str_starts_with($part, 'q=')) {
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
              await writeFile(indexPhp, negotiationPhp, "utf8");
            } else {
              await writeFile(indexPhp, apiPhp, "utf8");
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
            src = src.replace(/function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s*\(/g, (_, name) => "function " + prefix + "_" + name + "(");
            await writeFile(outFs, src, "utf8");
          })());
        }
        await Promise.all(conversions);
        builder.log.minor("Copying build to output");
        builder.copy(prerenderedRoot, outDir);
        builder.log.minor("Generating .htaccess");
        const htaccess = getHtaccess("php-static", builder.config.kit.paths.base, precompress);
        await writeFile(path2.join(outDir, ".htaccess"), htaccess.trim(), "utf8");
        builder.log.minor("Generating router.php");
        const router = getRouterPhp(builder.config.kit.paths.base, "php-static");
        await writeFile(path2.join(outDir, "router.php"), router, "utf8");
      }
      if (precompress) {
        builder.log.minor("Compressing assets");
        await builder.compress(outDir);
      }
      builder.log.minor("Done");
    }
  };
}
export {
  sveltekitPhpAdapter as default
};
