let siteConfig = null;
let menuData = null;

const fallbackConfig = {
  restaurant: {
    name: 'Pizzeria Planeta',
    tagline: 'Najlepsza pizza w Elblągu',
    description: 'Cienkie, chrupiące ciasto, obfite składniki i smak, który zapamiętasz.',
    address: 'Płk. Stanisława Dąbka 140/4',
    city: '82-300 Elbląg',
    phone: '+48 55 000 00 00',
    email: 'kontakt@pizzeriaplaneta.pl',
    hours: {
      poniedzialek: '12:00 – 22:00',
      wtorek: '12:00 – 22:00',
      sroda: '12:00 – 22:00',
      czwartek: '12:00 – 22:00',
      piatek: '12:00 – 23:00',
      sobota: '12:00 – 23:00',
      niedziela: '12:00 – 22:00'
    },
    rating: 3.9,
    reviewsCount: 143,
    features: ['Dowóz na terenie Elbląga', 'Odbiór osobisty', 'Imprezy okolicznościowe']
  },
  images: {
    hero: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&q=80',
    about: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&q=80',
      'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&q=80'
    ],
    logo: 'assets/logo.svg'
  },
  email: {
    serviceId: 'TWOJ_SERVICE_ID',
    templateId: 'TWOJ_TEMPLATE_ID',
    publicKey: 'TWOJ_PUBLIC_KEY',
    ownerEmail: 'wlasciciel@pizzeriaplaneta.pl'
  },
  delivery: {
    minOrder: 30,
    deliveryFee: 5,
    freeDeliveryFrom: 80,
    estimatedTime: '45-60 min'
  }
};

const fallbackMenu = {
  categories: [
    {
      id: 'bestsellery',
      name: 'Bestsellery',
      icon: '🔥',
      items: [
        {
          id: 'czerwona-planeta-40',
          name: 'Czerwona Planeta',
          description: 'Sos pomidorowy, mozzarella, salami, pieczarki, papryka, cebula',
          price: 42,
          image: 'https://images.unsplash.com/photo-1604382894740-747abb3801bb?w=600&q=80',
          tags: ['bestseller', 'pikantna'],
          sizes: [
            { name: '30 cm', priceModifier: -8 },
            { name: '40 cm', priceModifier: 0 }
          ]
        }
      ]
    },
    {
      id: 'pizza-40',
      name: 'Pizza 40 cm',
      icon: '🍕',
      items: [
        {
          id: 'margherita-40',
          name: 'Margherita',
          description: 'Sos pomidorowy, mozzarella, oregano, bazylia',
          price: 32,
          image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&q=80',
          tags: ['klasyczna']
        }
      ]
    }
  ]
};

export async function loadConfig() {
  try {
    const [configRes, menuRes] = await Promise.all([
      fetch('data/config.json', { cache: 'no-store' }),
      fetch('data/menu.json', { cache: 'no-store' })
    ]);

    if (!configRes.ok || !menuRes.ok) {
      throw new Error('Nie udało się pobrać danych z serwera');
    }

    siteConfig = await configRes.json();
    menuData = await menuRes.json();
  } catch (err) {
    console.warn('Używam danych awaryjnych strony:', err);
    siteConfig = fallbackConfig;
    menuData = fallbackMenu;
  }

  return { siteConfig, menuData };
}

export function getConfig() {
  return siteConfig || fallbackConfig;
}

export function getMenu() {
  return menuData || fallbackMenu;
}

export function formatPrice(price) {
  return `${price.toFixed(2).replace('.', ',')} zł`;
}

export function getTagClass(tag) {
  const map = {
    bestseller: 'badge-bestseller',
    wegetarianska: 'badge-vege',
    pikantna: 'badge-spicy'
  };
  return map[tag] || 'badge-bestseller';
}

export function getTagLabel(tag) {
  const map = {
    bestseller: 'Bestseller',
    wegetarianska: 'Wege',
    pikantna: 'Pikantna',
    klasyczna: 'Klasyczna',
    xxl: 'XXL'
  };
  return map[tag] || tag;
}
