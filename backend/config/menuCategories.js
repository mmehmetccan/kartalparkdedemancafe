const MENU_SECTIONS = [
    { id: 'ana-yemekler', label: 'Ana Yemekler' },
    { id: 'ara-sicaklar', label: 'Ara Sıcaklar' },
    { id: 'kahvaltilar', label: 'Kahvaltılar' },
    {
        id: 'tatli-meyve',
        label: 'Tatlılar ve Meyveler',
        children: [
            { id: 'tatlilar', label: 'Tatlılar' },
            { id: 'meyveler', label: 'Meyveler' }
        ]
    },
    {
        id: 'kahveler',
        label: 'Kahveler',
        children: [
            { id: 'sicak-kahveler', label: 'Sıcak İçecekler' },
            { id: 'soguk-kahveler', label: 'Soğuk İçecekler' }
        ]
    },
    { id: 'icecekler', label: 'İçecekler' }
];

const MENU_SECTION_IDS = MENU_SECTIONS.map((section) => section.id);

const MENU_SUBSECTION_IDS = MENU_SECTIONS.flatMap((section) => section.children?.map((child) => child.id) || []);

const SECTION_CHILDREN = Object.fromEntries(
    MENU_SECTIONS.map((section) => [section.id, section.children?.map((child) => child.id) || []])
);

const SECTION_TRAITS = {
    kahveler: 'coffee',
    'ana-yemekler': 'portion',
    'ara-sicaklar': 'spice',
    kahvaltilar: 'richness',
    'tatli-meyve': 'sweetness',
    icecekler: 'refreshment'
};

const COFFEE_KEYWORDS = ['espresso', 'americano', 'cappuccino', 'latte', 'mocha', 'kahve', 'coffee', 'macchiato', 'flat white'];

const getSectionById = (sectionId) => MENU_SECTIONS.find((section) => section.id === sectionId);

const getSubsectionLabel = (sectionId, subsectionId) => {
    const section = getSectionById(sectionId);
    if (!section?.children || !subsectionId) return null;
    return section.children.find((child) => child.id === subsectionId)?.label || null;
};

const buildCategoryLabel = (menuSection, menuSubsection) => {
    const section = getSectionById(menuSection);
    if (!section) return '';
    const childLabel = getSubsectionLabel(menuSection, menuSubsection);
    return childLabel ? `${section.label} · ${childLabel}` : section.label;
};

const isValidMenuSection = (value) => MENU_SECTION_IDS.includes(value);

const isValidMenuSubsection = (menuSection, menuSubsection) => {
    if (!menuSubsection) return true;
    return (SECTION_CHILDREN[menuSection] || []).includes(menuSubsection);
};

const inferMenuClassification = (category = '', name = '') => {
    const source = `${String(category).trim()} ${String(name).trim()}`.toLowerCase();

    if (source.includes('kahvalti') || source.includes('kahvaltı') || source.includes('breakfast')) {
        return { menuSection: 'kahvaltilar', menuSubsection: null };
    }
    if (source.includes('ana yemek') || source.includes('anayemek') || source.includes('main course')) {
        return { menuSection: 'ana-yemekler', menuSubsection: null };
    }
    if (source.includes('ara sicak') || source.includes('ara sıcak') || source.includes('appetizer') || source.includes('starter')) {
        return { menuSection: 'ara-sicaklar', menuSubsection: null };
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
            menuSubsection: isColdCoffee ? 'soguk-kahveler' : 'sicak-kahveler'
        };
    }
    if (source.includes('icecek') || source.includes('içecek') || source.includes('drink') || source.includes('beverage')) {
        return { menuSection: 'icecekler', menuSubsection: null };
    }

    return { menuSection: 'icecekler', menuSubsection: null };
};

const normalizeProductPayload = (payload = {}) => {
    const next = { ...payload };
    let menuSection = next.menuSection;
    let menuSubsection = next.menuSubsection || null;

    if (!isValidMenuSection(menuSection)) {
        const inferred = inferMenuClassification(next.category, next.name);
        menuSection = inferred.menuSection;
        menuSubsection = inferred.menuSubsection;
    }

    if (!isValidMenuSubsection(menuSection, menuSubsection)) {
        menuSubsection = null;
    }

    const children = SECTION_CHILDREN[menuSection] || [];
    if (children.length && !menuSubsection) {
        menuSubsection = children[0];
    }
    if (!children.length) {
        menuSubsection = null;
    }

    next.menuSection = menuSection;
    next.menuSubsection = menuSubsection;
    next.category = buildCategoryLabel(menuSection, menuSubsection);

    const intensity = Number(next.intensity);
    next.intensity = Number.isFinite(intensity) ? Math.min(5, Math.max(1, Math.round(intensity))) : 3;

    return next;
};

module.exports = {
    MENU_SECTIONS,
    MENU_SECTION_IDS,
    MENU_SUBSECTION_IDS,
    SECTION_CHILDREN,
    SECTION_TRAITS,
    buildCategoryLabel,
    inferMenuClassification,
    isValidMenuSection,
    isValidMenuSubsection,
    normalizeProductPayload
};
