import { useEffect, useMemo, useState } from 'react';
import I18nContext from './context';
import menuTranslations from './menuTranslations';
import managementTranslations from './managementTranslations';
import { operationsTranslations } from './operationsTranslations';

const STORAGE_KEY = 'parkDedeman.language';
const DEFAULT_LANGUAGE = 'tr';

const baseDictionaries = {
  tr: {
    common: {
      hotelName: 'Park Dedeman Kartal',
      guestMenu: 'Misafir Menüsü',
      adminPanel: 'Yönetim',
      languageLabel: 'Dil',
      languageNames: { tr: 'Türkçe', en: 'English', de: 'Deutsch', ar: 'العربية', ru: 'Русский' },
      actions: {
        backToGuest: 'Misafir girişi',
        backToAdmin: 'Yönetim girişi',
        logout: 'Çıkış yap',
        loading: 'Yükleniyor...',
      },
    },
    guestLogin: {
      topBadge: 'Misafir Menüsü',
      welcomeEyebrow: 'HOŞ GELDİNİZ',
      welcomeTitle: 'Keyifli bir konaklama deneyimi.',
      welcomeBody: 'Odanızın konforunda, taze hazırlanmış lezzetler sizi bekliyor.',
      kicker: 'MİSAFİR MENÜSÜ',
      title: 'Oda numaranızla devam edin.',
      description: 'Menüye erişmek için konakladığınız oda numarasını yazın.',
      roomLabel: 'Oda numaranız',
      roomHelp: 'Size özel sepetinizi oluşturmak için kullanılır.',
      roomPlaceholder: 'Oda numaranızı yazın',
      submit: 'Menüye devam et',
      submitting: 'Giriş yapılıyor...',
      note: 'Park Dedeman Kartal misafirleri için hazırlanmıştır.',
      errors: {
        emptyRoom: 'Lütfen oda numaranızı girin.',
        invalidRoom: 'Geçersiz oda numarası. Lütfen oda numaranızı doğru girin.',
        loginFailed: 'Giriş sırasında bir hata oluştu.',
      },
    },
    adminLogin: {
      brand: 'Kartal Park Dedeman',
      title: 'Cafe operasyon yönetimi',
      description: 'Siparişleri, kahvaltı taleplerini ve aylık kasa verilerini tek yerden takip edin.',
      kicker: 'YÖNETİCİ GİRİŞİ',
      welcome: 'Hoş geldiniz',
      username: 'Kullanıcı adı',
      password: 'Şifre',
      submit: 'Panele giriş yap',
      submitting: 'Giriş yapılıyor...',
      errors: {
        required: 'Kullanıcı adı ve şifre zorunludur.',
        failed: 'Giriş yapılamadı.',
      },
    },
    adminLayout: {
      ariaLabel: 'Yönetim menüsü',
      nav: {
        orders: 'Siparişler',
        delivered: 'Teslim edilenler',
        createBreakfast: 'Kahvaltı oluştur',
        breakfasts: 'Kahvaltılar',
        products: 'Ürün yönetimi',
        reports: 'Kasa ve geçmiş',
        users: 'Yöneticiler',
      },
      roles: {
        admin: 'Yönetici',
        reception: 'Resepsiyon',
        chef: 'Şef',
      },
      fallbackUser: 'Yönetici',
      footerLabel: '{{username}} · {{role}}',
    },
    notFound: {
      visualEyebrow: 'CAFE MENÜSÜ',
      visualTitle: 'Kayıp sayfa.',
      visualBody: 'Yanlış adres girilmiş olabilir. Birkaç saniye içinde sizi doğru girişe yönlendiriyoruz.',
      code: '404',
      title: 'Aradığınız sayfa bulunamadı.',
      description: 'Yazdığınız adres geçerli bir sayfaya gitmiyor. Birazdan sizi uygun girişe yönlendireceğim.',
      note: 'Park Dedeman Kartal için güvenli yönlendirme hazırlanıyor.',
    },
  },
  en: {
    common: {
      hotelName: 'Park Dedeman Kartal',
      guestMenu: 'Guest Menu',
      adminPanel: 'Management',
      languageLabel: 'Language',
      languageNames: { tr: 'Turkish', en: 'English', de: 'German', ar: 'Arabic', ru: 'Russian' },
      actions: {
        backToGuest: 'Guest login',
        backToAdmin: 'Admin login',
        logout: 'Log out',
        loading: 'Loading...',
      },
    },
    guestLogin: {
      topBadge: 'Guest Menu',
      welcomeEyebrow: 'WELCOME',
      welcomeTitle: 'A pleasant stay begins here.',
      welcomeBody: 'Freshly prepared delights are waiting for you in the comfort of your room.',
      kicker: 'GUEST MENU',
      title: 'Continue with your room number.',
      description: 'Enter your room number to access the menu.',
      roomLabel: 'Your room number',
      roomHelp: 'It is used to create your personal cart.',
      roomPlaceholder: 'Enter your room number',
      submit: 'Continue to menu',
      submitting: 'Signing in...',
      note: 'Prepared for Park Dedeman Kartal guests.',
      errors: {
        emptyRoom: 'Please enter your room number.',
        invalidRoom: 'Invalid room number. Please enter the correct room number.',
        loginFailed: 'An error occurred while signing in.',
      },
    },
    adminLogin: {
      brand: 'Kartal Park Dedeman',
      title: 'Cafe operations management',
      description: 'Track orders, breakfast requests, and monthly cash flow from one place.',
      kicker: 'ADMIN LOGIN',
      welcome: 'Welcome',
      username: 'Username',
      password: 'Password',
      submit: 'Enter dashboard',
      submitting: 'Signing in...',
      errors: {
        required: 'Username and password are required.',
        failed: 'Login failed.',
      },
    },
    adminLayout: {
      ariaLabel: 'Management menu',
      nav: {
        orders: 'Orders',
        delivered: 'Delivered',
        createBreakfast: 'Create breakfast',
        breakfasts: 'Breakfasts',
        products: 'Product management',
        reports: 'Cash & history',
        users: 'Administrators',
      },
      roles: {
        admin: 'Administrator',
        reception: 'Reception',
        chef: 'Chef',
      },
      fallbackUser: 'Administrator',
      footerLabel: '{{username}} · {{role}}',
    },
    notFound: {
      visualEyebrow: 'CAFE MENU',
      visualTitle: 'Lost page.',
      visualBody: 'The address may be incorrect. We are taking you to the right entry point in a few seconds.',
      code: '404',
      title: 'The page you are looking for could not be found.',
      description: 'The address you entered does not lead to a valid page. You will be redirected shortly.',
      note: 'Preparing a safe redirect for Park Dedeman Kartal.',
    },
  },
  de: {
    common: {
      hotelName: 'Park Dedeman Kartal',
      guestMenu: 'Gästemenü',
      adminPanel: 'Verwaltung',
      languageLabel: 'Sprache',
      languageNames: { tr: 'Türkisch', en: 'Englisch', de: 'Deutsch', ar: 'Arabisch', ru: 'Russisch' },
      actions: {
        backToGuest: 'Gästelogin',
        backToAdmin: 'Admin-Login',
        logout: 'Abmelden',
        loading: 'Wird geladen...',
      },
    },
    guestLogin: {
      topBadge: 'Gästemenü',
      welcomeEyebrow: 'WILLKOMMEN',
      welcomeTitle: 'Ein angenehmer Aufenthalt beginnt hier.',
      welcomeBody: 'Frisch zubereitete Spezialitäten erwarten Sie im Komfort Ihres Zimmers.',
      kicker: 'GÄSTEMENÜ',
      title: 'Mit Ihrer Zimmernummer fortfahren.',
      description: 'Geben Sie Ihre Zimmernummer ein, um das Menü zu öffnen.',
      roomLabel: 'Ihre Zimmernummer',
      roomHelp: 'Damit wird Ihr persönlicher Warenkorb erstellt.',
      roomPlaceholder: 'Zimmernummer eingeben',
      submit: 'Zum Menü',
      submitting: 'Anmeldung läuft...',
      note: 'Vorbereitet für Gäste des Park Dedeman Kartal.',
      errors: {
        emptyRoom: 'Bitte geben Sie Ihre Zimmernummer ein.',
        invalidRoom: 'Ungültige Zimmernummer. Bitte geben Sie die richtige Zimmernummer ein.',
        loginFailed: 'Bei der Anmeldung ist ein Fehler aufgetreten.',
      },
    },
    adminLogin: {
      brand: 'Kartal Park Dedeman',
      title: 'Cafe-Betriebsverwaltung',
      description: 'Verfolgen Sie Bestellungen, Frühstücksanfragen und monatliche Kassenbewegungen an einem Ort.',
      kicker: 'ADMIN-LOGIN',
      welcome: 'Willkommen',
      username: 'Benutzername',
      password: 'Passwort',
      submit: 'Zum Dashboard',
      submitting: 'Anmeldung läuft...',
      errors: {
        required: 'Benutzername und Passwort sind erforderlich.',
        failed: 'Anmeldung fehlgeschlagen.',
      },
    },
    adminLayout: {
      ariaLabel: 'Verwaltungsmenü',
      nav: {
        orders: 'Bestellungen',
        delivered: 'Ausgeliefert',
        createBreakfast: 'Frühstück anlegen',
        breakfasts: 'Frühstücke',
        products: 'Produktverwaltung',
        reports: 'Kasse und Verlauf',
        users: 'Administratoren',
      },
      roles: {
        admin: 'Administrator',
        reception: 'Rezeption',
        chef: 'Kueche',
      },
      fallbackUser: 'Administrator',
      footerLabel: '{{username}} · {{role}}',
    },
    notFound: {
      visualEyebrow: 'CAFÉ-MENÜ',
      visualTitle: 'Seite nicht gefunden.',
      visualBody: 'Die Adresse könnte falsch sein. In wenigen Sekunden leiten wir Sie zum richtigen Einstieg weiter.',
      code: '404',
      title: 'Die gesuchte Seite wurde nicht gefunden.',
      description: 'Die eingegebene Adresse führt zu keiner gültigen Seite. Sie werden gleich weitergeleitet.',
      note: 'Sichere Weiterleitung für Park Dedeman Kartal wird vorbereitet.',
    },
  },
  ar: {
    common: {
      hotelName: 'بارك ديديمان كارتال',
      guestMenu: 'قائمة الضيف',
      adminPanel: 'الإدارة',
      languageLabel: 'اللغة',
      languageNames: { tr: 'التركية', en: 'الإنجليزية', de: 'الألمانية', ar: 'العربية', ru: 'الروسية' },
      actions: {
        backToGuest: 'دخول الضيف',
        backToAdmin: 'دخول الإدارة',
        logout: 'تسجيل الخروج',
        loading: 'جارٍ التحميل...',
      },
    },
    guestLogin: {
      topBadge: 'قائمة الضيف',
      welcomeEyebrow: 'أهلاً وسهلاً',
      welcomeTitle: 'إقامة مريحة تبدأ من هنا.',
      welcomeBody: 'تنتظركم أطباق طازجة مُحضّرة بعناية داخل راحة غرفتكم.',
      kicker: 'قائمة الضيف',
      title: 'تابع باستخدام رقم الغرفة.',
      description: 'أدخل رقم غرفتك للوصول إلى القائمة.',
      roomLabel: 'رقم الغرفة',
      roomHelp: 'يُستخدم لإنشاء سلة خاصة بك.',
      roomPlaceholder: 'اكتب رقم غرفتك',
      submit: 'المتابعة إلى القائمة',
      submitting: 'جارٍ تسجيل الدخول...',
      note: 'تم إعدادها خصيصاً لضيوف بارك ديديمان كارتال.',
      errors: {
        emptyRoom: 'يرجى إدخال رقم الغرفة.',
        invalidRoom: 'رقم الغرفة غير صالح. يرجى إدخال الرقم الصحيح.',
        loginFailed: 'حدث خطأ أثناء تسجيل الدخول.',
      },
    },
    adminLogin: {
      brand: 'بارك ديديمان كارتال',
      title: 'إدارة عمليات المقهى',
      description: 'تابع الطلبات وطلبات الإفطار وحركة الصندوق الشهرية من مكان واحد.',
      kicker: 'دخول الإدارة',
      welcome: 'مرحباً بكم',
      username: 'اسم المستخدم',
      password: 'كلمة المرور',
      submit: 'الدخول إلى اللوحة',
      submitting: 'جارٍ تسجيل الدخول...',
      errors: {
        required: 'اسم المستخدم وكلمة المرور مطلوبان.',
        failed: 'تعذر تسجيل الدخول.',
      },
    },
    adminLayout: {
      ariaLabel: 'قائمة الإدارة',
      nav: {
        orders: 'الطلبات',
        delivered: 'الطلبات المسلّمة',
        createBreakfast: 'إنشاء إفطار',
        breakfasts: 'وجبات الإفطار',
        products: 'إدارة المنتجات',
        reports: 'الصندوق والسجل',
        users: 'المديرون',
      },
      roles: {
        admin: 'مدير',
        reception: 'الاستقبال',
        chef: 'الشيف',
      },
      fallbackUser: 'مدير',
      footerLabel: '{{username}} · {{role}}',
    },
    notFound: {
      visualEyebrow: 'قائمة المقهى',
      visualTitle: 'الصفحة غير موجودة.',
      visualBody: 'قد يكون العنوان غير صحيح. سننقلك إلى بوابة الدخول المناسبة خلال بضع ثوانٍ.',
      code: '404',
      title: 'الصفحة التي تبحث عنها غير موجودة.',
      description: 'العنوان الذي أدخلته لا يقود إلى صفحة صالحة. سيتم توجيهك بعد لحظات.',
      note: 'يتم تجهيز تحويل آمن لبارك ديديمان كارتال.',
    },
  },
  ru: {
    common: {
      hotelName: 'Park Dedeman Kartal',
      guestMenu: 'Меню гостя',
      adminPanel: 'Управление',
      languageLabel: 'Язык',
      languageNames: { tr: 'Турецкий', en: 'Английский', de: 'Немецкий', ar: 'Арабский', ru: 'Русский' },
      actions: {
        backToGuest: 'Вход гостя',
        backToAdmin: 'Вход для администрации',
        logout: 'Выйти',
        loading: 'Загрузка...',
      },
    },
    guestLogin: {
      topBadge: 'Меню гостя',
      welcomeEyebrow: 'ДОБРО ПОЖАЛОВАТЬ',
      welcomeTitle: 'Приятное пребывание начинается здесь.',
      welcomeBody: 'Свежеприготовленные угощения ждут вас в комфорте вашего номера.',
      kicker: 'МЕНЮ ГОСТЯ',
      title: 'Продолжите с номером вашей комнаты.',
      description: 'Введите номер комнаты, чтобы открыть меню.',
      roomLabel: 'Номер комнаты',
      roomHelp: 'Он используется для создания вашей персональной корзины.',
      roomPlaceholder: 'Введите номер комнаты',
      submit: 'Перейти к меню',
      submitting: 'Выполняется вход...',
      note: 'Подготовлено для гостей Park Dedeman Kartal.',
      errors: {
        emptyRoom: 'Пожалуйста, введите номер комнаты.',
        invalidRoom: 'Неверный номер комнаты. Пожалуйста, введите правильный номер.',
        loginFailed: 'Произошла ошибка при входе.',
      },
    },
    adminLogin: {
      brand: 'Kartal Park Dedeman',
      title: 'Управление работой кафе',
      description: 'Отслеживайте заказы, заявки на завтрак и ежемесячные кассовые показатели в одном месте.',
      kicker: 'ВХОД ДЛЯ АДМИНИСТРАЦИИ',
      welcome: 'Добро пожаловать',
      username: 'Имя пользователя',
      password: 'Пароль',
      submit: 'Войти в панель',
      submitting: 'Выполняется вход...',
      errors: {
        required: 'Имя пользователя и пароль обязательны.',
        failed: 'Не удалось выполнить вход.',
      },
    },
    adminLayout: {
      ariaLabel: 'Меню управления',
      nav: {
        orders: 'Заказы',
        delivered: 'Выполненные заказы',
        createBreakfast: 'Создать завтрак',
        breakfasts: 'Завтраки',
        products: 'Управление товарами',
        reports: 'Касса и история',
        users: 'Администраторы',
      },
      roles: {
        admin: 'Администратор',
        reception: 'Ресепшен',
        chef: 'Шеф',
      },
      fallbackUser: 'Администратор',
      footerLabel: '{{username}} · {{role}}',
    },
    notFound: {
      visualEyebrow: 'МЕНЮ КАФЕ',
      visualTitle: 'Страница потерялась.',
      visualBody: 'Возможно, адрес указан неверно. Через несколько секунд мы направим вас к нужному входу.',
      code: '404',
      title: 'Запрашиваемая страница не найдена.',
      description: 'Введённый адрес не ведёт на действительную страницу. Скоро мы перенаправим вас дальше.',
      note: 'Готовится безопасное перенаправление для Park Dedeman Kartal.',
    },
  },
};

const dictionaries = Object.fromEntries(
  Object.entries(baseDictionaries).map(([language, baseDictionary]) => [
    language,
    {
      ...baseDictionary,
      ...(menuTranslations[language] || menuTranslations.tr),
      ...(managementTranslations[language] || managementTranslations.tr),
      ...(operationsTranslations[language] || operationsTranslations.tr),
    },
  ]),
);

const localeMap = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  ar: 'ar-SA',
  ru: 'ru-RU',
};

const rtlLanguages = new Set(['ar']);

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && dictionaries[stored]) return stored;
  const browserLanguage = window.navigator.language?.slice(0, 2)?.toLowerCase();
  return dictionaries[browserLanguage] ? browserLanguage : DEFAULT_LANGUAGE;
};

const getNestedValue = (object, path) =>
  path.split('.').reduce((currentValue, segment) => (currentValue && currentValue[segment] !== undefined ? currentValue[segment] : undefined), object);

const interpolate = (template, values = {}) =>
  template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const value = values[key.trim()];
    return value === undefined || value === null ? '' : String(value);
  });

const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
    document.documentElement.lang = localeMap[language];
    document.documentElement.dir = rtlLanguages.has(language) ? 'rtl' : 'ltr';
  }, [language]);

  const value = useMemo(() => {
    const dictionary = dictionaries[language] || dictionaries[DEFAULT_LANGUAGE];
    const locale = localeMap[language] || localeMap[DEFAULT_LANGUAGE];
    const dir = rtlLanguages.has(language) ? 'rtl' : 'ltr';

    const t = (key, values) => {
      const resolved = getNestedValue(dictionary, key) ?? getNestedValue(dictionaries[DEFAULT_LANGUAGE], key) ?? key;
      return typeof resolved === 'string' ? interpolate(resolved, values) : resolved;
    };

    return {
      language,
      locale,
      dir,
      languages: Object.keys(dictionaries),
      setLanguage: (nextLanguage) => {
        if (dictionaries[nextLanguage]) setLanguageState(nextLanguage);
      },
      t,
      formatDate: (value, options) => new Intl.DateTimeFormat(locale, options).format(new Date(value)),
      formatNumber: (value, options) => new Intl.NumberFormat(locale, options).format(value),
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export default I18nProvider;
