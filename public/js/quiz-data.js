/**
 * KVÍZ — 10 otázek
 * Strukturováno podle screenshotů + doplněné otázky 1-3
 *
 * Ikony jsou krátké textové zkratky/symboly. CSS je vykresluje
 * v monospace fontu uvnitř kulatého kontejneru → moderní, B2B vzhled.
 */
window.QUIZ = [
  // ===== Q1 =====
  {
    id: 'firma_jmeno',
    section: 'O TVÉ FIRMĚ',
    title: 'Jak se jmenuje tvoje firma?',
    help: 'Použijeme to v tvém AI plánu na konci.',
    type: 'inputs',
    fields: [
      { key: 'firma_jmeno', label: 'Název firmy', placeholder: 'např. Thaddy Transport', required: true },
      { key: 'role', label: 'Tvoje role', placeholder: 'majitel, ředitel, jednatel…', required: false }
    ]
  },

  // ===== Q2 =====
  {
    id: 'velikost_tymu',
    section: 'O TVÉ FIRMĚ',
    title: 'Kolik vás je v týmu?',
    help: 'Včetně tebe a externích spolupracovníků.',
    type: 'single',
    options: [
      { key: 'solo', icon: '01', label: 'Solo — jsem na to sám/sama' },
      { key: '2-5', icon: '2-5', label: '2 – 5 lidí' },
      { key: '6-15', icon: '6+', label: '6 – 15 lidí' },
      { key: '16-50', icon: '16+', label: '16 – 50 lidí' },
      { key: '50+', icon: '50+', label: '50+ lidí' }
    ]
  },

  // ===== Q3 =====
  {
    id: 'odvetvi',
    section: 'O TVÉ FIRMĚ',
    title: 'Z jakého jsi odvětví?',
    help: 'Stačí přibližně — pomáhá nám to vybrat relevantní AI systémy.',
    type: 'single',
    cols: 2,
    options: [
      { key: 'sluzby', icon: 'SL', label: 'Služby / agentura' },
      { key: 'doprava', icon: 'DO', label: 'Doprava / logistika' },
      { key: 'vyroba', icon: 'VR', label: 'Výroba / řemeslo' },
      { key: 'eshop', icon: 'EC', label: 'E-shop / obchod' },
      { key: 'realit', icon: 'FI', label: 'Reality / finance' },
      { key: 'gastro', icon: 'GA', label: 'Gastro / hotel' },
      { key: 'it', icon: 'IT', label: 'IT / software' },
      { key: 'jine', icon: '...', label: 'Něco jiného' }
    ]
  },

  // ===== Q4 — KDE TĚ TLAČÍ ČAS =====
  {
    id: 'kde_tlaci_cas',
    section: 'KDE TĚ TLAČÍ ČAS',
    title: 'Kde se ve FIRMĚ teď topíte? Co bere nejvíc času?',
    help: 'Vyber 1–3 možnosti.',
    type: 'multi',
    cols: 2,
    min: 1,
    max: 3,
    hint: { strong: 'Tři oblasti.', text: ' Signál, že je čas začít. Dobrá zpráva: AI to zvládne všechno.' },
    options: [
      { key: 'komunikace-klienti', icon: 'KK', label: 'Komunikace s klienty (ozývání, dotahování / follow-upy, schůzky)' },
      { key: 'vykazovani-cisla', icon: 'RP', label: 'Vykazování čísel a přehledy' },
      { key: 'provoz-administrativa', icon: 'AD', label: 'Provoz a administrativa (faktury, plánování, papíry)' },
      { key: 'onboarding', icon: 'ON', label: 'Onboarding klientů a zaškolení zaměstnanců' },
      { key: 'dorucovani', icon: 'OP', label: 'Doručování služby/produktu (vlastní práce/výroba)' },
      { key: 'nabor-hr', icon: 'HR', label: 'Nábor a personální (HR)' },
      { key: 'strategie-kreativita', icon: 'ST', label: 'Strategická a kreativní práce' },
      { key: 'jine', icon: '...', label: 'Něco jiného' }
    ]
  },

  // ===== Q5 — CO BY MĚLI DĚLAT VÍC =====
  {
    id: 'co_chybi_cas',
    section: 'KDE TĚ TLAČÍ ČAS',
    title: 'Co byste měli ve firmě dělat víc, ale nemáte na to čas? Věci, které by přinesly víc peněz.',
    help: 'Vyber 1–3 možnosti.',
    type: 'multi',
    cols: 2,
    min: 1,
    max: 3,
    options: [
      { key: 'socialni-site-obsah', icon: 'SO', label: 'Sociální sítě a tvorba obsahu' },
      { key: 'aktivni-osloveni', icon: 'AQ', label: 'Aktivní oslovování klientů (e-maily, LinkedIn, akvizice)' },
      { key: 'budovani-vztahu', icon: 'NW', label: 'Budování vztahů, partnerství' },
      { key: 'stavajici-klienti', icon: 'CR', label: 'Práce se stávajícími klienty (rozšiřování spolupráce / upsell, udržení klientů)' },
      { key: 'analyza-cisel', icon: 'AN', label: 'Sledování a analýza vlastních čísel' },
      { key: 'strategie-planovani', icon: 'ST', label: 'Strategická práce, plánování, vývoj' },
      { key: 'vyvoj-produktu', icon: 'PR', label: 'Vývoj nových produktů nebo služeb' },
      { key: 'vzdelavani', icon: 'ED', label: 'Vzdělávání mě nebo týmu' },
      { key: 'jine', icon: '...', label: 'Něco jiného' }
    ]
  },

  // ===== Q6 — HODINY =====
  {
    id: 'hodiny_tydne',
    section: 'KDE TĚ TLAČÍ ČAS',
    title: 'Kolik hodin týdně ty nebo tým strávíte na věcech z předchozí otázky?',
    type: 'single',
    cols: 2,
    options: [
      { key: 'pod-10', icon: '<10', label: 'Pod 10 hodin týdně', layout: 'center' },
      { key: '10-25', icon: '10-25', label: '10 – 25 hodin týdně', layout: 'center' },
      { key: '25-50', icon: '25-50', label: '25 – 50 hodin týdně', layout: 'center' },
      { key: '50-100', icon: '50-100', label: '50 – 100 hodin týdně', layout: 'center' },
      { key: 'nad-100', icon: '100+', label: 'Víc než 100 hodin týdně', layout: 'center' }
    ]
  },

  // ===== Q7 — SAZBA =====
  {
    id: 'sazba',
    section: 'KDE TĚ TLAČÍ ČAS',
    title: 'Hodinová sazba — kolik tě (nebo tvého člověka) v průměru stojí 1 hodina?',
    help: 'Pokud nevíš přesně, vezmi měsíční náklad na pozici (mzda + odvody) a vyděl 160.',
    type: 'single',
    cols: 2,
    options: [
      { key: 'pod-500', icon: '<500', label: 'Pod 500 Kč/h', layout: 'center' },
      { key: '500-1000', icon: '500-1k', label: '500 – 1 000 Kč/h', layout: 'center' },
      { key: '1000-2000', icon: '1-2k', label: '1 000 – 2 000 Kč/h', layout: 'center' },
      { key: '2000-5000', icon: '2-5k', label: '2 000 – 5 000 Kč/h', layout: 'center' },
      { key: 'nad-5000', icon: '5k+', label: 'Nad 5 000 Kč/h', layout: 'center' }
    ]
  },

  // ===== Q8 — DVOJOTÁZKA: OBRAT + KAPACITA =====
  {
    id: 'ekonomika',
    section: 'CÍLE A PLÁN',
    title: 'Ekonomika tvojí firmy',
    help: 'Dvě rychlé otázky na jedné kartě.',
    type: 'combined',
    subgroups: [
      {
        key: 'obrat',
        icon: '$',
        title: 'Tvůj měsíční obrat (v Kč)',
        type: 'pills',
        options: [
          { key: 'pod-100k', label: 'Pod 100 000 Kč' },
          { key: '100k-500k', label: '100 000 – 500 000 Kč' },
          { key: '500k-1m', label: '500 000 – 1 000 000 Kč' },
          { key: '1-3m', label: '1 – 3 mil. Kč' },
          { key: '3-10m', label: '3 – 10 mil. Kč' },
          { key: '10m+', label: '10+ mil. Kč' },
          { key: 'neuvedeno', label: 'Nechci říct' }
        ]
      },
      {
        key: 'kapacita',
        icon: '%',
        title: 'Jak moc jsi vytížený/á zakázkami?',
        type: 'pills',
        options: [
          { key: 'na-maximu', label: 'Jsem na maximu, víc už nezvládnu' },
          { key: '70-90', label: 'Mám ještě trochu prostoru (70–90 %)' },
          { key: '50-70', label: 'Mám slušnou rezervu (50–70 %)' },
          { key: 'pod-50', label: 'Hodně volné kapacity (pod 50 %)' },
          { key: 'neomezene', label: 'Strop nemám (online produkt / neomezené)' },
          { key: 'nevim', label: 'Nevím' }
        ]
      }
    ]
  },

  // ===== Q9 — AI ZKUŠENOST =====
  {
    id: 'ai_zkusenost',
    section: 'CÍLE A PLÁN',
    title: 'Jaké už máš zkušenosti s AI?',
    type: 'single',
    cols: 1,
    options: [
      {
        key: 'zacinam',
        icon: 'I',
        label: 'Začínám',
        desc: 'Pouštím si ChatGPT občas, ptám se na jednoduché věci.'
      },
      {
        key: 'pravidelne',
        icon: 'II',
        label: 'Pravidelně',
        desc: 'ChatGPT/Claude používám denně, dělám si custom GPTs, občas si hraju i s Coworkem.'
      },
      {
        key: 'stredne-pokrocily',
        icon: 'III',
        label: 'Středně pokročilý',
        desc: 'Cowork používám aktivně, stavím automatizace v Make/Zapier.'
      },
      {
        key: 'pokrocily',
        icon: 'IV',
        label: 'Pokročilý',
        desc: 'Stavím vlastní agenty, kóduji s Claude Code, řeším MCP servery.'
      }
    ]
  },

  // ===== Q10 — CO BRZDÍ =====
  {
    id: 'co_nejvic_brzdi',
    section: 'CÍLE A PLÁN',
    title: 'Co tě teď v byznysu nejvíc brzdí?',
    help: 'Vyber to, co tě tlačí nejvíc.',
    type: 'single',
    cols: 1,
    options: [
      { key: 'strategie-vs-operativa', icon: 'OP', label: 'Nestíhám se věnovat strategii a růstu — operativa mě požírá' },
      { key: 'akvizice', icon: 'AQ', label: 'Nestíhám akvizici a obchod — nové klienty řeším nárazově' },
      { key: 'cashflow', icon: 'CF', label: 'Slabý nebo nestabilní cash flow — měsíce kolísají' },
      { key: 'tym', icon: 'TM', label: 'Tým — nemám lidi nebo neumím z nich dostat víc' },
      { key: 'ai-kde-zacit', icon: 'AI', label: 'Nevím, kde s AI začít a co reálně automatizovat' },
      { key: 'napady-bez-systemu', icon: 'SY', label: 'Mám nápady, ale chybí provedení a systém' },
      { key: 'kapacita-poptavka', icon: 'CP', label: 'Kapacita nestíhá poptávku — nemůžu škálovat' },
      { key: 'jine', icon: '...', label: 'Něco jiného' }
    ]
  }
];
