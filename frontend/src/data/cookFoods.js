export const initialCookFoods = [
  { id: 101, name: 'Chicken Rice & Curry', category: 'Rice & Curry', price: 850, portions: 12, status: 'Available', emoji: '🍛', color: '#f5d89c' },
  { id: 102, name: 'Cheese Chicken Kottu', category: 'Kottu', price: 1050, portions: 8, status: 'Available', emoji: '🥘', color: '#dce8c7' },
  { id: 103, name: 'Fish Cutlets', category: 'Short Eats', price: 480, portions: 0, status: 'Sold out', emoji: '🥟', color: '#f1d1b4' },
  { id: 104, name: 'Watalappan', category: 'Desserts', price: 500, portions: 6, status: 'Available', emoji: '🍮', color: '#e8c9a4' },
]

export function getCookFoods() {
  try {
    const saved = JSON.parse(localStorage.getItem('tasteloop-cook-foods'))
    return Array.isArray(saved) ? saved : [...initialCookFoods]
  } catch {
    return [...initialCookFoods]
  }
}

export function saveCookFoods(foods) {
  try {
    localStorage.setItem('tasteloop-cook-foods', JSON.stringify(foods))
  } catch {
    // The UI remains usable when browser storage is disabled.
  }
}
