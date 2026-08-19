export const MENU_SECTIONS = [
  { id: 'ana-yemekler' },
  { id: 'ara-sicaklar' },
  { id: 'kahvaltilar' },
  {
    id: 'tatli-meyve',
    children: [
      { id: 'tatlilar' },
      { id: 'meyveler' },
    ],
  },
  {
    id: 'kahveler',
    children: [
      { id: 'sicak-kahveler' },
      { id: 'soguk-kahveler' },
    ],
  },
  { id: 'icecekler' },
];

export const SECTION_TRAITS = {
  kahveler: 'coffee',
  'ana-yemekler': 'portion',
  'ara-sicaklar': 'spice',
  kahvaltilar: 'richness',
  'tatli-meyve': 'sweetness',
  icecekler: 'refreshment',
};

const COFFEE_KEYWORDS = ['espresso', 'americano', 'cappuccino', 'latte', 'mocha', 'kahve', 'coffee', 'macchiato', 'flat white'];

export const getSectionById = (sectionId) => MENU_SECTIONS.find((section) => section.id === sectionId);

export const getSectionChildren = (sectionId) => getSectionById(sectionId)?.children || [];

export const getDefaultSubsection = (sectionId) => getSectionChildren(sectionId)[0]?.id || '';

export const inferMenuClassification = (category = '', name = '') => {
  const source = `${String(category).trim()} ${String(name).trim()}`.toLowerCase();

  if (source.includes('kahvalti') || source.includes('kahvaltı') || source.includes('breakfast')) {
    return { menuSection: 'kahvaltilar', menuSubsection: '' };
  }
  if (source.includes('ana yemek') || source.includes('anayemek') || source.includes('main course')) {
    return { menuSection: 'ana-yemekler', menuSubsection: '' };
  }
  if (source.includes('ara sicak') || source.includes('ara sıcak') || source.includes('appetizer') || source.includes('starter')) {
    return { menuSection: 'ara-sicaklar', menuSubsection: '' };
  }
  if (source.includes('meyve') || source.includes('fruit')) {
    return { menuSection: 'tatli-meyve', menuSubsection: 'meyveler' };
  }
  if (source.includes('tatli') || source.includes('tatlı') || source.includes('dessert')) {
    return { menuSection: 'tatli-meyve', menuSubsection: 'tatlilar' };
  }
  if (COFFEE_KEYWORDS.some((keyword) => source.includes(keyword)) || source.includes('kahve')) {
    const isColdCoffee = source.includes('iced') || source.includes('soguk') || source.includes('soğuk') || source.includes('cold') || source.includes('frappe');
    return {
      menuSection: 'kahveler',
      menuSubsection: isColdCoffee ? 'soguk-kahveler' : 'sicak-kahveler',
    };
  }
  if (source.includes('icecek') || source.includes('içecek') || source.includes('drink') || source.includes('beverage')) {
    return { menuSection: 'icecekler', menuSubsection: '' };
  }

  return { menuSection: 'kahveler', menuSubsection: 'sicak-kahveler' };
};

export const resolveProductFromLegacy = (product = {}) => {
  if (product.menuSection) {
    return {
      menuSection: product.menuSection,
      menuSubsection: product.menuSubsection || getDefaultSubsection(product.menuSection),
    };
  }
  return inferMenuClassification(product.category, product.name);
};

export const resolveProductImageUrl = (imageUrl) => {
  if (!imageUrl) return '';
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverBase = apiBase.replace(/\/api\/?$/, '');
  return `${serverBase}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
};
