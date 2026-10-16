import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n/useI18n';
import FlagIcon from './FlagIcon';

// Diller kendi adlarıyla listelenir; misafir hangi dilde olursa olsun kendi dilini tanır.
const NATIVE_NAMES = { tr: 'Türkçe', en: 'English', de: 'Deutsch', ar: 'العربية', ru: 'Русский' };
const MENU_WIDTH = 178;
const ROW_HEIGHT = 40;
const VIEWPORT_PADDING = 10;

const LanguageSwitcher = ({ className = '', compact = false }) => {
  const { language, languages, setLanguage, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const reposition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const menuHeight = languages.length * ROW_HEIGHT + 14;
    const openUpwards = rect.bottom + menuHeight + VIEWPORT_PADDING > window.innerHeight
      && rect.top - menuHeight > VIEWPORT_PADDING;
    const maxLeft = window.innerWidth - MENU_WIDTH - VIEWPORT_PADDING;
    setPlacement({
      top: openUpwards ? rect.top - menuHeight - 6 : rect.bottom + 6,
      left: Math.max(VIEWPORT_PADDING, Math.min(rect.right - MENU_WIDTH, maxLeft)),
    });
  }, [languages.length]);

  useEffect(() => {
    if (!open) return undefined;
    reposition();

    const closeOnOutside = (event) => {
      if (triggerRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open, reposition]);

  const select = (item) => {
    setLanguage(item);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const activeName = t(`common.languageNames.${language}`);

  return (
    <div className={`app-language-switcher ${compact ? 'compact' : ''} ${className}`.trim()}>
      <button
        ref={triggerRef}
        type="button"
        className={`app-language-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t('common.languageLabel')}: ${activeName}`}
        title={activeName}
      >
        <FlagIcon language={language} />
        <ChevronDown size={compact ? 12 : 14} aria-hidden="true" />
      </button>

      {open && placement && createPortal(
        <div
          ref={menuRef}
          className="app-language-menu"
          style={{ top: `${placement.top}px`, left: `${placement.left}px`, width: `${MENU_WIDTH}px` }}
          role="listbox"
          aria-label={t('common.languageLabel')}
        >
          {languages.map((item) => (
            <button
              key={item}
              type="button"
              role="option"
              aria-selected={item === language}
              className={`app-language-option${item === language ? ' active' : ''}`}
              onClick={() => select(item)}
            >
              <FlagIcon language={item} />
              <span>{NATIVE_NAMES[item] || t(`common.languageNames.${item}`)}</span>
              {item === language && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default LanguageSwitcher;
