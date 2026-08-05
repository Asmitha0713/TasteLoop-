import { NavLink } from 'react-router-dom'
import LogoutButton from './LogoutButton.jsx'
import NotificationBell from './NotificationBell.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { useTranslation } from '../i18n/LanguageContext.jsx'

export default function DeliveryNav() {
  const { t } = useTranslation()
  return <header className="delivery-nav"><NavLink to="/delivery/dashboard" className="delivery-brand"><img src="/tasteloop-logo.png" alt="TasteLoop" /><span>{t('Delivery Partner')}</span></NavLink><nav><NavLink to="/delivery/dashboard">{t('Dashboard')}</NavLink><NavLink to="/delivery/profile">{t('Profile')}</NavLink><LanguageSwitcher compact/><NotificationBell/><LogoutButton compact /></nav></header>
}
