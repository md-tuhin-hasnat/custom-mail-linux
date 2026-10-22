---
trigger: always_on
always_on: true
description: Mandatory strict adherence to Vercel React Best Practices across the entire project
---

# Vercel React Best Practices — Mandatory Project Rule

All agents and contributors operating in this codebase MUST follow the **Vercel React Best Practices** strictly and unconditionally ("like bible").

Source Documentation:
- Complete Reference: [AGENTS.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/AGENTS.md)
- Skill Specification: [SKILL.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/SKILL.md)
- Individual Rule Definitions: [rules/](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/)

---

## Non-Negotiable Directives

Whenever writing, editing, reviewing, or refactoring code (React, Next.js, Electron frontend/renderer, TypeScript, JavaScript):

1. **Check Before Writing**: Never generate or modify React/TS/JS components without aligning with the 8 prioritized categories below.
2. **Prioritize by Impact**: Apply higher-priority rules first when architectural decisions conflict:
   - **CRITICAL**: Eliminating Waterfalls & Bundle Size Optimization
   - **HIGH**: Server-Side Performance
   - **MEDIUM-HIGH**: Client-Side Data Fetching
   - **MEDIUM**: Re-render Optimization & Rendering Performance
   - **LOW-MEDIUM**: JavaScript Performance
   - **LOW**: Advanced Patterns
3. **Strict Modularity & Short Files (CRITICAL)**:
   - **Keep files short & concise**: Target small, single-purpose files (ideally under 100-150 lines). Split large files aggressively.
   - **Maximum component granularity**: Build as many small, focused, reusable components as possible.
   - **No monolithic page files**: Never dump massive blocks of raw HTML/JSX directly in `page.js`, `page.tsx`, `App.tsx`, or top-level route/window containers. Pages should only compose and orchestrate high-level modular components.
   - **No inline component declarations**: Never declare components inside other component functions (`rerender-no-inline-components`). Each component belongs in its own dedicated file.
   - **Component Folder Architecture**: For each component, create a folder with the same name containing `ComponentName/ComponentName.tsx` and `ComponentName/ComponentName.module.css`. No Tailwind CSS; use CSS Modules (`*.module.css`) exclusively.
4. **No Waterfalls Permitted**: Async operations must never block sequentially if they can be parallelized or deferred.
5. **No Barrel File Imports**: Always import directly from individual module files (`ComponentName/ComponentName`) to prevent bundle bloat (`bundle-barrel-imports`).
6. **No Redundant Re-renders**: State reads must be deferred, derived state calculated in render without `useEffect`, and heavy subtrees memoized with hoisted constants.

---

## Prioritized Rule Directory

### 1. Eliminating Waterfalls (CRITICAL) — Prefix: `async-`
- [async-cheap-condition-before-await.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/async-cheap-condition-before-await.md): Check cheap synchronous conditions before awaiting remote flags or promises.
- [async-defer-await.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/async-defer-await.md): Defer `await` statements into branches where data is actually consumed.
- [async-parallel.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/async-parallel.md): Execute independent asynchronous operations concurrently with `Promise.all()`.
- [async-dependencies.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/async-dependencies.md): Parallelize partially dependent operations using DAG/dependency orchestration rather than linear await chains.
- [async-api-routes.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/async-api-routes.md): Start promises as early as possible in route/IPC handlers, await as late as possible.
- [async-suspense-boundaries.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/async-suspense-boundaries.md): Wrap async components in strategic `Suspense` boundaries to stream UI immediately.

### 2. Bundle Size Optimization (CRITICAL) — Prefix: `bundle-`
- [bundle-barrel-imports.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/bundle-barrel-imports.md): Avoid barrel file imports (`index.ts` re-exports); import directly from specific subpaths (e.g. `lucide-react/dist/esm/icons/...` or direct component files).
- [bundle-analyzable-paths.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/bundle-analyzable-paths.md): Use statically analyzable import/path expressions so bundlers can properly tree-shake.
- [bundle-dynamic-imports.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/bundle-dynamic-imports.md): Lazy-load heavy components, modals, and charts with dynamic imports (`React.lazy` or `next/dynamic`).
- [bundle-defer-third-party.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/bundle-defer-third-party.md): Defer analytics, logging, and auxiliary scripts until after initial paint and hydration.
- [bundle-conditional.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/bundle-conditional.md): Dynamically import modules only when the feature or user action is triggered.
- [bundle-preload.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/bundle-preload.md): Preload dynamic chunks on user intent (hover, focus, viewport visibility).

### 3. Server-Side Performance (HIGH) — Prefix: `server-`
- [server-auth-actions.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-auth-actions.md): Authenticate and authorize every server action or backend endpoint like an API route.
- [server-cache-react.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-cache-react.md): Use `React.cache()` to deduplicate identical data fetches within a single request lifecycle.
- [server-cache-lru.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-cache-lru.md): Implement LRU caching for expensive computations reused across multiple requests.
- [server-dedup-props.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-dedup-props.md): Do not pass redundant or duplicate data down across server-client component boundaries.
- [server-hoist-static-io.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-hoist-static-io.md): Hoist static file reads, fonts, and fixed assets to module scope.
- [server-no-shared-module-state.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-no-shared-module-state.md): Avoid module-level mutable variables for request-specific state.
- [server-serialization.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-serialization.md): Keep RSC-to-client payload minimal; never serialize entire DB models when only a few fields are used.
- [server-parallel-fetching.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-parallel-fetching.md): Parallelize data fetching using component composition.
- [server-parallel-nested-fetching.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-parallel-nested-fetching.md): Chain nested fetches per item concurrently inside `Promise.all()`.
- [server-after-nonblocking.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/server-after-nonblocking.md): Use `after()` for non-blocking secondary operations (telemetry, auditing).

### 4. Client-Side Data Fetching (MEDIUM-HIGH) — Prefix: `client-`
- [client-swr-dedup.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/client-swr-dedup.md): Use SWR or TanStack Query for automatic request deduplication and cache revalidation.
- [client-event-listeners.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/client-event-listeners.md): Deduplicate global window/document event listeners across multiple components.
- [client-passive-event-listeners.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/client-passive-event-listeners.md): Always set `{ passive: true }` on touch and scroll listeners.
- [client-localstorage-schema.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/client-localstorage-schema.md): Version and minimize stored localStorage payload structures.

### 5. Re-render Optimization (MEDIUM) — Prefix: `rerender-`
- [rerender-defer-reads.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-defer-reads.md): Do not subscribe a component to state that is only read inside callbacks or event handlers.
- [rerender-memo.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-memo.md): Extract computationally heavy or frequently re-rendered subtrees into `React.memo` components.
- [rerender-memo-with-default-value.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-memo-with-default-value.md): Hoist default non-primitive prop values to module constants to prevent memo breakage.
- [rerender-dependencies.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-dependencies.md): Prefer primitive values over composite objects in hook dependency arrays.
- [rerender-derived-state.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-derived-state.md): Subscribe components to derived boolean flags or primitives rather than entire collections.
- [rerender-derived-state-no-effect.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-derived-state-no-effect.md): Calculate derived values synchronously during render; NEVER use `useEffect` to copy state into state.
- [rerender-functional-setstate.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-functional-setstate.md): Use functional setState updater form (`prev => ...`) to avoid adding state variables to `useCallback` dependency arrays.
- [rerender-lazy-state-init.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-lazy-state-init.md): Pass a function to `useState(() => init())` for expensive initial values.
- [rerender-simple-expression-in-memo.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-simple-expression-in-memo.md): Do not wrap trivial primitive calculations in `useMemo`.
- [rerender-split-combined-hooks.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-split-combined-hooks.md): Split combined hooks that manage independent state/computations.
- [rerender-move-effect-to-event.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-move-effect-to-event.md): Execute interaction-driven mutations in event handlers, not in `useEffect`.
- [rerender-transitions.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-transitions.md): Wrap non-urgent state updates in `startTransition` to preserve input responsiveness.
- [rerender-use-deferred-value.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-use-deferred-value.md): Use `useDeferredValue` for sluggish filtered lists and heavy visual derivations.
- [rerender-use-ref-transient-values.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-use-ref-transient-values.md): Store high-frequency transient values (mouse position, timers, scroll offsets) in `useRef`.
- [rerender-no-inline-components.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rerender-no-inline-components.md): Never declare component functions inside another component function.

### 6. Rendering Performance (MEDIUM) — Prefix: `rendering-`
- [rendering-animate-svg-wrapper.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-animate-svg-wrapper.md): Apply CSS transforms and animations to a wrapper `<div>` instead of the `<svg>` node itself.
- [rendering-content-visibility.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-content-visibility.md): Use `content-visibility: auto` and `contain-intrinsic-size` on long off-screen list items.
- [rendering-hoist-jsx.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-hoist-jsx.md): Hoist static JSX trees outside component functions to prevent re-instantiation.
- [rendering-svg-precision.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-svg-precision.md): Round and optimize SVG path precision to eliminate superfluous coordinate decimals.
- [rendering-hydration-no-flicker.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-hydration-no-flicker.md): Inject critical initial client values (theme, stored auth) via inline scripts to avoid flash and flicker.
- [rendering-hydration-suppress-warning.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-hydration-suppress-warning.md): Explicitly set `suppressHydrationWarning` only where non-deterministic content (dates/timestamps) is unavoidable.
- [rendering-activity.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-activity.md): Use `<Activity mode="...">` (or offscreen patterns) for persistent background tabs instead of unmounting.
- [rendering-conditional-render.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-conditional-render.md): Use explicit ternary operators (`condition ? <Comp /> : null`) instead of `&&` to avoid accidental `0` or `NaN` rendering bugs.
- [rendering-usetransition-loading.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-usetransition-loading.md): Prefer `useTransition` `isPending` state over manual `isLoading` boolean state flips.
- [rendering-resource-hints.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-resource-hints.md): Leverage React DOM resource hints (`preload`, `preconnect`, `prefetchDNS`).
- [rendering-script-defer-async.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/rendering-script-defer-async.md): Always mark external `<script>` elements with `defer` or `async`.

### 7. JavaScript Performance (LOW-MEDIUM) — Prefix: `js-`
- [js-batch-dom-css.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-batch-dom-css.md): Batch DOM layout measurements and style changes; avoid interleaved read/write layout thrashing.
- [js-index-maps.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-index-maps.md): Construct `Map` or indexed records for repeated entity lookups instead of `.find()` in loops.
- [js-cache-property-access.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-cache-property-access.md): Cache nested object property lookups into local variables inside tight loops.
- [js-cache-function-results.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-cache-function-results.md): Cache pure deterministic function computations using a module-level `Map` or LRU.
- [js-cache-storage.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-cache-storage.md): Cache synchronous `localStorage` and `sessionStorage` reads in memory.
- [js-combine-iterations.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-combine-iterations.md): Combine chained `.filter().map()` operations into a single pass using a loop, `reduce`, or `flatMap`.
- [js-length-check-first.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-length-check-first.md): Check array length equivalence before executing deep structural array comparisons.
- [js-early-exit.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-early-exit.md): Return early from functions to minimize nesting and avoid unnecessary processing.
- [js-hoist-regexp.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-hoist-regexp.md): Hoist static `RegExp` expressions to module scope; never construct `new RegExp()` inside render loops.
- [js-min-max-loop.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-min-max-loop.md): Use a single-pass loop or `Math.min/max` to find extreme values rather than sorting the whole array.
- [js-set-map-lookups.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-set-map-lookups.md): Use `Set` for `O(1)` membership checks (`set.has(x)`) instead of `Array.includes()`.
- [js-tosorted-immutable.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-tosorted-immutable.md): Use `toSorted()` instead of mutating `sort()` to maintain immutability without array copying ceremony.
- [js-flatmap-filter.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-flatmap-filter.md): Use `flatMap` to transform and filter items in a single pass.
- [js-request-idle-callback.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/js-request-idle-callback.md): Defer non-critical computations to browser idle time with `requestIdleCallback`.

### 8. Advanced Patterns (LOW) — Prefix: `advanced-`
- [advanced-effect-event-deps.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/advanced-effect-event-deps.md): Never include `useEffectEvent` functions in `useEffect` dependency arrays.
- [advanced-event-handler-refs.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/advanced-event-handler-refs.md): Store dynamic callback handlers in refs to avoid re-binding listeners.
- [advanced-init-once.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/advanced-init-once.md): Run one-time app initialization once at the module or app level, not inside component mount effects.
- [advanced-use-latest.md](file:///home/touhidur/Code/custom-mail-linux/.agents/skills/vercel-react-best-practices/rules/advanced-use-latest.md): Use `useLatest` hook to create stable callback references without stale closure traps.

---

## Agent Enforcement Checklist

Before delivering code or marking any React/Next.js/Electron UI task complete, the agent must verify:
- [ ] Are files kept short and concise (ideally < 150 lines)?
- [ ] Is UI broken down into granular, focused components instead of raw HTML blobs in `page.js`/`page.tsx`?
- [ ] Are all imports specific and avoiding barrel files?
- [ ] Are async operations parallelized with `Promise.all` wherever independent?
- [ ] Are expensive calculations deferred or memoized with hoisted default constants?
- [ ] Is derived state calculated directly in render rather than synchronized via `useEffect`?
- [ ] Are state callbacks using functional updates (`prev => ...`) to keep hook dependencies minimal?
- [ ] Are event handlers handling mutations rather than relying on effect lifecycles?
- [ ] Are lookups using `Set` / `Map` instead of linear array scans?
- [ ] Is there zero layout thrashing or un-batched DOM mutations?
