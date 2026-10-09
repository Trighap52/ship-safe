# Open-source 11.0.0 release record

Released October 8, 2026. [`v11.0.0`](https://github.com/asamassekou10/ship-safe/releases/tag/v11.0.0)
was published from commit `1e3a547da23755bb7eca6bd85b00f0109031962e`.
[`ship-safe@11.0.0`](https://www.npmjs.com/package/ship-safe) is the npm
`latest` version. The
[publish workflow](https://github.com/asamassekou10/ship-safe/actions/runs/37837322448)
completed successfully, including tests, deterministic release benchmarks,
dependency audit, self-scan, package-content checks, and npm provenance.

## Post-release smoke test

On Node.js 24.21.0, a clean temporary install of `ship-safe@11.0.0` reported
version `11.0.0` and scanned a one-file benign fixture successfully. The JSON
report identified one scanned file, zero findings, and `success: true`. The
install and fixture were removed after the test.

## Release changes

- Runtime requirement and lockfile aligned to Node 22.13+ on the 22.x line,
  or Node 24+. CI now includes the minimum version, latest 22, and 24.
- Publishing uses Node 24 and additionally gates on detection, verdict, and
  Hermes release benchmarks and the dependency audit.
- Existing JSON metadata and relative-path changes reviewed. Scan and CI
  SARIF now use the package version instead of hard-coded older versions.
- Detection and verdict result artifacts refreshed against the working tree.

## Pre-release verification

- Detection: 13/13 target scenarios and 13/13 paired safe controls.
- Verdicts: 11/20 labeled real findings settled; zero false refutations,
  three noise findings standing, zero unlabeled findings.
- The October 7 false-positive run for 11.0.0 reports 692 raw findings across
  the five clean projects (654 Hermes, 63 critical) and 128 across the two
  vulnerable projects; all detection floors pass. The generated result
  artifact has been refreshed. Hermes is down eight findings from the previous
  snapshot, but investigator labels remain automated and this is not an
  accuracy estimate or release pass.
- Hermes release evidence: the runner passes all four human-reviewed paired
  scenarios; 4 target findings in vulnerable fixtures, none in their paired
  safe fixtures. These are static fixtures, not a claim of runtime reproduction.
- The pre-migration tree passed all 1,060 tests on Node 26.8.1. The
  post-migration tree before the 11.0.0 candidate passed 1,062 tests on Node
  22.13.0, Node 24.14.1, and Node 26.8.1. The current 11.0.0 candidate passes
  all 1,070 tests serially on Node 22.13.0, latest Node 22 (22.23.3), Node
  24.21.0, and Node 26.8.1, including glob-wrapper security and compatibility
  regressions. Runs use
  `node --test --test-concurrency=1 --test-reporter=tap
  cli/__tests__/*.test.js`. The Node 22.23.3 and 24.21.0 binaries were
  checksum-verified against official Node.js release manifests. Earlier
  focused runs passed
  the CLI privacy/MCP group 36/36, the broader glob/scan/CI/MCP integration
  group 449/449, and the ReDoS suite 8/8. A higher-concurrency run under heavy
  host load was inconclusive (subprocess and worker timeouts); serial runs are
  clean.
- Scan JSON regressions pass on Node 22.13.0 and Node 24.14.1. A freshly
  packed npm tarball installs and its CLI JSON/SARIF smoke checks pass
  under both versions. After the latest detector change, a new tarball also
  passed PII calibration plus red-team JSON/SARIF smoke checks on Node 26.8.1.
  Red-team machine reports exclude global MCP findings,
  redact project and home paths recursively through nested evidence, use
  project-relative artifact locations, and report the real package version in
  SARIF. The fresh 11.0.0 tarball's 10 machine-report path-redaction checks also
  pass on Node 22.13.0, Node 22.23.3, Node 24.21.0, and Node 26.8.1, including
  JSON findings seeded with temporary absolute checkout and home paths. No
  checked secret or environment-file filename patterns were present; this does
  not prove file contents are secret-free.
- On October 8, a freshly packed 11.0.0 tarball was installed in an isolated
  temporary directory. Its CLI version and clean-fixture JSON/SARIF report
  contracts passed under Node 22.13.0, Node 22.23.3, Node 24.21.0, and Node
  26.8.1.
- Extended the machine-report path review beyond scan/audit/CI/red-team. JSON
  from investigation, capabilities, trust, OpenClaw, legal, ABOM, skill/MCP
  vetting, hooks, team-report, and MCP tool responses now redacts checkout and
  home paths recursively or returns relative identifiers. Explicit
  `--absolute-paths` remains an opt-in for scan/audit/CI. The targeted
  report-path and MCP suite passes 36/36 tests.
- The final working-tree `npm pack --dry-run --json` contains 153 files,
  includes the path-redaction and glob compatibility utilities, and excludes
  the local corpus checkouts, draft articles, and generated report files.
- `npm run lint` exits successfully with zero errors and 81 warnings across
  `cli/`; warnings remain a cleanup item.
- `npm audit --audit-level=high`: zero vulnerabilities.
- Removed `fast-glob`, whose `micromatch` dependency brought in `braces@3.0.3`
  with a high-severity advisory and no fixed release available. The project
  now uses `tinyglobby`, with a 100-level brace-nesting guard on input patterns
  and ignore rules; the remaining `brace-expansion` dependency is pinned to
  the fixed `5.0.12` line. The post-migration audit reports zero vulnerabilities.
- CI-equivalent local gates pass: 13/13 synthetic detections and paired safe
  controls, verdict benchmark, 4/4 Hermes release-evidence fixtures, and a
  clean self-scan of 129 files. These fixtures are project-maintained and do
  not establish real-world scanner accuracy.
- After merging current `main` into the release branch and adding the roadmap
  candidate guard, the full suite passes 1,087/1,087 serially on the local
  runtime. GitHub PR #222 CI passes its test and installed-package integration
  jobs on Node 22.13.0, latest Node 22.x, and Node 24.
- All repository workflows now pin `ubuntu-24.04` instead of the moving
  `ubuntu-latest` label. After this change, hosted CI passed all six test and
  package-integration jobs on PR #222.
- An AI-assisted source-level review inspected all 63 Hermes critical
  locations at the pinned corpus revision. It recorded 55 apparent rule/context
  false positives, two opt-in pickle deserialization locations, two host
  networking configurations, two fixed-destination credential actions, and
  two hardening follow-ups. This is not an independent human security audit or
  exploit reproduction; see `benchmarks/false-positives/hermes-critical-review.md`.

## Post-release follow-ups (not release gates)

- Obtain a human security review of the AI-assisted Hermes critical triage
  before making any claims based on those locations. The October 7 full run
  is the checked-in 11.0.0 artifact. The Hermes investigator returned no
  confirmed locations, but its labels are automated, not independent human
  adjudications. The formerly tool-confirmed webhook result was traced to a
  prompt-rule identifier-substring false positive and is no longer reported.
  This run uses Hermes commit `743dc94`, while dedicated v0.21.0 security
  coverage uses `29112bef`; the full-corpus result is not evidence about the
  v0.21.0 baseline. Retain `743dc94` as the stable longitudinal corpus pin;
  run a separate full-corpus comparison if the release needs evidence on the
  newer upstream revision. This release keeps the stable corpus pin; any newer
  upstream comparison should be a separate benchmark, not a replacement.
The synthetic benchmarks measure regression behavior on labeled fixtures.
They do not establish accuracy on arbitrary production code.

## October 4–8 follow-up

- The latest dependency audit surfaced the newly published high-severity
  `braces@3.0.3` stack-exhaustion advisory. GitHub lists no patched release.
  Removed `fast-glob` and switched its call sites to `tinyglobby` through a
  compatibility wrapper that rejects glob and ignore patterns deeper than
  100 nested braces. Updated `brace-expansion` to 5.0.12. The current audit
  reports zero vulnerabilities.
- The post-migration test suite passed 1,062/1,062 serially on Node 22.13.0,
  Node 24.14.1, and Node 26.8.1; the focused 449-test scan/glob/CI/MCP group
  also passed. `git diff --check` passes.
- On October 7, the complete 11.0.0 candidate suite passed 1,070/1,070 tests
  serially on Node 26.8.1. On October 8, the same candidate passed 1,070/1,070
  on Node 22.13.0, latest Node 22.x (22.23.3), and Node 24.21.0. The fresh
  package tarball also passed CLI version and clean JSON/SARIF smoke checks on
  those runtimes and Node 26.8.1. Hosted CI subsequently passed before the
  release was published; see the release outcome above.
- The current dependency audit reports zero vulnerabilities. `npm run lint`
  exits successfully with zero errors and 81 unused-code warnings; reducing
  that warning debt remains a cleanup task.
- After the focused Hermes detector changes, its targeted test group passes,
  including the `.hermes-update-*` regression, the native OAuth token-store
  adapter false-positive case, the Modal stdout sync-back case, positive
  credential-archive/network-stream controls, and cron update guard-asymmetry
  plus guarded-update fixtures. Targeted ESLint reports no errors. A read-only
  full-corpus run completed on October 7 after these refinements; its results
  are documented above, and the benchmark artifact is refreshed for 11.0.0.
- PR #222 was merged to `main` before 11.0.0 was tagged and published. Hosted
  CI and installed-package checks passed; see the release outcome above.
- The earlier focused Hermes pass found false positives on `.hermes-update-*`
  application-bundle paths, the Electron native OAuth token-store adapter, and
  Modal's stdout-based `.hermes/` sync-back. Added boundary tests for these
  cases while preserving positive archive and explicit network-sink checks.
  The remaining cron update finding is supported by a static create/update
  guard asymmetry, but no runtime exploit has been reproduced. The October 4
  corpus run used Hermes `743dc94`; it does not establish the finding count on
  the separate v0.21.0 coverage revision `29112bef`.

## September 27 follow-up

- Expanded the installed-tarball CI integration job to Node 22.13, latest
  22, and 24. Added assertions for parseable JSON, report schema, package
  version, timestamp, and a clean result from an empty fixture directory.
- The existing `packaged-cli-smoke.test.js` invokes the source entry point;
  the integration job is what installs and tests the actual npm artifact.
- On the preceding revision, clean Node 22.13.0 and Node 24.14.1 runs passed
  all 1,050 tests, including the mass-assignment and red-team output/privacy
  regressions. On October 4, the pre-migration tree passed all 1,060 tests on
  Node 26.8.1 with test concurrency limited to one. After replacing the glob
  dependency, all 1,062 current-tree tests passed serially on Node 22.13.0,
  Node 24.14.1, and Node 26.8.1; the focused 449-test glob/scan/CI/MCP
  integration group passed as well. At that point, the full GitHub CI matrix,
  including the latest Node 22.x release, still needed a remote pass; it
  passed before the 11.0.0 publication.

## Application-corpus adjudication

- Reviewed the tool-level `API_SPREAD_BODY` result from the pinned
  three-application run. It pointed to
  `createUser({ ...req.body.user, demo: false })`, but the service builds its
  Prisma write from an explicit field allowlist and the route forces
  `demo: false`; arbitrary properties are not persisted. This is a false
  confirmation, not a demonstrated mass-assignment vulnerability.
- Added a regression ceiling for `API_SPREAD_BODY` and `MASS_ASSIGNMENT`:
  source-to-call dataflow alone now yields `likely`, because it does not prove
  which fields the downstream model accepts or writes. The focused
  data-flow suite passes 55/55 tests. After the change, the pinned application
  corpus reports zero tool-level confirmations across the same three apps;
  the false-positive confirmation is no longer overstated.
- Refreshed `benchmarks/results/verdicts.json`. The first-party synthetic
  verdict benchmark remains at 11/20 settled, with zero false refutations and
  three noise findings standing. This is fixture evidence, not a production
  accuracy estimate.
- Red-team JSON/SARIF previously serialized developer-global MCP findings and
  absolute file paths. The command now keeps those findings in interactive
  output only, scores project findings alone, awaits machine-output writes
  before exit, emits project-relative artifact paths, and recursively redacts
  local project/home paths inside nested evidence. Its SARIF uses the package
  version. Regression coverage passes on the source tree and a freshly packed
  and installed npm tarball on Node 26.8.1; the earlier tarball smoke checks
  on Node 22.13.0 and Node 24.14.1 predate this nested-evidence regression.
