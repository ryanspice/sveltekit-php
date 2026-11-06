# November 2026 integration decisions

This integration combines operating guidance in [PR 2](https://github.com/ryanspice/sveltekit-php/pull/2) with the outstanding adapter/security work in [PR 3](https://github.com/ryanspice/sveltekit-php/pull/3). GitHub records the merge/check state; this document records the maintained decisions.

## Accepted guidance and fixes

`AGENTS.md` is the shared instruction entry point. The operating, scripts, testing, and policy guides were reconciled with the current Kit 3 app configuration, generated declarations, PHP guards, and Kit 2/3 consumer support. The incoming missing-env/helper claims were checked against source and corrected. `build:php` and `build:apache` now each run one Vite/adapter build; the redundant helper scripts are retired.

The security candidate preserves private sidecar output, router/private-path guards, action origin checks, bounded request bodies, proxy-header trust, safe hydration decoding, and explicit remote-function exclusion. Review additionally fixed multipart upload-limit and missing-boundary validation before upstream dispatch, and rejection of an explicitly invalid zero body limit. Runtime tests cover those failures and bounded chunked bodies without Content-Length.

Linux CI exposed a dependency on the optional PHP ctype extension in request guards. ASCII-digit validation now uses core PHP functions while retaining the existing range checks. Synthetic PHP fixtures disable `ctype_digit` even when compiled into the host, and 20 additional probes cover extension absence, forwarded depth, and malformed Content-Length. This reproduces the platform difference locally without relaxing rejection behavior.

## CI and verification

Automatic CI separates source/package contracts, PHP 8.3/8.5 HTTP/browser checks, and pinned packed Kit 2/3 consumers. It checks lint, types, unit tests, bundle/declaration parity, runtime guards, output/router behavior, desktop/mobile behavior, and package types. Hosted Alpha/RC investigations are manual only. No automatic job deploys or publishes.

Local integration evidence includes 247 unit tests, typechecking, strict generated-artifact parity, 19 release-prep checks, six E2E output builds, local root/subdirectory HTTP checks, 11 compatibility-router requests, 32 browser tests, and 28 Kit 3 desktop/mobile tests. Four Kit 3 cases are explicitly skipped because PHP-static actions use the client fallback. Eight packed consumer lanes cover Kit 2.70.3 and Kit 3.1.0, both modes, and root/subdirectory paths. These results do not establish a real shared-host deployment or native desktop-shell acceptance.

Formatting and script typing make the existing lint/type gates executable. Generated declarations remain governed by strict generation parity rather than independent formatter rewrites. The RSS fixture link is an external document link so its existing deployment base is not applied twice.

The router-parity CLI now accepts both spaced and equals arguments and rejects unknown options rather than silently selecting the default build. Its comparison accounts for the demo layout's per-request PHP memory counter in the current named JSON format; status, headers, route content, other numbers and malformed values remain significant. Twenty-four focused verifier tests include those negative controls, and all 11 parity requests pass against the intended E2E output.

## Artifact and historical-plan disposition

The inactive `.codegraph` directory and two empty sidecar outputs were removed. Ninety-two historical run/skill/Hermes files were preserved with their grouping under `.ai/archive/`, verified by SHA-256 before their originals were removed. No process was stopped. Private packets, evidence, archives, and indexes are excluded from commits.

The older local skill is superseded by current repository guidance. July/August plans retain their original evidence with historical labels; their version, npm authentication, gate-count, and hosted claims are not current acceptance. [MODERNIZATION.md](MODERNIZATION.md) records the source dispositions and archive paths.

Open follow-ups include a focused reproduction of the historical sibling-output concern, actual host/proxy cookie acceptance, the Bun prepack tooling dependency, and the limited prose coverage of version-drift checks. They remain explicit questions for the next feature/performance/security plan rather than inferred completed work.

## Next acceptance decisions

The four skipped Kit 3 PHP-static no-JavaScript cases are one `js-ssr` native-form
test across root/subdirectory and desktop/mobile configurations. Their test bodies
did not run, so they establish neither four failures nor native PHP-static form
support. Characterize native GET and POST on a disposable, pinned candidate before
choosing explicit boundary assertions. Request-time Svelte rendering remains the
`js-ssr` boundary; changing it is a separate product decision.

Reproduce the possible `js-ssr` sibling-output collision with generated-output and
HTTP evidence before changing its generator. A synthetic PHP built-in-server probe
returned HTML for a JSON request at a subdirectory while the root returned JSON;
confirm the behavior with a real Kit consumer before selecting a fix. Retain existing
behavior if no material divergence is established. Real-host security and human UI acceptance remain open;
collect representative synthetic measurements before selecting optimizations.
