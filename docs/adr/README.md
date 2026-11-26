# ADRs

Index by topic. Numbers are global.

## ship

- [0001](ship/0001-parallel-slice-draining-in-ship.md) - Parallel slice draining in ship (accepted) - slice builds are delegated to subagents and up to 3 hub slices run as a parallel batch
- [0003](ship/0003-slice-delivery-mode-github-or-local.md) - Slice delivery becomes a mode: github or local (accepted) - `setup` picks whether slices go through GitHub PRs or merge locally; one transport file per mode
- [0004](ship/0004-epics-drain-in-the-shared-tree-worktrees-are-lanes-only.md) - Epics drain in the shared tree; worktrees are lanes only (accepted) - the per-epic worktree and its on/off mode are removed, lane worktrees stay

## tracker

- [0002](tracker/0002-github-becomes-solves-only-tracker-mode.md) - Github becomes solve's only tracker mode (accepted) - local tracker mode is removed
