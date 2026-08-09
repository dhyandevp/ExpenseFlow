export function csvSafe(value) {
  if (typeof value !== "string") {
    return value;
  }
  // Prevent CSV injection
  if (/^[=+\-@]/.test(value)) {
    return `'${value}`;
  }
  // Escape double quotes and wrap in double quotes if there are commas or quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
