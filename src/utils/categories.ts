// The product categories shown in the overlay and the panel.
// This is the single source of truth: adding an entry here surfaces a new
// overlay button and a new panel tab, and requires an icon in Overlay.tsx.
export const categories = [
  { key: "makeup", label: "Makeup" },
  { key: "skincare", label: "Skincare" },
  { key: "haircare", label: "Haircare" },
] as const;

export type CategoryKey = (typeof categories)[number]["key"];

const categoryKeys: readonly string[] = categories.map(({ key }) => key);

export const isCategoryKey = (value: string): value is CategoryKey =>
  categoryKeys.includes(value);

/**
 * Normalize a raw `category` string from products.json into a category key,
 * so that data entered as "Haircare", "haircare" or " Hair Care " all match.
 * Returns null for anything that isn't a known category.
 */
export const toCategoryKey = (
  value: string | undefined,
): CategoryKey | null => {
  const normalized = value?.trim().toLowerCase().replace(/\s+/g, "");
  return normalized && isCategoryKey(normalized) ? normalized : null;
};

export const categoryLabel = (key: CategoryKey) =>
  categories.find((category) => category.key === key)!.label;
