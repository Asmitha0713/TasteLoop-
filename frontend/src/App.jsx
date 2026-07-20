import { Routes, Route } from 'react-router-dom'

// Public flow
import Landing from './pages/Landing.jsx'
import About from './pages/About.jsx'
import Browse from './pages/Browse.jsx'
import FoodDetails from './pages/FoodDetails.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import ChooseRole from './pages/ChooseRole.jsx'

// Customer flow
import CustomerDashboard from './pages/customer/CustomerDashboard.jsx'
import SearchFilter from './pages/customer/SearchFilter.jsx'
import Cart from './pages/customer/Cart.jsx'
import Checkout from './pages/customer/Checkout.jsx'
import OrderConfirmation from './pages/customer/OrderConfirmation.jsx'
import OrderHistory from './pages/customer/OrderHistory.jsx'
import CustomerProfile from './pages/customer/CustomerProfile.jsx'

// Home Cook flow
import CookDashboard from './pages/cook/CookDashboard.jsx'
import AddFood from './pages/cook/AddFood.jsx'
import ManageFoods from './pages/cook/ManageFoods.jsx'
import CookOrders from './pages/cook/CookOrders.jsx'
import Earnings from './pages/cook/Earnings.jsx'
import CookProfile from './pages/cook/CookProfile.jsx'

// Admin flow
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import ManageUsers from './pages/admin/ManageUsers.jsx'
import AdminManageFoods from './pages/admin/AdminManageFoods.jsx'
import Reports from './pages/admin/Reports.jsx'

export default function App() {
  return (
    <Routes>
      {/* Public flow */}
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/food/:id" element={<FoodDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/choose-role" element={<ChooseRole />} />

      {/* Customer flow */}
      <Route path="/customer/dashboard" element={<CustomerDashboard />} />
      <Route path="/customer/search" element={<SearchFilter />} />
      <Route path="/customer/cart" element={<Cart />} />
      <Route path="/customer/checkout" element={<Checkout />} />
      <Route path="/customer/order-confirmation" element={<OrderConfirmation />} />
      <Route path="/customer/orders" element={<OrderHistory />} />
      <Route path="/customer/profile" element={<CustomerProfile />} />

      {/* Home Cook flow */}
      <Route path="/cook/dashboard" element={<CookDashboard />} />
      <Route path="/cook/add-food" element={<AddFood />} />
      <Route path="/cook/manage-foods" element={<ManageFoods />} />
      <Route path="/cook/orders" element={<CookOrders />} />
      <Route path="/cook/earnings" element={<Earnings />} />
      <Route path="/cook/profile" element={<CookProfile />} />

      {/* Admin flow */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<ManageUsers />} />
      <Route path="/admin/foods" element={<AdminManageFoods />} />
      <Route path="/admin/reports" element={<Reports />} />
    </Routes>
  )
}
