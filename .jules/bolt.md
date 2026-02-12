## 2025-02-14 - [Anti-pattern: State updates in useMemo]
**Learning:** Calling state setters inside a `useMemo` hook triggers an immediate second render and is a major performance bottleneck in complex components like `QuestionList`. React 19 might handle it, but it's still an anti-pattern that leads to redundant work.
**Action:** Always derive state-like values during render if they depend on other state (like search terms), or move side effects to `useEffect`.
