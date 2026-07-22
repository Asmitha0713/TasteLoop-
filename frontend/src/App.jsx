import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import About from './pages/About.jsx'
import Browse from './pages/Browse.jsx'
import ChooseRole from './pages/chooseRole.jsx'
import FoodDetails from './pages/FoodDetails.jsx'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import CustomerDashboard from './pages/CustomerDashboard.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import OrderHistory from './pages/OrderHistory.jsx'
import SearchFilter from './pages/SearchFilter.jsx'
import AddFood from './pages/AddFood.jsx'
import ManageFoods from './pages/ManageFoods.jsx'
import Earnings from './pages/Earnings.jsx'
import CookProfile from './pages/CookProfile.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import AdminFoods from './pages/AdminFoods.jsx'
import AdminReports from './pages/AdminReports.jsx'
import CustomerProfile from './pages/CustomerProfile.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

const customer = (element) => <ProtectedRoute roles={['customer']}>{element}</ProtectedRoute>
const cook = (element) => <ProtectedRoute roles={['home_cook']}>{element}</ProtectedRoute>
const admin = (element) => <ProtectedRoute roles={['admin']}>{element}</ProtectedRoute>

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/about" element={<About />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/food/:id" element={<FoodDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/choose-role" element={<ChooseRole />} />
      <Route path="/customer/dashboard" element={customer(<CustomerDashboard />)} />
      <Route path="/customer/profile" element={customer(<CustomerProfile />)} />
      <Route path="/search" element={<SearchFilter />} />
      <Route path="/cart" element={customer(<Cart />)} />
      <Route path="/checkout" element={customer(<Checkout />)} />
      <Route path="/order-confirmation" element={customer(<OrderConfirmation />)} />
      <Route path="/orders" element={customer(<OrderHistory />)} />
      <Route path="/cook/dashboard" element={<Navigate to="/cook/foods" replace />} />
      <Route path="/cook/foods" element={cook(<ManageFoods />)} />
      <Route path="/cook/add-food" element={cook(<AddFood />)} />
      <Route path="/cook/foods/:id/edit" element={cook(<AddFood />)} />
      <Route path="/cook/earnings" element={cook(<Earnings />)} />
      <Route path="/cook/profile" element={cook(<CookProfile />)} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={admin(<AdminDashboard />)} />
      <Route path="/admin/users" element={admin(<AdminUsers />)} />
      <Route path="/admin/foods" element={admin(<AdminFoods />)} />
      <Route path="/admin/reports" element={admin(<AdminReports />)} />
      <Route path="/addfood" element={<Navigate to="/cook/add-food" replace />} />
      <Route path="/managefoods" element={<Navigate to="/cook/foods" replace />} />
      <Route path="/cook/manage-foods" element={<Navigate to="/cook/foods" replace />} />
      <Route path="/cookfoods" element={<Navigate to="/cook/foods" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
