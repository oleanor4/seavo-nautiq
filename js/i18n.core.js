(function(){
  const FLAG_URL = code => `https://flagcdn.com/w40/${code}.png`;
  const LANG_DEFAULT = 'en';
  const STORAGE_KEY = 'seavo_lang';

  // Gjeldende språk deles via localStorage
  window.SEAVO_LANG = localStorage.getItem(STORAGE_KEY) || LANG_DEFAULT;

  // Hent tekst
  function t(key, fallback){
    const dict = (window.I18N_DICTIONARIES||{})[window.SEAVO_LANG] || {};
    return dict[key] ?? fallback ?? key;
  }
  window.t = t;

  // Anvend data-i18n-attributter
  function applyTranslations(root=document){
    root.querySelectorAll('[data-i18n]').forEach(el=>{
      el.textContent = t(el.getAttribute('data-i18n'), el.textContent);
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder'), el.getAttribute('placeholder')));
    });
    root.querySelectorAll('[data-i18n-title]').forEach(el=>{
      el.setAttribute('title', t(el.getAttribute('data-i18n-title'), el.getAttribute('title')));
    });
    root.querySelectorAll('[data-i18n-aria]').forEach(el=>{
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'), el.getAttribute('aria-label')));
    });
  }
  window.applyTranslations = applyTranslations;

  // Språkvelger-UI
  window.toggleDropdown = function(){
    document.getElementById('language-dropdown')?.classList.toggle('open');
  };

  // NB: bruk språkkoder ('en','no', 'is','ru','zh','es','pt'), ikke navn
  window.selectLanguage = function(langCode, flagCode){
    window.SEAVO_LANG = langCode || LANG_DEFAULT;
    localStorage.setItem(STORAGE_KEY, window.SEAVO_LANG);
    document.documentElement.lang = window.SEAVO_LANG;

    const img = document.getElementById('selected-flag');
    if(img && flagCode) img.src = FLAG_URL(flagCode);
    const lbl = document.getElementById('selected-lang-label');
    if(lbl) lbl.textContent = (window.I18N_DICTIONARIES[window.SEAVO_LANG]?.["lang.name"]) || window.SEAVO_LANG;

    document.getElementById('language-dropdown')?.classList.remove('open');

    // (1) Oversett statiske noder
    applyTranslations(document);

    // (2) Rerender dynamisk innhold (tabell/global view) for å få riktig språk og spacing
    try{
      if (typeof isGlobalView !== 'undefined' && isGlobalView && typeof showGlobalOverview === 'function') {
        showGlobalOverview();
      } else if (typeof showCategory === 'function') {
        showCategory();
      }
      // oppdater top-knappen også
      const btn = document.getElementById("globalToggleButton");
      if(btn){
        btn.textContent = isGlobalView ? t("btn.backToTable","🔙 Back to control table")
                                       : t("btn.globalOverview","📋 Global Overview");
      }
    }catch(_e){ /* stille */ }

    // Varsle andre faner/sider
    try{ localStorage.setItem('seavo_lang_broadcast', Date.now().toString()); }catch{}
  };

  // Lukk dropdown ved klikk utenfor
  document.addEventListener('click', (e)=>{
    const dd = document.getElementById('language-dropdown');
    const btn = document.getElementById('language-btn');
    if(!dd || !btn) return;
    if(dd.contains(e.target) || btn.contains(e.target)) return;
    dd.classList.remove('open');
  });

  // Init på hver side
  document.addEventListener('DOMContentLoaded', ()=>{
    document.documentElement.lang = window.SEAVO_LANG;

    // Hvis siden har språkknapp, oppdater flagg/label
    const mapFlag = { en:"gb", no:"no", is:"is", ru:"ru", zh:"cn", es:"es", pt:"pt" };
    const code = mapFlag[window.SEAVO_LANG] || "gb";
    const img = document.getElementById('selected-flag');
    if(img) img.src = FLAG_URL(code);
    const lbl = document.getElementById('selected-lang-label');
    if(lbl) lbl.textContent = (window.I18N_DICTIONARIES[window.SEAVO_LANG]?.["lang.name"]) || window.SEAVO_LANG;

    applyTranslations(document);
  });

  // Reager på endring i annen fane/side
  window.addEventListener('storage', (ev)=>{
    if(ev.key === 'seavo_lang' || ev.key === 'seavo_lang_broadcast'){
      window.SEAVO_LANG = localStorage.getItem(STORAGE_KEY) || LANG_DEFAULT;
      document.documentElement.lang = window.SEAVO_LANG;
      applyTranslations(document);

      // Rerender dynamisk innhold
      try{
        if (typeof isGlobalView !== 'undefined' && isGlobalView && typeof showGlobalOverview === 'function') {
          showGlobalOverview();
        } else if (typeof showCategory === 'function') {
          showCategory();
        }
        const btn = document.getElementById("globalToggleButton");
        if(btn){
          btn.textContent = isGlobalView ? t("btn.backToTable","🔙 Back to control table")
                                         : t("btn.globalOverview","📋 Global Overview");
        }
      }catch(_e){}

      // Oppdater flagg/label hvis knappen finnes
      const mapFlag = { en:"gb", no:"no", is:"ic", ru:"ru", zh:"cn", es:"es", pt:"pt" };
      const code = mapFlag[window.SEAVO_LANG] || "gb";
      const img = document.getElementById('selected-flag');
      if(img) img.src = FLAG_URL(code);
      const lbl = document.getElementById('selected-lang-label');
      if(lbl) lbl.textContent = (window.I18N_DICTIONARIES[window.SEAVO_LANG]?.["lang.name"]) || window.SEAVO_LANG;
    }
  });
})();