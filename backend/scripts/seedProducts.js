require('dotenv').config();
const { connectDB, getPool } = require('../config/db');
const productRepository = require('../repositories/productRepository');

const products = [
    {
        name: 'Espresso',
        menuSection: 'kahveler',
        menuSubsection: 'sicak-kahveler',
        description: 'Yoğun aroması ve kadifemsi kremasıyla kahvenin en saf, en karakterli hali.',
        translations: {
            en: { name: 'Espresso', description: 'The purest and most characterful form of coffee with intense aroma and velvety crema.' },
            de: { name: 'Espresso', description: 'Die purste und charakterstärkste Form des Kaffees mit intensivem Aroma und samtiger Crema.' },
            ar: { name: 'إسبريسو', description: 'أكثر أشكال القهوة نقاءً وشخصيةً مع نكهة مركزة وكريمة مخملية.' },
            ru: { name: 'Эспрессо', description: 'Самая чистая и выразительная форма кофе с насыщенным ароматом и бархатистой крема.' }
        },
        intensity: 5,
        sellingPrice: 95,
        costPrice: 24,
        imageUrl: 'menu-products/espresso.webp'
    },
    {
        name: 'Americano',
        menuSection: 'kahveler',
        menuSubsection: 'sicak-kahveler',
        description: 'Espressonun güçlü karakterini sıcak suyla uzatan, dengeli ve uzun içimli klasik.',
        translations: {
            en: { name: 'Americano', description: 'A balanced long drink that softens the bold character of espresso with hot water.' },
            de: { name: 'Americano', description: 'Ein ausgewogener Klassiker mit langem Trinkgenuss, der den kräftigen Charakter des Espressos mit heißem Wasser verlängert.' },
            ar: { name: 'أمريكانو', description: 'كلاسيكي متوازن يمتد فيه طابع الإسبريسو القوي بالماء الساخن.' },
            ru: { name: 'Американо', description: 'Сбалансированная классика с мягко раскрытым характером эспрессо, разбавленного горячей водой.' }
        },
        intensity: 4,
        sellingPrice: 110,
        costPrice: 29,
        imageUrl: 'menu-products/americano.webp'
    },
    {
        name: 'Cappuccino',
        menuSection: 'kahveler',
        menuSubsection: 'sicak-kahveler',
        description: 'Espresso, sıcak süt ve yoğun süt köpüğünün dengeli buluşması.',
        translations: {
            en: { name: 'Cappuccino', description: 'A balanced meeting of espresso, steamed milk, and dense milk foam.' },
            de: { name: 'Cappuccino', description: 'Ein ausgewogenes Zusammenspiel aus Espresso, heißer Milch und dichtem Milchschaum.' },
            ar: { name: 'كابتشينو', description: 'مزيج متوازن من الإسبريسو والحليب الساخن ورغوة الحليب الكثيفة.' },
            ru: { name: 'Капучино', description: 'Сбалансированное сочетание эспрессо, горячего молока и плотной молочной пены.' }
        },
        intensity: 3,
        sellingPrice: 135,
        costPrice: 42,
        imageUrl: 'menu-products/cappuccino.webp'
    },
    {
        name: 'Latte',
        menuSection: 'kahveler',
        menuSubsection: 'sicak-kahveler',
        description: 'Yumuşak içimli espresso, bol sıcak süt ve ince bir köpük dokunuşu.',
        translations: {
            en: { name: 'Latte', description: 'Smooth espresso with plenty of hot milk and a delicate layer of foam.' },
            de: { name: 'Latte', description: 'Sanfter Espresso mit viel heißer Milch und einer feinen Schaumnote.' },
            ar: { name: 'لاتيه', description: 'إسبريسو ناعم مع الكثير من الحليب الساخن ولمسة رغوة خفيفة.' },
            ru: { name: 'Латте', description: 'Мягкий эспрессо с большим количеством горячего молока и легкой пенкой.' }
        },
        intensity: 2,
        sellingPrice: 140,
        costPrice: 46,
        imageUrl: 'menu-products/latte.webp'
    },
    {
        name: 'Türk Kahvesi',
        menuSection: 'kahveler',
        menuSubsection: 'sicak-kahveler',
        description: 'Geleneksel yöntemle ağır ağır pişirilen, yoğun gövdeli ve bol köpüklü kahve.',
        translations: {
            en: { name: 'Turkish Coffee', description: 'Rich-bodied, foamy coffee slowly brewed with the traditional method.' },
            de: { name: 'Türkischer Kaffee', description: 'Kräftiger, vollmundiger Kaffee mit viel Schaum, langsam nach traditioneller Methode zubereitet.' },
            ar: { name: 'قهوة تركية', description: 'قهوة غنية القوام وكثيفة الرغوة تُحضّر ببطء على الطريقة التقليدية.' },
            ru: { name: 'Турецкий кофе', description: 'Насыщенный кофе с плотной пенкой, медленно приготовленный традиционным способом.' }
        },
        intensity: 5,
        sellingPrice: 100,
        costPrice: 22,
        imageUrl: 'menu-products/turk-kahvesi.webp'
    },
    {
        name: 'Iced Latte',
        menuSection: 'kahveler',
        menuSubsection: 'soguk-kahveler',
        description: 'Buzun ferahlığı, soğuk sütün yumuşaklığı ve taze espressonun yoğun aroması aynı bardakta.',
        translations: {
            en: { name: 'Iced Latte', description: 'Refreshing ice, smooth cold milk, and the intense aroma of fresh espresso in one glass.' },
            de: { name: 'Iced Latte', description: 'Die Frische von Eis, die Milde kalter Milch und das intensive Aroma von frischem Espresso in einem Glas.' },
            ar: { name: 'آيس لاتيه', description: 'انتعاش الثلج ونعومة الحليب البارد وكثافة الإسبريسو الطازج في كوب واحد.' },
            ru: { name: 'Айс-латте', description: 'Свежесть льда, мягкость холодного молока и насыщенный аромат свежего эспрессо в одном стакане.' }
        },
        intensity: 3,
        sellingPrice: 155,
        costPrice: 52,
        imageUrl: 'menu-products/iced-latte.webp'
    },
    {
        name: 'Karışık Tost',
        menuSection: 'kahvaltilar',
        menuSubsection: 'tostlar',
        description: 'Sucuk, kaşar ve mevsim yeşillikleri ile servis edilir.',
        translations: {
            en: { name: 'Mixed Toast', description: 'Served with sucuk, kashar cheese, and seasonal greens.' },
            de: { name: 'Gemischter Toast', description: 'Serviert mit Sucuk, Kaschkaval und saisonalem Grün.' },
            ar: { name: 'توست مشكل', description: 'يُقدّم مع السجق والجبن الكاشار والخضار الموسمية.' },
            ru: { name: 'Смешанный тост', description: 'Подаётся с суджуком, сыром кашар и сезонной зеленью.' }
        },
        intensity: 4,
        sellingPrice: 250,
        costPrice: 80,
        imageUrl: 'menu-products/karisik-tost.webp'
    },
    {
        name: 'Kaşarlı Tost',
        menuSection: 'kahvaltilar',
        menuSubsection: 'tostlar',
        description: 'Kaşar peynir ve mevsim yeşillikleri ile servis edilir.',
        translations: {
            en: { name: 'Kashar Toast', description: 'Served with kashar cheese and seasonal greens.' },
            de: { name: 'Käsetoast', description: 'Serviert mit Kaschkaval und saisonalem Grün.' },
            ar: { name: 'توست بالجبن الكاشار', description: 'يُقدّم مع جبن الكاشار والخضار الموسمية.' },
            ru: { name: 'Тост с кашаром', description: 'Подаётся с сыром кашар и сезонной зеленью.' }
        },
        intensity: 3,
        sellingPrice: 220,
        costPrice: 65,
        imageUrl: 'menu-products/kasarli-tost.webp'
    },
    {
        name: 'Domatesli - Beyaz Peynirli Tost',
        menuSection: 'kahvaltilar',
        menuSubsection: 'tostlar',
        description: 'Beyaz peynir, domates, kekik ve mevsim yeşillikleri ile servis edilir.',
        translations: {
            en: { name: 'Tomato and White Cheese Toast', description: 'Served with white cheese, tomato, thyme, and seasonal greens.' },
            de: { name: 'Toast mit Tomate und Weißkäse', description: 'Serviert mit Weißkäse, Tomate, Thymian und saisonalem Grün.' },
            ar: { name: 'توست بالطماطم والجبن الأبيض', description: 'يُقدّم مع الجبن الأبيض والطماطم والزعتر والخضار الموسمية.' },
            ru: { name: 'Тост с томатом и белым сыром', description: 'Подаётся с белым сыром, томатом, тимьяном и сезонной зеленью.' }
        },
        intensity: 3,
        sellingPrice: 230,
        costPrice: 70,
        imageUrl: 'menu-products/domatesli-beyaz-peynirli-tost.webp'
    },
    {
        name: 'Peynir Sandviç',
        menuSection: 'kahvaltilar',
        menuSubsection: 'sandvicler',
        description: 'Beyaz peynir, kaşar peynir, domates, salatalık ve marul.',
        translations: {
            en: { name: 'Cheese Sandwich', description: 'White cheese, kashar cheese, tomato, cucumber, and lettuce.' },
            de: { name: 'Käsesandwich', description: 'Weißkäse, Kaschkaval, Tomate, Gurke und Salat.' },
            ar: { name: 'ساندويش بالجبن', description: 'جبن أبيض، جبن كاشار، طماطم، خيار وخس.' },
            ru: { name: 'Сэндвич с сыром', description: 'Белый сыр, кашар, томат, огурец и салат.' }
        },
        intensity: 3,
        sellingPrice: 240,
        costPrice: 75,
        imageUrl: 'menu-products/peynir-sandvic.webp'
    },
    {
        name: 'Karışık Sandviç',
        menuSection: 'kahvaltilar',
        menuSubsection: 'sandvicler',
        description: 'Kaşar peynir, domates, salatalık, marul, hindi füme ve salam.',
        translations: {
            en: { name: 'Mixed Sandwich', description: 'Kashar cheese, tomato, cucumber, lettuce, smoked turkey, and salami.' },
            de: { name: 'Gemischtes Sandwich', description: 'Kaschkaval, Tomate, Gurke, Salat, geräucherter Truthahn und Salami.' },
            ar: { name: 'ساندويش مشكل', description: 'جبن كاشار، طماطم، خيار، خس، حبش مدخن وسلامي.' },
            ru: { name: 'Смешанный сэндвич', description: 'Кашар, томат, огурец, салат, копчёная индейка и салями.' }
        },
        intensity: 4,
        sellingPrice: 280,
        costPrice: 95,
        imageUrl: 'menu-products/karisik-sandvic.webp'
    },
    {
        name: 'Ton Balıklı Sandviç',
        menuSection: 'kahvaltilar',
        menuSubsection: 'sandvicler',
        description: 'Mor soğan, ton balığı, kornişon turşu, marul, mayonez ve mısır.',
        translations: {
            en: { name: 'Tuna Sandwich', description: 'Red onion, tuna, gherkins, lettuce, mayonnaise, and corn.' },
            de: { name: 'Thunfischsandwich', description: 'Rote Zwiebel, Thunfisch, Cornichons, Salat, Mayonnaise und Mais.' },
            ar: { name: 'ساندويش التونة', description: 'بصل أحمر، تونة، مخلل كورنيشون، خس، مايونيز وذرة.' },
            ru: { name: 'Сэндвич с тунцом', description: 'Красный лук, тунец, корнишоны, салат, майонез и кукуруза.' }
        },
        intensity: 3,
        sellingPrice: 270,
        costPrice: 90,
        imageUrl: 'menu-products/ton-balikli-sandvic.webp'
    }
];

const seedProducts = async () => {
    await connectDB();
    for (const product of products) {
        const existing = await productRepository.findByName(product.name);
        if (existing) {
            await productRepository.update(existing._id, product);
        } else {
            await productRepository.create(product);
        }
    }
    console.log(`${products.length} deneme ürünü hazır.`);
    await getPool().end();
};

seedProducts().catch((error) => {
    console.error(`Ürün ekleme hatası: ${error.message}`);
    process.exitCode = 1;
});
