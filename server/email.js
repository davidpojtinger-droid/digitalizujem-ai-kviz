/**
 * EMAIL MODUL — odesílání AI plánů přes Resend
 * Pošle krásný HTML email klientovi + interní notifikaci na info@digitalizujem.cz
 */
const { Resend } = require('resend');

const FROM = process.env.EMAIL_FROM || 'Digitalizujem.cz <info@digitalizujem.cz>';
const REPLY_TO = process.env.EMAIL_REPLY_TO || 'info@digitalizujem.cz';
const NOTIFY = process.env.EMAIL_NOTIFY || 'info@digitalizujem.cz';
const BOOKING_URL = process.env.BOOKING_URL || 'https://cal.com/digitalizujem';

let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  console.warn('⚠ RESEND_API_KEY není nastavený — emaily se neposílají.');
}

const fmt = (n) => {
  if (n == null) return '—';
  return new Intl.NumberFormat('cs-CZ').format(Math.round(n));
};

const esc = (s) => {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * HTML šablona emailu — branded, mobile-friendly, inlined CSS
 */
function buildClientEmail(odpovedi, vysledek) {
  const v = vysledek;
  const firma = esc(v.firma_jmeno || 'tvoji firmu');

  const systemyHtml = v.top3_systemy.map(sys => `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 16px;">
      <tr>
        <td style="background:#131a1f; border:1px solid #1f2a30; border-radius:12px; padding:24px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td style="vertical-align:top; padding-bottom:14px;">
                <span style="display:inline-block; padding:6px 12px; background:rgba(107, 78, 255, 0.15); color:#8B6FFF; font-family:'Courier New',monospace; font-size:11px; font-weight:700; letter-spacing:0.1em; border-radius:4px; text-transform:uppercase;">
                  ${sys.poradi}. ${sys.typ === 'setri-cas' ? 'Šetří čas' : 'Vydělává'}
                </span>
              </td>
              <td style="vertical-align:top; text-align:right; padding-bottom:14px;">
                <span style="display:inline-block; padding:6px 14px; background:#2EE8C8; color:#050807; font-weight:700; font-size:14px; border-radius:100px;">
                  ${sys.typ === 'setri-cas' ? '+' + fmt(sys.usetri_kc_mesic) : '+' + fmt(sys.prinese_kc_mesic)} Kč/měs
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-bottom:8px;">
                <h3 style="margin:0; font-family:Arial,sans-serif; font-size:18px; color:#ffffff; line-height:1.3;">
                  ${esc(sys.nazev)}
                </h3>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-bottom:14px;">
                <p style="margin:0; font-family:Arial,sans-serif; font-size:14px; line-height:1.55; color:#a8b3bb;">
                  ${esc(sys.popis)}
                </p>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:14px; border-top:1px solid #1f2a30;">
                ${sys.typ === 'setri-cas' ? `
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-family:Arial,sans-serif; font-size:13px; color:#6c7a82;">Ušetří</td>
                      <td style="font-family:Arial,sans-serif; font-size:13px; color:#ffffff; font-weight:600; text-align:right;">~${sys.usetri_h_mesic} h / měsíc</td>
                    </tr>
                    <tr>
                      <td style="font-family:Arial,sans-serif; font-size:13px; color:#6c7a82; padding-top:6px;">V Kč</td>
                      <td style="font-family:Arial,sans-serif; font-size:13px; color:#ffffff; font-weight:600; text-align:right; padding-top:6px;">≈ ${fmt(sys.usetri_kc_mesic)} Kč / měsíc</td>
                    </tr>
                  </table>
                ` : `
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="font-family:Arial,sans-serif; font-size:13px; color:#6c7a82;">Přinese</td>
                      <td style="font-family:Arial,sans-serif; font-size:13px; color:#ffffff; font-weight:600; text-align:right;">≈ ${fmt(sys.prinese_kc_mesic)} Kč / měsíc</td>
                    </tr>
                  </table>
                `}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `).join('');

  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Tvůj AI plán pro ${firma}</title>
</head>
<body style="margin:0; padding:0; background:#050807; font-family:Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050807;">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px; width:100%;">

        <!-- Logo -->
        <tr>
          <td align="center" style="padding-bottom:32px;">
            <table role="presentation" cellspacing="0" cellpadding="0">
              <tr>
                <td style="vertical-align:middle; padding-right:10px;">
                  <div style="width:28px; height:28px; background:linear-gradient(135deg, #2EE8C8 0%, #6B4EFF 100%); border-radius:6px;"></div>
                </td>
                <td style="vertical-align:middle; font-family:Arial,sans-serif; font-size:16px; font-weight:600; color:#ffffff;">
                  Digitalizujem<span style="color:#2EE8C8;">.</span>cz
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Greeting -->
        <tr>
          <td style="padding-bottom:24px;">
            <p style="margin:0; font-family:Arial,sans-serif; font-size:14px; color:#6c7a82; text-transform:uppercase; letter-spacing:0.15em;">
              Tvůj AI plán
            </p>
            <h1 style="margin:8px 0 0; font-family:Arial,sans-serif; font-size:32px; color:#ffffff; line-height:1.15; font-weight:700; letter-spacing:-0.02em;">
              Ahoj${odpovedi.role ? ' ' + esc(odpovedi.role) : ''},<br>
              tady je plán pro <span style="color:#2EE8C8;">${firma}</span>.
            </h1>
          </td>
        </tr>

        <!-- Hero stats -->
        <tr>
          <td style="padding-bottom:32px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg, rgba(46,232,200,0.05) 0%, rgba(15,21,25,0.6) 50%, rgba(107,78,255,0.06) 100%); border:1px solid rgba(46,232,200,0.35); border-radius:18px;">
              <tr>
                <td style="padding:32px 24px; text-align:center;">
                  <p style="margin:0 0 20px; font-family:'Courier New',monospace; font-size:11px; color:#2EE8C8; letter-spacing:0.2em; text-transform:uppercase;">
                    AIOS potenciál
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="33%" align="center" style="padding:0 8px;">
                        <div style="font-family:Arial,sans-serif; font-size:36px; font-weight:700; color:#2EE8C8; line-height:1;">
                          ${v.aios_potencial.usetrenych_h_mesic} h
                        </div>
                        <div style="font-family:Arial,sans-serif; font-size:12px; color:#6c7a82; margin-top:6px;">
                          ušetřených/měsíc
                        </div>
                      </td>
                      <td width="34%" align="center" style="padding:0 8px;">
                        <div style="font-family:Arial,sans-serif; font-size:36px; font-weight:700; color:#8B6FFF; line-height:1;">
                          ${fmt(v.aios_potencial.dopad_rok)} Kč
                        </div>
                        <div style="font-family:Arial,sans-serif; font-size:12px; color:#6c7a82; margin-top:6px;">
                          dopad / rok
                        </div>
                      </td>
                      <td width="33%" align="center" style="padding:0 8px;">
                        <div style="font-family:Arial,sans-serif; font-size:36px; font-weight:700; color:#2EE8C8; line-height:1;">
                          ${v.aios_potencial.navratnost_mesicu} měs.
                        </div>
                        <div style="font-family:Arial,sans-serif; font-size:12px; color:#6c7a82; margin-top:6px;">
                          návratnost
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Co AI vrátí -->
        <tr>
          <td style="padding-bottom:24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#131a1f; border:1px solid #1f2a30; border-radius:18px;">
              <tr>
                <td style="padding:28px;">
                  <p style="margin:0 0 18px; font-family:'Courier New',monospace; font-size:11px; color:#2EE8C8; letter-spacing:0.2em; text-transform:uppercase;">
                    Co AI vaší firmě každý měsíc vrátí
                  </p>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr style="border-bottom:1px solid #1f2a30;">
                      <td style="padding:12px 0; font-family:Arial,sans-serif; font-size:14px; color:#a8b3bb;">Ušetřené hodiny</td>
                      <td style="padding:12px 0; font-family:Arial,sans-serif; font-size:14px; color:#ffffff; font-weight:600; text-align:right;">~${v.co_ai_vrati.usetrene_h} h</td>
                    </tr>
                    <tr style="border-bottom:1px solid #1f2a30;">
                      <td style="padding:12px 0; font-family:Arial,sans-serif; font-size:14px; color:#a8b3bb;">Ušetří</td>
                      <td style="padding:12px 0; font-family:Arial,sans-serif; font-size:14px; color:#ffffff; font-weight:600; text-align:right;">≈ ${fmt(v.co_ai_vrati.usetri_kc)} Kč</td>
                    </tr>
                    <tr style="border-bottom:1px solid #1f2a30;">
                      <td style="padding:12px 0; font-family:Arial,sans-serif; font-size:14px; color:#a8b3bb;">Přinese navíc</td>
                      <td style="padding:12px 0; font-family:Arial,sans-serif; font-size:14px; color:#ffffff; font-weight:600; text-align:right;">≈ ${fmt(v.co_ai_vrati.prinese_navic)} Kč</td>
                    </tr>
                    <tr>
                      <td style="padding:16px 0 0; font-family:Arial,sans-serif; font-size:15px; color:#ffffff; font-weight:600;">Celkový dopad</td>
                      <td style="padding:16px 0 0; font-family:Arial,sans-serif; font-size:20px; color:#2EE8C8; font-weight:700; text-align:right;">≈ ${fmt(v.co_ai_vrati.celkovy_dopad)} Kč</td>
                    </tr>
                  </table>
                  <p style="margin:18px 0 0; padding:14px 0 0; border-top:1px solid #1f2a30; font-family:Arial,sans-serif; font-size:14px; color:#a8b3bb; text-align:center;">
                    Za rok ≈ <strong style="color:#2EE8C8;">${fmt(v.co_ai_vrati.za_rok)} Kč</strong> navíc
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Top 3 systémy -->
        <tr>
          <td style="padding:8px 0 24px;">
            <h2 style="margin:0 0 20px; font-family:Arial,sans-serif; font-size:24px; color:#ffffff; font-weight:600; letter-spacing:-0.01em;">
              Top 3 AI systémy pro <span style="color:#2EE8C8;">${firma}</span>
            </h2>
            ${systemyHtml}
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding-bottom:24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg, rgba(46,232,200,0.06) 0%, rgba(15,21,25,0.7) 50%, rgba(107,78,255,0.10) 100%); border:1px solid rgba(46,232,200,0.35); border-radius:18px;">
              <tr>
                <td style="padding:36px 28px; text-align:center;">
                  <p style="margin:0 0 12px; display:inline-block; padding:8px 16px; font-family:'Courier New',monospace; font-size:11px; color:#8B6FFF; letter-spacing:0.2em; text-transform:uppercase; border:1px solid rgba(107,78,255,0.3); border-radius:100px; background:rgba(107,78,255,0.10);">
                    Další krok
                  </p>
                  <h3 style="margin:12px 0 16px; font-family:Arial,sans-serif; font-size:22px; color:#ffffff; line-height:1.3; font-weight:600;">
                    Tenhle plán pro <span style="color:#2EE8C8;">${firma}</span> ti dokážeme nasadit za <span style="color:#8B6FFF;">4–8 týdnů</span>.
                  </h3>
                  <p style="margin:0 0 24px; font-family:Arial,sans-serif; font-size:15px; color:#a8b3bb; line-height:1.6;">
                    Na 30minutovém hovoru s Davidem (obchodní ředitel) projdeme tvé výsledky,
                    ujasníme si pořadí systémů a domluvíme se, co konkrétně zrealizujeme jako první.
                  </p>
                  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                    <tr>
                      <td>
                        <a href="${BOOKING_URL}" style="display:inline-block; padding:16px 32px; background:linear-gradient(135deg, #2EE8C8 0%, #8B6FFF 100%); color:#050807; font-family:Arial,sans-serif; font-size:15px; font-weight:700; text-decoration:none; border-radius:100px;">
                          Rezervovat hovor s Davidem →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:20px 0 0; font-family:Arial,sans-serif; font-size:12px; color:#6c7a82;">
                    Hovor je zdarma · Bez závazku
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:24px 0;">
            <p style="margin:0; font-family:Arial,sans-serif; font-size:12px; color:#6c7a82; line-height:1.6;">
              Odhad na základě tvých odpovědí · Modelováno podle stovek podobných firem<br>
              Pokud máš dotaz, odpověz na tento email — čte ho David osobně.<br><br>
              <span style="color:#4a5560;">Digitalizujem.cz · Nepracuj trdě, podnikej chytře.</span>
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/**
 * Interní notifikace na info@digitalizujem.cz
 */
function buildInternalEmail(odpovedi, vysledek, recordId) {
  const v = vysledek;
  const obrat = odpovedi.obrat ? `${odpovedi.obrat}` : 'neuvedeno';
  const kapacita = odpovedi.kapacita || 'neuvedeno';

  return `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif; max-width:600px; margin:auto; padding:20px;">
  <h2 style="color:#6B4EFF; margin:0 0 16px;">🎯 Nový lead z AI kvízu</h2>
  <p style="color:#666; margin:0 0 24px;">ID: ${recordId}</p>

  <h3 style="color:#14B09A;">Firma</h3>
  <table cellpadding="6" style="width:100%; border-collapse:collapse;">
    <tr><td style="border-bottom:1px solid #eee;"><b>Jméno firmy</b></td><td style="border-bottom:1px solid #eee;">${esc(odpovedi.firma_jmeno || '—')}</td></tr>
    <tr><td style="border-bottom:1px solid #eee;"><b>Role</b></td><td style="border-bottom:1px solid #eee;">${esc(odpovedi.role || '—')}</td></tr>
    <tr><td style="border-bottom:1px solid #eee;"><b>Velikost týmu</b></td><td style="border-bottom:1px solid #eee;">${esc(odpovedi.velikost_tymu || '—')}</td></tr>
    <tr><td style="border-bottom:1px solid #eee;"><b>Odvětví</b></td><td style="border-bottom:1px solid #eee;">${esc(odpovedi.odvetvi || '—')}</td></tr>
    <tr><td style="border-bottom:1px solid #eee;"><b>Email</b></td><td style="border-bottom:1px solid #eee;"><a href="mailto:${esc(odpovedi.email || '')}">${esc(odpovedi.email || 'neuveden')}</a></td></tr>
  </table>

  <h3 style="color:#14B09A; margin-top:24px;">Ekonomika</h3>
  <table cellpadding="6" style="width:100%; border-collapse:collapse;">
    <tr><td style="border-bottom:1px solid #eee;"><b>Obrat / měs</b></td><td style="border-bottom:1px solid #eee;">${esc(obrat)} (≈ ${fmt(v.soucasny_stav.obrat_mesic)} Kč)</td></tr>
    <tr><td style="border-bottom:1px solid #eee;"><b>Naplnění kapacity</b></td><td style="border-bottom:1px solid #eee;">${esc(kapacita)} (${v.soucasny_stav.naplneni_kapacity_pct} %)</td></tr>
    <tr><td style="border-bottom:1px solid #eee;"><b>Hodiny/týden</b></td><td style="border-bottom:1px solid #eee;">${esc(odpovedi.hodiny_tydne || '—')}</td></tr>
    <tr><td style="border-bottom:1px solid #eee;"><b>Sazba</b></td><td style="border-bottom:1px solid #eee;">${esc(odpovedi.sazba || '—')}</td></tr>
    <tr><td style="border-bottom:1px solid #eee;"><b>AI úroveň</b></td><td style="border-bottom:1px solid #eee;">${esc(odpovedi.ai_zkusenost || '—')}</td></tr>
    <tr><td style="border-bottom:1px solid #eee;"><b>Co brzdí</b></td><td style="border-bottom:1px solid #eee;">${esc(odpovedi.co_nejvic_brzdi || '—')}</td></tr>
  </table>

  <h3 style="color:#14B09A; margin-top:24px;">Vypočtený potenciál</h3>
  <ul>
    <li><b>Ušetřených hodin/měsíc:</b> ${v.aios_potencial.usetrenych_h_mesic} h</li>
    <li><b>Dopad/rok:</b> ${fmt(v.aios_potencial.dopad_rok)} Kč</li>
    <li><b>Návratnost:</b> ${v.aios_potencial.navratnost_mesicu} měs.</li>
  </ul>

  <h3 style="color:#14B09A;">Top 3 doporučené systémy</h3>
  <ol>
    ${v.top3_systemy.map(s => `<li><b>${esc(s.nazev)}</b> — ${s.typ === 'setri-cas' ? '+' + fmt(s.usetri_kc_mesic) : '+' + fmt(s.prinese_kc_mesic)} Kč/měs</li>`).join('')}
  </ol>

  <p style="margin-top:32px; padding:16px; background:#f5f5ff; border-radius:8px; color:#333;">
    <b>Doporučená rychlá akce:</b> ${odpovedi.email
      ? 'Klient nechal email — pošli mu osobní reply do 24 h.'
      : 'Klient nenechal email — sleduj data a podívej se po follow-upu.'}
  </p>
</body></html>`;
}

/**
 * Veřejná funkce — pošli klientovi plán a interní notifikaci
 */
async function sendPlan(odpovedi, vysledek, recordId) {
  if (!resend) {
    console.warn('Resend není nastavený, email nelze odeslat.');
    return { sent: false, reason: 'no_resend_key' };
  }

  const results = { sent: false, client: null, internal: null };

  // Email klientovi (pokud má email)
  if (odpovedi.email && odpovedi.email.includes('@')) {
    try {
      const r = await resend.emails.send({
        from: FROM,
        to: odpovedi.email,
        replyTo: REPLY_TO,
        subject: `Tvůj AI plán pro ${odpovedi.firma_jmeno || 'tvoji firmu'}`,
        html: buildClientEmail(odpovedi, vysledek)
      });
      results.client = { ok: true, id: r.data?.id };
      results.sent = true;
    } catch (err) {
      console.error('Resend client email error:', err);
      results.client = { ok: false, error: err.message };
    }
  }

  // Interní notifikace na info@
  try {
    const r = await resend.emails.send({
      from: FROM,
      to: NOTIFY,
      replyTo: odpovedi.email || REPLY_TO,
      subject: `🎯 Lead: ${odpovedi.firma_jmeno || 'neznámá firma'} (${fmt(vysledek.aios_potencial.dopad_rok)} Kč/rok)`,
      html: buildInternalEmail(odpovedi, vysledek, recordId)
    });
    results.internal = { ok: true, id: r.data?.id };
  } catch (err) {
    console.error('Resend internal email error:', err);
    results.internal = { ok: false, error: err.message };
  }

  return results;
}

module.exports = { sendPlan };
