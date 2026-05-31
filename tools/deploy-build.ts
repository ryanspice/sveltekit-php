#!/usr/bin/env bun
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';

type Mode = 'fast' | 'hash';

type ManifestFile = {
	path: string; // posix relative
	size: number;
	mtimeMs: number;
	sha256?: string; // only in hash mode (or older cache)
};

type Manifest = {
	version: 2;
	createdAt: string;
	localRoot: string;
	mode: Mode;
	files: Record<string, ManifestFile>;
};

type Options = {
	profile: string;
	host: string;
	user: string;
	port: number;
	remote: string;
	local: string;

	mode: Mode; // fast default
	progress: boolean;

	thresholdFiles: number; // 0..1
	thresholdBytes: number; // 0..1
	dryRun: boolean;
	forceFull: boolean;

	archive: boolean;
	cleanup: boolean;
	cleanupBackground: boolean;
	cleanupMaxSecs: number;
	cleanupStallSecs: number;

	wipeRemote: boolean;
	yesWipe: boolean;

	deleteRemote: boolean; // patch-mode delete removed files

	yes: boolean; // skip prompt
	listLimit: number;
};

const DEFAULTS = {
	profile: 'mark8t-dev',
	local: './build',
	port: 22,
	thresholdFiles: 0.35,
	thresholdBytes: 0.5,
	listLimit: 200,
	mode: 'fast' as Mode,
	progress: true,
	cleanupMaxSecs: 90,
	cleanupStallSecs: 15
};

function parseArgs(argv: string[]): Record<string, string | boolean> {
	const out: Record<string, string | boolean> = {};
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i]!;
		if (!a.startsWith('--')) continue;

		const [k, vRaw] = a.includes('=') ? a.split('=', 2) : [a, undefined];
		const key = k.slice(2);
		if (vRaw !== undefined) {
			out[key] = vRaw;
			continue;
		}

		const next = argv[i + 1];
		if (next && !next.startsWith('--')) {
			out[key] = next;
			i++;
		} else {
			out[key] = true;
		}
	}
	return out;
}

function env(name: string): string | undefined {
	const v = process.env[name];
	return v && v.trim().length ? v.trim() : undefined;
}

function must(v: string | undefined, name: string): string {
	if (!v) {
		console.error(`Missing required "${name}". Set via --${name} or DEPLOY_${name.toUpperCase()}.`);
		process.exit(2);
	}
	return v;
}

function parseBool(v: unknown, def: boolean): boolean {
	if (v === undefined || v === null) return def;
	if (typeof v === 'boolean') return v;
	const s = String(v).trim().toLowerCase();
	if (!s) return def;
	return !(s === '0' || s === 'false' || s === 'no' || s === 'off');
}

function parseNum(v: unknown, def: number): number {
	const n = Number(v);
	return Number.isFinite(n) ? n : def;
}

function parseMode(v: unknown): Mode {
	const s = String(v ?? '')
		.trim()
		.toLowerCase();
	if (s === 'hash' || s === 'accurate' || s === 'sha' || s === 'sha256') return 'hash';
	return 'fast';
}

function toPosixRel(rel: string): string {
	return rel.split(path.sep).join('/');
}

function fmtPct(n: number): string {
	return `${Math.round(n * 1000) / 10}%`;
}

function fmtBytes(n: number): string {
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	let v = n;
	let i = 0;
	while (v >= 1024 && i < units.length - 1) {
		v /= 1024;
		i++;
	}
	const s = i === 0 ? `${v}` : `${Math.round(v * 10) / 10}`;
	return `${s} ${units[i]}`;
}

async function promptYesNo(question: string, def = false): Promise<boolean> {
	if (!process.stdin.isTTY) {
		console.error('No TTY for prompt. Re-run with --yes for non-interactive.');
		process.exit(2);
	}
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	const suffix = def ? '[Y/n]' : '[y/N]';
	const ans = (await rl.question(`${question} ${suffix} `)).trim().toLowerCase();
	rl.close();
	if (!ans) return def;
	return ans === 'y' || ans === 'yes';
}

async function run(
	cmd: string,
	args: string[],
	envOverride?: Record<string, string>
): Promise<number> {
	return await new Promise((resolve, reject) => {
		const p = spawn(cmd, args, {
			stdio: 'inherit',
			env: envOverride ? { ...process.env, ...envOverride } : process.env
		});
		p.on('error', reject);
		p.on('close', (code) => resolve(code ?? 1));
	});
}

async function walkFiles(rootAbs: string): Promise<string[]> {
	const out: string[] = [];
	async function rec(dirAbs: string) {
		const ents = await fs.readdir(dirAbs, { withFileTypes: true });
		for (const e of ents) {
			const pAbs = path.join(dirAbs, e.name);
			if (e.isDirectory()) await rec(pAbs);
			else if (e.isFile()) out.push(pAbs);
		}
	}
	await rec(rootAbs);
	return out;
}

async function sha256File(fileAbs: string): Promise<string> {
	const h = crypto.createHash('sha256');
	await new Promise<void>((resolve, reject) => {
		const s = fssync.createReadStream(fileAbs);
		s.on('data', (d) => h.update(d));
		s.on('error', reject);
		s.on('end', () => resolve());
	});
	return h.digest('hex');
}

function limiter(concurrency: number) {
	let active = 0;
	const queue: Array<() => void> = [];
	const runNext = () => {
		if (active >= concurrency) return;
		const fn = queue.shift();
		if (!fn) return;
		active++;
		fn();
	};
	return async <T>(task: () => Promise<T>): Promise<T> =>
		await new Promise<T>((resolve, reject) => {
			queue.push(async () => {
				try {
					const res = await task();
					resolve(res);
				} catch (e) {
					reject(e);
				} finally {
					active--;
					runNext();
				}
			});
			runNext();
		});
}

function makeProgressPrinter(enabled: boolean) {
	let last = 0;
	return (label: string, i: number, total: number, rel?: string) => {
		if (!enabled) return;
		const now = Date.now();
		if (now - last < 120) return; // throttle
		last = now;
		const pct = total ? Math.round((i / total) * 1000) / 10 : 0;
		const tail = rel ? ` | ${rel}` : '';
		process.stdout.write(`\r${label} ${i}/${total} (${pct}%)${tail}        `);
	};
}

async function buildManifest(
	localRootAbs: string,
	mode: Mode,
	progress: boolean
): Promise<Manifest> {
	const filesAbs = await walkFiles(localRootAbs);
	const files: Record<string, ManifestFile> = {};
	const tick = makeProgressPrinter(progress);

	if (mode === 'fast') {
		for (let i = 0; i < filesAbs.length; i++) {
			const abs = filesAbs[i]!;
			const st = await fs.stat(abs);
			const rel = toPosixRel(path.relative(localRootAbs, abs));
			tick('Scanning', i + 1, filesAbs.length, rel);
			files[rel] = { path: rel, size: st.size, mtimeMs: st.mtimeMs };
		}
		if (progress) process.stdout.write('\n');
	} else {
		const limit = limiter(6);
		let done = 0;
		await Promise.all(
			filesAbs.map((abs) =>
				limit(async () => {
					const st = await fs.stat(abs);
					const rel = toPosixRel(path.relative(localRootAbs, abs));
					const sha = await sha256File(abs);
					files[rel] = { path: rel, size: st.size, mtimeMs: st.mtimeMs, sha256: sha };
					done++;
					tick('Hashing', done, filesAbs.length, rel);
				})
			)
		);
		if (progress) process.stdout.write('\n');
	}

	return {
		version: 2,
		createdAt: new Date().toISOString(),
		localRoot: localRootAbs,
		mode,
		files
	};
}

async function loadManifest(p: string): Promise<Manifest | null> {
	try {
		const raw = await fs.readFile(p, 'utf8');
		const j = JSON.parse(raw);

		// version 1 (older): no mode field, sha required. Convert.
		if (j?.version === 1 && j?.files) {
			const files: Record<string, ManifestFile> = {};
			for (const [k, v] of Object.entries(
				j.files as Record<
					string,
					{ path?: unknown; size?: unknown; mtimeMs?: unknown; sha256?: unknown }
				>
			)) {
				files[k] = {
					path: String(v.path ?? k),
					size: Number(v.size ?? 0),
					mtimeMs: Number(v.mtimeMs ?? 0),
					sha256: String(v.sha256 ?? '')
				};
			}
			return {
				version: 2,
				createdAt: String(j.createdAt ?? new Date().toISOString()),
				localRoot: String(j.localRoot ?? ''),
				mode: 'hash',
				files
			};
		}

		if (j?.version === 2 && j?.files && (j.mode === 'fast' || j.mode === 'hash')) {
			return j as Manifest;
		}

		return null;
	} catch {
		return null;
	}
}

async function saveManifest(p: string, m: Manifest): Promise<void> {
	await fs.mkdir(path.dirname(p), { recursive: true });
	await fs.writeFile(p, JSON.stringify(m, null, 2), 'utf8');
}

function fileChanged(prev: ManifestFile | undefined, curr: ManifestFile, mode: Mode): boolean {
	if (!prev) return true;

	// FAST default: metadata only
	const metaDiff = prev.size !== curr.size || Math.abs(prev.mtimeMs - curr.mtimeMs) > 1;
	if (mode === 'fast') return metaDiff;

	// HASH mode: prefer sha when present, fallback to metadata
	if (prev.sha256 && curr.sha256) return prev.sha256 !== curr.sha256;
	return metaDiff;
}

function diffManifests(prev: Manifest | null, curr: Manifest, mode: Mode) {
	const prevFiles = prev?.files ?? {};
	const currFiles = curr.files;

	const changed: string[] = [];
	const removed: string[] = [];

	let totalBytes = 0;
	let changedBytes = 0;

	const currKeys = Object.keys(currFiles);
	for (const k of currKeys) {
		const f = currFiles[k]!;
		totalBytes += f.size;

		const pf = prevFiles[k];
		if (fileChanged(pf, f, mode)) {
			changed.push(k);
			changedBytes += f.size;
		}
	}

	for (const k of Object.keys(prevFiles)) {
		if (!currFiles[k]) removed.push(k);
	}

	const totalFiles = currKeys.length;
	const changedFiles = changed.length + removed.length;

	return {
		changed,
		removed,
		totalFiles,
		changedFiles,
		totalBytes,
		changedBytes,
		changedFileRatio: totalFiles ? changedFiles / totalFiles : 1,
		changedByteRatio: totalBytes ? changedBytes / totalBytes : 1
	};
}

function sshTarget(o: Options): string {
	return `${o.user}@${o.host}`;
}

function remoteFileFor(o: Options, relPosix: string): string {
	const base = o.remote.replace(/\/+$/, '');
	const r = relPosix ? `${base}/${relPosix}` : base;
	return `${sshTarget(o)}:${r}`;
}

function remoteDirFor(o: Options, relPosix: string): string {
	const relDir = relPosix.includes('/') ? relPosix.slice(0, relPosix.lastIndexOf('/')) : '';
	const r = relDir ? `${o.remote.replace(/\/+$/, '')}/${relDir}` : o.remote.replace(/\/+$/, '');
	return r;
}

async function ensureRemoteDirs(o: Options, relPaths: string[]): Promise<void> {
	const dirs = new Set<string>();
	for (const rel of relPaths) dirs.add(remoteDirFor(o, rel));
	const list = Array.from(dirs).sort();

	const chunkSize = 80;
	for (let i = 0; i < list.length; i += chunkSize) {
		const chunk = list.slice(i, i + chunkSize);
		const cmd = `mkdir -p ${chunk.map((d) => `"${d.replace(/"/g, '\\"')}"`).join(' ')}`;
		const code = await run('ssh', ['-p', String(o.port), sshTarget(o), cmd]);
		if (code !== 0) process.exit(code);
	}
}

async function sftpBatch(o: Options, lines: string[]): Promise<void> {
	const cacheDir = path.resolve('.deploy-cache', o.profile);
	await fs.mkdir(cacheDir, { recursive: true });
	const batchPath = path.join(cacheDir, `sftp-${Date.now()}.batch`);
	await fs.writeFile(batchPath, lines.join('\n') + '\n', 'utf8');

	const code = await run('sftp', ['-P', String(o.port), '-b', batchPath, sshTarget(o)]);
	await fs.rm(batchPath, { force: true });

	if (code !== 0) process.exit(code);
}

async function patchUpload(o: Options, relChanged: string[], relRemoved: string[]): Promise<void> {
	if (!relChanged.length && !(o.deleteRemote && relRemoved.length)) {
		console.log('No changes to upload.');
		return;
	}

	await run('ssh', [
		'-p',
		String(o.port),
		sshTarget(o),
		`mkdir -p "${o.remote.replace(/"/g, '\\"')}"`
	]);

	if (relChanged.length) await ensureRemoteDirs(o, relChanged);

	const localRootAbs = path.resolve(o.local);
	const batch: string[] = [];
	batch.push(`cd "${o.remote.replace(/"/g, '\\"')}"`);

	for (const rel of relChanged) {
		const localAbs = path.join(localRootAbs, rel.split('/').join(path.sep));
		const localEsc = localAbs.replace(/\\/g, '/');
		const remoteRel = rel.replace(/"/g, '\\"');
		batch.push(`put -p "${localEsc.replace(/"/g, '\\"')}" "${remoteRel}"`);
	}

	if (o.deleteRemote && relRemoved.length) {
		for (const rel of relRemoved) {
			const remoteRel = rel.replace(/"/g, '\\"');
			batch.push(`rm "${remoteRel}"`);
		}
	}

	await sftpBatch(o, batch);
}

async function wipeRemote(o: Options): Promise<void> {
	if (!o.wipeRemote) return;
	if (!o.yesWipe) {
		console.error('Refusing to wipe remote without --yes-wipe.');
		process.exit(3);
	}

	const r = o.remote.replace(/"/g, '\\"').replace(/\/+$/, '');
	const cmd =
		`mkdir -p "${r}" && ` + `rm -rf "${r}"/* "${r}"/.[!.]* "${r}"/..?* 2>/dev/null || true`;

	const code = await run('ssh', ['-p', String(o.port), sshTarget(o), cmd]);
	if (code !== 0) process.exit(code);
}

async function fullUploadArchive(o: Options, curr: Manifest): Promise<void> {
	const localAbs = path.resolve(o.local);
	const cacheDir = path.resolve('.deploy-cache', o.profile);
	await fs.mkdir(cacheDir, { recursive: true });

	const stamp = new Date().toISOString().replace(/[:.]/g, '-');
	const archiveLocal = path.join(cacheDir, `build-${stamp}.tgz`);
	const keepLocal = path.join(cacheDir, `keep-${stamp}.txt`);
	const cleanupLocal = path.join(cacheDir, `cleanup-${stamp}.sh`);
	const runnerLocal = path.join(cacheDir, `runner-${stamp}.sh`);

	const remoteBaseRaw = o.remote.replace(/\/+$/, '');
	const remoteTgzRaw = `${remoteBaseRaw}/.deploy-upload.tgz`;
	const remoteKeepRaw = `${remoteBaseRaw}/.deploy-keep.txt`;
	const remoteCleanupRaw = `${remoteBaseRaw}/.deploy-cleanup.sh`;
	const remoteRunnerRaw = `${remoteBaseRaw}/.deploy-cleanup-runner.sh`;
	const remoteLogRaw = `${remoteBaseRaw}/.deploy-cleanup.log`;

	const remoteBaseQ = remoteBaseRaw.replace(/"/g, '\\"');
	const remoteTgzQ = remoteTgzRaw.replace(/"/g, '\\"');
	const remoteCleanupQ = remoteCleanupRaw.replace(/"/g, '\\"');
	const remoteRunnerQ = remoteRunnerRaw.replace(/"/g, '\\"');
	const remoteLogQ = remoteLogRaw.replace(/"/g, '\\"');

	// Keep list from manifest keys
	const keepList = Object.keys(curr.files).sort().join('\n') + '\n';
	await fs.writeFile(keepLocal, keepList, 'utf8');

	// Cleanup script: delete remote files not in keep list, heartbeat for watchdog
	const cleanupScript = `#!/bin/sh
set -e
cd "${remoteBaseQ}" || exit 0
HB=".deploy-heartbeat"
beat() { date +%s > "$HB" 2>/dev/null || true; }
beat

sort ".deploy-keep.txt" > ".deploy-keep-sorted.txt"
beat

find . -type f -print | sed 's|^\\./||' | sort > ".deploy-remote.txt"
beat

comm -23 ".deploy-remote.txt" ".deploy-keep-sorted.txt" > ".deploy-delete.txt" || true
beat

if [ -s ".deploy-delete.txt" ]; then
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    case "$f" in
      .deploy-*) continue ;;
    esac
    beat
    rm -f -- "$f" || true
  done < ".deploy-delete.txt"
fi

find . -type d -empty -delete 2>/dev/null || true
beat

rm -f ".deploy-remote.txt" ".deploy-keep-sorted.txt" ".deploy-delete.txt" 2>/dev/null || true
`;
	await fs.writeFile(cleanupLocal, cleanupScript, 'utf8');

	// Runner/watchdog: kill on stall or timeout, kill previous cleanup, log to file
	const runnerScript = `#!/bin/sh
set -e
cd "${remoteBaseQ}" || exit 0

LOG=".deploy-cleanup.log"
PIDFILE=".deploy-cleanup.pid"
HB=".deploy-heartbeat"
MAX="${o.cleanupMaxSecs}"
STALL="${o.cleanupStallSecs}"

ts() { date -Is 2>/dev/null || date; }
echo "[runner] start $(ts) max=${o.cleanupMaxSecs}s stall=${o.cleanupStallSecs}s" >> "$LOG"

if [ -f "$PIDFILE" ]; then
  old="$(cat "$PIDFILE" 2>/dev/null || true)"
  case "$old" in
    ''|*[!0-9]*) ;;
    *)
      if kill -0 "$old" 2>/dev/null; then
        echo "[runner] killing previous pid=$old $(ts)" >> "$LOG"
        kill "$old" 2>/dev/null || true
        sleep 2
        kill -9 "$old" 2>/dev/null || true
      fi
    ;;
  esac
  rm -f "$PIDFILE" 2>/dev/null || true
fi

date +%s > "$HB" 2>/dev/null || echo 0 > "$HB"

NICE=""
if command -v nice >/dev/null 2>&1; then NICE="nice -n 10"; fi

($NICE sh ".deploy-cleanup.sh") >> "$LOG" 2>&1 &
pid=$!
echo "$pid" > "$PIDFILE"
start="$(date +%s)"

kill_it() {
  why="$1"
  echo "[runner] $why pid=$pid $(ts)" >> "$LOG"
  kill "$pid" 2>/dev/null || true
  sleep 3
  kill -9 "$pid" 2>/dev/null || true
}

while kill -0 "$pid" 2>/dev/null; do
  now="$(date +%s)"
  if [ $((now-start)) -gt "$MAX" ]; then
    kill_it "timeout"
    break
  fi
  hb="$(cat "$HB" 2>/dev/null || echo 0)"
  case "$hb" in ''|*[!0-9]*) hb=0 ;; esac
  if [ "$hb" -gt 0 ] && [ $((now-hb)) -gt "$STALL" ]; then
    kill_it "stall (no heartbeat for ${o.cleanupStallSecs}s)"
    break
  fi
  sleep 2
done

wait "$pid" 2>/dev/null || true
rm -f "$PIDFILE" "$HB" ".deploy-keep.txt" ".deploy-cleanup.sh" ".deploy-cleanup-runner.sh" 2>/dev/null || true
echo "[runner] end $(ts)" >> "$LOG"
`;
	await fs.writeFile(runnerLocal, runnerScript, 'utf8');

	// FAST mode: favor speed over compression ratio
	const tarEnv = o.mode === 'fast' ? { GZIP: '-1' } : undefined;
	let code = await run('tar', ['-czf', archiveLocal, '-C', localAbs, '.'], tarEnv);
	if (code !== 0) process.exit(code);

	code = await run('ssh', ['-p', String(o.port), sshTarget(o), `mkdir -p "${remoteBaseQ}"`]);
	if (code !== 0) process.exit(code);

	code = await run('scp', ['-P', String(o.port), archiveLocal, `${sshTarget(o)}:${remoteTgzRaw}`]);
	if (code !== 0) process.exit(code);

	code = await run('scp', ['-P', String(o.port), keepLocal, `${sshTarget(o)}:${remoteKeepRaw}`]);
	if (code !== 0) process.exit(code);

	code = await run('scp', [
		'-P',
		String(o.port),
		cleanupLocal,
		`${sshTarget(o)}:${remoteCleanupRaw}`
	]);
	if (code !== 0) process.exit(code);

	code = await run('scp', [
		'-P',
		String(o.port),
		runnerLocal,
		`${sshTarget(o)}:${remoteRunnerRaw}`
	]);
	if (code !== 0) process.exit(code);

	const runCleanup = o.cleanup
		? o.cleanupBackground
			? `chmod 700 "${remoteCleanupQ}" "${remoteRunnerQ}" 2>/dev/null || true; if command -v nohup >/dev/null 2>&1; then nohup sh "${remoteRunnerQ}" >> "${remoteLogQ}" 2>&1 & else sh "${remoteRunnerQ}" >> "${remoteLogQ}" 2>&1 & fi; echo "Cleanup watchdog started: ${sshTarget(o)}:${remoteLogRaw}"`
			: `chmod 700 "${remoteCleanupQ}" "${remoteRunnerQ}" 2>/dev/null || true; sh "${remoteRunnerQ}" >> "${remoteLogQ}" 2>&1; echo "Cleanup watchdog finished: ${sshTarget(o)}:${remoteLogRaw}"`
		: `echo "Cleanup disabled."`;

	const extractCmd = `tar -xzf "${remoteTgzQ}" -C "${remoteBaseQ}" && rm -f "${remoteTgzQ}" && ${runCleanup}`;
	code = await run('ssh', ['-p', String(o.port), sshTarget(o), extractCmd]);
	if (code !== 0) process.exit(code);

	await fs.rm(archiveLocal, { force: true });
	await fs.rm(keepLocal, { force: true });
	await fs.rm(cleanupLocal, { force: true });
	await fs.rm(runnerLocal, { force: true });
}

async function fullUpload(o: Options, curr: Manifest): Promise<void> {
	await run('ssh', [
		'-p',
		String(o.port),
		sshTarget(o),
		`mkdir -p "${o.remote.replace(/"/g, '\\"')}"`
	]);
	await wipeRemote(o);

	if (o.archive) {
		await fullUploadArchive(o, curr);
		return;
	}

	const localAbs = path.resolve(o.local);
	const source = path.join(localAbs, '.');
	const dest = `${sshTarget(o)}:${o.remote.replace(/\/+$/, '')}/`;

	const code = await run('scp', ['-P', String(o.port), '-r', source, dest]);
	if (code !== 0) process.exit(code);
}

function buildPlanLines(
	o: Options,
	shouldFull: boolean,
	d: ReturnType<typeof diffManifests>,
	curr: Manifest
): string[] {
	const limit = Number.isFinite(o.listLimit) ? o.listLimit : DEFAULTS.listLimit;
	const lines: string[] = [];

	if (shouldFull) {
		const kind = o.archive ? 'FULL ARCHIVE' : 'FULL COPY';
		lines.push(
			`${kind}  ${path.resolve(o.local)}${path.sep}.  ->  ${sshTarget(o)}:${o.remote.replace(/\/+$/, '')}/`
		);
		const rels = Object.keys(curr.files).sort();
		const shown = limit <= 0 ? rels : rels.slice(0, limit);
		for (const rel of shown) lines.push(`COPY  ${rel}  ->  ${remoteFileFor(o, rel)}`);
		if (limit > 0 && rels.length > shown.length) {
			lines.push(
				`... (${rels.length - shown.length} more not shown; use --list-limit=0 to show all)`
			);
		}
		if (o.wipeRemote)
			lines.push(`WIPE  ${sshTarget(o)}:${o.remote.replace(/\/+$/, '')}/* (requires --yes-wipe)`);
		return lines;
	}

	const puts = d.changed.slice().sort();
	const rms = d.removed.slice().sort();
	const putShown = limit <= 0 ? puts : puts.slice(0, limit);

	for (const rel of putShown) lines.push(`PUT   ${rel}  ->  ${remoteFileFor(o, rel)}`);
	if (limit > 0 && puts.length > putShown.length) {
		lines.push(
			`... (${puts.length - putShown.length} more PUT not shown; use --list-limit=0 to show all)`
		);
	}

	if (o.deleteRemote && rms.length) {
		const left = limit > 0 ? Math.max(0, limit - putShown.length) : 0;
		const rmShown = limit <= 0 ? rms : rms.slice(0, left);
		for (const rel of rmShown) lines.push(`RM    ${remoteFileFor(o, rel)}`);
		if (limit > 0 && rms.length > rmShown.length) {
			lines.push(
				`... (${rms.length - rmShown.length} more RM not shown; use --list-limit=0 to show all)`
			);
		}
	}

	return lines;
}

async function main() {
	const a = parseArgs(process.argv.slice(2));

	const profile = String(a.profile ?? env('DEPLOY_PROFILE') ?? DEFAULTS.profile);

	const host = must(String(a.host ?? env('DEPLOY_HOST')), 'host');
	const user = must(String(a.user ?? env('DEPLOY_USER')), 'user');
	const remote = must(String(a.remote ?? env('DEPLOY_REMOTE')), 'remote');

	const port = parseNum(a.port ?? env('DEPLOY_PORT'), DEFAULTS.port);
	const local = String(a.local ?? env('DEPLOY_LOCAL') ?? DEFAULTS.local);

	const thresholdFiles = parseNum(
		a['threshold-files'] ?? env('DEPLOY_THRESHOLD_FILES'),
		DEFAULTS.thresholdFiles
	);
	const thresholdBytes = parseNum(
		a['threshold-bytes'] ?? env('DEPLOY_THRESHOLD_BYTES'),
		DEFAULTS.thresholdBytes
	);

	const dryRun = parseBool(a['dry-run'], false);
	const forceFull = parseBool(a.full, false);

	// FAST by default. `--hash` is a shortcut.
	const mode = parseBool(a.hash, false)
		? 'hash'
		: parseMode(a.mode ?? env('DEPLOY_MODE') ?? DEFAULTS.mode);

	const progress = parseBool(a.progress ?? env('DEPLOY_PROGRESS'), DEFAULTS.progress);
	const archive = parseBool(a.archive ?? env('DEPLOY_ARCHIVE'), false);

	const cleanupWait = parseBool(a['cleanup-wait'] ?? env('DEPLOY_CLEANUP_WAIT'), false);
	const cleanup = parseBool(a.cleanup ?? env('DEPLOY_CLEANUP'), archive ? true : false);
	const cleanupBackground = cleanup ? !cleanupWait : false;
	const cleanupMaxSecs = parseNum(
		a['cleanup-max-secs'] ?? env('DEPLOY_CLEANUP_MAX_SECS'),
		DEFAULTS.cleanupMaxSecs
	);
	const cleanupStallSecs = parseNum(
		a['cleanup-stall-secs'] ?? env('DEPLOY_CLEANUP_STALL_SECS'),
		DEFAULTS.cleanupStallSecs
	);

	const deleteRemote = parseBool(a.delete, false);
	const wipeRemoteFlag = parseBool(a['wipe-remote'], false);
	const yesWipe = parseBool(a['yes-wipe'], false);

	const yes = parseBool(a.yes ?? env('DEPLOY_YES'), false);
	const listLimit = parseNum(a['list-limit'] ?? env('DEPLOY_LIST_LIMIT'), DEFAULTS.listLimit);

	const o: Options = {
		profile,
		host,
		user,
		port,
		remote,
		local,

		mode,
		progress,

		thresholdFiles,
		thresholdBytes,
		dryRun,
		forceFull,

		archive,
		cleanup,
		cleanupBackground,
		cleanupMaxSecs,
		cleanupStallSecs,

		wipeRemote: wipeRemoteFlag,
		yesWipe,

		deleteRemote,

		yes,
		listLimit
	};

	const localAbs = path.resolve(o.local);
	if (!fssync.existsSync(localAbs)) {
		console.error(`Local folder not found: ${localAbs}`);
		process.exit(2);
	}

	const cachePath = path.resolve('.deploy-cache', o.profile, 'manifest.json');

	console.log(`Local:  ${localAbs}`);
	console.log(`Remote: ${o.user}@${o.host}:${o.remote} (port ${o.port})`);
	console.log(`Cache:  ${cachePath}`);
	console.log(
		`Mode:   ${o.mode}${o.mode === 'fast' ? ' (mtime+size, no hashing)' : ' (sha256 hashing)'}`
	);
	if (o.archive) console.log(`Archive: enabled${o.mode === 'fast' ? ' (gzip -1)' : ''}`);

	const prev = await loadManifest(cachePath);

	// Build current manifest (FAST default)
	const curr = await buildManifest(localAbs, o.mode, o.progress);

	const d = diffManifests(prev, curr, o.mode);

	console.log('');
	console.log(
		`Changed files: ${d.changed.length}, removed: ${d.removed.length} (ratio ${fmtPct(d.changedFileRatio)})`
	);
	console.log(
		`Changed bytes: ${fmtBytes(d.changedBytes)} / ${fmtBytes(d.totalBytes)} (ratio ${fmtPct(d.changedByteRatio)})`
	);

	const shouldFull =
		o.forceFull ||
		!prev ||
		d.changedFileRatio >= o.thresholdFiles ||
		d.changedByteRatio >= o.thresholdBytes;

	console.log('');
	console.log(
		shouldFull
			? `Mode: FULL${o.archive ? ' (archive)' : ''}${o.wipeRemote ? ' (wipe remote enabled)' : ''}`
			: `Mode: PATCH${o.deleteRemote ? ' (delete enabled)' : ''}`
	);

	console.log('');
	console.log('Plan:');
	const planLines = buildPlanLines(o, shouldFull, d, curr);
	for (const line of planLines) console.log(line);

	console.log('');
	const question = o.dryRun
		? 'Dry run preview complete. Run the upload now?'
		: 'Proceed with upload?';
	const proceed = o.yes ? true : await promptYesNo(question, false);

	if (!proceed) {
		console.log('Cancelled. No upload performed, cache NOT updated.');
		process.exit(0);
	}

	if (shouldFull) {
		await fullUpload(o, curr);
	} else {
		await patchUpload(o, d.changed, d.removed);
	}

	await saveManifest(cachePath, curr);
	console.log('');
	console.log('Done. Cache updated.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
