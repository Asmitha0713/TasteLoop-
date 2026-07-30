import { NavLink } from 'react-router-dom'
import LogoutButton from './LogoutButton.jsx'
import NotificationBell from './NotificationBell.jsx'

export default function DeliveryNav() {
  return <header className="delivery-nav"><NavLink to="/delivery/dashboard" className="delivery-brand"><img src="/tasteloop-logo.png" alt="TasteLoop" /><span>Delivery Partner</span></NavLink><nav><NavLink to="/delivery/dashboard">Dashboard</NavLink><NavLink to="/delivery/profile">Profile</NavLink><NotificationBell/><LogoutButton compact /></nav></header>
}
