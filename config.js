// Die einzigen Angaben, die später eingetragen werden müssen. Leer = Platzhalter wird angezeigt.
window.VOXMIRA = {
  // Store-ID aus dem Partner Center (beginnt mit 9, 12 Zeichen) – dann zeigt der Knopf auf den Store
  storeId: '',
  // Support-E-Mail (zuerst Gmail, später eigene Adresse)
  supportEmail: 'support.voxmira.app@gmail.com',
};

// ---- ab hier nichts ändern ----
(function () {
  const C = window.VOXMIRA;
  const root = document.documentElement;

  // Sprache: gespeicherte Wahl, sonst Browser-Sprache
  let lang = 'de';
  try { lang = localStorage.getItem('voxmira-lang') || ''; } catch (e) { lang = ''; }
  if (lang !== 'de' && lang !== 'en') lang = 'en';   // Englisch zuerst (Nutzer, 26.11.2026), Deutsch nur per Knopf
  root.dataset.lang = lang;
  root.lang = lang;

  window.setLang = function (l) {
    root.dataset.lang = l;
    root.lang = l;
    try { localStorage.setItem('voxmira-lang', l); } catch (e) { /* egal */ }
    fill();
  };

  function fill() {
    const en = root.dataset.lang === 'en';
    document.querySelectorAll('[data-store]').forEach(a => {
      if (C.storeId) {
        a.href = 'https://apps.microsoft.com/detail/' + C.storeId;
        a.classList.remove('soon');
      } else {
        a.removeAttribute('href');
        a.classList.add('soon');
      }
    });
    document.querySelectorAll('[data-store-label]').forEach(el => {
      el.textContent = C.storeId
        ? (en ? 'Get it from Microsoft Store' : 'Im Microsoft Store holen')
        : (en ? 'Coming soon to Microsoft Store' : 'Bald im Microsoft Store');
    });
    document.querySelectorAll('[data-mail]').forEach(el => {
      if (C.supportEmail) {
        el.textContent = C.supportEmail;
        if (el.tagName === 'A') el.href = 'mailto:' + C.supportEmail;
      } else {
        el.textContent = en ? '[support email]' : '[Support-E-Mail]';
        el.removeAttribute('href');
      }
    });
  }
  document.addEventListener('DOMContentLoaded', fill);
})();
