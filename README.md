# AI Kvíz · Digitalizujem.cz

Interaktivní 10-otázkový kvíz, který návštěvníkovi ukáže potenciál AI v jeho firmě — kolik hodin a peněz mu AI měsíčně vrátí, plus Top 3 doporučené systémy na míru.

Kompletní řešení = frontend (HTML/CSS/JS, particle background, parallax, count-up) + Express backend se SQLite úložištěm odpovědí.

---

## 📁 Struktura

```
ai-kviz/
├── package.json
├── server/
│   └── index.js            # Express + SQLite + výpočetní logika
├── public/
│   ├── index.html
│   ├── css/main.css        # Design systém (dark + teal akcent)
│   └── js/
│       ├── particles.js    # Particle network background
│       ├── quiz-data.js    # Definice 10 otázek
│       └── main.js         # Stav kvízu, render, animace
├── data/
│   └── kviz.db             # SQLite — vytvoří se sama
└── .env                    # Konfigurace
```

---

## 🚀 Lokální spuštění

```bash
# 1. Nainstaluj závislosti
npm install

# 2. Spusť server
npm start

# Otevři v prohlížeči:
# http://localhost:3000
```

---

## 🌍 Nasazení na produkci

### Varianta A — Railway / Render / Fly.io (nejjednodušší)

1. Pushni složku do GitHub repa.
2. Na Railway/Render → "New Project" → "Deploy from GitHub".
3. Nastav:
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: `PORT` automaticky, `ADMIN_KEY=tvuj-tajny-klic`
4. Po deployi dostaneš URL typu `tvuj-projekt.up.railway.app`.

### Varianta B — VPS (Hetzner, Contabo apod.)

```bash
# Na serveru:
git clone <tvuj-repo>
cd ai-kviz
npm install
npm install -g pm2
pm2 start server/index.js --name ai-kviz
pm2 save
pm2 startup

# Nginx reverse proxy (zkrácený příklad):
# server {
#   listen 80;
#   server_name analyza.digitalizujem.cz;
#   location / {
#     proxy_pass http://localhost:3000;
#     proxy_set_header Host $host;
#     proxy_set_header X-Real-IP $remote_addr;
#   }
# }

# Pak Let's Encrypt:
certbot --nginx -d analyza.digitalizujem.cz
```

### Napojení na doménu analyza.digitalizujem.cz

**Tvůj plán:** Koupíš si subdoménu `analyza.digitalizujem.cz` a kvíz pojede na ní. Z hlavního webu na ni pak odkážeš.

**DNS nastavení (u registrátora digitalizujem.cz):**

Pokud nasadíš na **Railway/Render** (doporučuji — 5 minut, zdarma):
1. V Railway dashboardu → Settings → Domains → Add custom domain → `analyza.digitalizujem.cz`
2. Railway ti ukáže CNAME hodnotu, např. `tvuj-projekt.up.railway.app`
3. V DNS u digitalizujem.cz přidej:
   ```
   Typ:    CNAME
   Název:  analyza
   Cíl:    tvuj-projekt.up.railway.app
   TTL:    3600
   ```
4. Počkej 5–60 minut na DNS propagaci. Railway sám vystaví SSL certifikát.
5. Hotovo — kvíz běží na `https://analyza.digitalizujem.cz`.

Pokud nasadíš na **VPS**:
```
Typ:    A
Název:  analyza
Cíl:    IP adresa tvého serveru
TTL:    3600
```
A pak na serveru Nginx config (viz níže) + Let's Encrypt:
```bash
certbot --nginx -d analyza.digitalizujem.cz
```

**Z hlavního webu odkaž:**
```html
<a href="https://analyza.digitalizujem.cz">Spusť bezplatnou AI analýzu</a>
```

Nebo to můžeš embednout iframem do hlavní stránky:
```html
<iframe src="https://analyza.digitalizujem.cz" style="width:100%; height:1400px; border:0; border-radius:12px;"></iframe>
```

---

## 📊 Admin přehled odpovědí

Všechny odpovědi se ukládají do `data/submissions.jsonl` (jeden záznam = jeden řádek JSON).
Žádná databáze není potřeba, žádné native závislosti — funguje na Vercelu, Railway, Render i obyčejném VPS.

```bash
# Stáhnout všechny odpovědi přes API:
curl "https://analyza.digitalizujem.cz/api/admin/submissions?key=tvuj-tajny-klic"

# Nebo přímo ze souboru:
cat data/submissions.jsonl | jq .
```

**Pokud později přejdeš na SQL databázi**, stačí přepsat dvě funkce v `server/index.js` — `saveSubmission()` a `loadSubmissions()`. Zbytek aplikace zůstává stejný.

---

## ⚙️ Co lze ladit

### Výpočetní logika (`server/index.js`)
- `HODINY_RANGE`, `SAZBA_RANGE`, `OBRAT_RANGE` — průměrné hodnoty pro jednotlivé výběry
- `AI_USPORA_HODIN` — kolik % manuálních hodin AI typicky ušetří podle úrovně
- `AI_SYSTEMY_KATALOG` — všech 15 doporučených systémů, jejich popisy, výpočet úspor a výnosů
- `spocitejVysledek()` — finální vzorec, návratnost, výběr Top 3

### Otázky (`public/js/quiz-data.js`)
- Můžeš přidávat/odebírat otázky, měnit ikony, popisy
- Pokud přidáš novou otázku, doplň i logiku v `spocitejVysledek()` na backendu

### Vizuál (`public/css/main.css`)
- CSS proměnné na začátku — barvy, fonty, radii
- Particle config v `public/js/particles.js` (počet částic, vzdálenost spojnic, rychlost)

---

## 🔒 Co dořešit před spuštěním

### 1. Cal.com — booking link
1. Založ si účet na [cal.com](https://cal.com) (Free plán stačí)
2. Vytvoř event type „AI Audit — 30 minut" pro Davida
3. Zkopíruj URL (např. `https://cal.com/david-novak/audit`)
4. Vlož ji do `.env` jako `BOOKING_URL=...`

### 2. Resend — emaily na info@digitalizujem.cz
1. Založ účet zdarma na [resend.com](https://resend.com) — Free tier zahrnuje 3 000 emailů/měsíc
2. V dashboardu **Domains** přidej `digitalizujem.cz`
3. Resend ti ukáže DNS záznamy (TXT pro SPF, DKIM, DMARC) — přidej je u registrátora domény
4. Počkej na zelená zaškrtávátka u domény (5–60 minut)
5. V sekci **API Keys** vytvoř nový klíč (typ "Sending access")
6. Vlož klíč do `.env` jako `RESEND_API_KEY=re_xxx...`

**Co Resend posílá:**
- Klientovi (pokud nechá email): krásný HTML email s celým plánem + CTA na Cal.com
- Vám na `info@digitalizujem.cz`: interní notifikace s detaily leadu (firma, email, čísla)

Pokud `RESEND_API_KEY` není nastavený, server běží dál (jen se neposílají emaily) — můžeš nasadit kvíz dřív, než dořešíš email.

### 3. Ostatní
- [ ] Změň `ADMIN_KEY` v `.env` na silný náhodný řetězec
- [ ] GDPR — zvaž přidání zaškrtávátka souhlasu před odesláním (zatím chybí)
- [ ] Otestuj na mobilu

---

## 🤝 Kontakt

V případě dotazů ohledně úprav výpočetní logiky nebo přidání otázek mě kontaktuj.
