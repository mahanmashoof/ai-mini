# Performance Enhancements Overview

This document explains every performance-oriented change applied to the `AIDashboard` component so you can learn the reasoning, trade–offs, and future opportunities.

## Goals

- Keep UX smooth even for large CSV uploads (thousands of rows).
- Avoid unnecessary re-renders and expensive computations.
- Provide user feedback when downsampling occurs.

## Changes Implemented

### 1. Type Conversion (Early Normalization)

We normalize raw CSV string values to numbers where appropriate:

```ts
const parseValue = (value: string): string | number => {
  const num = Number(value);
  return !isNaN(num) && value.trim() !== "" ? num : value;
};
```

**Why:** Doing this once up–front means later sort logic can do native numeric comparison without repeated parsing.

### 2. Raw vs Display Data Separation

- `rawData` stores the full converted dataset.
- `data` stores the currently visualized, potentially sampled & sorted subset.

**Why:** Allows us to keep the original dataset intact while transforming only what’s needed for visualization. Makes future features (paging, filtering) simpler.

### 3. Deterministic Sorting Abstraction

```ts
const sortDataByKey = (data, key) => {
  /* numeric vs string aware */
};
```

**Why:** Centralizes comparison logic; avoids ad-hoc sort duplication and reduces cognitive complexity.

### 4. Data Sampling for Large Inputs

```ts
const sampleData = (data, maxPoints = 100) => {
  /* even stride sampling */
};
```

- If dataset length > `maxPoints`, we stride through the array to pick evenly distributed points.
- User sees: `Showing 100 of 4321 points` badge.

**Why:** Rendering thousands of bars/points causes layout & SVG overhead. Sampling preserves shape/trend while keeping the chart responsive.

**Trade–off:** Outliers between sampled indices may be skipped; for high-precision analytics you'd switch to windowing or zoom interactions later.

### 5. Memoized Derived Dataset

```ts
const displayData = useMemo(() => {
  const sorted = sortDataByKey(rawData, selectedXAxis);
  return sampleData(sorted, 100);
}, [rawData, selectedXAxis]);
```

**Why:** Prevents re-running sort + sampling on unrelated state changes (e.g. AI summary updates). Only recalculates when the inputs change.

### 6. Sync `data` from Memo Output

```ts
useEffect(() => {
  setData(displayData);
}, [displayData]);
```

**Why:** Keeps a stable `data` reference for the charting library (can help avoid animations resetting). Also isolates rendering concerns from calculation concerns.

### 7. Memoized Chart Rendering

```ts
const renderChart = useMemo(() => {
  /* returns JSX */
}, [chartType, data, selectedXAxis, selectedKey]);
```

**Why:** Chart subtree will not re-render unless its dependencies actually change. Cuts down on React reconciliation time for large parent updates.

### 8. Removed Pie Chart Variant

**Why:** Pie charts with large categorical domains are expensive & less informative. Removing it simplified logic and reduced import bundle size.

### 9. Conditional Feedback Badge

```tsx
{
  rawData.length > 100 && (
    <span>
      Showing {data.length} of {rawData.length} points
    </span>
  );
}
```

**Why:** Transparency improves trust. Users understand why they don’t see all rows.

## Performance Impact (Qualitative)

| Feature                          | Before                           | After                  |
| -------------------------------- | -------------------------------- | ---------------------- |
| Axis change on 10k rows          | Re-sorts full array every render | Single memo pass, fast |
| Initial load of large CSV        | All rows rendered                | Capped to sampled 100  |
| Re-render due to unrelated state | Chart recalculated               | Chart stable           |

## Potential Future Enhancements

1. **Progressive Loading:** Parse in chunks using Papa’s streaming mode; show incremental chart growth.
2. **Virtualized Tabular Preview:** If you add a table view, use react-window or react-virtual to avoid DOM bloat.
3. **Adaptive Sampling:** Use variance-based sampling (keep more points where data changes quickly).
4. **Client-side Caching:** Cache sorted arrays per key to avoid re-sorting when returning to an axis.
5. **Web Workers:** Offload parsing & sorting for extreme datasets (>100k rows) to prevent UI blocking.
6. **Zoom & Pan:** Replace fixed sampling with dynamic window (user zoom selects smaller range = full fidelity there).
7. **Dynamic MaxPoints Slider:** Let user trade granularity vs speed interactively.
8. **Binary Formats:** Support Parquet / Arrow for faster structured ingest (if moving beyond CSV).

## Anti-Patterns Avoided

- Re-sorting inside render body.
- Mutating arrays in-place (would break memo caching).
- Parsing numbers in every sort comparator call.
- Rendering thousands of SVG nodes blindly.

## Checklist of Concepts Learned

- Up–front normalization reduces downstream cost.
- Split raw vs derived state for clarity & extensibility.
- Sampling preserves trend while improving responsiveness.
- Memoization (useMemo) + effect sync patterns.
- User feedback when applying lossy transforms.
- Avoiding over-engineering early (no workers until needed).

## Quick Reference Snippets

### Sample + Sort Pattern

```ts
const displayData = useMemo(() => {
  if (!selectedXAxis) return [];
  return sampleData(sortDataByKey(rawData, selectedXAxis), 100);
}, [rawData, selectedXAxis]);
```

### Even Stride Sampling

```ts
const step = Math.floor(data.length / maxPoints);
for (let i = 0; i < data.length; i += step) sampled.push(data[i]);
```

### Numeric vs String Sort

```ts
if (typeof aVal === "number" && typeof bVal === "number") return aVal - bVal;
return String(aVal).localeCompare(String(bVal));
```

## Summary

The changes focus on _doing heavy work once_, _reducing per-render cost_, and _scaling visual output gracefully_. These patterns are broadly applicable to any data visualization scenario in React.

Feel free to iterate further—each future enhancement can layer onto this solid baseline.
