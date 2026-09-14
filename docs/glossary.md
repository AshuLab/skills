# Glossary

**Hub slice** - a slice with no open blocker, or several, cut off the epic branch directly. A drain only ever produces hub slices; a hub slice handed directly to `ship` (rather than picked by a drain) is the only way a stack slice gets built ahead of it.
_Avoid_: "independent slice", "root slice".

**Stack slice** - a slice with exactly one open blocker, cut off that blocker's branch instead of the epic branch, so it builds on the blocker's code without waiting for it to land. Its PR targets the blocker's branch and retargets to the epic branch once the blocker closes.
_Avoid_: "dependent slice", "chained slice".

**Delegated build** - `ship` running a slice's build (claim through Close the loop's steps 1-3: commit, push, open PR) inside a subagent with its own fresh context, instead of inside the draining agent's own session. Applies to every slice, sequential or parallel, so the draining agent's context carries only each slice's close-out summary, never a full build transcript.
_Avoid_: "subagent slice", "isolated build".

**Parallel batch** - the set of up to 3 simultaneously-startable hub slices that `ship` dispatches together as concurrent delegated builds, github tracker mode only. The draining agent still serializes the merge of each finished slice into the epic branch one at a time.
_Avoid_: "concurrent drain", "parallel drain".

**Draining agent** - the agent running `ship`, whether on one ticket or a whole epic. Owns everything outside a slice's own delegated build: finding the next startable slice, *Pick the tree*, *Clean the tree, cut the epic branch*, and Close the loop's steps 4-6 (merge, close the issue, delete the branch) off each subagent's close-out report.
_Avoid_: "the orchestrator", "ship itself".
