import React from 'react';
import {
  House,
  Lightbulb,
  ShoppingCart,
  Wrench,
  Package,
  Car,
  Bus,
  Train,
  Plane,
  Pizza,
  Coffee,
  Gamepad2,
  Clapperboard,
  Music,
  Tv,
  BookOpen,
  Pill,
  Hospital,
  HeartPulse,
  Dumbbell,
  GraduationCap,
  Laptop,
  Hotel,
  Map,
  Luggage,
  Umbrella,
  Dog,
  Cat,
  Bird,
  Rabbit,
  Settings,
  Wallet,
  CreditCard,
  Landmark,
  ReceiptText,
  PartyPopper,
  Gift,
  Utensils
} from 'lucide-react';

// Maps legacy emoji to a Lucide icon component, and names to icons for defaults
export const iconMapping = {
  // Legacy Emojis from DEFAULT_CATEGORIES
  "🏠": House,
  "⚡": Lightbulb,
  "🛒": ShoppingCart,
  "🔧": Wrench,
  "📦": Package,
  "🍔": Utensils,
  "🚗": Car,
  "✈️": Plane,
  "☕": Coffee,
  "🍕": Pizza,
  "🎮": Gamepad2,
  "🎬": Clapperboard,
  "🎵": Music,
  "📺": Tv,
  "💊": Pill,
  "🏥": Hospital,
  "📚": BookOpen,
  "💻": Laptop,
  "🏨": Hotel,
  "🐾": Dog,
  "💰": Wallet,
  "💳": CreditCard,
  "🎁": Gift,

  // Fallback defaults
  "Rent": House,
  "Utilities": Lightbulb,
  "Groceries": ShoppingCart,
  "Repairs": Wrench,
  "Outings": PartyPopper,
  "Other": Package,
  "Food": Utensils,
  "Transport": Car,
};

export function CategoryIcon({ category, size = 16, className = "" }) {
  if (!category) return <Package size={size} className={className} />;

  if (category.iconName && availableIcons[category.iconName]) {
    const IconComponent = availableIcons[category.iconName];
    return <IconComponent size={size} className={className} />;
  }

  const identifier = category.emoji || category.name;
  const MappedIcon = iconMapping[identifier] || Package;

  return <MappedIcon size={size} className={className} />;
}

// Groups for the AddCategoryModal
export const ICON_GROUPS = [
  { label: "Home & Living", icons: [{name: "House", Icon: House}, {name: "Lightbulb", Icon: Lightbulb}, {name: "Wrench", Icon: Wrench}] },
  { label: "Transport", icons: [{name: "Car", Icon: Car}, {name: "Bus", Icon: Bus}, {name: "Train", Icon: Train}, {name: "Plane", Icon: Plane}] },
  { label: "Food & Drinks", icons: [{name: "Utensils", Icon: Utensils}, {name: "Pizza", Icon: Pizza}, {name: "Coffee", Icon: Coffee}, {name: "ShoppingCart", Icon: ShoppingCart}] },
  { label: "Entertainment", icons: [{name: "Gamepad2", Icon: Gamepad2}, {name: "Clapperboard", Icon: Clapperboard}, {name: "Music", Icon: Music}, {name: "Tv", Icon: Tv}, {name: "PartyPopper", Icon: PartyPopper}] },
  { label: "Health", icons: [{name: "Pill", Icon: Pill}, {name: "Hospital", Icon: Hospital}, {name: "HeartPulse", Icon: HeartPulse}, {name: "Dumbbell", Icon: Dumbbell}] },
  { label: "Education", icons: [{name: "BookOpen", Icon: BookOpen}, {name: "GraduationCap", Icon: GraduationCap}, {name: "Laptop", Icon: Laptop}] },
  { label: "Travel", icons: [{name: "Hotel", Icon: Hotel}, {name: "Map", Icon: Map}, {name: "Luggage", Icon: Luggage}, {name: "Umbrella", Icon: Umbrella}] },
  { label: "Pets", icons: [{name: "Dog", Icon: Dog}, {name: "Cat", Icon: Cat}, {name: "Bird", Icon: Bird}, {name: "Rabbit", Icon: Rabbit}] },
  { label: "Finance", icons: [{name: "Wallet", Icon: Wallet}, {name: "CreditCard", Icon: CreditCard}, {name: "Landmark", Icon: Landmark}, {name: "ReceiptText", Icon: ReceiptText}] },
  { label: "Other", icons: [{name: "Package", Icon: Package}, {name: "Gift", Icon: Gift}, {name: "Settings", Icon: Settings}] },
];

export const availableIcons = {};
ICON_GROUPS.forEach(group => {
  group.icons.forEach(({name, Icon}) => {
    availableIcons[name] = Icon;
  });
});
