export const categories = [
  { name: 'Rice & Curry', emoji: '🍛' },
  { name: 'Kottu', emoji: '🥘' },
  { name: 'Bakes', emoji: '🥐' },
  { name: 'Desserts', emoji: '🍮' },
]

export const foods = [
  { id: 1, name: 'Chicken Rice & Curry', category: 'Rice & Curry', cook: 'Nadeesha’s Kitchen', price: 850, rating: 4.9, emoji: '🍛', color: '#f5d89c' },
  { id: 2, name: 'Cheese Chicken Kottu', category: 'Kottu', cook: 'Amma’s Table', price: 1050, rating: 4.8, emoji: '🥘', color: '#dce8c7' },
  { id: 3, name: 'Fresh Fish Buns', category: 'Bakes', cook: 'Rani Bakes', price: 450, rating: 4.7, emoji: '🥐', color: '#f1d1b4' },
  { id: 4, name: 'Watalappan', category: 'Desserts', cook: 'Sweet Colombo', price: 500, rating: 4.9, emoji: '🍮', color: '#e8c9a4' },
  { id: 5, name: 'Vegetable Rice & Curry', category: 'Rice & Curry', cook: 'Green Pot', price: 700, rating: 4.6, emoji: '🍚', color: '#d7e6b5' },
  { id: 6, name: 'Seafood Kottu', category: 'Kottu', cook: 'Coastal Kitchen', price: 1200, rating: 4.8, emoji: '🍲', color: '#cfe3e5' },
]

export const cooks = [
  { id: 1, name: 'Nadeesha Perera', specialty: 'Traditional Sri Lankan', rating: 4.9, orders: 214, emoji: '👩🏽‍🍳', color: '#f5d89c' },
  { id: 2, name: 'Rani Selvarajah', specialty: 'Bakes & short eats', rating: 4.8, orders: 176, emoji: '👩🏾‍🍳', color: '#dce8c7' },
  { id: 3, name: 'Fathima Azeez', specialty: 'Rice, curry & sweets', rating: 4.9, orders: 193, emoji: '👩🏽‍🍳', color: '#f1d1b4' },
]

export const foodDetail = {
  ...foods[0],
  reviews: 68,
  description: 'A generous home-style plate with fragrant rice, slow-cooked chicken curry, dhal, seasonal vegetables and fresh sambol.',
  ingredients: ['Rice', 'Chicken', 'Coconut milk', 'Dhal', 'Seasonal vegetables', 'Spices'],
}
