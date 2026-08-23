# Spec baseline

Use this reference for the **Spec axis**. The independent intent is authoritative; this is a tracing method, not a source of requirements.

## Axis procedure

1. Extract the explicit requirements from the independent intent. Keep compound requirements separate. Do not turn implementation details, guesses, or a desirable alternative into requirements.
2. For each requirement, trace the changed code, configuration, migration, or documentation that fulfils it. Then trace a test, acceptance check, or other evidence that would fail if the requirement were absent or wrong.
3. Report a finding when a requirement has no implementation, is only partially met, is implemented with different semantics, or lacks meaningful evidence for a changed behaviour. Quote the requirement and name the missing or wrong trace.
4. Inspect every substantive changed unit against the intent. A unit that fulfils no stated requirement is unrequested scope unless it is necessary plumbing; state the necessity chain before reporting it.
5. For a bug fix, name the failure class. A fix and test that only address the reported values are incomplete when a nearby input, state, timing, or consumer follows the same failing rule.

## Ambiguity

If the intent is ambiguous, record the interpretation that would decide the review and what would confirm it. Do not choose a product behaviour silently or manufacture a finding from the ambiguity alone.

## Useful prompts

- Which requirement has no direct implementation trace?
- Which changed behaviour has no evidence that distinguishes the requested result from a plausible wrong one?
- Does the diff silently narrow, broaden, or otherwise change a stated requirement?
- Which changed unit has no necessity chain back to the intent?
