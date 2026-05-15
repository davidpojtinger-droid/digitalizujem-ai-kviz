/**
 * KVÍZ — řízení stavu, render otázek, submit, výsledek
 */
(() => {
  const QUIZ = window.QUIZ;
  const TOTAL = QUIZ.length;

  // ============ CONFIG (nahrá se z backendu) ============
  let CONFIG = {
    bookingUrl: 'https://cal.com/digitalizujem'
  };
  fetch('/api/config').then(r => r.json()).then(c => {
    if (c && c.bookingUrl) CONFIG.bookingUrl = c.bookingUrl;
  }).catch(() => {});

  // ============ STATE ============
  const state = {
    screen: 'intro',     // intro | quiz | loading | result
    step: 0,
    answers: {},         // { firma_jmeno, role, velikost_tymu, kde_tlaci_cas: [...], ... }
    result: null
  };

  // ============ DOM HELPERS ============
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  // ============ TOAST ============
  let toastTimer;
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-visible'), 2500);
  }

  // ============ SCREEN SWITCHING ============
  function showScreen(name) {
    $$('.screen').forEach(s => s.classList.remove('is-active'));
    const target = $(`#screen-${name}`);
    if (target) target.classList.add('is-active');
    state.screen = name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============ INTRO ============
  $('#btn-start').addEventListener('click', () => {
    state.step = 0;
    showScreen('quiz');
    renderQuestion();
  });

  // ============ PROGRESS ============
  function renderProgress() {
    const bars = $('#progress-bars');
    bars.innerHTML = '';
    for (let i = 0; i < TOTAL; i++) {
      const b = document.createElement('div');
      b.className = 'bar';
      if (i < state.step) b.classList.add('is-done');
      if (i === state.step) b.classList.add('is-active');
      bars.appendChild(b);
    }

    const q = QUIZ[state.step];
    $('#quiz-section').textContent = q.section;
    $('#quiz-counter').textContent = `OTÁZKA ${state.step + 1} Z ${TOTAL}`;
  }

  // ============ RENDER QUESTION ============
  function renderQuestion() {
    const q = QUIZ[state.step];
    const card = $('#quiz-card');
    renderProgress();

    let html = `
      <div class="q-number">${String(state.step + 1).padStart(2, '0')} / ${String(TOTAL).padStart(2, '0')} · ${q.section}</div>
      <h2 class="q-title">${escapeHtml(q.title)}</h2>
      ${q.help ? `<p class="q-help">${escapeHtml(q.help)}</p>` : ''}
    `;

    if (q.type === 'inputs') {
      html += renderInputs(q);
    } else if (q.type === 'single') {
      html += renderOptionsSingle(q);
    } else if (q.type === 'multi') {
      html += renderOptionsMulti(q);
    } else if (q.type === 'combined') {
      html += renderCombined(q);
    }

    if (q.hint) {
      html += `<div class="q-hint" id="q-hint"><strong>${escapeHtml(q.hint.strong)}</strong>${escapeHtml(q.hint.text)}</div>`;
    }

    html += `<div class="q-error" id="q-error"></div>`;

    card.innerHTML = html;
    card.classList.add('stagger');

    bindOptionEvents(q);
    updateNextButton();

    // Pokud už něco máme uloženo, zobraz to
    restoreSelection(q);

    // Show hint pokud je multi a má min vybraných
    if (q.hint) maybeShowHint(q);
  }

  function renderInputs(q) {
    return `
      <div class="inputs-block">
        ${q.fields.map(f => `
          <div class="input-group">
            <label for="in-${f.key}">${escapeHtml(f.label)}${f.required ? ' *' : ''}</label>
            <input
              id="in-${f.key}"
              type="text"
              data-key="${f.key}"
              placeholder="${escapeHtml(f.placeholder || '')}"
              value="${escapeHtml(state.answers[f.key] || '')}"
              autocomplete="off"
            />
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderOptionsSingle(q) {
    const cols = q.cols ? `cols-${q.cols}` : '';
    return `
      <div class="options-grid ${cols}">
        ${q.options.map(opt => optHtml(opt, q.id, false)).join('')}
      </div>
    `;
  }

  function renderOptionsMulti(q) {
    const cols = q.cols ? `cols-${q.cols}` : '';
    return `
      <div class="options-grid ${cols}">
        ${q.options.map(opt => optHtml(opt, q.id, true)).join('')}
      </div>
    `;
  }

  function optHtml(opt, qid, multi) {
    const variant = multi ? 'checkbox' : 'radio';
    const isCenter = opt.layout === 'center';
    const iconText = opt.icon || '◆';
    const iconLen = String(iconText).length;
    return `
      <button class="opt ${isCenter ? 'opt-center' : ''}" data-variant="${variant}" data-key="${opt.key}" type="button">
        <div class="opt-icon" data-len="${iconLen}">${escapeHtml(iconText)}</div>
        <div class="opt-content">
          <div class="opt-label">${escapeHtml(opt.label)}</div>
          ${opt.desc ? `<div class="opt-desc">${escapeHtml(opt.desc)}</div>` : ''}
        </div>
        <div class="opt-check">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="5 13 10 18 19 7" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </button>
    `;
  }

  function renderCombined(q) {
    return q.subgroups.map(sg => `
      <div class="subgroup">
        <div class="subgroup-title">
          <div class="subgroup-icon">${sg.icon}</div>
          <span>${escapeHtml(sg.title)}</span>
        </div>
        <div class="pills-row">
          ${sg.options.map(opt => `
            <button class="opt-pill" data-subkey="${sg.key}" data-key="${opt.key}" type="button">
              ${escapeHtml(opt.label)}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // ============ BIND EVENTS ============
  function bindOptionEvents(q) {
    if (q.type === 'inputs') {
      $$('.inputs-block input').forEach(inp => {
        inp.addEventListener('input', e => {
          state.answers[e.target.dataset.key] = e.target.value.trim();
          updateNextButton();
        });
      });
      return;
    }

    if (q.type === 'combined') {
      $$('.opt-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          const sub = btn.dataset.subkey;
          const key = btn.dataset.key;
          state.answers[sub] = key;
          $$(`.opt-pill[data-subkey="${sub}"]`).forEach(p => p.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          updateNextButton();
        });
      });
      return;
    }

    if (q.type === 'single') {
      $$('.opt').forEach(btn => {
        btn.addEventListener('click', () => {
          $$('.opt').forEach(b => b.classList.remove('is-selected'));
          btn.classList.add('is-selected');
          state.answers[q.id] = btn.dataset.key;
          updateNextButton();
        });
      });
      return;
    }

    if (q.type === 'multi') {
      if (!Array.isArray(state.answers[q.id])) state.answers[q.id] = [];
      $$('.opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.key;
          const list = state.answers[q.id];
          const idx = list.indexOf(key);
          if (idx >= 0) {
            list.splice(idx, 1);
            btn.classList.remove('is-selected');
          } else {
            if (list.length >= q.max) {
              toast(`Maximálně ${q.max} možnosti.`);
              return;
            }
            list.push(key);
            btn.classList.add('is-selected');
          }
          updateNextButton();
          maybeShowHint(q);
        });
      });
      return;
    }
  }

  // ============ RESTORE SELECTION (zpět na otázku) ============
  function restoreSelection(q) {
    if (q.type === 'single' && state.answers[q.id]) {
      const btn = document.querySelector(`.opt[data-key="${state.answers[q.id]}"]`);
      if (btn) btn.classList.add('is-selected');
    }
    if (q.type === 'multi' && Array.isArray(state.answers[q.id])) {
      state.answers[q.id].forEach(k => {
        const btn = document.querySelector(`.opt[data-key="${k}"]`);
        if (btn) btn.classList.add('is-selected');
      });
    }
    if (q.type === 'combined') {
      q.subgroups.forEach(sg => {
        if (state.answers[sg.key]) {
          const btn = document.querySelector(`.opt-pill[data-subkey="${sg.key}"][data-key="${state.answers[sg.key]}"]`);
          if (btn) btn.classList.add('is-selected');
        }
      });
    }
  }

  function maybeShowHint(q) {
    const hint = $('#q-hint');
    if (!hint || !q.hint) return;
    const arr = state.answers[q.id];
    if (Array.isArray(arr) && arr.length === 3) {
      hint.classList.add('is-visible');
    }
  }

  // ============ VALIDATION + NEXT ============
  function isStepValid() {
    const q = QUIZ[state.step];
    const err = $('#q-error');
    if (err) err.classList.remove('is-visible');

    if (q.type === 'inputs') {
      for (const f of q.fields) {
        if (f.required && !(state.answers[f.key] || '').trim()) return false;
      }
      return true;
    }
    if (q.type === 'single') {
      return !!state.answers[q.id];
    }
    if (q.type === 'multi') {
      const arr = state.answers[q.id];
      return Array.isArray(arr) && arr.length >= (q.min || 1);
    }
    if (q.type === 'combined') {
      return q.subgroups.every(sg => !!state.answers[sg.key]);
    }
    return true;
  }

  function updateNextButton() {
    const btn = $('#btn-next');
    btn.disabled = !isStepValid();

    // Změň label posledního kroku
    const isLast = state.step === TOTAL - 1;
    $('#btn-next-label').textContent = isLast ? 'Hotovo' : 'Pokračovat';
  }

  $('#btn-back').addEventListener('click', () => {
    if (state.step === 0) {
      showScreen('intro');
      return;
    }
    state.step--;
    renderQuestion();
  });

  $('#btn-next').addEventListener('click', () => {
    if (!isStepValid()) {
      const err = $('#q-error');
      err.textContent = 'Vyber prosím odpověď, ať můžeme pokračovat.';
      err.classList.add('is-visible');
      return;
    }

    if (state.step < TOTAL - 1) {
      state.step++;
      renderQuestion();
    } else {
      submitQuiz();
    }
  });

  // ============ SUBMIT ============
  async function submitQuiz() {
    showScreen('loading');
    const startedAt = Date.now();

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state.answers)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Neznámá chyba');
      state.result = data.vysledek;

      // Min 3.2s loading aby animace dohrály
      const elapsed = Date.now() - startedAt;
      const remain = Math.max(0, 3200 - elapsed);
      setTimeout(() => {
        renderResult();
        showScreen('result');
      }, remain);

    } catch (err) {
      toast('Něco se nepodařilo. Zkus to ještě jednou.');
      console.error(err);
      // Fallback: zobraz výsledek z lokálního výpočtu? -> raději vrátíme uživatele zpět
      setTimeout(() => {
        showScreen('quiz');
        renderQuestion();
      }, 1500);
    }
  }

  // ============ RENDER VÝSLEDEK ============
  function renderResult() {
    const v = state.result;
    if (!v) return;

    const f = (n) => {
      if (n == null) return '—';
      return new Intl.NumberFormat('cs-CZ').format(Math.round(n));
    };

    const html = `
      <header class="result-header">
        <div class="dots">
          <span></span><div class="line"></div><span></span><div class="line"></div><span></span>
        </div>
        <h1 class="result-title">
          AI plán pro
          <span class="firma">${escapeHtml(v.firma_jmeno)}</span>
        </h1>
      </header>

      <div class="hero-stats">
        <div class="label">Tvůj AIOS potenciál</div>
        <div class="hero-stats-grid">
          <div class="hero-stat">
            <div class="num" data-count="${v.aios_potencial.usetrenych_h_mesic}" data-suffix=" h">0 h</div>
            <div class="desc">ušetřených/měsíc</div>
          </div>
          <div class="hero-stat">
            <div class="num" data-count="${v.aios_potencial.dopad_rok}" data-suffix=" Kč" data-format="kc">0 Kč</div>
            <div class="desc">dopad/rok</div>
          </div>
          <div class="hero-stat">
            <div class="num" data-count="${v.aios_potencial.navratnost_mesicu}" data-suffix=" měs.">0 měs.</div>
            <div class="desc">návratnost investice</div>
          </div>
        </div>
      </div>

      <div class="section-block">
        <span class="section-label">Tvůj současný stav</span>
        <div class="kv-row">
          <div class="kv-key">Obrat:</div>
          <div class="kv-val">${v.soucasny_stav.obrat_mesic ? f(v.soucasny_stav.obrat_mesic) + ' Kč / měsíc' : 'neuvedeno'}</div>
        </div>
        <div class="kv-row">
          <div class="kv-key">Naplnění kapacity:</div>
          <div class="kv-val">${v.soucasny_stav.naplneni_kapacity_pct} %</div>
        </div>
        <div class="kv-row">
          <div class="kv-key">Co ti měsíčně utíká:</div>
          <div class="kv-val highlight">≈ ${f(v.soucasny_stav.utika_mesic)} Kč / měsíc</div>
        </div>
      </div>

      <div class="section-block highlight">
        <span class="section-label">Co AI vaší firmě každý měsíc vrátí</span>
        <div class="kv-row">
          <div class="kv-key"><span class="ico">H</span> Ušetřené hodiny</div>
          <div class="kv-val">~${v.co_ai_vrati.usetrene_h} h</div>
        </div>
        <div class="kv-row">
          <div class="kv-key"><span class="ico">Kč</span> Ušetří</div>
          <div class="kv-val">≈ ${f(v.co_ai_vrati.usetri_kc)} Kč</div>
        </div>
        <div class="kv-row">
          <div class="kv-key"><span class="ico">+</span> Přinese navíc</div>
          <div class="kv-val">≈ ${f(v.co_ai_vrati.prinese_navic)} Kč</div>
        </div>
        <div class="kv-row totale">
          <div class="kv-key"><span class="ico">Σ</span> Celkový dopad</div>
          <div class="kv-val">≈ ${f(v.co_ai_vrati.celkovy_dopad)} Kč</div>
        </div>
        <div class="section-footer">
          Za rok ≈ <strong>${f(v.co_ai_vrati.za_rok)} Kč</strong> navíc
        </div>
      </div>

      <div class="cta-banner">
        <div class="cta-inner">
          <div class="cta-eyebrow">
            <span class="cta-pulse"></span>
            <span>Další krok</span>
          </div>
          <h3 class="cta-headline">
            Tenhle plán pro <span class="cta-firma">${escapeHtml(v.firma_jmeno)}</span> ti dokážeme<br>
            nasadit za <span class="cta-num">4–8 týdnů</span>.
          </h3>
          <p class="cta-sub">
            Na 30minutovém hovoru s Davidem (obchodní ředitel) projdeme tvé výsledky,
            ujasníme si pořadí systémů a domluvíme se, co konkrétně zrealizujeme jako první.
          </p>

          <ul class="cta-bullets">
            <li><span class="bullet-mark">01</span> Co reálně nasadit jako první (a co počká)</li>
            <li><span class="bullet-mark">02</span> Konkrétní rozpočet a časový plán</li>
            <li><span class="bullet-mark">03</span> Návratnost na tvých číslech</li>
          </ul>

          <div class="cta-actions">
            <a class="cta-result-btn primary" href="${CONFIG.bookingUrl}" target="_blank" rel="noopener">
              <span>Rezervovat hovor s Davidem</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;">
                <path d="M5 12h14M13 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <button class="cta-result-btn secondary" id="btn-email-plan" type="button">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px;">
                <rect x="3" y="5" width="18" height="14" rx="2"/>
                <path d="M3 7l9 6 9-6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Poslat plán emailem</span>
            </button>
          </div>

          <div class="cta-trust">
            <span class="trust-marks">★★★★★</span>
            <span>Hovor je zdarma · Ne každého bereme · Bez závazku</span>
          </div>
        </div>
      </div>

      <div class="top3-section">
        <h2>Top 3 AI systémy pro <span class="firma">${escapeHtml(v.firma_jmeno)}</span></h2>
        <div class="top3-grid">
          ${v.top3_systemy.map(sys => `
            <div class="system-card">
              <div class="card-head">
                <div class="card-num">${sys.poradi}</div>
                <div class="card-pill">${sys.typ === 'setri-cas' ? '+' + f(sys.usetri_kc_mesic) + ' Kč/m' : '+' + f(sys.prinese_kc_mesic) + ' Kč/m'}</div>
              </div>
              <div class="card-tag ${sys.typ === 'setri-cas' ? 'setri' : 'vydelava'}">
                ${sys.typ === 'setri-cas' ? 'Šetří čas' : 'Vydělává'}
              </div>
              <div class="card-title">${escapeHtml(sys.nazev)}</div>
              <div class="card-desc">${escapeHtml(sys.popis)}</div>
              <div class="card-stats">
                ${sys.typ === 'setri-cas' ? `
                  <div class="card-stat-row"><span>Ušetří</span><span>~${sys.usetri_h_mesic} h / měsíc</span></div>
                  <div class="card-stat-row"><span>V Kč</span><span>≈ ${f(sys.usetri_kc_mesic)} Kč / měsíc</span></div>
                ` : `
                  <div class="card-stat-row"><span>Přinese</span><span>≈ ${f(sys.prinese_kc_mesic)} Kč / měsíc</span></div>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="result-disclaimer">
        Odhad na základě tvých odpovědí · Modelováno podle stovek podobných firem · Skutečný dopad upřesníme na konzultaci
      </div>
    `;

    $('#result-content').innerHTML = html;
    $('#result-content').classList.add('stagger');

    // Spusť počítací animaci čísel po malém delay
    setTimeout(animateCountUp, 200);

    // Email plán — handler
    const emailBtn = document.getElementById('btn-email-plan');
    if (emailBtn) {
      emailBtn.addEventListener('click', () => {
        const email = prompt('Na jaký email ti pošleme tvůj AI plán?');
        if (!email || !email.includes('@')) {
          if (email !== null) toast('Zadej prosím platný email.');
          return;
        }
        fetch('/api/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...state.answers, email, chce_plan_emailem: true })
        }).catch(() => {});
        emailBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:18px;height:18px;"><polyline points="5 13 10 18 19 7" stroke-linecap="round" stroke-linejoin="round"/></svg> <span>Odesláno na ' + escapeHtml(email) + '</span>';
        emailBtn.disabled = true;
        toast('Email s plánem dorazí během chvíle.');
      });
    }
  }

  // ============ COUNT-UP ANIMATION ============
  function animateCountUp() {
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const isCurrency = el.dataset.format === 'kc';
      const duration = 1800;
      const start = performance.now();

      function tick(t) {
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        const val = Math.round(target * eased);
        const formatted = isCurrency
          ? new Intl.NumberFormat('cs-CZ').format(val)
          : val;
        el.textContent = formatted + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  // ============ UTIL ============
  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Init
  showScreen('intro');
})();
