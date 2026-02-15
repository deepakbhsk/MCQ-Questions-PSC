## 2025-02-15 - [React Performance Anti-pattern: setState in useMemo]
**Learning:** Calling `setState` (like `setOpenFolders`) inside a `useMemo` block triggers a re-render during the current render phase. This violates the purity of `useMemo` and causes redundant render cycles.
**Action:** Use derived state (calculated during render or via another `useMemo`) for temporary UI states (like search results opening folders) and `useEffect` for one-time initialization.

## 2025-02-15 - [Long List Optimization]
**Learning:** For long lists with complex items, extracting the item rendering into a memoized component (`React.memo`) is crucial to prevent re-rendering the entire list when only one item changes or when list-level state (like a folder toggle) updates.
**Action:** Always extract and memoize list items in components like `QuestionList`.
