export const DEFAULT_CATEGORIES = [
  { name: "Rent", emoji: "🏠" },
  { name: "Utilities", emoji: "⚡" },
  { name: "Groceries", emoji: "🛒" },
  { name: "Repairs", emoji: "🔧" },
  { name: "Outings", emoji: "🎉" },
  { name: "Other", emoji: "📦" },
];

export function getGroupCategories(group) {
  return group?.categories?.length > 0 ? group.categories : DEFAULT_CATEGORIES;
}

export const MODEL_OPTIONS = [
  { value: "equal", label: "Equal split" },
  { value: "room_size", label: "Room-size weighted" },
  { value: "income_weighted", label: "Income weighted" },
  { value: "shared_pot", label: "Shared pot" },
  { value: "pay_as_you_go", label: "Pay-as-you-go" },
];
