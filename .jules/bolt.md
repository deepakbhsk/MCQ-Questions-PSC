## 2025-05-15 - [React Anti-pattern: State Update in useMemo]
**Learning:** Calling state setters inside `useMemo` triggers additional render cycles and is unstable. Derived state should be calculated purely during render or handled in `useEffect`. In `QuestionList`, auto-opening folders during search should be a derived calculation (`effectiveOpenFolders`) rather than a state update.
**Action:** Always derive UI states that depend on other state/props (like search terms) instead of syncing them into a new state during the render phase.

## 2025-05-15 - [List Performance: Memoize Items]
**Learning:** In long lists, memoizing the entire list is often insufficient if the parent state changes frequently (e.g., typing in a search bar).
**Action:** Extract list items into a separate component wrapped in `React.memo` to ensure that only the items that actually changed will re-render.
