import { apiGet } from "./apiClient.js";

const COMMON_FOODS = [
  { id: "rice-basmati", name: "Basmati Rice", category: "Grains", calories: 130, protein: 2.4, carbs: 28, fat: 0.3 },
  { id: "dal-tadka", name: "Dal Tadka", category: "Legumes", calories: 110, protein: 6, carbs: 12, fat: 4 },
  { id: "paneer-tikka", name: "Paneer Tikka", category: "Dairy", calories: 190, protein: 14, carbs: 6, fat: 12 },
  { id: "roti-wholewheat", name: "Wholewheat Roti", category: "Grains", calories: 80, protein: 3, carbs: 15, fat: 1 },
  { id: "banana", name: "Banana", category: "Fruit", calories: 90, protein: 1.1, carbs: 23, fat: 0.3 },
  { id: "chicken-breast", name: "Grilled Chicken Breast", category: "Protein", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "greek-yogurt", name: "Greek Yogurt", category: "Dairy", calories: 100, protein: 10, carbs: 4, fat: 4 },
  { id: "mixed-vegetable", name: "Mixed Vegetable Curry", category: "Vegetables", calories: 120, protein: 4, carbs: 14, fat: 6 },
  { id: "almonds", name: "Almonds", category: "Nuts", calories: 170, protein: 6, carbs: 6, fat: 15 },
  { id: "oats", name: "Oats", category: "Grains", calories: 150, protein: 5, carbs: 27, fat: 3 },
];

const normalizeQuery = (text) => String(text || "").trim().toLowerCase();
const matchesFood = (food, query) => {
  const normalizedName = String(food.name || "").toLowerCase();
  const normalizedCategory = String(food.category || "").toLowerCase();
  return normalizedName.includes(query) || normalizedCategory.includes(query);
};

export async function searchFoods(query) {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const localMatches = COMMON_FOODS.filter((food) => matchesFood(food, normalized));
  if (localMatches.length) {
    return localMatches;
  }

  try {
    const data = await apiGet(`/api/foods?q=${encodeURIComponent(normalized)}`);
    return data || [];
  } catch (error) {
    console.warn("Food search failed, falling back to local foods", error);
    return COMMON_FOODS.filter((food) => matchesFood(food, normalized));
  }
}

export async function getFoodById(id) {
  const localFood = COMMON_FOODS.find((food) => String(food.id) === String(id));
  if (localFood) {
    return localFood;
  }

  try {
    const data = await apiGet(`/api/foods/${id}`);
    return data || null;
  } catch (error) {
    console.warn("Failed to load food", error);
    return null;
  }
}

export async function getFoodsByCategory(category) {
  const normalized = normalizeQuery(category);
  const localMatches = COMMON_FOODS.filter((food) => normalizeQuery(food.category) === normalized);
  if (localMatches.length) {
    return localMatches;
  }

  try {
    const data = await apiGet(`/api/foods/category/${encodeURIComponent(category)}`);
    return data || [];
  } catch (error) {
    console.warn("Failed to load foods by category", error);
    return [];
  }
}

export async function findFoodByName(name) {
  const normalized = normalizeQuery(name);
  if (!normalized) return null;

  const localFood = COMMON_FOODS.find((food) => String(food.name || "").toLowerCase() === normalized);
  if (localFood) {
    return localFood;
  }

  try {
    const results = await apiGet(`/api/foods?q=${encodeURIComponent(normalized)}&limit=1`);
    return results?.[0] ?? null;
  } catch (error) {
    console.warn("Failed to find food by name", error);
    return null;
  }
}
