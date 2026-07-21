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
    const home = user.role === 'admin' ? '/admin/dashboard' : user.role === 'home_cook' ? '/cook/foods' : '/customer/dashboard'
    return <Navigate to={home} replace />
  }

  return children
}
