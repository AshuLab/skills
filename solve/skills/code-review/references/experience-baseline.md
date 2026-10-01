# Experience baseline

Failure prompts for the **Experience axis**: what a person hits when they see or operate the change. Runs only when the diff changes user-facing UI. Terms below are web; map them to the repository's platform (native, desktop) and stack. Do not use this as a checklist.

## Axis procedure

1. List every changed user-facing unit: component, template, screen, interaction, copy. That list is the coverage sweep; give each a verdict.
2. Walk the flow a person would take through each unit: keyboard only, assistive technology, narrow screen or zoom, slow or failed data.
3. The repository's design system or component library wins: its accessible primitive is the fix. A hand-rolled replacement for one it already has is an Experience finding only when it loses accessible behaviour; otherwise it is a Standards convention violation.
4. What the code shows is `verified`: a clickable `div` with no role, an input with no label, a state that is never rendered. What depends on rendering is `probable`: contrast, layout at a width, focus behaviour, announcement order. Name the check that confirms it: keyboard pass, axe or Lighthouse, screen reader, screenshot at a width, contrast computed from the tokens. Use an automated result when the validation state has one; do not assume the pass can run it.
5. Security of the UI (injection, unsafe HTML, data exposure) belongs to Risk.

## A - Accessibility - can everyone operate it?

> Run this with the keyboard alone, then with a screen reader in mind: DOM order is reading order.

**Non-semantic control** - clickable `div`/`span`, link used as button or the reverse, heading level picked for size -> native element, or the right role with keyboard handling.

**Missing accessible name** - icon-only button, input without a label, informative image without alt text, decorative image not hidden; a placeholder is not a label -> visible label or accessible name.

**Keyboard dead end** - control unreachable or unusable by keyboard, positive `tabindex`, hover-only reveal, drag-only action -> logical tab order and a pointer-free path to the same action.

**Lost focus** - modal, menu, or route change does not move focus in, contain it, and return it on close; focus outline removed -> manage focus, keep a visible indicator.

**Color-only meaning or weak contrast** - state shown by color alone; text below 4.5:1, large text or UI components below 3:1 (WCAG AA) -> add text or an icon, fix the contrast.

**Silent update** - toast, validation error, or async result appears without being announced; error not tied to its field -> live region or moved focus, error associated with the input.

**ARIA misuse** - `aria-hidden` on something focusable, a role that contradicts the native element, `aria-label` that overrides visible text, state attributes (`aria-expanded`, `aria-selected`) never updated -> prefer native semantics; keep ARIA truthful.

**Motion without opt-out** - autoplay or large animation ignores `prefers-reduced-motion` -> respect it.

## B - Journey - is every state handled?

**Missing state** - loading, empty, error, success, disabled, or offline state not rendered for the new data path -> render each one, with a way to recover.

**Dead-end error** - failure with no cause or next step; form wipes the user's input on error -> say what happened and keep the input.

**Unguarded destructive action** - delete, overwrite, or send with no confirmation or undo -> confirm or allow undo.

**Layout breakage** - fixed widths, clipped text, overflow at narrow width or 200% zoom, touch targets under 24 CSS px unless spaced apart (WCAG 2.2 AA minimum) -> responsive layout and adequate targets.

**Unstructured screen** - new page or route without a title, landmarks, or a sensible heading outline; links or buttons labelled "click here" -> give the screen a title and structure, and make link text meaningful out of context.

**Layout shift** - media or late-loading content without reserved space jumps the page -> reserve the space.

**Hardcoded copy** - user-visible strings, dates, or numbers bypass the repository's i18n or formatting layer -> use it. Skip when the repository has none.
