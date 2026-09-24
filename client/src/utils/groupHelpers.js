export const COLOR_OPTIONS = [
  "#105D5E",
  "#009A6E",
  "#B3EDA9",
  "#E8E300",
  "#767F7D",
  "#C2CBC9",
  "#293E33",
  "#FFFFFF",
];

export const DEFAULT_CATEGORIES = [
  { name: "Rent", iconName: "House", color: "#105D5E", split_model: "equal", is_default: true },
  { name: "Utilities", iconName: "Lightbulb", color: "#E8E300", split_model: "equal", is_default: true },
  { name: "Groceries", iconName: "ShoppingCart", color: "#009A6E", split_model: "equal", is_default: true },
  { name: "Repairs", iconName: "Wrench", color: "#767F7D", split_model: "equal", is_default: true },
  { name: "Outings", iconName: "PartyPopper", color: "#B3EDA9", split_model: "pay_as_you_go", is_default: true },
  { name: "Other", iconName: "Package", color: "#C2CBC9", split_model: "equal", is_default: true },
];

export function getGroupCategories(group) {
  return group?.categories?.length > 0 ? group.categories : DEFAULT_CATEGORIES;
}

export const MODEL_OPTIONS = [
  { value: "equal", label: "Equal split" },
  { value: "pay_as_you_go", label: "Pay-as-you-go" },
  { value: "room_size", label: "Room-size weighted" },
  { value: "income_weighted", label: "Income weighted" },
  { value: "shared_pot", label: "Shared pot" },
  { value: "custom", label: "Custom percentages" },
];

export const PERIOD_OPTIONS = [
  { label: "All Time", value: "all" },
  { label: "This Month", value: "month" },
  { label: "Last 3 Months", value: "3months" },
  { label: "Last 6 Months", value: "6months" },
];

export function getDateRange(filter) {
  const now = new Date();
  const nowIso = now.toISOString().split("T")[0];
  switch (filter) {
    case "month":
      return {
        start_date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
        end_date: nowIso,
      };
    case "3months":
      return {
        start_date: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split("T")[0],
        end_date: nowIso,
      };
    case "6months":
      return {
        start_date: new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split("T")[0],
        end_date: nowIso,
      };
    default:
      return {};
  }
}

