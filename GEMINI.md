# Project Guidelines & Rules: Custom Mail Linux

## Mandatory Standard: Vercel React Best Practices

All agents, LLMs, and code generators working in this repository MUST follow the **Vercel React Best Practices** strictly and unconditionally ("like bible").

Reference Documents:
- Complete Expanded Guide: [AGENTS.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/AGENTS.md)
- Workspace Rule Definition: [vercel-react-best-practices.md](file:///home/touhidur/Code/custom-mail-linux/.agents/rules/vercel-react-best-practices.md)
- Skill Configuration: [SKILL.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/SKILL.md)
- Specific Rule Files: [rules/](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/)

---

## Mandatory Tech Stack & Component Architecture

1. **Tech Stack**: Electron JS + Next.js (App Router).
2. **Styling Standard**: **Zero Tailwind CSS**. Use CSS Modules (`*.module.css`) exclusively.
3. **Component Folder Architecture**:
   - Every component has a dedicated folder named exactly after the component.
   - Inside that folder:
     - Component file named after the folder: `ComponentName/ComponentName.tsx` (or `.jsx`).
     - Scoped style file: `ComponentName/ComponentName.module.css`.
   - **No barrel re-exports** (`index.ts`). Import directly: `import { ComponentName } from '@/components/.../ComponentName/ComponentName'`.

---

### Non-Negotiable Directives

1. **Zero Waterfalls (CRITICAL)**:
   - Check cheap synchronous conditions before awaiting promises (`async-cheap-condition-before-await`).
   - Move `await` down into the branch where the value is used (`async-defer-await`).
   - Use `Promise.all()` for independent asynchronous tasks (`async-parallel`).
   - Use strategic `Suspense` boundaries for streaming and unblocking rendering (`async-suspense-boundaries`).

2. **Strict Bundle Optimization (CRITICAL)**:
   - **Never import from barrel files** (`index.ts` / `index.js`). Always import directly from specific subpaths / component files (`bundle-barrel-imports`).
   - Dynamically load heavy dialogs, modals, and charts with `React.lazy` / dynamic imports (`bundle-dynamic-imports`).
   - Defer non-critical third-party modules until after initial paint (`bundle-defer-third-party`).

3. **Strict Modularity, Granular Components & Short Files (CRITICAL)**:
   - **Keep files short & concise**: Target compact, focused files (ideally < 150 lines). Split large files aggressively.
   - **Maximum component granularity**: Decompose complex views into discrete, reusable subcomponents. Make as many granular components as possible.
   - **No monolithic page files**: Never dump huge blocks of raw HTML/JSX directly in `page.js`, `page.tsx`, `App.tsx`, or container components. Top-level pages must only orchestrate high-level modular components.
   - **Never define components inline**: Keep each component in its own separate file or top-level module scope; never declare a component inside another component function (`rerender-no-inline-components`).
   - **Organize by domain & feature**: Group subcomponents into focused feature folders (e.g., `components/mail/`, `components/sidebar/`, `components/composer/`) and import each directly without barrel files.

4. **Re-render & State Optimization (MEDIUM / HIGH)**:
   - Calculate derived state synchronously in render; **never use `useEffect` to sync or derive state** (`rerender-derived-state-no-effect`).
   - Use functional updates (`setState(prev => ...)`) to avoid adding state variables to `useCallback` dependency arrays (`rerender-functional-setstate`).
   - Put user interaction mutations in event handlers, not in effects (`rerender-move-effect-to-event`).
   - Extract expensive subtrees into `React.memo` with hoisted default non-primitive props (`rerender-memo`, `rerender-memo-with-default-value`).
   - Use `useTransition` for non-urgent state updates (`rerender-transitions`).
   - Store transient high-frequency values in `useRef` rather than state (`rerender-use-ref-transient-values`).

5. **Clean & High-Performance Rendering**:
   - Use explicit conditionals with ternary (`cond ? <Comp /> : null`), never `cond && <Comp />` (`rendering-conditional-render`).
   - Hoist static JSX and RegExp instances outside render functions (`rendering-hoist-jsx`, `js-hoist-regexp`).
   - Use `content-visibility: auto` for large lists / message threads (`rendering-content-visibility`).
   - Use `Set` / `Map` for $O(1)$ lookups instead of `.find()` / `.includes()` in loops (`js-set-map-lookups`, `js-index-maps`).

---

### Pre-Commit Agent Verification
Before completing any React / Electron / TypeScript task, verify:
- [ ] Are files kept short, modular, and single-purpose?
- [ ] Are views decomposed into granular subcomponents instead of raw HTML blobs in `page.js`/`page.tsx`?
- [ ] No barrel imports (`import { ... } from '@/components'` or package root barrels).
- [ ] No sequential `await` waterfalls where concurrent execution is possible.
- [ ] No `useEffect` used for deriving state.
- [ ] Functional `setState` used wherever previous state is referenced.
- [ ] Appropriate memoization and boundary isolation applied.
