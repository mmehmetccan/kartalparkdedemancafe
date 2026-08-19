export const menuTranslations = {
  tr: {
    guestMenu: {
      errors: {
        sessionExpired: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.',
        productsUnavailable: 'Ürünler şu anda yüklenemiyor.',
        orderFailed: 'Sipariş oluşturulamadı.'
      },
      header: {
        brandAria: 'Park Dedeman Kartal',
        ownAccount: 'OWN hesabı',
        roomLabel: 'Oda {{roomNumber}}',
        ownBadge: 'OTEL HESABI',
        guestBadge: 'MİSAFİR ODASI',
        logoutAria: 'Menüden çıkış yap',
        logout: 'Çıkış'
      },
      hero: {
        alt: 'Park Dedeman Kartal otel dinlenme alanı',
        eyebrow: 'ODA SERVİSİ · HER GÜN',
        title: 'Bir fincan mutluluk|odanıza gelsin.',
        body: 'Seçiminizi yapın, siparişinizi keyifle hazırlayalım.'
      },
      categories: {
        panelAria: 'Menü kategorileri',
        stageLabel: 'Menü kategori sahnesi',
        intro: 'KATEGORİLER',
        parentNav: 'Ana menü kategorileri',
        back: 'Tüm kategoriler',
        childrenNav: '{{label}} alt kategorileri',
        allInCategory: 'Tüm {{label}}',
        allInCategoryDescription: 'Bu kategorideki tüm ürünleri göster',
        fallbackLabel: 'Tüm Lezzetler',
        sections: {
          'ana-yemekler': { label: 'Ana Yemekler', description: 'Doyurucu ve özenli tabaklar' },
          'ara-sicaklar': { label: 'Ara Sıcaklar', description: 'Paylaşımlık sıcak lezzetler' },
          kahvaltilar: { label: 'Kahvaltılar', description: 'Güne iyi başlayan tabaklar' },
          'tatli-meyve': { label: 'Tatlılar ve Meyveler', description: 'Tatlı dokunuşlar ve taze meyveler' },
          kahveler: { label: 'Kahveler', description: 'Sıcak ve soğuk kahve seçkisi' },
          icecekler: { label: 'İçecekler', description: 'Serin ve klasik içecekler' }
        },
        children: {
          tatlilar: { label: 'Tatlılar', description: 'Günün tatlı seçkisi' },
          meyveler: { label: 'Meyveler', description: 'Taze hazırlanan meyve tabakları' },
          'sicak-kahveler': { label: 'Sıcak İçecekler', description: 'Klasik ve sıcak servis edilen kahveler' },
          'soguk-kahveler': { label: 'Soğuk İçecekler', description: 'Buzlu ve ferah kahve seçenekleri' }
        }
      },
      products: {
        sectionEyebrow: 'KAFE MENÜSÜ',
        heading: '{{category}} burada.',
        description: 'Odanız için özenle hazırlanan seçkimize göz atın.',
        metricCoffee: 'KAHVE YOĞUNLUĞU',
        metricGeneral: 'LEZZET PROFİLİ',
        metrics: {
          coffee: 'KAHVE YOĞUNLUĞU',
          portion: 'PORSİYON',
          spice: 'LEZZET YOĞUNLUĞU',
          richness: 'DOYGUNLUK',
          sweetness: 'TATLLILIK',
          refreshment: 'FERAHLIK',
        },
        traitLevels: {
          coffee: ['Hafif', 'Yumuşak', 'Dengeli', 'Belirgin', 'Yoğun'],
          portion: ['Hafif tabak', 'Orta porsiyon', 'Standart', 'Doyurucu', 'Büyük porsiyon'],
          spice: ['Hafif', 'Yumuşak', 'Dengeli', 'Belirgin', 'Yoğun'],
          richness: ['Hafif', 'Yumuşak', 'Dengeli', 'Doyurucu', 'Zengin'],
          sweetness: ['Az tatlı', 'Hafif tatlı', 'Dengeli', 'Tatlı', 'Çok tatlı'],
          refreshment: ['Hafif', 'Serin', 'Dengeli', 'Ferah', 'Buz gibi'],
        },
        emptyTitle: 'Bu kategori hazırlanıyor',
        emptyBody: '{{category}} ürünleri eklendiğinde burada görünecek.',
        loadingAria: 'Menü yükleniyor',
        loadingText: 'Yükleniyor',
        intensityLabels: ['Hafif', 'Yumuşak', 'Dengeli', 'Belirgin', 'Yoğun'],
        fallbackNames: {
          espresso: 'Espresso',
          americano: 'Americano',
          cappuccino: 'Cappuccino',
          latte: 'Latte',
          'türk kahvesi': 'Türk Kahvesi',
          'iced latte': 'Buzlu Latte'
        },
        fallbackDetails: {
          espresso: 'Yoğun aroması ve kadifemsi kremasıyla kahvenin en saf, en karakterli hali.',
          americano: 'Espressonun güçlü karakterini sıcak suyla uzatan, dengeli ve uzun içimli klasik.',
          cappuccino: 'Espresso, sıcak süt ve yoğun süt köpüğünün dengeli buluşması.',
          latte: 'Yumuşak içimli espresso, bol sıcak süt ve ince bir köpük dokunuşu.',
          'türk kahvesi': 'Geleneksel yöntemle ağır ağır pişirilen, yoğun gövdeli ve bol köpüklü kahve.',
          'iced latte': 'Buzun ferahlığı, soğuk sütün yumuşaklığı ve taze espressonun yoğun aroması aynı bardakta.',
          generic: 'Özenle seçilen içeriklerle siparişiniz üzerine taze hazırlanır.'
        }
      },
      cart: {
        open: 'Sepeti aç',
        openAria: 'Sepeti aç',
        openWithCountAria: 'Sepeti aç, {{count}} ürün var',
        title: 'Sepet',
        empty: 'Boş sepet',
        itemCount: '{{count}} ürün',
        drawerTitle: 'Sepetiniz',
        drawerSubtitle: 'Seçtiğiniz lezzetler',
        closeAria: 'Sepeti kapat',
        emptyState: 'Henüz sepetinize ürün eklemediniz.|Menüden bir kahve seçerek başlayın.',
        perItem: '{{price}} / adet',
        lineTotalAria: '{{name}} toplam tutar',
        decreaseAria: '{{name}} ürününü azalt',
        increaseAria: '{{name}} ürününü artır',
        quantityAria: '{{name}} miktarı',
        paymentTitle: 'ÖDEME YÖNTEMİ',
        paymentCash: 'Nakit',
        paymentCard: 'Kredi Kartı',
        total: 'Toplam',
        checkout: 'Siparişi onayla',
        checkoutPending: 'Sipariş iletiliyor...'
      },
      productCard: {
        add: 'Sepete ekle',
        addAria: '{{name}} ürününü sepete ekle',
        decreaseAria: 'Azalt',
        increaseAria: 'Artır'
      },
      confirmation: {
        closeAria: 'Teyit penceresini kapat',
        eyebrow: 'SİPARİŞ TEYİDİ',
        title: 'Resepsiyona kısa bir arama yapın.',
        body: 'Siparişinizi teyit amaçlı oda telefonundan <strong>0</strong> tuşlayarak resepsiyonu aramalısınız.',
        calloutTitle: 'Oda telefonundan 0 tuşlayın',
        calloutBody: 'Resepsiyon siparişinizi hemen teyit edecektir.',
        back: 'Sepete dön',
        submit: 'Siparişi ilet',
        submitPending: 'İletiliyor...'
      },
      success: {
        closeAria: 'Mesajı kapat',
        eyebrow: 'SİPARİŞ ONAYLANDI',
        title: 'Siparişiniz alındı.',
        body: 'Ödeme, siparişiniz teslim edilirken alınacaktır.',
        done: 'Tamam'
      }
    }
  },
  en: {
    guestMenu: {
      errors: {
        sessionExpired: 'Your session has expired. Please sign in again.',
        productsUnavailable: 'Products are unavailable right now.',
        orderFailed: 'The order could not be created.'
      },
      header: {
        brandAria: 'Park Dedeman Kartal',
        ownAccount: 'OWN account',
        roomLabel: 'Room {{roomNumber}}',
        ownBadge: 'HOTEL ACCOUNT',
        guestBadge: 'GUEST ROOM',
        logoutAria: 'Leave the menu',
        logout: 'Exit'
      },
      hero: {
        alt: 'Park Dedeman Kartal hotel lounge area',
        eyebrow: 'ROOM SERVICE · EVERY DAY',
        title: 'A cup of happiness,|delivered to your room.',
        body: 'Make your selection and let us prepare it with care.'
      },
      categories: {
        panelAria: 'Menu categories',
        stageLabel: 'Menu category stage',
        intro: 'CATEGORIES',
        parentNav: 'Main menu categories',
        back: 'All categories',
        childrenNav: '{{label}} subcategories',
        allInCategory: 'All {{label}}',
        allInCategoryDescription: 'Show all products in this category',
        fallbackLabel: 'All flavors',
        sections: {
          'ana-yemekler': { label: 'Main Courses', description: 'Hearty and carefully prepared plates' },
          'ara-sicaklar': { label: 'Warm Starters', description: 'Shareable warm bites' },
          kahvaltilar: { label: 'Breakfast', description: 'A delicious start to your day' },
          'tatli-meyve': { label: 'Desserts and Fruits', description: 'Sweet touches and fresh fruits' },
          kahveler: { label: 'Coffees', description: 'A selection of hot and iced coffees' },
          icecekler: { label: 'Beverages', description: 'Refreshing and classic drinks' }
        },
        children: {
          tatlilar: { label: 'Desserts', description: 'Today’s dessert selection' },
          meyveler: { label: 'Fruits', description: 'Freshly prepared fruit plates' },
          'sicak-kahveler': { label: 'Hot Drinks', description: 'Classic coffees served hot' },
          'soguk-kahveler': { label: 'Cold Drinks', description: 'Refreshing iced coffee choices' }
        }
      },
      products: {
        sectionEyebrow: 'CAFÉ MENU',
        heading: 'Discover {{category}}.',
        description: 'Explore our selection prepared with care for your room.',
        metricCoffee: 'COFFEE INTENSITY',
        metricGeneral: 'FLAVOR PROFILE',
        metrics: {
          coffee: 'COFFEE INTENSITY',
          portion: 'PORTION SIZE',
          spice: 'FLAVOR INTENSITY',
          richness: 'RICHNESS',
          sweetness: 'SWEETNESS',
          refreshment: 'REFRESHMENT',
        },
        traitLevels: {
          coffee: ['Light', 'Smooth', 'Balanced', 'Bold', 'Intense'],
          portion: ['Light plate', 'Medium', 'Standard', 'Hearty', 'Large portion'],
          spice: ['Mild', 'Soft', 'Balanced', 'Bold', 'Intense'],
          richness: ['Light', 'Soft', 'Balanced', 'Rich', 'Very rich'],
          sweetness: ['Low sweet', 'Lightly sweet', 'Balanced', 'Sweet', 'Very sweet'],
          refreshment: ['Mild', 'Cool', 'Balanced', 'Fresh', 'Ice cold'],
        },
        emptyTitle: 'This category is being prepared',
        emptyBody: '{{category}} items will appear here once they are added.',
        loadingAria: 'Loading menu',
        loadingText: 'Loading',
        intensityLabels: ['Light', 'Smooth', 'Balanced', 'Bold', 'Intense'],
        fallbackNames: {
          espresso: 'Espresso',
          americano: 'Americano',
          cappuccino: 'Cappuccino',
          latte: 'Latte',
          'türk kahvesi': 'Turkish Coffee',
          'iced latte': 'Iced Latte'
        },
        fallbackDetails: {
          espresso: 'The purest and most characterful form of coffee with intense aroma and velvety crema.',
          americano: 'A balanced long drink that stretches espresso’s bold character with hot water.',
          cappuccino: 'A balanced meeting of espresso, warm milk and dense milk foam.',
          latte: 'Smooth espresso with plenty of warm milk and a delicate foam finish.',
          'türk kahvesi': 'Traditional coffee slowly brewed for a full body and abundant foam.',
          'iced latte': 'The freshness of ice, the softness of cold milk and the deep aroma of fresh espresso in one glass.',
          generic: 'Prepared fresh to order with carefully selected ingredients.'
        }
      },
      cart: {
        open: 'Open cart',
        openAria: 'Open cart',
        openWithCountAria: 'Open cart, items: {{count}}',
        title: 'Cart',
        empty: 'Empty cart',
        itemCount: 'Items: {{count}}',
        drawerTitle: 'Your cart',
        drawerSubtitle: 'Your selected treats',
        closeAria: 'Close cart',
        emptyState: 'You have not added any items to your cart yet.|Start by choosing a coffee from the menu.',
        perItem: '{{price}} / each',
        lineTotalAria: '{{name}} line total',
        decreaseAria: 'Decrease {{name}}',
        increaseAria: 'Increase {{name}}',
        quantityAria: '{{name}} quantity',
        paymentTitle: 'PAYMENT METHOD',
        paymentCash: 'Cash',
        paymentCard: 'Credit Card',
        total: 'Total',
        checkout: 'Confirm order',
        checkoutPending: 'Sending order...'
      },
      productCard: {
        add: 'Add to cart',
        addAria: 'Add {{name}} to cart',
        decreaseAria: 'Decrease',
        increaseAria: 'Increase'
      },
      confirmation: {
        closeAria: 'Close confirmation dialog',
        eyebrow: 'ORDER CONFIRMATION',
        title: 'Please give reception a quick call.',
        body: 'To confirm your order, please dial <strong>0</strong> from your room phone and call reception.',
        calloutTitle: 'Dial 0 on your room phone',
        calloutBody: 'Reception will confirm your order right away.',
        back: 'Back to cart',
        submit: 'Send order',
        submitPending: 'Sending...'
      },
      success: {
        closeAria: 'Close message',
        eyebrow: 'ORDER CONFIRMED',
        title: 'Your order has been received.',
        body: 'Payment will be collected when your order is delivered.',
        done: 'Done'
      }
    }
  },
  de: {
    guestMenu: {
      errors: {
        sessionExpired: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
        productsUnavailable: 'Produkte sind derzeit nicht verfügbar.',
        orderFailed: 'Die Bestellung konnte nicht aufgegeben werden.'
      },
      header: {
        brandAria: 'Park Dedeman Kartal',
        ownAccount: 'OWN-Konto',
        roomLabel: 'Zimmer {{roomNumber}}',
        ownBadge: 'HOTELKONTO',
        guestBadge: 'GASTZIMMER',
        logoutAria: 'Menü verlassen',
        logout: 'Beenden'
      },
      hero: {
        alt: 'Loungebereich des Park Dedeman Kartal Hotels',
        eyebrow: 'ZIMMERSERVICE · JEDEN TAG',
        title: 'Eine Tasse Glück –|direkt auf Ihr Zimmer.',
        body: 'Treffen Sie Ihre Auswahl und wir bereiten sie mit Sorgfalt zu.'
      },
      categories: {
        panelAria: 'Menükategorien',
        stageLabel: 'Bereich der Menükategorien',
        intro: 'KATEGORIEN',
        parentNav: 'Hauptkategorien des Menüs',
        back: 'Alle Kategorien',
        childrenNav: 'Unterkategorien von {{label}}',
        allInCategory: 'Alle {{label}}',
        allInCategoryDescription: 'Alle Produkte dieser Kategorie anzeigen',
        fallbackLabel: 'Alle Genüsse',
        sections: {
          'ana-yemekler': { label: 'Hauptgerichte', description: 'Sättigende und sorgfältig zubereitete Teller' },
          'ara-sicaklar': { label: 'Warme Vorspeisen', description: 'Warme Leckereien zum Teilen' },
          kahvaltilar: { label: 'Frühstück', description: 'Ein genussvoller Start in den Tag' },
          'tatli-meyve': { label: 'Desserts und Obst', description: 'Süße Akzente und frisches Obst' },
          kahveler: { label: 'Kaffeespezialitäten', description: 'Eine Auswahl an heißen und kalten Kaffeespezialitäten' },
          icecekler: { label: 'Getränke', description: 'Erfrischende und klassische Getränke' }
        },
        children: {
          tatlilar: { label: 'Desserts', description: 'Die Dessertauswahl des Tages' },
          meyveler: { label: 'Obst', description: 'Frisch vorbereitete Obstplatten' },
          'sicak-kahveler': { label: 'Heiße Getränke', description: 'Klassische Kaffeespezialitäten, heiß serviert' },
          'soguk-kahveler': { label: 'Kalte Getränke', description: 'Erfrischende Kaffeespezialitäten auf Eis' }
        }
      },
      products: {
        sectionEyebrow: 'CAFÉ-MENÜ',
        heading: '{{category}} entdecken.',
        description: 'Entdecken Sie unsere sorgfältig zusammengestellte Auswahl für den Zimmerservice.',
        metricCoffee: 'KAFFEEINTENSITÄT',
        metricGeneral: 'GESCHMACKSPROFIL',
        emptyTitle: 'Diese Kategorie wird vorbereitet',
        emptyBody: '{{category}} werden hier angezeigt, sobald sie hinzugefügt wurden.',
        loadingAria: 'Menü wird geladen',
        loadingText: 'Wird geladen',
        intensityLabels: ['Leicht', 'Sanft', 'Ausgewogen', 'Kräftig', 'Intensiv'],
        fallbackNames: {
          espresso: 'Espresso',
          americano: 'Americano',
          cappuccino: 'Cappuccino',
          latte: 'Latte',
          'türk kahvesi': 'Türkischer Kaffee',
          'iced latte': 'Iced Latte'
        },
        fallbackDetails: {
          espresso: 'Die reinste und charakterstarkste Form des Kaffees mit intensivem Aroma und samtiger Crema.',
          americano: 'Ein ausgewogener langer Kaffee, der den kräftigen Charakter des Espresso mit heißem Wasser streckt.',
          cappuccino: 'Eine ausgewogene Verbindung aus Espresso, warmer Milch und dichtem Milchschaum.',
          latte: 'Milder Espresso mit viel warmer Milch und einem feinen Schaumabschluss.',
          'türk kahvesi': 'Traditionell langsam aufgebrühter Kaffee mit vollem Körper und reichlich Schaum.',
          'iced latte': 'Die Frische von Eis, die Sanftheit kalter Milch und das tiefe Aroma von frischem Espresso in einem Glas.',
          generic: 'Frisch auf Bestellung mit sorgfältig ausgewählten Zutaten zubereitet.'
        }
      },
      cart: {
        open: 'Warenkorb öffnen',
        openAria: 'Warenkorb öffnen',
        openWithCountAria: 'Warenkorb öffnen, {{count}} Artikel',
        title: 'Warenkorb',
        empty: 'Leerer Warenkorb',
        itemCount: '{{count}} Artikel',
        drawerTitle: 'Ihr Warenkorb',
        drawerSubtitle: 'Ihre ausgewählten Genüsse',
        closeAria: 'Warenkorb schließen',
        emptyState: 'Sie haben noch keine Artikel in den Warenkorb gelegt.|Beginnen Sie mit einem Kaffee aus dem Menü.',
        perItem: '{{price}} / Stück',
        lineTotalAria: '{{name}} Zwischensumme',
        decreaseAria: '{{name}} verringern',
        increaseAria: '{{name}} erhöhen',
        quantityAria: 'Menge von {{name}}',
        paymentTitle: 'ZAHLUNGSART',
        paymentCash: 'Bar',
        paymentCard: 'Kreditkarte',
        total: 'Gesamt',
        checkout: 'Bestellung bestätigen',
        checkoutPending: 'Bestellung wird gesendet...'
      },
      productCard: {
        add: 'In den Warenkorb',
        addAria: '{{name}} in den Warenkorb legen',
        decreaseAria: 'Verringern',
        increaseAria: 'Erhöhen'
      },
      confirmation: {
        closeAria: 'Bestätigungsfenster schließen',
        eyebrow: 'BESTELLBESTÄTIGUNG',
        title: 'Bitte rufen Sie kurz die Rezeption an.',
        body: 'Zur Bestätigung Ihrer Bestellung wählen Sie bitte <strong>0</strong> auf dem Zimmertelefon und rufen die Rezeption an.',
        calloutTitle: 'Wählen Sie 0 am Zimmertelefon',
        calloutBody: 'Die Rezeption bestätigt Ihre Bestellung sofort.',
        back: 'Zurück zum Warenkorb',
        submit: 'Bestellung senden',
        submitPending: 'Wird gesendet...'
      },
      success: {
        closeAria: 'Nachricht schließen',
        eyebrow: 'BESTELLUNG BESTÄTIGT',
        title: 'Ihre Bestellung ist eingegangen.',
        body: 'Die Zahlung wird bei der Lieferung Ihrer Bestellung entgegengenommen.',
        done: 'Fertig'
      }
    }
  },
  ar: {
    guestMenu: {
      errors: {
        sessionExpired: 'انتهت جلستك. يُرجى تسجيل الدخول مرة أخرى.',
        productsUnavailable: 'المنتجات غير متاحة حاليًا.',
        orderFailed: 'تعذر إنشاء الطلب.'
      },
      header: {
        brandAria: 'Park Dedeman Kartal',
        ownAccount: 'حساب OWN',
        roomLabel: 'الغرفة {{roomNumber}}',
        ownBadge: 'حساب الفندق',
        guestBadge: 'غرفة الضيف',
        logoutAria: 'الخروج من القائمة',
        logout: 'خروج'
      },
      hero: {
        alt: 'ردهة فندق بارك ديديمان كارتال',
        eyebrow: 'خدمة الغرف · كل يوم',
        title: 'دع فنجاناً من السعادة|يصل إلى غرفتك.',
        body: 'اختر ما تريده ودعنا نعده لك بعناية.'
      },
      categories: {
        panelAria: 'فئات القائمة',
        stageLabel: 'منصة فئات القائمة',
        intro: 'الفئات',
        parentNav: 'فئات القائمة الرئيسية',
        back: 'كل الفئات',
        childrenNav: 'الفئات الفرعية لـ {{label}}',
        allInCategory: 'كل {{label}}',
        allInCategoryDescription: 'عرض جميع المنتجات في هذه الفئة',
        fallbackLabel: 'كل النكهات',
        sections: {
          'ana-yemekler': { label: 'الأطباق الرئيسية', description: 'أطباق مشبعة ومحضرة بعناية' },
          'ara-sicaklar': { label: 'المقبلات الساخنة', description: 'لقيمات ساخنة للمشاركة' },
          kahvaltilar: { label: 'وجبات الإفطار', description: 'أطباق تبدأ اليوم بشكل جميل' },
          'tatli-meyve': { label: 'الحلويات والفواكه', description: 'لمسات حلوة وفواكه طازجة' },
          kahveler: { label: 'القهوة', description: 'تشكيلة من القهوة الساخنة والباردة' },
          icecekler: { label: 'المشروبات', description: 'مشروبات منعشة وكلاسيكية' }
        },
        children: {
          tatlilar: { label: 'الحلويات', description: 'تشكيلة حلويات اليوم' },
          meyveler: { label: 'الفواكه', description: 'أطباق فواكه طازجة' },
          'sicak-kahveler': { label: 'المشروبات الساخنة', description: 'قهوة كلاسيكية تقدم ساخنة' },
          'soguk-kahveler': { label: 'المشروبات الباردة', description: 'خيارات قهوة مثلجة ومنعشة' }
        }
      },
      products: {
        sectionEyebrow: 'قائمة المقهى',
        heading: 'اكتشف {{category}}.',
        description: 'اكتشف تشكيلتنا المحضرة بعناية لغرفتك.',
        metricCoffee: 'قوة القهوة',
        metricGeneral: 'ملف النكهة',
        emptyTitle: 'يتم تجهيز هذه الفئة',
        emptyBody: 'ستظهر منتجات {{category}} هنا عند إضافتها.',
        loadingAria: 'جارٍ تحميل القائمة',
        loadingText: 'جارٍ التحميل',
        intensityLabels: ['خفيفة', 'ناعمة', 'متوازنة', 'بارزة', 'قوية'],
        fallbackNames: {
          espresso: 'إسبريسو',
          americano: 'أمريكانو',
          cappuccino: 'كابتشينو',
          latte: 'لاتيه',
          'türk kahvesi': 'قهوة تركية',
          'iced latte': 'لاتيه مثلج'
        },
        fallbackDetails: {
          espresso: 'أكثر أشكال القهوة نقاء وشخصية مع رائحة قوية وكريمة مخملية.',
          americano: 'مشروب متوازن طويل يجمع قوة الإسبريسو مع الماء الساخن.',
          cappuccino: 'توازن جميل بين الإسبريسو والحليب الدافئ ورغوة الحليب الكثيفة.',
          latte: 'إسبريسو ناعم مع الكثير من الحليب الدافئ ولمسة رغوة خفيفة.',
          'türk kahvesi': 'قهوة تقليدية تُحضّر ببطء بقوام غني ورغوة وفيرة.',
          'iced latte': 'انتعاش الثلج ونعومة الحليب البارد وعمق الإسبريسو الطازج في كوب واحد.',
          generic: 'يُحضّر طازجاً عند الطلب بمكونات مختارة بعناية.'
        }
      },
      cart: {
        open: 'فتح السلة',
        openAria: 'فتح السلة',
        openWithCountAria: 'فتح السلة، عدد المنتجات: {{count}}',
        title: 'السلة',
        empty: 'سلة فارغة',
        itemCount: 'عدد المنتجات: {{count}}',
        drawerTitle: 'سلتك',
        drawerSubtitle: 'اختياراتك اللذيذة',
        closeAria: 'إغلاق السلة',
        emptyState: 'لم تضف أي منتجات إلى السلة بعد.|ابدأ باختيار قهوة من القائمة.',
        perItem: '{{price}} / القطعة',
        lineTotalAria: 'إجمالي {{name}}',
        decreaseAria: 'تقليل {{name}}',
        increaseAria: 'زيادة {{name}}',
        quantityAria: 'كمية {{name}}',
        paymentTitle: 'طريقة الدفع',
        paymentCash: 'نقدًا',
        paymentCard: 'بطاقة ائتمان',
        total: 'الإجمالي',
        checkout: 'تأكيد الطلب',
        checkoutPending: 'جارٍ إرسال الطلب...'
      },
      productCard: {
        add: 'أضف إلى السلة',
        addAria: 'أضف {{name}} إلى السلة',
        decreaseAria: 'تقليل',
        increaseAria: 'زيادة'
      },
      confirmation: {
        closeAria: 'إغلاق نافذة التأكيد',
        eyebrow: 'تأكيد الطلب',
        title: 'يُرجى الاتصال سريعًا بمكتب الاستقبال.',
        body: 'لتأكيد طلبك، يُرجى الضغط على <strong>0</strong> من هاتف الغرفة للاتصال بمكتب الاستقبال.',
        calloutTitle: 'اضغط على 0 من هاتف الغرفة',
        calloutBody: 'سيؤكد مكتب الاستقبال طلبك فورًا.',
        back: 'العودة إلى السلة',
        submit: 'إرسال الطلب',
        submitPending: 'جارٍ الإرسال...'
      },
      success: {
        closeAria: 'إغلاق الرسالة',
        eyebrow: 'تم تأكيد الطلب',
        title: 'تم استلام طلبك.',
        body: 'سيتم تحصيل الدفع عند تسليم طلبك.',
        done: 'حسنًا'
      }
    }
  },
  ru: {
    guestMenu: {
      errors: {
        sessionExpired: 'Срок вашей сессии истёк. Пожалуйста, войдите снова.',
        productsUnavailable: 'Продукты сейчас недоступны.',
        orderFailed: 'Не удалось оформить заказ.'
      },
      header: {
        brandAria: 'Park Dedeman Kartal',
        ownAccount: 'Счёт OWN',
        roomLabel: 'Номер {{roomNumber}}',
        ownBadge: 'СЧЁТ ОТЕЛЯ',
        guestBadge: 'ГОСТЕВОЙ НОМЕР',
        logoutAria: 'Выйти из меню',
        logout: 'Выход'
      },
      hero: {
        alt: 'Зона отдыха отеля Park Dedeman Kartal',
        eyebrow: 'ОБСЛУЖИВАНИЕ В НОМЕРЕ · КАЖДЫЙ ДЕНЬ',
        title: 'Чашка счастья —|прямо в ваш номер.',
        body: 'Сделайте выбор, а мы с заботой всё приготовим.'
      },
      categories: {
        panelAria: 'Категории меню',
        stageLabel: 'Сцена категорий меню',
        intro: 'КАТЕГОРИИ',
        parentNav: 'Основные категории меню',
        back: 'Все категории',
        childrenNav: 'Подкатегории {{label}}',
        allInCategory: 'Все {{label}}',
        allInCategoryDescription: 'Показать все продукты в этой категории',
        fallbackLabel: 'Все вкусы',
        sections: {
          'ana-yemekler': { label: 'Основные блюда', description: 'Сытные и тщательно приготовленные блюда' },
          'ara-sicaklar': { label: 'Горячие закуски', description: 'Теплые закуски для компании' },
          kahvaltilar: { label: 'Завтраки', description: 'Блюда для хорошего начала дня' },
          'tatli-meyve': { label: 'Десерты и фрукты', description: 'Сладкие акценты и свежие фрукты' },
          kahveler: { label: 'Кофе', description: 'Подборка горячего и холодного кофе' },
          icecekler: { label: 'Напитки', description: 'Освежающие и классические напитки' }
        },
        children: {
          tatlilar: { label: 'Десерты', description: 'Сегодняшняя подборка десертов' },
          meyveler: { label: 'Фрукты', description: 'Свежие фруктовые тарелки' },
          'sicak-kahveler': { label: 'Горячие напитки', description: 'Классический кофе, подаваемый горячим' },
          'soguk-kahveler': { label: 'Холодные напитки', description: 'Ледяные и освежающие кофейные варианты' }
        }
      },
      products: {
        sectionEyebrow: 'МЕНЮ КАФЕ',
        heading: 'Выбор: {{category}}.',
        description: 'Познакомьтесь с нашей подборкой, с заботой приготовленной для заказа в номер.',
        metricCoffee: 'КРЕПОСТЬ КОФЕ',
        metricGeneral: 'ПРОФИЛЬ ВКУСА',
        emptyTitle: 'Эта категория готовится',
        emptyBody: 'Товары категории {{category}} появятся здесь после добавления.',
        loadingAria: 'Загрузка меню',
        loadingText: 'Загрузка',
        intensityLabels: ['Лёгкий', 'Мягкий', 'Сбалансированный', 'Яркий', 'Насыщенный'],
        fallbackNames: {
          espresso: 'Эспрессо',
          americano: 'Американо',
          cappuccino: 'Капучино',
          latte: 'Латте',
          'türk kahvesi': 'Кофе по-турецки',
          'iced latte': 'Айс-латте'
        },
        fallbackDetails: {
          espresso: 'Самая чистая и выразительная форма кофе с интенсивным ароматом и бархатистой кремой.',
          americano: 'Сбалансированный длинный напиток, раскрывающий яркий характер эспрессо с горячей водой.',
          cappuccino: 'Гармоничное сочетание эспрессо, тёплого молока и плотной молочной пены.',
          latte: 'Мягкий эспрессо с большим количеством тёплого молока и нежной пеной.',
          'türk kahvesi': 'Традиционный кофе, медленно сваренный для плотного вкуса и богатой пены.',
          'iced latte': 'Свежесть льда, мягкость холодного молока и глубокий аромат свежего эспрессо в одном стакане.',
          generic: 'Готовится свежим по заказу из тщательно отобранных ингредиентов.'
        }
      },
      cart: {
        open: 'Открыть корзину',
        openAria: 'Открыть корзину',
        openWithCountAria: 'Открыть корзину, товаров: {{count}}',
        title: 'Корзина',
        empty: 'Пустая корзина',
        itemCount: 'Товаров: {{count}}',
        drawerTitle: 'Ваша корзина',
        drawerSubtitle: 'Выбранные блюда',
        closeAria: 'Закрыть корзину',
        emptyState: 'Вы ещё не добавили товары в корзину.|Начните с выбора кофе из меню.',
        perItem: '{{price}} / шт.',
        lineTotalAria: 'Сумма по позиции {{name}}',
        decreaseAria: 'Уменьшить {{name}}',
        increaseAria: 'Увеличить {{name}}',
        quantityAria: 'Количество {{name}}',
        paymentTitle: 'СПОСОБ ОПЛАТЫ',
        paymentCash: 'Наличные',
        paymentCard: 'Банковская карта',
        total: 'Итого',
        checkout: 'Подтвердить заказ',
        checkoutPending: 'Отправка заказа...'
      },
      productCard: {
        add: 'Добавить в корзину',
        addAria: 'Добавить {{name}} в корзину',
        decreaseAria: 'Уменьшить',
        increaseAria: 'Увеличить'
      },
      confirmation: {
        closeAria: 'Закрыть окно подтверждения',
        eyebrow: 'ПОДТВЕРЖДЕНИЕ ЗАКАЗА',
        title: 'Пожалуйста, позвоните на стойку регистрации.',
        body: 'Чтобы подтвердить заказ, наберите <strong>0</strong> на телефоне в номере и позвоните на стойку регистрации.',
        calloutTitle: 'Наберите 0 с телефона в номере',
        calloutBody: 'Сотрудники стойки регистрации сразу подтвердят ваш заказ.',
        back: 'Назад в корзину',
        submit: 'Отправить заказ',
        submitPending: 'Отправка...'
      },
      success: {
        closeAria: 'Закрыть сообщение',
        eyebrow: 'ЗАКАЗ ПОДТВЕРЖДЕН',
        title: 'Ваш заказ получен.',
        body: 'Оплата производится при доставке заказа.',
        done: 'Готово'
      }
    }
  }
};

export default menuTranslations;
