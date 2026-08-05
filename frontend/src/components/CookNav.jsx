import { Link, NavLink } from 'react-router-dom'
import LogoutButton from './LogoutButton.jsx'
import NotificationBell from './NotificationBell.jsx'
import LanguageSwitcher from './LanguageSwitcher.jsx'
import { useTranslation } from '../i18n/LanguageContext.jsx'

const links = [
  { to: '/cook/foods', label: 'My Foods' },
  { to: '/cook/add-food', label: 'Add Food' },
  { to: '/cook/orders', label: 'Orders' },
  { to: '/cook/earnings', label: 'Earnings' },
  { to: '/cook/complaints', label: 'Complaints' },
  { to: '/cook/profile', label: 'Profile' },
]

export default function CookNav() {
  const { t } = useTranslation()
  return (
    <header className="cook-nav">
      <div className="container cook-nav__bar">
        <Link to="/" className="cook-nav__logo"><img src="/tasteloop-logo.png" alt="TasteLoop home-cooked food marketplace" /></Link>
        <nav className="cook-nav__links" aria-label="Cook navigation">
          {links.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => `cook-nav__link${isActive ? ' active' : ''}`}>{t(link.label)}</NavLink>)}
        </nav>
        <LanguageSwitcher compact />
        <NotificationBell />
        <Link to="/cook/profile" className="cook-profile"><span className="cook-profile__avatar">👩‍🍳</span><span className="hide-mobile"><strong></strong><small>{t('Home cook')}</small></span></Link>
        <LogoutButton compact />
      </div>
    </header>
  )
}
