# Resolving a slice-merge conflict

Read only when `gh pr merge` refuses a slice PR for a merge conflict - *Close the loop* step 4 in `SKILL.md`.

One resolution attempt, on the **slice branch** in the tree it was built in (its lane, the epic worktree or the shared tree) - never on its base:

1. `git -C <tree> fetch && git -C <tree> merge origin/<base>` - a merge commit, never `rebase`.
2. Hand the conflict to a subagent - the slice's ticket, its spec section, the conflicting files - that returns *Delegate the build*'s close-out report:
   - **Semantic overlap** (both sides changed the same logic, signature or contract, or resolving would alter behaviour beyond the slice's spec): `git -C <tree> merge --abort`, `outcome: "stopped"`, `reason` naming the files.
   - **Additive or mechanical overlap** (independent entries in a shared list, enum, switch, registry, test file or imports): resolve it, then verify the definition of done as *Close the loop* in `SKILL.md` describes. Red: `git -C <tree> merge --abort`, `stopped` with what failed. Green: commit the merge, push, `ready-to-merge`.
   A missing or malformed report counts as `stopped` - run the `merge --abort` yourself if the merge is still in progress. Either way the tree is left clean on the slice branch.
3. `ready-to-merge`: wait for the PR's required checks - `gh pr checks <pr> --watch --required --fail-fast`, at most 2 hours. "no checks reported" exits 1 but means there's nothing to wait for: treat it as green. Then, once `gh pr view <pr> --json mergeable` no longer reads `UNKNOWN`, `gh pr merge <pr> --merge` again.
4. Merged: carry on with *Close the loop* step 5. Anything else - `stopped`, checks red or past the bound, a second refusal - is an **unresolved conflict**: stop and report the files.
