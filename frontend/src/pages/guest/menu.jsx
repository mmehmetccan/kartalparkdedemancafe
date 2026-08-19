import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BedDouble, CheckCircle2, ChevronLeft, Coffee, CreditCard, LogOut, Minus, PhoneCall, Plus, ShoppingBag, ShoppingCart, WalletCards, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { api, withToken } from '../../lib/api';
import { clearGuestSession, getGuestCart, getGuestSession, isGuestSessionExpired, saveGuestCart } from '../../lib/guestSession';
import { useI18n } from '../../i18n/useI18n';
import menuTranslations from '../../i18n/menuTranslations';
import { resolveProductImageUrl, SECTION_TRAITS } from '../../lib/menuCategories';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import '../../styles/Guest/GuestMenu.css';

const HOTEL_HERO_IMAGE = import.meta.env.VITE_HOTEL_HERO_IMAGE || '/park-dedeman-lobby.png';
const PRODUCT_FALLBACK_IMAGE = '/menu-products/americano-v1.jpg';
const DEFAULT_PRODUCT_IMAGE_IDS = {
  Espresso: ['photo-1510707577719-ae7c14805e3a'],
  Americano: ['photo-1494314671902-399b18174975', 'photo-1495474472287-4d71bcdd2085'],
  Cappuccino: ['photo-1534778101976-62847782c213', 'photo-1509042239860-f550ce710b93'],
  Latte: ['photo-1570968915860-54d5c301fa9f', 'photo-1442512595331-e89e73853f31'],
  'Türk Kahvesi': ['photo-1541167760496-1628856ab772', 'photo-1514432324607-a09d9b4aefdd'],
  'Iced Latte': ['photo-1461023058943-07fcbe16d735', 'photo-1512568400610-62da28bc8a13']
};
const COFFEE_IMAGE_SET = {
  Espresso: '/menu-products/espresso-v1.jpg',
  Americano: '/menu-products/americano-v1.jpg',
  Cappuccino: '/menu-products/cappuccino-v1.jpg',
  Latte: '/menu-products/latte-v1.jpg',
  'Türk Kahvesi': '/menu-products/turk-kahvesi-v1.jpg',
  'Iced Latte': '/menu-products/iced-latte-v1.jpg'
};
const getProductSourceName = (product) => String(product.baseName || product.name || '').trim();
const applyDefaultCoffeeImage = (product) => {
  const name = getProductSourceName(product);
  const previousImageIds = DEFAULT_PRODUCT_IMAGE_IDS[name];
  const updatedImage = COFFEE_IMAGE_SET[name];
  const usesPreviousDefault = previousImageIds?.some((imageId) => product.imageUrl?.includes(imageId));
  if (updatedImage && (!product.imageUrl || usesPreviousDefault || product.imageUrl === updatedImage)) {
    return { ...product, imageUrl: updatedImage };
  }
  return product;
};
const PRODUCT_DETAIL_INTENSITIES = {
  espresso: 5,
  americano: 4,
  cappuccino: 3,
  latte: 2,
  'türk kahvesi': 5,
  'iced latte': 3
};
const getNestedValue = (source, key) => key.split('.').reduce((accumulator, part) => (accumulator && Object.prototype.hasOwnProperty.call(accumulator, part) ? accumulator[part] : undefined), source);
const interpolateValue = (template, values) => {
  if (!values) return template;
  return template.replace(/\{\{(.*?)\}\}/g, (_, token) => values[token.trim()] ?? '');
};
const splitTextLines = (value) => String(value || '').split('|');
const formatMoney = (value, locale) => new Intl.NumberFormat(locale || 'tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(value || 0);

const getProductDetail = (product, translateMenu, language) => {
  const normalizedName = getProductSourceName(product).toLowerCase();
  const fallbackDescription = translateMenu(`products.fallbackDetails.${normalizedName}`) !== `products.fallbackDetails.${normalizedName}`
    ? translateMenu(`products.fallbackDetails.${normalizedName}`)
    : translateMenu('products.fallbackDetails.generic');
  const fallbackIntensity = PRODUCT_DETAIL_INTENSITIES[normalizedName] || 3;
  const intensity = Number(product.intensity ?? fallbackIntensity);
  const translatedDescription = product.translations?.[language]?.description;
  const useCatalogTranslation = language !== 'tr' && PRODUCT_DETAIL_INTENSITIES[normalizedName];
  return {
    description: translatedDescription || (useCatalogTranslation ? fallbackDescription : product.description || fallbackDescription),
    intensity: Number.isFinite(intensity) ? Math.min(5, Math.max(1, Math.round(intensity))) : fallbackIntensity
  };
};

const getLocalizedProductName = (product, translateMenu, language) => {
  const translatedName = product.translations?.[language]?.name;
  if (translatedName) return translatedName;
  const normalizedName = getProductSourceName(product).toLowerCase();
  const catalogName = translateMenu(`products.fallbackNames.${normalizedName}`);
  return catalogName === `products.fallbackNames.${normalizedName}` ? product.name : catalogName;
};
const MENU_SECTIONS = [
  { id: 'ana-yemekler' },
  { id: 'ara-sicaklar' },
  { id: 'kahvaltilar' },
  {
    id: 'tatli-meyve',
    children: [
      { id: 'tatlilar' },
      { id: 'meyveler' }
    ]
  },
  {
    id: 'kahveler',
    children: [
      { id: 'sicak-kahveler' },
      { id: 'soguk-kahveler' }
    ]
  },
  { id: 'icecekler' }
];

const CategoryMotion = ({ category }) => {
  if (category === 'kahveler') {
    return <svg className="guest-category-motion guest-category-motion-coffee" viewBox="0 0 150 86" aria-hidden="true" focusable="false">
      <ellipse className="guest-category-motion-shadow" cx="77" cy="76" rx="41" ry="4" />
      <g className="guest-category-coffee-pot">
        <path d="M89 7h30l-4 20H94z" />
        <path d="M116 11c12 0 13 12 1 13" fill="none" />
        <path d="M91 13l-12 5 13 4" />
      </g>
      <path className="guest-category-coffee-stream" d="M82 21c-7 9-7 17-7 29" />
      <g className="guest-category-coffee-cup">
        <path d="M48 48h51v13c0 9-7 14-16 14H64c-9 0-16-5-16-14z" />
        <path d="M99 52h5c12 0 12 15 1 16h-8" fill="none" />
        <path d="M42 75h66" fill="none" />
        <path className="guest-category-coffee-surface" d="M51 49c13 4 31-4 45 0" fill="none" />
      </g>
      <path className="guest-category-coffee-steam guest-category-coffee-steam-one" d="M61 46c-7-9 8-12 1-22" fill="none" />
      <path className="guest-category-coffee-steam guest-category-coffee-steam-two" d="M88 45c7-8-7-12 0-21" fill="none" />
    </svg>;
  }

  if (category === 'ana-yemekler') {
    return <svg className="guest-category-motion guest-category-motion-burger" viewBox="0 0 150 86" aria-hidden="true" focusable="false">
      <ellipse className="guest-category-motion-shadow" cx="75" cy="77" rx="44" ry="4" />
      <path className="guest-category-burger-bottom" d="M39 64h72c0 9-8 12-17 12H56c-9 0-17-3-17-12z" />
      <rect className="guest-category-burger-patty" x="37" y="55" width="76" height="11" rx="5.5" />
      <path className="guest-category-burger-cheese" d="M42 51h67l-8 9-10-6-10 7-11-7-10 6z" />
      <path className="guest-category-burger-green" d="M39 48c8-5 15 5 23 0s15 5 23 0 15 5 25 0v8H39z" />
      <g className="guest-category-burger-top">
        <path d="M40 45c2-19 16-30 35-30s33 11 35 30z" />
        <g className="guest-category-burger-seeds">
          <path d="M57 29l4-2M70 22l4 1M85 24l4-2M96 31l4 1" />
        </g>
      </g>
    </svg>;
  }

  if (category === 'ara-sicaklar') {
    return <svg className="guest-category-motion guest-category-motion-starter" viewBox="0 0 150 86" aria-hidden="true" focusable="false">
      <ellipse className="guest-category-motion-shadow" cx="75" cy="76" rx="42" ry="4" />
      <path className="guest-category-starter-bowl" d="M34 54h82c-5 15-18 22-41 22S39 69 34 54z" />
      <path className="guest-category-starter-rim" d="M31 53c17-5 71-5 88 0" fill="none" />
      <rect className="guest-category-starter-piece guest-category-starter-piece-one" x="49" y="25" width="14" height="29" rx="6" />
      <rect className="guest-category-starter-piece guest-category-starter-piece-two" x="69" y="15" width="14" height="34" rx="6" />
      <rect className="guest-category-starter-piece guest-category-starter-piece-three" x="90" y="25" width="14" height="29" rx="6" />
      <path className="guest-category-starter-steam guest-category-starter-steam-one" d="M57 22c-7-7 7-10 1-17" fill="none" />
      <path className="guest-category-starter-steam guest-category-starter-steam-two" d="M96 22c7-7-7-10-1-17" fill="none" />
    </svg>;
  }

  if (category === 'tatli-meyve') {
    return <svg className="guest-category-motion guest-category-motion-dessert" viewBox="0 0 150 86" aria-hidden="true" focusable="false">
      <ellipse className="guest-category-motion-shadow" cx="75" cy="76" rx="43" ry="4" />
      <ellipse className="guest-category-dessert-plate" cx="75" cy="68" rx="43" ry="8" />
      <path className="guest-category-dessert-cake" d="M47 60l33-37 26 37z" />
      <path className="guest-category-dessert-cream" d="M53 52c12-6 28 4 46-1l7 9H47z" />
      <path className="guest-category-dessert-layer" d="M58 46h36" fill="none" />
      <g className="guest-category-dessert-fruit">
        <circle cx="79" cy="24" r="7" />
        <path d="M81 18c2-7 8-8 11-7" fill="none" />
        <path d="M85 14c4-4 8-2 9 1-4 2-7 2-9-1z" />
      </g>
      <circle className="guest-category-dessert-spark guest-category-dessert-spark-one" cx="44" cy="27" r="2.5" />
      <circle className="guest-category-dessert-spark guest-category-dessert-spark-two" cx="110" cy="31" r="2" />
    </svg>;
  }

  if (category === 'icecekler') {
    return <svg className="guest-category-motion guest-category-motion-drink" viewBox="0 0 150 86" aria-hidden="true" focusable="false">
      <ellipse className="guest-category-motion-shadow" cx="75" cy="77" rx="32" ry="4" />
      <path className="guest-category-drink-straw" d="M88 7l-9 22" fill="none" />
      <path className="guest-category-drink-glass" d="M48 23h55l-7 52H55z" />
      <path className="guest-category-drink-liquid" d="M53 44h45l-4 28H57z" />
      <rect className="guest-category-drink-ice guest-category-drink-ice-one" x="60" y="29" width="13" height="13" rx="2" />
      <rect className="guest-category-drink-ice guest-category-drink-ice-two" x="78" y="24" width="14" height="14" rx="2" />
      <circle className="guest-category-drink-bubble guest-category-drink-bubble-one" cx="67" cy="61" r="2.5" />
      <circle className="guest-category-drink-bubble guest-category-drink-bubble-two" cx="84" cy="66" r="2" />
      <circle className="guest-category-drink-bubble guest-category-drink-bubble-three" cx="89" cy="53" r="1.7" />
    </svg>;
  }

  return <svg className="guest-category-motion guest-category-motion-breakfast" viewBox="0 0 150 86" aria-hidden="true" focusable="false">
    <ellipse className="guest-category-motion-shadow" cx="75" cy="77" rx="44" ry="4" />
    <g className="guest-category-breakfast-sun">
      <circle cx="105" cy="27" r="13" />
      <path d="M105 6v7M105 41v7M84 27h7M119 27h7M90 12l5 5M115 37l5 5M120 12l-5 5" fill="none" />
    </g>
    <ellipse className="guest-category-breakfast-plate" cx="72" cy="64" rx="43" ry="12" />
    <path className="guest-category-breakfast-egg" d="M45 62c-3-10 6-21 17-18 8-11 27-7 28 6 12 4 10 18-2 21-13 5-38 2-43-9z" />
    <circle className="guest-category-breakfast-yolk" cx="69" cy="57" r="9" />
    <path className="guest-category-breakfast-toast" d="M84 15c9-5 24-2 27 6l-5 31H82l-4-31c1-4 3-5 6-6z" />
  </svg>;
};

const getLocalizedMenuDictionary = (language) => menuTranslations[language] || menuTranslations.tr;

const CATEGORY_THEMES = {
  kahveler: {
    surfaceRgb: '252, 248, 240',
    altRgb: '242, 247, 241',
    accent: '#8d6539',
    accentSoft: '#efe3cf',
    strong: '#214632',
    line: 'rgba(113, 80, 53, .16)',
    buttonBg: '#f7eee0',
    buttonHover: '#f2e4ce',
    buttonText: '#5e3921',
    buttonBorder: 'rgba(111, 71, 42, .38)'
  },
  icecekler: {
    surfaceRgb: '244, 249, 248',
    altRgb: '239, 246, 242',
    accent: '#356f6c',
    accentSoft: '#dceeed',
    strong: '#19393b',
    line: 'rgba(49, 107, 100, .14)',
    buttonBg: '#e8f3f0',
    buttonHover: '#dcedea',
    buttonText: '#1f5855',
    buttonBorder: 'rgba(55, 110, 105, .34)'
  },
  kahvaltilar: {
    surfaceRgb: '253, 247, 235',
    altRgb: '247, 240, 225',
    accent: '#8e7244',
    accentSoft: '#f2e6c9',
    strong: '#4a3922',
    line: 'rgba(137, 111, 63, .16)',
    buttonBg: '#f6ead2',
    buttonHover: '#efdfbf',
    buttonText: '#674f2a',
    buttonBorder: 'rgba(131, 103, 58, .34)'
  },
  'ana-yemekler': {
    surfaceRgb: '248, 245, 239',
    altRgb: '240, 246, 238',
    accent: '#5e7048',
    accentSoft: '#e4ebd9',
    strong: '#233322',
    line: 'rgba(87, 110, 70, .16)',
    buttonBg: '#e9f0e0',
    buttonHover: '#dde8d3',
    buttonText: '#355133',
    buttonBorder: 'rgba(82, 106, 68, .34)'
  },
  'ara-sicaklar': {
    surfaceRgb: '249, 242, 234',
    altRgb: '243, 237, 228',
    accent: '#975d3d',
    accentSoft: '#f0dccd',
    strong: '#4b2d1f',
    line: 'rgba(132, 82, 53, .16)',
    buttonBg: '#f5e5d8',
    buttonHover: '#efd9c8',
    buttonText: '#6b3f2a',
    buttonBorder: 'rgba(132, 82, 53, .34)'
  },
  'tatli-meyve': {
    surfaceRgb: '252, 244, 242',
    altRgb: '247, 238, 236',
    accent: '#a4645b',
    accentSoft: '#f4dcd7',
    strong: '#4a2724',
    line: 'rgba(153, 95, 84, .16)',
    buttonBg: '#f7e3df',
    buttonHover: '#f0d4ce',
    buttonText: '#7b463f',
    buttonBorder: 'rgba(158, 92, 82, .34)'
  },
  default: {
    surfaceRgb: '248, 247, 242',
    altRgb: '240, 246, 238',
    accent: '#556a55',
    accentSoft: '#e4ebe1',
    strong: '#253428',
    line: 'rgba(85, 106, 85, .14)',
    buttonBg: '#edf2ea',
    buttonHover: '#e2eadf',
    buttonText: '#36503b',
    buttonBorder: 'rgba(85, 106, 85, .3)'
  }
};
const COFFEE_KEYWORDS = ['espresso', 'americano', 'cappuccino', 'latte', 'mocha', 'kahve', 'coffee', 'macchiato', 'flat white'];
const classifyProduct = (product) => {
  if (product.menuSection) {
    return {
      parent: product.menuSection,
      child: product.menuSubsection || null,
      label: product.menuSubsection || product.menuSection
    };
  }

  const rawCategory = String(product.category || '').trim().toLowerCase();
  const rawName = getProductSourceName(product).toLowerCase();
  const source = `${rawCategory} ${rawName}`;

  if (source.includes('kahvalti') || source.includes('kahvaltı') || source.includes('breakfast')) {
    return { parent: 'kahvaltilar', child: null, label: 'Kahvaltilar' };
  }
  if (source.includes('ana yemek') || source.includes('anayemek') || source.includes('main course')) {
    return { parent: 'ana-yemekler', child: null, label: 'Ana Yemekler' };
  }
  if (source.includes('ara sicak') || source.includes('ara sıcak') || source.includes('appetizer') || source.includes('starter')) {
    return { parent: 'ara-sicaklar', child: null, label: 'Ara Sicaklar' };
  }
  if (source.includes('tatli') || source.includes('tatlı') || source.includes('dessert')) {
    return { parent: 'tatli-meyve', child: 'tatlilar', label: 'Tatlilar' };
  }
  if (source.includes('meyve') || source.includes('fruit')) {
    return { parent: 'tatli-meyve', child: 'meyveler', label: 'Meyveler' };
  }
  if (COFFEE_KEYWORDS.some((keyword) => source.includes(keyword))) {
    const isColdCoffee = source.includes('iced') || source.includes('soguk') || source.includes('soğuk') || source.includes('cold') || source.includes('frappe');
    return { parent: 'kahveler', child: isColdCoffee ? 'soguk-kahveler' : 'sicak-kahveler', label: isColdCoffee ? 'Soğuk İçecekler' : 'Sıcak İçecekler' };
  }
  if (source.includes('icecek') || source.includes('içecek') || source.includes('drink') || source.includes('beverage')) {
    return { parent: 'icecekler', child: null, label: 'İçecekler' };
  }

  return { parent: 'icecekler', child: null, label: 'İçecekler' };
};
const getCategoryTheme = (product) => CATEGORY_THEMES[classifyProduct(product).parent] || CATEGORY_THEMES.default;
const Menu = () => {
  const navigate = useNavigate();
  const { t, language, locale } = useI18n();
  const localDictionary = useMemo(() => getLocalizedMenuDictionary(language), [language]);
  const translateMenu = useCallback((key, values) => {
    const scopedKey = `guestMenu.${key}`;
    const providerValue = t(scopedKey, values);
    if (providerValue !== scopedKey) return providerValue;
    const localValue = getNestedValue(localDictionary, scopedKey);
    if (typeof localValue === 'string') return interpolateValue(localValue, values);
    return localValue ?? scopedKey;
  }, [localDictionary, t]);
  const translateCategory = useCallback((sectionId) => translateMenu(`categories.sections.${sectionId}.label`), [translateMenu]);
  const translateChildCategory = useCallback((childId) => translateMenu(`categories.children.${childId}.label`), [translateMenu]);
  const intensityLabels = translateMenu('products.intensityLabels');
  const getTraitLabels = (sectionId) => {
    const traitKey = SECTION_TRAITS[sectionId] || 'coffee';
    const labels = translateMenu(`products.traitLevels.${traitKey}`);
    return Array.isArray(labels) ? labels : intensityLabels;
  };
  const getTraitMetric = (sectionId) => {
    const traitKey = SECTION_TRAITS[sectionId] || 'coffee';
    const metric = translateMenu(`products.metrics.${traitKey}`);
    return metric !== `products.metrics.${traitKey}` ? metric : translateMenu('products.metricGeneral');
  };
  const [session] = useState(() => getGuestSession());
  const [products, setProducts] = useState([]); const [cart, setCart] = useState(() => getGuestCart(getGuestSession()?.cartKey));
  const [paymentMethod, setPaymentMethod] = useState('Nakit'); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false); const [cartOpen, setCartOpen] = useState(false); const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false); const [orderSuccessOpen, setOrderSuccessOpen] = useState(false); const [coffeeEffect, setCoffeeEffect] = useState(null); const [cartAttention, setCartAttention] = useState(false); const [activeParent, setActiveParent] = useState(null); const [activeChild, setActiveChild] = useState(null); const [categoryView, setCategoryView] = useState('parents');
  const effectId = useRef(0);
  const categoryPanelRef = useRef(null);
  const productsStartRef = useRef(null);
  const leaveGuestMenu = useCallback((message) => { clearGuestSession(); if (message) toast.error(message); navigate('/', { replace: true }); }, [navigate]);
  useEffect(() => { if (isGuestSessionExpired(session)) { leaveGuestMenu(translateMenu('errors.sessionExpired')); return undefined; } const fetchProducts = async () => { try { const { data } = await api.get('/products', withToken(session.token)); setProducts(data.map(applyDefaultCoffeeImage)); } catch (error) { if (error.response?.status === 401) { leaveGuestMenu(translateMenu('errors.sessionExpired')); return; } toast.error(translateMenu('errors.productsUnavailable')); } finally { setLoading(false); } }; void fetchProducts(); const expirationCheck = window.setInterval(() => { if (isGuestSessionExpired(session)) leaveGuestMenu(translateMenu('errors.sessionExpired')); }, 60_000); return () => window.clearInterval(expirationCheck); }, [session, leaveGuestMenu, translateMenu]);
  useEffect(() => { if (session?.cartKey) saveGuestCart(session.cartKey, cart); }, [cart, session]);
  const cartItems = useMemo(() => Object.values(cart), [cart]); const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0); const totalAmount = cartItems.reduce((total, item) => total + item.sellingPrice * item.quantity, 0);
  const localizedSections = useMemo(() => MENU_SECTIONS.map((section) => ({ ...section, label: translateCategory(section.id), description: translateMenu(`categories.sections.${section.id}.description`), children: section.children?.map((child) => ({ ...child, label: translateChildCategory(child.id), description: translateMenu(`categories.children.${child.id}.description`) })) })), [translateCategory, translateChildCategory, translateMenu]);
  const localizedSectionMap = useMemo(() => Object.fromEntries(localizedSections.map((section) => [section.id, section])), [localizedSections]);
  const activeSection = activeParent ? localizedSectionMap[activeParent] : null;
  const visibleChildren = activeSection?.children || [];
  const categoryChoices = activeSection
    ? (visibleChildren.length ? visibleChildren : [{ id: 'all', label: translateMenu('categories.allInCategory', { label: activeSection.label }), description: translateMenu('categories.allInCategoryDescription') }])
    : [];
  const filteredProducts = useMemo(
    () => products.filter((product) => {
      const classification = classifyProduct(product);
      if (!activeParent) return true;
      if (classification.parent !== activeParent) return false;
      if (!activeChild) return true;
      return classification.child === activeChild;
    }),
    [activeChild, activeParent, products]
  );
  const activeCategoryLabel = activeChild ? visibleChildren.find((child) => child.id === activeChild)?.label || activeSection?.label : activeSection?.label || translateMenu('categories.fallbackLabel');
  const showParentCategories = () => {
    setCategoryView('parents');
    setActiveParent(null);
    setActiveChild(null);
  };
  const selectParentCategory = (sectionId) => {
    setActiveParent(sectionId);
    setActiveChild(null);
    setCategoryView('children');
  };
  const scrollToProducts = () => {
    window.requestAnimationFrame(() => {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      productsStartRef.current?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });
    });
  };
  const selectCategoryChoice = (choiceId) => {
    setActiveChild(choiceId === 'all' ? null : choiceId);
    scrollToProducts();
  };
  const celebrateCoffee = (productId) => { effectId.current += 1; setCoffeeEffect({ productId, id: effectId.current }); setCartAttention(true); window.setTimeout(() => setCoffeeEffect(null), 900); window.setTimeout(() => setCartAttention(false), 750); };
  const updateCart = (product, difference) => { if (difference > 0) celebrateCoffee(product._id); setCart((currentCart) => { const quantity = (currentCart[product._id]?.quantity || 0) + difference; if (quantity <= 0) { const nextCart = { ...currentCart }; delete nextCart[product._id]; return nextCart; } return { ...currentCart, [product._id]: { ...product, quantity } }; }); };
  const requestOrderConfirmation = () => { if (!cartItems.length || submitting) return; setOrderConfirmationOpen(true); };
  const completeOrder = async () => { if (!cartItems.length) return; setSubmitting(true); try { await api.post('/orders', { paymentMethod, items: cartItems.map((item) => ({ productId: item._id, quantity: item.quantity })) }, withToken(session.token)); setCart({}); setCartOpen(false); setOrderConfirmationOpen(false); setOrderSuccessOpen(true); } catch (error) { if (error.response?.status === 401) { leaveGuestMenu(translateMenu('errors.sessionExpired')); return; } toast.error(error.response?.data?.message || translateMenu('errors.orderFailed')); } finally { setSubmitting(false); } };
  if (loading) return <div className="guest-menu-loading" aria-label={translateMenu('products.loadingAria')}><span /><small className="sr-only">{translateMenu('products.loadingText')}</small></div>;

  const [heroTitleLineOne, heroTitleLineTwo] = splitTextLines(translateMenu('hero.title'));
  const [emptyCartLineOne, emptyCartLineTwo] = splitTextLines(translateMenu('cart.emptyState'));
  const paymentMethodLabel = paymentMethod === 'Nakit' ? translateMenu('cart.paymentCash') : translateMenu('cart.paymentCard');

  return <main className="guest-menu-page" dir={language === 'ar' ? 'rtl' : undefined}>
    <header className="guest-menu-header">
      <div className="guest-menu-header-inner">
        <div className="guest-menu-brand">
          <div className="guest-menu-brand-copy" aria-label={translateMenu('header.brandAria')}>
            <img src="/park-dedeman-header-logo.png" alt={translateMenu('header.brandAria')} className="guest-menu-brand-mark" />
          </div>
        </div>

        <div className="guest-menu-header-actions">
          <LanguageSwitcher compact className="guest-menu-language-switcher" />
          <div className="guest-menu-room" aria-label={session.roomNumber === 'own' ? translateMenu('header.ownAccount') : translateMenu('header.roomLabel', { roomNumber: session.roomNumber })}>
            <span className="guest-menu-action-icon"><BedDouble size={19} aria-hidden="true" /></span>
            <span className="guest-menu-room-copy">
              <small>{session.roomNumber === 'own' ? translateMenu('header.ownBadge') : translateMenu('header.guestBadge')}</small>
              <strong>{session.roomNumber === 'own' ? 'OWN' : session.roomNumber}</strong>
            </span>
          </div>
          <button type="button" className="guest-menu-logout" onClick={() => leaveGuestMenu()} aria-label={translateMenu('header.logoutAria')}>
            <span className="guest-menu-action-icon"><LogOut size={18} aria-hidden="true" /></span>
            <span className="guest-menu-logout-label">{translateMenu('header.logout')}</span>
          </button>
        </div>
      </div>
    </header>
    <section className="guest-menu-hero"><img src={HOTEL_HERO_IMAGE} alt={translateMenu('hero.alt')} /><div className="guest-menu-hero-overlay" /><div className="guest-menu-hero-content"><p>{translateMenu('hero.eyebrow')}</p><h1>{heroTitleLineOne}<br />{heroTitleLineTwo}</h1><span>{translateMenu('hero.body')}</span></div></section>
    <section ref={categoryPanelRef} className={`guest-menu-category-band ${categoryView === 'children' ? 'child-view' : 'parent-view'}`} aria-label={translateMenu('categories.panelAria')}>
      <div className="guest-menu-category-band-inner">
        <div id="guest-menu-category-stage" className="guest-menu-category-stage" aria-live="polite" aria-label={translateMenu('categories.stageLabel')}>
          {categoryView === 'parents' ? <div className="guest-menu-category-screen guest-menu-parent-screen" key="parent-categories">
            <div className="guest-menu-category-intro">
              <p>{translateMenu('categories.intro')}</p>
            </div>
            <nav className="guest-menu-tabs" aria-label={translateMenu('categories.parentNav')}>
              {localizedSections.map((section, index) => <div key={section.id} className="guest-menu-tab-item" data-category={section.id} style={{ '--category-index': index }}>
                <span className="guest-menu-tab-scene" aria-hidden="true"><CategoryMotion category={section.id} /></span>
                <button type="button" className="guest-menu-tab" onClick={() => selectParentCategory(section.id)}>
                  <span className="guest-menu-tab-copy"><strong>{section.label}</strong></span>
                </button>
              </div>)}
            </nav>
          </div> : <div className="guest-menu-category-screen guest-menu-child-screen" key={activeParent}>
            <button type="button" className="guest-menu-category-back" onClick={showParentCategories}><ChevronLeft size={17} aria-hidden="true" /> {translateMenu('categories.back')}</button>
            <div className="guest-menu-category-intro">
              <p>{activeSection?.label?.toUpperCase()}</p>
            </div>
            <nav className="guest-menu-subtabs" aria-label={translateMenu('categories.childrenNav', { label: activeSection?.label || translateMenu('categories.fallbackLabel') })}>
              {categoryChoices.map((choice, index) => <button type="button" key={choice.id} className={`guest-menu-subtab ${(choice.id === 'all' ? !activeChild : activeChild === choice.id) ? 'active' : ''}`} style={{ '--category-index': index }} onClick={() => selectCategoryChoice(choice.id)}>
                <span><strong>{choice.label}</strong></span>
              </button>)}
            </nav>
          </div>}
        </div>
      </div>
    </section>
    <div className="guest-menu-layout">
      <section ref={productsStartRef} className="guest-products-section" aria-labelledby="products-title" tabIndex="-1">
        <div className="guest-products-heading"><div><p>{translateMenu('products.sectionEyebrow')}</p><h2 id="products-title">{translateMenu('products.heading', { category: activeCategoryLabel })}</h2><span>{translateMenu('products.description')}</span></div></div>
        {filteredProducts.length ? <>
          <div className="guest-products-grid" key={`${activeParent}-${activeChild || 'all'}`}>{filteredProducts.map((product, index) => {
          const detail = getProductDetail(product, translateMenu, language);
          const theme = getCategoryTheme(product);
          const classification = classifyProduct(product);
          const localizedClassificationLabel = classification.child ? translateChildCategory(classification.child) : translateCategory(classification.parent);
          const localizedProductName = getLocalizedProductName(product, translateMenu, language);
          const traitLabels = getTraitLabels(classification.parent);
          const productImage = resolveProductImageUrl(product.imageUrl) || PRODUCT_FALLBACK_IMAGE;
          return <article className={`guest-product-card ${cart[product._id] ? 'in-cart' : ''}`} data-product-name={getProductSourceName(product).toLowerCase()} data-category={classification.parent} style={{ '--card-index': index, '--product-surface': theme.surfaceRgb, '--product-surface-alt': theme.altRgb, '--product-accent': theme.accent, '--product-accent-soft': theme.accentSoft, '--product-strong': theme.strong, '--product-line': theme.line, '--product-button-bg': theme.buttonBg, '--product-button-hover': theme.buttonHover, '--product-button-text': theme.buttonText, '--product-button-border': theme.buttonBorder }} key={product._id}>
            <div className="guest-product-image"><img src={productImage} alt={localizedProductName} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = PRODUCT_FALLBACK_IMAGE; }} />{coffeeEffect?.productId === product._id && <div className="guest-coffee-burst" key={coffeeEffect.id} aria-hidden="true"><Coffee size={31} /><i>✦</i><b>✦</b><em>☕</em></div>}</div>
            <div className="guest-product-body"><p className="guest-product-kicker">{localizedClassificationLabel.toLocaleUpperCase(locale)}</p><h3>{localizedProductName}</h3><p className="guest-product-description">{detail.description}</p><div className="guest-product-intensity"><span>{getTraitMetric(classification.parent)}</span><div>{[1, 2, 3, 4, 5].map((level) => <i className={level <= detail.intensity ? 'active' : ''} key={level} />)}</div><strong>{traitLabels[detail.intensity - 1]}</strong></div><div className="guest-product-bottom"><strong>{formatMoney(product.sellingPrice, locale)}</strong>{cart[product._id] ? <div className="guest-quantity-control" aria-label={translateMenu('cart.quantityAria', { name: localizedProductName })}><button type="button" onClick={() => updateCart(product, -1)} aria-label={translateMenu('productCard.decreaseAria')}><Minus size={15} /></button><span>{cart[product._id].quantity}</span><button type="button" onClick={() => updateCart(product, 1)} aria-label={translateMenu('productCard.increaseAria')}><Plus size={15} /></button></div> : <button type="button" className="guest-add-button" onClick={() => updateCart(product, 1)} aria-label={translateMenu('productCard.addAria', { name: localizedProductName })}><Plus className="guest-add-icon" size={16} aria-hidden="true" /><span className="guest-add-label">{translateMenu('productCard.add')}</span></button>}</div></div>
          </article>;
        })}</div>
        </> : <div className="guest-products-empty"><ShoppingBag size={30} /><h3>{translateMenu('products.emptyTitle')}</h3><p>{translateMenu('products.emptyBody', { category: activeCategoryLabel })}</p></div>}
      </section>
    </div>
    <button type="button" className={`guest-cart-inline-trigger ${cartAttention ? 'guest-cart-trigger-attention' : ''}`} onClick={() => setCartOpen(true)} aria-label={totalQuantity ? translateMenu('cart.openWithCountAria', { count: totalQuantity }) : translateMenu('cart.openAria')}><span className="guest-cart-trigger-shell" aria-hidden="true"><ShoppingCart size={20} />{cartAttention ? <i className="guest-cart-trigger-pulse" /> : null}</span><span className="guest-cart-trigger-copy"><small>{translateMenu('cart.title')}</small><strong>{totalQuantity ? translateMenu('cart.itemCount', { count: totalQuantity }) : translateMenu('cart.empty')}</strong></span>{totalQuantity > 0 && <b>{totalQuantity}</b>}</button>
    {/* eslint-disable-next-line react-hooks/refs */}
    {cartOpen && <div className="guest-cart-backdrop" onClick={() => setCartOpen(false)}><aside className="guest-cart guest-cart-drawer" aria-label={translateMenu('cart.drawerTitle')} role="dialog" aria-modal="true" aria-labelledby="guest-cart-title" onClick={(event) => event.stopPropagation()}><div className="guest-cart-heading"><div><h2 id="guest-cart-title">{translateMenu('cart.drawerTitle')}</h2><p>{translateMenu('cart.drawerSubtitle')}</p></div><button type="button" className="guest-cart-close" onClick={() => setCartOpen(false)} aria-label={translateMenu('cart.closeAria')}><X size={19} /></button></div><div className="guest-cart-items">{cartItems.length ? cartItems.map((item) => { const localizedItemName = getLocalizedProductName(item, translateMenu, language); return <div className="guest-cart-item" key={item._id}><img src={resolveProductImageUrl(item.imageUrl) || PRODUCT_FALLBACK_IMAGE} alt="" /><div className="guest-cart-item-copy"><strong>{localizedItemName}</strong><span>{translateMenu('cart.perItem', { price: formatMoney(item.sellingPrice, locale) })}</span></div><div className="guest-cart-item-actions"><b aria-label={translateMenu('cart.lineTotalAria', { name: localizedItemName })}>{formatMoney(item.sellingPrice * item.quantity, locale)}</b><div className="guest-cart-quantity-control"><button type="button" onClick={() => updateCart(item, -1)} aria-label={translateMenu('cart.decreaseAria', { name: localizedItemName })}><Minus size={14} /></button><span>{item.quantity}</span><button type="button" onClick={() => updateCart(item, 1)} aria-label={translateMenu('cart.increaseAria', { name: localizedItemName })}><Plus size={14} /></button></div></div></div>; }) : <p className="guest-cart-empty">{emptyCartLineOne}<br />{emptyCartLineTwo}</p>}</div><div className="guest-cart-footer"><div className="guest-payment-methods"><p>{translateMenu('cart.paymentTitle')}</p><div><button type="button" className={paymentMethod === 'Nakit' ? 'active' : ''} onClick={() => setPaymentMethod('Nakit')}><WalletCards size={17} />{translateMenu('cart.paymentCash')}</button><button type="button" className={paymentMethod === 'Kredi Kartı' ? 'active' : ''} onClick={() => setPaymentMethod('Kredi Kartı')}><CreditCard size={17} />{translateMenu('cart.paymentCard')}</button></div></div><div className="guest-cart-total"><span>{translateMenu('cart.total')}</span><strong>{formatMoney(totalAmount, locale)}</strong></div><button type="button" className="guest-checkout-button" disabled={!totalQuantity || submitting} onClick={requestOrderConfirmation}>{submitting ? translateMenu('cart.checkoutPending') : translateMenu('cart.checkout')}</button></div></aside></div>}
    {orderConfirmationOpen && <div className="guest-order-confirm-backdrop" role="presentation" onClick={() => setOrderConfirmationOpen(false)}><section className="guest-order-confirm" role="dialog" aria-modal="true" aria-labelledby="guest-order-confirm-title" onClick={(event) => event.stopPropagation()}><button type="button" className="guest-order-confirm-close" onClick={() => setOrderConfirmationOpen(false)} aria-label={translateMenu('confirmation.closeAria')}><X size={18} /></button><div className="guest-order-confirm-icon"><PhoneCall size={25} /></div><p className="guest-order-confirm-eyebrow">{translateMenu('confirmation.eyebrow')}</p><h2 id="guest-order-confirm-title">{translateMenu('confirmation.title')}</h2><p className="guest-order-confirm-copy">{translateMenu('confirmation.body').replace('<strong>', '').replace('</strong>', '')}</p><div className="guest-order-confirm-callout"><PhoneCall size={18} /><div><strong>{translateMenu('confirmation.calloutTitle')}</strong><span>{translateMenu('confirmation.calloutBody')}</span></div></div><div className="guest-order-confirm-summary"><span>{session.roomNumber === 'own' ? 'OWN' : translateMenu('header.roomLabel', { roomNumber: session.roomNumber })}</span><i /><strong>{formatMoney(totalAmount, locale)}</strong></div><div className="guest-order-confirm-actions"><button type="button" onClick={() => setOrderConfirmationOpen(false)}>{translateMenu('confirmation.back')}</button><button type="button" onClick={completeOrder} disabled={submitting}>{submitting ? translateMenu('confirmation.submitPending') : translateMenu('confirmation.submit')}</button></div></section></div>}
    {orderSuccessOpen && <div className="guest-order-success-backdrop" role="presentation" onClick={() => setOrderSuccessOpen(false)}><section className="guest-order-success" role="dialog" aria-modal="true" aria-labelledby="guest-order-success-title" onClick={(event) => event.stopPropagation()}><button type="button" className="guest-order-success-close" onClick={() => setOrderSuccessOpen(false)} aria-label={translateMenu('success.closeAria')}><X size={18} /></button><div className="guest-order-success-mini"><span><CheckCircle2 size={34} /></span></div><div className="guest-order-success-body"><p className="guest-order-success-eyebrow">{translateMenu('success.eyebrow')}</p><h2 id="guest-order-success-title">{translateMenu('success.title')}</h2><p className="guest-order-success-copy">{translateMenu('success.body')}</p><p className="guest-order-success-meta">{session.roomNumber === 'own' ? 'OWN' : translateMenu('header.roomLabel', { roomNumber: session.roomNumber })} <i /> {paymentMethodLabel}</p><button type="button" onClick={() => setOrderSuccessOpen(false)}>{translateMenu('success.done')}</button></div></section></div>}
  </main>;
};

export default Menu;
