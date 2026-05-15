const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { sendPlan } = require('./email');

const app = express();
const PORT = process.env.PORT || 3000;

// ============ JEDNODUCHÉ ÚLOŽIŠTĚ (JSONL) ============
// Důvod: žádné native dependence, funguje na Vercelu, Railway, VPS, kdekoli.
// Pokud potřebuješ SQL, je to malá refaktorace — viz README.
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const submissionsFile = path.join(dataDir, 'submissions.jsonl');

function saveSubmission(record) {
  const line = JSON.stringify(record) + '\n';
  fs.appendFileSync(submissionsFile, line, 'utf8');
}

function loadSubmissions(limit = 200) {
  if (!fs.existsSync(submissionsFile)) return [];
  const lines = fs.readFileSync(submissionsFile, 'utf8').trim().split('\n').filter(Boolean);
  return lines.slice(-limit).reverse().map(l => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

// ============ MIDDLEWARE ============
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ============ VÝPOČETNÍ LOGIKA ============
// Stejná logika jako na screenshotech: hodiny × sazba × % automatizace

const HODINY_RANGE = {
  'pod-10': 7,
  '10-25': 17,
  '25-50': 37,
  '50-100': 75,
  'nad-100': 120
};

const SAZBA_RANGE = {
  'pod-500': 350,
  '500-1000': 750,
  '1000-2000': 1500,
  '2000-5000': 3500,
  'nad-5000': 6500
};

const OBRAT_RANGE = {
  'pod-100k': 70000,
  '100k-500k': 300000,
  '500k-1m': 750000,
  '1-3m': 2000000,
  '3-10m': 6500000,
  '10m+': 15000000,
  'neuvedeno': null
};

const KAPACITA_USLY = {
  'na-maximu': 0.95,
  '70-90': 0.80,
  '50-70': 0.60,
  'pod-50': 0.40,
  'neomezene': 1.0,
  'nevim': 0.75
};

// % automatizace dle úrovně AI zkušeností a typu úkolů
const AI_USPORA_HODIN = {
  'zacinam': 0.30,        // 30 % manuálních hodin AI ušetří
  'pravidelne': 0.42,
  'stredne-pokrocily': 0.55,
  'pokrocily': 0.65
};

// Doporučené AI systémy podle "kde tě tlačí čas" + "co bys měl dělat víc"
const AI_SYSTEMY_KATALOG = {
  'komunikace-klienti': {
    nazev: 'Automatický follow-up a komunikace s klienty',
    typ: 'setri-cas',
    popis: 'AI sleduje rozjednané obchody, automaticky posílá follow-upy, připomínky a navrhuje další kroky. Místo psaní stejných emailů znovu a znovu máš systém, který drží kontakt s klienty za tebe.',
    usetri_h: 0.15,
    multiplier: 1.0
  },
  'provoz-administrativa': {
    nazev: 'Automatizace fakturace a administrativy',
    typ: 'setri-cas',
    popis: 'Faktury, podklady, evidence — AI připraví dokumenty, hlídá splatnosti a posílá upomínky. Účetní program propojený s AI ti ušetří hodiny papírování každý týden.',
    usetri_h: 0.12,
    multiplier: 1.0
  },
  'dorucovani': {
    nazev: 'Plánování a optimalizace vlastní práce',
    typ: 'setri-cas',
    popis: 'AI plánuje jízdy, výrobu, realizace — na základě objednávek navrhne optimální rozvrh a upozorní, kde je kapacita volná nebo kde hrozí kolize. Méně improvizace, méně chyb.',
    usetri_h: 0.18,
    multiplier: 1.0
  },
  'vykazovani-cisla': {
    nazev: 'Reporty a dashboardy v reálném čase',
    typ: 'setri-cas',
    popis: 'Místo skládání čísel v Excelu máš dashboard, který se aktualizuje sám. AI shrne týden, měsíc, klienta — a upozorní na anomálie dřív, než se z nich stane problém.',
    usetri_h: 0.10,
    multiplier: 1.0
  },
  'onboarding': {
    nazev: 'Onboarding klientů a zaškolení zaměstnanců',
    typ: 'setri-cas',
    popis: 'AI asistent provede klienta nebo zaměstnance procesem — odpovídá na otázky, posílá podklady, hlídá kroky. Ty místo opakování stejných věcí 50× ročně řešíš jen výjimky.',
    usetri_h: 0.10,
    multiplier: 1.0
  },
  'nabor-hr': {
    nazev: 'Pre-screening kandidátů a HR agenda',
    typ: 'setri-cas',
    popis: 'AI projde CV, položí kandidátům úvodní otázky a předfiltruje je. Ty mluvíš jen s lidmi, kteří dávají smysl. Plus automatizovaná smluvní agenda a evidence.',
    usetri_h: 0.08,
    multiplier: 1.0
  },
  'strategie-kreativita': {
    nazev: 'AI sparring partner pro strategii',
    typ: 'setri-cas',
    popis: 'Custom GPT trénovaný na tvých datech — pomáhá ti rozhodovat, brainstormovat, validovat nápady. Místo abys to řešil sám v hlavě, máš protějšek 24/7.',
    usetri_h: 0.06,
    multiplier: 1.0
  },
  // Příležitosti = peníze navíc
  'socialni-site-obsah': {
    nazev: 'Pravidelný obsah na sociální sítě',
    typ: 'vydelava',
    popis: 'AI připraví posty, články, scénáře videí — z tvých podkladů a tvým hlasem. Pravidelný výstup bez toho, aby ti to sežralo víkendy.',
    prinese_kc_pct_obratu: 0.015,
    multiplier: 1.0
  },
  'budovani-vztahu': {
    nazev: 'Systematická péče o partnery a network',
    typ: 'vydelava',
    popis: 'AI sleduje, s kým ses dlouho neslyšel, připraví personalizovanou zprávu nebo nabídku. Vztahy se neudržují samy — teď je za tebe pohlídá systém.',
    prinese_kc_pct_obratu: 0.02,
    multiplier: 1.0
  },
  'analyza-cisel': {
    nazev: 'AI analytika vlastních dat a trendů',
    typ: 'vydelava',
    popis: 'AI pravidelně prochází tvoje čísla a hledá příležitosti — nejziskovější segmenty, klesající marže, neobjevené vzorce. Rozhoduješ podle dat, ne pocitu.',
    prinese_kc_pct_obratu: 0.018,
    multiplier: 1.0
  },
  'aktivni-osloveni': {
    nazev: 'Aktivní akvizice — emaily, LinkedIn, outbound',
    typ: 'vydelava',
    popis: 'AI hledá relevantní firmy, píše personalizované zprávy a hlídá odpovědi. Místo nárazové akvizice máš stabilní příliv leadů každý týden.',
    prinese_kc_pct_obratu: 0.04,
    multiplier: 1.0
  },
  'stavajici-klienti': {
    nazev: 'Systematické dotahování stávajících klientů',
    typ: 'vydelava',
    popis: 'Většina firem vydělá víc na stávajících klientech než na nových. AI sleduje, kdo dlouho neobjednal nebo by potřeboval víc — a automaticky pošle nabídku.',
    prinese_kc_pct_obratu: 0.075,
    multiplier: 1.0
  },
  'strategie-planovani': {
    nazev: 'AI pro strategické plánování a vývoj',
    typ: 'vydelava',
    popis: 'AI ti pomůže držet strategii nahoře — sleduje, co se děje v oboru, hlídá tvoje cíle, připomíná priority. Operativa tě přestane požírat.',
    prinese_kc_pct_obratu: 0.012,
    multiplier: 1.0
  },
  'vyvoj-produktu': {
    nazev: 'AI pro vývoj produktů a služeb',
    typ: 'vydelava',
    popis: 'Validace nápadů, prototypování, testování trhu — AI ti zkrátí cestu od nápadu k prodeji o měsíce. Méně rizika, rychlejší launch.',
    prinese_kc_pct_obratu: 0.025,
    multiplier: 1.0
  },
  'vzdelavani': {
    nazev: 'Personalizované vzdělávání týmu',
    typ: 'vydelava',
    popis: 'AI tutor pro tým — školí na míru, hlídá pokrok, odpovídá na otázky. Lidé rostou rychleji a ty nemusíš řešit, kdo umí co.',
    prinese_kc_pct_obratu: 0.01,
    multiplier: 1.0
  }
};

function spocitejVysledek(odpovedi) {
  const {
    firma_jmeno = 'tvoji firmu',
    role,           // q1
    velikost_tymu,  // q2
    odvetvi,        // q3
    kde_tlaci_cas = [],      // q4 (1-3)
    co_chybi_cas = [],       // q5 (1-3)
    hodiny_tydne,            // q6
    sazba,                   // q7
    obrat,                   // q8
    kapacita,                // q8
    ai_zkusenost,            // q9
    co_nejvic_brzdi          // q10
  } = odpovedi;

  // Základní vstupy
  const hodinyRocne = (HODINY_RANGE[hodiny_tydne] || 20) * 50; // 50 prac. týdnů
  const sazbaKc = SAZBA_RANGE[sazba] || 800;
  const obratMesic = OBRAT_RANGE[obrat] ?? 300000;
  const kapacitaPct = KAPACITA_USLY[kapacita] ?? 0.80;
  const aiUspora = AI_USPORA_HODIN[ai_zkusenost] || 0.30;

  // Kolik měsíčně utíká kvůli neoptimální kapacitě
  const utikaMesic = obratMesic ? Math.round(obratMesic * (1 - kapacitaPct) / kapacitaPct) : 0;

  // Vyber Top 3 AI systémy
  const kandidati = [];

  // Z "kde tlačí čas" → systémy typu "šetří čas"
  kde_tlaci_cas.forEach(klic => {
    if (AI_SYSTEMY_KATALOG[klic]) {
      kandidati.push({ ...AI_SYSTEMY_KATALOG[klic], klic, priorita: 1 });
    }
  });

  // Z "co chybí dělat víc" → systémy typu "vydělává"
  co_chybi_cas.forEach(klic => {
    if (AI_SYSTEMY_KATALOG[klic]) {
      kandidati.push({ ...AI_SYSTEMY_KATALOG[klic], klic, priorita: 2 });
    }
  });

  // Pokud má málo kandidátů, doplň defaulty
  if (kandidati.length < 3) {
    const fallback = ['stavajici-klienti', 'aktivni-osloveni', 'provoz-administrativa', 'komunikace-klienti'];
    fallback.forEach(klic => {
      if (kandidati.length < 3 && !kandidati.find(k => k.klic === klic)) {
        kandidati.push({ ...AI_SYSTEMY_KATALOG[klic], klic, priorita: 3 });
      }
    });
  }

  // Spočítej hodnotu každého systému
  const systemyVyhodnocene = kandidati.slice(0, 3).map((sys, idx) => {
    let usetri_h_mesic = 0;
    let prinese_kc_mesic = 0;
    let usetri_kc_mesic = 0;

    if (sys.typ === 'setri-cas') {
      const mesicniHodiny = (HODINY_RANGE[hodiny_tydne] || 20) * 4.33;
      usetri_h_mesic = Math.round(mesicniHodiny * sys.usetri_h * aiUspora);
      usetri_kc_mesic = Math.round(usetri_h_mesic * sazbaKc);
    } else {
      // vydělává
      prinese_kc_mesic = Math.round((obratMesic || 300000) * sys.prinese_kc_pct_obratu);
    }

    return {
      poradi: idx + 1,
      nazev: sys.nazev,
      typ: sys.typ,
      popis: sys.popis,
      usetri_h_mesic,
      usetri_kc_mesic,
      prinese_kc_mesic
    };
  });

  // Souhrn
  const celkem_h_mesic = systemyVyhodnocene.reduce((s, x) => s + (x.usetri_h_mesic || 0), 0);
  const celkem_usetri_kc = systemyVyhodnocene.reduce((s, x) => s + (x.usetri_kc_mesic || 0), 0);
  const celkem_prinese_kc = systemyVyhodnocene.reduce((s, x) => s + (x.prinese_kc_mesic || 0), 0);
  const celkovy_dopad_mesic = celkem_usetri_kc + celkem_prinese_kc;
  const dopad_rok = celkovy_dopad_mesic * 12;

  // Návratnost investice (předpoklad: implementace ~50-150k Kč)
  const odhadInvestice = 80000;
  const navratnost_mesicu = celkovy_dopad_mesic > 0
    ? Math.max(1, Math.round(odhadInvestice / celkovy_dopad_mesic))
    : 12;

  return {
    firma_jmeno,
    soucasny_stav: {
      obrat_mesic: obratMesic,
      naplneni_kapacity_pct: Math.round(kapacitaPct * 100),
      utika_mesic: utikaMesic
    },
    aios_potencial: {
      usetrenych_h_mesic: celkem_h_mesic,
      dopad_rok,
      navratnost_mesicu
    },
    co_ai_vrati: {
      usetrene_h: celkem_h_mesic,
      usetri_kc: celkem_usetri_kc,
      prinese_navic: celkem_prinese_kc,
      celkovy_dopad: celkovy_dopad_mesic,
      za_rok: dopad_rok
    },
    top3_systemy: systemyVyhodnocene
  };
}

// ============ API ROUTES ============
app.post('/api/submit', (req, res) => {
  try {
    const odpovedi = req.body;
    const vysledek = spocitejVysledek(odpovedi);

    const record = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
      created_at: new Date().toISOString(),
      firma_jmeno: odpovedi.firma_jmeno || null,
      email: odpovedi.email || null,
      telefon: odpovedi.telefon || null,
      chce_konzultaci: !!odpovedi.chce_konzultaci,
      ip: req.ip,
      odpovedi,
      vysledek
    };
    saveSubmission(record);

    // Pošli emaily na pozadí (neblokuj response)
    sendPlan(odpovedi, vysledek, record.id).catch(err => {
      console.error('sendPlan failed:', err);
    });

    res.json({ ok: true, id: record.id, vysledek });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/calculate', (req, res) => {
  try {
    const vysledek = spocitejVysledek(req.body);
    res.json({ ok: true, vysledek });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Admin endpoint — jednoduchý přehled (chráněný query keyem)
app.get('/api/admin/submissions', (req, res) => {
  const adminKey = process.env.ADMIN_KEY || 'zmen-mne';
  if (req.query.key !== adminKey) return res.status(401).json({ error: 'unauthorized' });
  const rows = loadSubmissions(500);
  res.json(rows);
});

app.get('/api/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Public config — frontend si načte runtime hodnoty (URL, atd.)
app.get('/api/config', (_, res) => {
  res.json({
    bookingUrl: process.env.BOOKING_URL || 'https://cal.com/digitalizujem'
  });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✓ Digitalizujem AI kvíz běží na http://localhost:${PORT}`);
});
