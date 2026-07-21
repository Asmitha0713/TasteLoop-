export const adminUsers = [
  { id: 1, name: 'Nadeesha Perera', email: 'nadeesha@example.com', role: 'Home Cook', joined: '12 May 2026', status: 'Active', avatar: 'NP', color: '#dfece4' },
  { id: 2, name: 'Ayesha Silva', email: 'ayesha@example.com', role: 'Customer', joined: '18 May 2026', status: 'Active', avatar: 'AS', color: '#f8e8ba' },
  { id: 3, name: 'Rani Selvarajah', email: 'rani@example.com', role: 'Home Cook', joined: '02 Jun 2026', status: 'Pending', avatar: 'RS', color: '#f1d1b4' },
  { id: 4, name: 'Kasun Perera', email: 'kasun@example.com', role: 'Customer', joined: '11 Jun 2026', status: 'Suspended', avatar: 'KP', color: '#eaded5' },
  { id: 5, name: 'Fathima Azeez', email: 'fathima@example.com', role: 'Home Cook', joined: '28 Jun 2026', status: 'Active', avatar: 'FA', color: '#d9e6c0' },
  { id: 6, name: 'Mariam Ali', email: 'mariam@example.com', role: 'Customer', joined: '09 Jul 2026', status: 'Active', avatar: 'MA', color: '#dce5ef' },
]

export const adminFoods = [
  { id: 1, name: 'Chicken Rice & Curry', cook: 'Nadeesha’s Kitchen', category: 'Rice & Curry', price: 850, status: 'Approved', emoji: '🍛', color: '#f5d89c', date: '20 Jul 2026' },
  { id: 2, name: 'Cheese Chicken Kottu', cook: 'Amma’s Table', category: 'Kottu', price: 1050, status: 'Approved', emoji: '🥘', color: '#dce8c7', date: '20 Jul 2026' },
  { id: 3, name: 'Spicy Fish Buns', cook: 'Rani Bakes', category: 'Bakes', price: 450, status: 'Pending', emoji: '🥐', color: '#f1d1b4', date: '21 Jul 2026' },
  { id: 4, name: 'Watalappan', cook: 'Sweet Colombo', category: 'Desserts', price: 500, status: 'Approved', emoji: '🍮', color: '#e8c9a4', date: '18 Jul 2026' },
  { id: 5, name: 'Seafood Kottu', cook: 'Coastal Kitchen', category: 'Kottu', price: 1200, status: 'Flagged', emoji: '🍲', color: '#cfe3e5', date: '17 Jul 2026' },
]

export const adminReports = [
  { id: 'RP-1042', type: 'Food quality', subject: 'Seafood Kottu', reporter: 'Ayesha Silva', against: 'Coastal Kitchen', date: '21 Jul 2026', status: 'Open', priority: 'High', details: 'The meal received did not match the listing description.' },
  { id: 'RP-1039', type: 'Late delivery', subject: 'Order #TL-2058', reporter: 'Kasun Perera', against: 'Quick Home Foods', date: '20 Jul 2026', status: 'Investigating', priority: 'Medium', details: 'Delivery arrived more than two hours after the estimated time.' },
  { id: 'RP-1034', type: 'Account conduct', subject: 'Inappropriate messages', reporter: 'Mariam Ali', against: 'User #284', date: '18 Jul 2026', status: 'Open', priority: 'High', details: 'Customer reported inappropriate communication after an order.' },
  { id: 'RP-1028', type: 'Incorrect order', subject: 'Order #TL-2011', reporter: 'Nimali Raj', against: 'Amma’s Table', date: '15 Jul 2026', status: 'Resolved', priority: 'Low', details: 'The incorrect side dish was supplied and later replaced.' },
]
