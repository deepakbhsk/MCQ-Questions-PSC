# Bolt's Journal - Critical Learnings

## 2025-05-15 - Optimizing Component Lifecycle and Re-renders

**Learning:**
1. **Timer Isolation**: High-frequency state updates (like a 1s timer) in a root or near-root component (like `Quiz.tsx`) cause massive performance degradation as the entire subtree (including heavy components like `QuestionCard` with LaTeX/KaTeX) re-renders every second. Localizing this logic into a small, isolated `Timer` component eliminates this overhead.
2. **useMemo Side-Effects**: Calling state setters (e.g., `setOpenFolders`) inside `useMemo` is a major anti-pattern. It triggers redundant render cycles and violates the purity expected by React. Moving these to `useEffect` or handling them via render-phase state updates is significantly more efficient.
3. **Selective Memoization**: Components used in large lists (`Icon`, `QuestionList`) or those performing expensive computations (`QuestionCard` with regex/KaTeX) should always be memoized with `React.memo`. This must be paired with `useCallback` for any function props passed from parents to ensure stable references.

**Action:**
- Always look for high-frequency state updates and isolate them.
- Audit `useMemo` blocks for side-effects and refactor to `useEffect`.
- Implement a "Memoization Triad": `React.memo` for child, `useMemo` for complex props, and `useCallback` for function props.
