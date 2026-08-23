# Risk baseline

Failure prompts for the **Risk axis**: what breaks, what disappears, and what fails when nobody is watching. Match mechanisms to the repository; do not use this as a checklist.

## Axis procedure

1. Account for every removal and trace its replacement. Verified lost functionality is a Blocker. With incomplete context, report the limitation or a `probable` finding that states what evidence would confirm it.
2. Trace external consumers: API shape, config, CLI, file format, schema, and declared inputs/outputs. Breaking contracts need a migration path.
3. Apply Correctness and Operability where the change is executable or operational; apply Change safety to every diff.
4. Behaviour changed → verification should change. For each new test, identify a production line whose breakage makes it fail; “none” or only the mock means the test proves nothing.
5. Run the security trigger even when the other families are clean.

## A · Correctness — wrong result or crash?

> Run this with hostile inputs, bad timing, retries, and flaky dependencies: what fails first?

**Unvalidated boundary** — request, event, environment, or third-party data reaches logic unparsed; casts do not validate → validate and sanitize at entry, allowlist over blocklist.

**Swallowed error** — failure is discarded, merely logged when execution cannot continue, hidden by fallback, or detached from async flow → separate expected input errors from infrastructure failures; critical paths log and stop.

**Partial failure** — step 2 of 3 leaves half-written state → make it atomic, resumable, compensating, or at least detectable.

**Non-idempotent handler** — webhook, consumer, cron, or request assumes exactly-once delivery → key retries and no-op repeats.

**Check-then-act** — concurrent callers can both pass a read before writing → use a conditional write, constraint, lock, or other atomic operation.

**Dangerous default** — existing callers silently opt into the risky path → choose a safe default and make risk explicit.

**Time and money** — implicit timezone, textual dates, or floating-point currency → explicit timezone and integer minor units.

**Weak randomness** — general RNG for tokens, IDs, nonces, or security-adjacent values → use a CSPRNG.

## B · Operability — can the on-call diagnose and stop it?

**Unbounded work** — unlimited query, input-sized loop, fetch-all/filter, N+1, or uncapped fan-out → cap, paginate, batch, and bound concurrency.

**Untimed external call** — no timeout or unbounded retries → explicit timeout and bounded retries with backoff/jitter.

**Silent critical path** — auth, payment, or money decision has no useful signal → structured log or metric at the decision point, with correlation and no PII.

**Irreversible step** — destructive migration, backfill, or delete has no stop/rollback path → add one or document why none is possible.

**Deploy-order coupling** — code, migration, config, or services must ship in lockstep → state ordering or tolerate both states with expand/contract.

**Config as code** — incident-sensitive URL, credential, threshold, or log level requires a deploy → externalize it. A secret in the diff is a Blocker.

## C · Change safety — finished and still truthful?

**Half-applied rename** — old name remains in dynamic callers, strings, tests, docs, or generated code → search repository-wide.

**Copy-paste divergence** — near-identical hunks differ accidentally → correct both or extract one source.

**Lying comment or doc** — text still describes old behaviour → update or delete it with the change.

**Test that cannot fail** — trivial assertion, self-fulfilling mock, or internal call-count test passes without the behaviour → test observable outcomes and prove the test goes red.

**Orphaned addition** — new export, parameter, function, or config has no consumer → find the caller or remove speculative work.

**Leftovers** — debug output, debugger, focused/skipped test, commented code, or ownerless new TODO → remove.

**New dependency** — broad, unmaintained, incompatible, or unnecessary package for a small utility → prefer the platform or a local implementation when cheaper.

**Snuck-in change** — unrelated bump, formatting sweep, refactor, or “while here” fix → split it.

## Security trigger

Automatically scrutinize changes touching authentication, authorization, permissions, payments, tokens, secrets, PII, or external input. Verify validation at the boundary, least privilege, allowlists, secure randomness, and that sensitive data does not enter logs or diffs. Any exposed secret is a Blocker.
