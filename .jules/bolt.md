## 2025-05-14 - [State Syncing Anti-Pattern]
**Learning:** Calling `setState` inside `useMemo` or during the render phase is a common anti-pattern that leads to double-renders or infinite loops. In lists where "open" states should change based on search terms, it's much more efficient to derive the "open" state dynamically during rendering rather than trying to sync it back to a state variable.

**Action:** Always prefer derived state over synced state via `useEffect` or render-phase side effects.

## 2025-05-14 - [High-Frequency Component Memoization]
**Learning:** In React applications with long lists, small components like icons can be a significant source of re-renders. Memoizing these "leaf" components provides a quick and measurable performance win with minimal risk.

**Action:** Audit high-frequency list components for missing `React.memo`.
