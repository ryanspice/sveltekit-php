# deploy-build.ts — SvelteKit (PHP build) push tool

A small Bun script that ships your local `./build` folder to a remote PHP hosting folder over SSH.
It defaults to **fast mode** and tries to be boring: show the plan (with destinations), ask once, upload, extract, then clean up.

---

## What it does

- **Fast scan (default):** compares local files using **mtime + size** (no hashing).
- **Plan output:** prints the _exact_ remote destinations for the archive/files before running.
- **Deploy methods:**
  - **Archive deploy** (recommended): `tar.gz` locally → upload → extract/overwrite remotely.
  - **File copy deploy**: upload files individually (slower, more SSH connections).
- **Cleanup:** optionally deletes remote files that are **not** present in the new build after extraction.
  - Writes a server-side log.
  - Includes a watchdog so a stalled cleanup doesn’t sit there forever.

---

## Requirements

### Local machine

- **Bun**
- **OpenSSH** tools in PATH: `ssh`, `scp` (Windows includes these)
- **tar** in PATH (Windows includes `tar.exe`)

### Remote server

- SSH access (port 22 by default)
- `tar` + `gzip` available
- Write permission to the deploy directory

---

## SSH setup (stop password prompts)

Deploy uses multiple SSH-family commands. Without key caching, you’ll be prompted repeatedly.

### 1) Make sure your SSH config file is actually named `config`

Windows Notepad loves saving `config.txt`. OpenSSH only reads `config`.

PowerShell:

```powershell
ls $env:USERPROFILE\.ssh
# if you see config.txt:
Rename-Item $env:USERPROFILE\.ssh\config.txt config
```

### 2) Add a host alias (recommended)

Edit:

```powershell
notepad $env:USERPROFILE\.ssh\config
```

Add:

```sshconfig
Host ryanspice
  HostName ryanspice.com
  User rspice
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
```

Test:

```powershell
ssh ryanspice "echo ok"
```

### 3) Start ssh-agent + add your key (one-time per session)

```powershell
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
ssh-add -l
```

If `ssh-agent` is blocked by policy, use a deploy-only key (no passphrase) or Pageant.

---

## Folder layout

Typical repo layout:

```
repo/
  build/
  tools/
    deploy-build.ts
  .deploy-cache/
    mark8t-dev/
      manifest.json
```

---

## Usage

### Typical deploy (archive, full)

```powershell
bun tools/deploy-build.ts --profile mark8t-dev --full --archive
```

The tool prints:

- Local path
- Remote path
- Cache path
- Mode (fast)
- A **Plan** listing remote destinations

Then prompts:

- `Continue? (y/N)`

### Non-interactive

```powershell
bun tools/deploy-build.ts --profile mark8t-dev --full --archive --yes
```

### Dry run (plan only)

```powershell
bun tools/deploy-build.ts --profile mark8t-dev --full --archive --dry-run
```

---

## Flags (common)

These reflect the intent + the output you posted.

- `--profile <name>`
  Selects the remote target + cache namespace.

- `--full`
  Forces a full deploy (even if nothing changed).

- `--archive`
  Creates a `.tgz`, uploads it, extracts/overwrites remotely.

- `--yes`
  Skip the “continue?” prompt.

- `--dry-run`
  Print plan and exit.

- `--progress=true|false`
  Toggle SCP progress output.

- `--mode fast|safe` (if present)
  - `fast`: mtime + size (default)
  - `safe`: hashing for stronger detection (slower)

---

## How archive mode works

1. Create `build-<timestamp>.tgz` from local `./build`
2. Upload archive to remote deploy folder
3. Extract into deploy folder (overwrite)
4. Optionally run cleanup:
   - delete remote files not present in the new build manifest
   - keep a safety allowlist (logs, etc.)
5. Optionally delete uploaded `.tgz`

**Why it’s faster:** one upload beats hundreds of small `scp` uploads and SSH handshakes.

---

## Cleanup + watchdog

When cleanup is enabled:

- A remote cleanup script runs and writes:
  - `<deployDir>/.deploy-cleanup.log`
- A watchdog monitors progress and will attempt to stop cleanup if it appears stalled.

### Inspect cleanup log

```powershell
ssh ryanspice "tail -n 100 /home/rspice/domains/mark8t.ca/private_html/dev/sveltekit/.deploy-cleanup.log"
```

### Kill a stuck cleanup (manual override)

```powershell
ssh ryanspice "ps aux | grep deploy-cleanup | grep -v grep"
```

Then `kill <PID>`.

---

## Troubleshooting

### `ssh: Could not resolve hostname ryanspice`

Your alias isn’t being read because your config is missing or named `config.txt`.

Fix:

```powershell
ls $env:USERPROFILE\.ssh
Rename-Item $env:USERPROFILE\.ssh\config.txt config
```

### Passphrase prompts keep showing up

Your agent isn’t running or key isn’t loaded.

Fix:

```powershell
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

### `tar: time stamp ... is in the future`

Clock skew or file mtimes ahead. Usually harmless.

### Permission denied

Wrong user/key or remote folder not writable.

Confirm:

```powershell
ssh ryanspice "whoami; ls -la /home/rspice/domains/mark8t.ca/private_html/dev/sveltekit | head"
```

---

## Example (your mark8t dev target)

Remote target:
`/home/rspice/domains/mark8t.ca/private_html/dev/sveltekit`

Command:

```powershell
bun tools/deploy-build.ts --profile mark8t-dev --full --archive --yes --progress=true
```

---

## Safety notes

- This is meant for **testing deploys** into a known folder.
- Point it at the wrong folder and it will faithfully overwrite it.
- Prefer SSH keys over passwords.

# deploy-build.ts — SvelteKit (PHP build) push tool

A small Bun script that ships your local `./build` folder to a remote PHP hosting folder over SSH.
It defaults to **fast mode** and tries to be boring: show the plan (with destinations), ask once, upload, extract, then clean up.

---

## What it does

- **Fast scan (default):** compares local files using **mtime + size** (no hashing).
- **Plan output:** prints the _exact_ remote destinations for the archive/files before running.
- **Deploy methods:**
  - **Archive deploy** (recommended): `tar.gz` locally → upload → extract/overwrite remotely.
  - **File copy deploy**: upload files individually (slower, more SSH connections).
- **Cleanup:** optionally deletes remote files that are **not** present in the new build after extraction.
  - Writes a server-side log.
  - Includes a watchdog so a stalled cleanup doesn’t sit there forever.

---

## Requirements

### Local machine

- **Bun**
- **OpenSSH** tools in PATH: `ssh`, `scp` (Windows includes these)
- **tar** in PATH (Windows includes `tar.exe`)

### Remote server

- SSH access (port 22 by default)
- `tar` + `gzip` available
- Write permission to the deploy directory

---

## SSH setup (stop password prompts)

Deploy uses multiple SSH-family commands. Without key caching, you’ll be prompted repeatedly.

### 1) Make sure your SSH config file is actually named `config`

Windows Notepad loves saving `config.txt`. OpenSSH only reads `config`.

PowerShell:

```powershell
ls $env:USERPROFILE\.ssh
# if you see config.txt:
Rename-Item $env:USERPROFILE\.ssh\config.txt config
```

### 2) Add a host alias (recommended)

Edit:

```powershell
notepad $env:USERPROFILE\.ssh\config
```

Add:

```sshconfig
Host ryanspice
  HostName ryanspice.com
  User rspice
  IdentityFile ~/.ssh/id_ed25519
  IdentitiesOnly yes
```

Test:

```powershell
ssh ryanspice "echo ok"
```

### 3) Start ssh-agent + add your key (one-time per session)

```powershell
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
ssh-add -l
```

If `ssh-agent` is blocked by policy, use a deploy-only key (no passphrase) or Pageant.

---

## Folder layout

Typical repo layout:

```
repo/
  build/
  tools/
    deploy-build.ts
  .deploy-cache/
    mark8t-dev/
      manifest.json
```

---

## Usage

### Typical deploy (archive, full)

```powershell
bun tools/deploy-build.ts --profile mark8t-dev --full --archive
```

The tool prints:

- Local path
- Remote path
- Cache path
- Mode (fast)
- A **Plan** listing remote destinations

Then prompts:

- `Continue? (y/N)`

### Non-interactive

```powershell
bun tools/deploy-build.ts --profile mark8t-dev --full --archive --yes
```

### Dry run (plan only)

```powershell
bun tools/deploy-build.ts --profile mark8t-dev --full --archive --dry-run
```

---

## Flags (common)

These reflect the intent + the output you posted.

- `--profile <name>`
  Selects the remote target + cache namespace.

- `--full`
  Forces a full deploy (even if nothing changed).

- `--archive`
  Creates a `.tgz`, uploads it, extracts/overwrites remotely.

- `--yes`
  Skip the “continue?” prompt.

- `--dry-run`
  Print plan and exit.

- `--progress=true|false`
  Toggle SCP progress output.

- `--mode fast|safe` (if present)
  - `fast`: mtime + size (default)
  - `safe`: hashing for stronger detection (slower)

---

## How archive mode works

1. Create `build-<timestamp>.tgz` from local `./build`
2. Upload archive to remote deploy folder
3. Extract into deploy folder (overwrite)
4. Optionally run cleanup:
   - delete remote files not present in the new build manifest
   - keep a safety allowlist (logs, etc.)
5. Optionally delete uploaded `.tgz`

**Why it’s faster:** one upload beats hundreds of small `scp` uploads and SSH handshakes.

---

## Cleanup + watchdog

When cleanup is enabled:

- A remote cleanup script runs and writes:
  - `<deployDir>/.deploy-cleanup.log`
- A watchdog monitors progress and will attempt to stop cleanup if it appears stalled.

### Inspect cleanup log

```powershell
ssh ryanspice "tail -n 100 /home/rspice/domains/mark8t.ca/private_html/dev/sveltekit/.deploy-cleanup.log"
```

### Kill a stuck cleanup (manual override)

```powershell
ssh ryanspice "ps aux | grep deploy-cleanup | grep -v grep"
```

Then `kill <PID>`.

---

## Troubleshooting

### `ssh: Could not resolve hostname ryanspice`

Your alias isn’t being read because your config is missing or named `config.txt`.

Fix:

```powershell
ls $env:USERPROFILE\.ssh
Rename-Item $env:USERPROFILE\.ssh\config.txt config
```

### Passphrase prompts keep showing up

Your agent isn’t running or key isn’t loaded.

Fix:

```powershell
Start-Service ssh-agent
ssh-add $env:USERPROFILE\.ssh\id_ed25519
```

### `tar: time stamp ... is in the future`

Clock skew or file mtimes ahead. Usually harmless.

### Permission denied

Wrong user/key or remote folder not writable.

Confirm:

```powershell
ssh ryanspice "whoami; ls -la /home/rspice/domains/mark8t.ca/private_html/dev/sveltekit | head"
```

---

## Example (your mark8t dev target)

Remote target:
`/home/rspice/domains/mark8t.ca/private_html/dev/sveltekit`

Command:

```powershell
bun tools/deploy-build.ts --profile mark8t-dev --full --archive --yes --progress=true
```

---

## Safety notes

- This is meant for **testing deploys** into a known folder.
- Point it at the wrong folder and it will faithfully overwrite it.
- Prefer SSH keys over passwords.
