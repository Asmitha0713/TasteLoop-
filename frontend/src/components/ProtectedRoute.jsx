import { Navigate, useLocation } from 'react-router-dom'
import { currentUser } from '../services/api.js'

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation()
  const token = localStorage.getItem('tasteloop-token')
  const user = currentUser()

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (roles && !roles.includes(user.role)) {
    const requiredRole = roles.includes('home_cook') ? 'Home Cook' : roles.includes('admin') ? 'Admin' : 'Customer'
    return <Navigate to="/login" replace state={{ from: location.pathname, message: `${requiredRole} account required. Please log in with the correct account.` }} />
  }

  return children
}
