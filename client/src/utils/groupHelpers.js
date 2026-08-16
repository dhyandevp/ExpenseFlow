export const DEFAULT_CATEGORIES = [
  { name: "Rent", iconName: "House" },
  { name: "Utilities", iconName: "Lightbulb" },
  { name: "Groceries", iconName: "ShoppingCart" },
  { name: "Repairs", iconName: "Wrench" },
  { name: "Outings", iconName: "PartyPopper" },
  { name: "Other", iconName: "Package" },
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
