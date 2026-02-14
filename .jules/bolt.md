## 2025-02-14 - [React Anti-pattern: State updates in useMemo]
**Learning:** Found an anti-pattern where `setOpenFolders` was being called inside a `useMemo` block in `QuestionList.tsx`. This causes a state update during render, which React discourages as it can lead to unpredictable behavior and extra render cycles.
**Action:** Move such synchronization logic to `useEffect` or derive the state directly from props during render if possible.

## 2025-02-14 - [Memoization chain for list rendering]
**Learning:** For `React.memo` to be effective on list items (`QuestionListItem`), all props passed down must be stable. This includes not only the data (`questions`) but also all callback functions.
**Action:** Wrap event handlers in `useCallback` in the parent component (`AdminDashboard`) before passing them down through the tree to the memoized list items.
