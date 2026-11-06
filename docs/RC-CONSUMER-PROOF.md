# RC consumer proof

Status as of 2026-08-24: **live routes restored; strict RC proof still blocked**.

LancasterFBC and 519 Trough are established real-world `php-static` consumers with fixed, Canopy-controlled `/sites/<site-id>` base paths. They are strong RC soak targets for large prerendered route sets, Apache/PHP routing, assets, canonical Canopy URLs, and rollback operations. They do not exercise PHP form actions, data loads, or API endpoints, so the dedicated hosted functional fixture remains a separate release requirement.

The Canopy main site, both archive roots, their representative pages, base-scoped assets, and unknown-route behavior were redeployed and probed successfully on 2026-08-24. Lancaster and 519 also build from an adapter bundle whose SHA-256 matches this release-candidate checkout. That repository assertion is useful deployment evidence, but it is not yet sufficient immutable provenance.

The former standalone Lancaster and 519 domains are intentionally excluded from release acceptance because Canopy Digital no longer controls them. Their DNS and redirect behavior is neither a product regression nor a release blocker. The authoritative versions for this proof are:

- `https://canopydigital.ca/sites/lancasterfbc.ca/`
- `https://canopydigital.ca/sites/519troughandexterior.ca/`

The remaining static-consumer blocker is immutable deployment provenance. The profile now requests `sveltekit-php.json` beneath each Canopy archive instead of a `.well-known` dotfile, because the production host rejects dotfile paths. Each publisher must emit that document before the strict proof can pass.

The former `/dev/sveltekitphp` hosted functional fixture is not current and still needs a fresh deployment. The archive consumers only prove the static/base-path portion of the contract.

The committed profile is privacy-safe and contains public expectations only. It deliberately excludes local source/output paths, deployment hosts, credentials, and response bodies.

```powershell
bun run verify:rc-consumer-profile
bun run rc:consumer:probe
# After an authorized resync and deployment:
bun run rc:consumer:smoke
bun run rc:consumer:verify
```

The strict smoke checks each Canopy-controlled canonical root and representative page, an unknown route, a base-scoped `_app` asset, and a sanitized `sveltekit-php.json` provenance document matching the candidate version and adapter bundle SHA-256. An optional mirror is checked only when a profile explicitly declares a controlled mirror. The smoke always writes `report/rc-consumer-evidence.json`; failures remain failures and are never promoted by documentation.

The manual `RC Consumer Proof` workflow does not deploy. It probes an already-authorized deployment and uploads the receipt even when the gate fails. Once both sites are current and green, this proof can be composed into the hosted v1 gate.
