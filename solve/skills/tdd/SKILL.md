---
name: tdd
description: Write code test-first in an agreed seam - the red->green loop, what makes a good test, and the anti-patterns to avoid. Optional and conditional - reach for it when the behavior is clear and a seam exists, not as a mandatory step. Also how you turn a reproduced bug into a regression test.
---

# tdd - red -> green, one behavior at a time

Optional by design.
Reach for it when the behavior is specifiable up front and a seam exists.
Skip it for exploration, throwaway code, or pure-visual UI - there the loop lies to you.

## The loop

1. **Red** - write a test for behavior that doesn't exist yet. Run it, watch it fail.
2. **Green** - write the least code that makes it pass.
3. **Refactor** - clean up now that the test has your back.

Policing the refactor isn't this loop's job - that belongs to `code-review`.

## Seams first

Don't write a test until you've agreed *where* it goes.
The seam comes from `to-spec`; if it didn't, agree it with the user before the first test.
Same rule either way - the **broadest** seam that still isolates the behavior.

## What a good test is

- Tests **behavior, not implementation**. If it breaks when you refactor without changing behavior, it's a bad test.
- Can actually fail. A test that can't go red proves nothing.

## Anti-patterns

- **Implementation-coupled** - asserts on internals; breaks on every refactor.
- **Tautological** - restates the code; green no matter what.
- **Horizontal** - tests a layer instead of a behavior end to end.

## No test infrastructure yet?

Then TDD can't start - there's no red to run.
Build the feedback loop first (a runner, one passing case), or write characterization tests for legacy seams.
Don't fake it.

## Bugs

A reproduced bug is a red test.
Write the repro as a failing test, make it green, and it stays as a regression test.
This is how `diagnose` closes the loop.
