// Helper function to convert string values to numbers where appropriate
export const parseValue = (value: string): string | number => {
  if (value === "" || value === null || value === undefined) return value;
  const num = Number(value);
  return !isNaN(num) && value.trim() !== "" ? num : value;
};

export const convertDataTypes = (
  data: Record<string, string>[]
): Record<string, string | number>[] => {
  return data.map((row) => {
    const convertedRow: Record<string, string | number> = {};
    for (const key in row) {
      convertedRow[key] = parseValue(row[key]);
    }
    return convertedRow;
  });
};

// Sort data by a specific key (handles both numeric and alphabetic)
export const sortDataByKey = (
  data: Record<string, string | number>[],
  key: string
): Record<string, string | number>[] => {
  return [...data].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    // Both are numbers
    if (typeof aVal === "number" && typeof bVal === "number") {
      return aVal - bVal;
    }

    // Convert to string for alphabetic comparison
    const aStr = String(aVal);
    const bStr = String(bVal);
    return aStr.localeCompare(bStr);
  });
};

// Sample large datasets for better performance
export const sampleData = (
  data: Record<string, string | number>[],
  maxPoints: number = 100
): Record<string, string | number>[] => {
  if (data.length <= maxPoints) return data;

  // Sample evenly across the dataset
  const step = Math.floor(data.length / maxPoints);
  const sampled: Record<string, string | number>[] = [];

  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
    if (sampled.length >= maxPoints) break;
  }

  return sampled;
};
