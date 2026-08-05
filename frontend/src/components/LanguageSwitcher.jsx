import { useTranslation } from '../i18n/LanguageContext.jsx'

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, t } = useTranslation()
  return <label className={`language-switcher${compact ? ' compact' : ''}`} aria-label={t('Language')}>
    <span aria-hidden="true">文</span>
    <select value={language} onChange={event => setLanguage(event.target.value)} title={t('Language')}>
      <option value="en">EN</option>
      <option value="ta">தமிழ்</option>
    </select>
  </label>
}
