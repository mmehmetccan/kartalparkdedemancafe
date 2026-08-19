import { Languages } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';

const LanguageSwitcher = ({ className = '', compact = false }) => {
  const { language, languages, setLanguage, t } = useI18n();

  return (
    <label className={`app-language-switcher ${compact ? 'compact' : ''} ${className}`.trim()}>
      <span className="app-language-switcher-icon" aria-hidden="true">
        <Languages size={16} />
      </span>
      <span className="app-language-switcher-label">{t('common.languageLabel')}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value)} aria-label={t('common.languageLabel')}>
        {languages.map((item) => (
          <option key={item} value={item}>
            {t(`common.languageNames.${item}`)}
          </option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSwitcher;
