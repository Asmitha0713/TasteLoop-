import { foods } from './sampleData.js'

export const cartItems = [
  { ...foods[0], quantity: 2 },
  { ...foods[3], quantity: 1 },
]

export const orders = [
  { id: 'TL-2048', date: '20 July 2026', cook: 'Nadeesha’s Kitchen', items: '2 × Chicken Rice & Curry', total: 1850, status: 'Preparing', emoji: '🍛', color: '#f5d89c' },
  { id: 'TL-1982', date: '12 July 2026', cook: 'Amma’s Table', items: '1 × Cheese Chicken Kottu', total: 1250, status: 'Delivered', emoji: '🥘', color: '#dce8c7' },
  { id: 'TL-1911', date: '28 June 2026', cook: 'Rani Bakes', items: '4 × Fresh Fish Buns', total: 2000, status: 'Delivered', emoji: '🥐', color: '#f1d1b4' },
  { id: 'TL-1876', date: '19 June 2026', cook: 'Sweet Colombo', items: '2 × Watalappan', total: 1200, status: 'Cancelled', emoji: '🍮', color: '#e8c9a4' },
]
