// ===== Seavo Nautiq – Core (Local Storage) =====
const SN_KEYS = {
  session: 'SN_session',            // { userId, fleetId? }
  user: 'SN_user',                  // { fullName, email, phone?, language, createdAtISO }
  vessel: 'SN_vessel',              // { vesselName, callSign?, language }
  subscription: 'SN_subscription',  // { plan: 'monthly'|'annual', trialStartISO }
  fleets: 'SN_fleets'               // { [fleetId]: { fleetId, name, pinHash, ownerUserId, vessels: { [userId]: { vesselName, callSign, language } }, voyages: { [userId]: [voyageObj] } } }
};

// --- Session & basic utils ---
(function ensureUserId(){
  const s = JSON.parse(localStorage.getItem(SN_KEYS.session) || '{}');
  if(!s.userId){
    s.userId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `u-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SN_KEYS.session, JSON.stringify(s));
  }
})();
function getSession(){ return JSON.parse(localStorage.getItem(SN_KEYS.session) || '{}'); }
function setSession(upd){ localStorage.setItem(SN_KEYS.session, JSON.stringify({ ...getSession(), ...upd })); }

function getUser(){ return JSON.parse(localStorage.getItem(SN_KEYS.user) || 'null'); }
function setUser(u){ localStorage.setItem(SN_KEYS.user, JSON.stringify(u)); }

function getVessel(){ return JSON.parse(localStorage.getItem(SN_KEYS.vessel) || 'null'); }
function setVessel(v){ localStorage.setItem(SN_KEYS.vessel, JSON.stringify(v)); }

function getSub(){ return JSON.parse(localStorage.getItem(SN_KEYS.subscription) || 'null'); }
function setSub(s){ localStorage.setItem(SN_KEYS.subscription, JSON.stringify(s)); }

function getFleets(){ return JSON.parse(localStorage.getItem(SN_KEYS.fleets) || '{}'); }
function setFleets(f){ localStorage.setItem(SN_KEYS.fleets, JSON.stringify(f)); }

// --- Helpers ---
function isEmail(x){ return /.+@.+\..+/.test(x); }
function daysBetween(a,b){ const d=24*60*60*1000; return Math.floor((b-a)/d); }
function addDays(iso, n){ return new Date(new Date(iso).getTime() + n*86400000); }

// Trial: 30 dager fra trialStartISO
function getTrialStatus(){
  const sub = getSub();
  if(!(sub && sub.trialStartISO)) return { inTrial:false, daysLeft:0, trialEnd:null };
  const now = new Date();
  const start = new Date(sub.trialStartISO);
  const end = addDays(sub.trialStartISO, 30);
  const inTrial = now < end;
  const daysLeft = Math.max(0, 30 - daysBetween(start, now));
  return { inTrial, daysLeft, trialEnd:end };
}

function applyLanguage(lang){
  // Enkel baseline – sett lang-attributt. Koble senere til faktiske i18n-tekster.
  document.documentElement.setAttribute('lang', lang || 'en');
}

function formatCallSign(cs){ return cs ? cs.toUpperCase() : ''; }

// --- Registration gate check ---
function isRegistered(){
  const u = getUser();
  const v = getVessel();
  // Krav: navn + epost + fartøyets navn (kallesignal valgfritt)
  return !!(u && u.fullName && isEmail(u.email) && v && v.vesselName);
}

// ===== Hash (med fallback hvis crypto.subtle ikke er tilgjengelig) =====
async function sha256Hex(text){
  if (window.crypto && window.crypto.subtle) {
    const enc = new TextEncoder().encode(String(text));
    const buf = await window.crypto.subtle.digest('SHA-256', enc);
    return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
  } else {
    // Dev-fallback (IKKE sikker): kort hash bare for å unngå feil i file://
    let h = 0; const s = String(text);
    for (let i=0;i<s.length;i++){ h = ((h<<5)-h) + s.charCodeAt(i); h |= 0; }
    return ('fallback-' + (h>>>0).toString(16).padStart(8,'0'));
  }
}

// ===== Fleets (Rederi) API =====
async function createFleet(fleetName, pin){
  const { userId } = getSession();
  const pinHash = await sha256Hex(String(pin||''));
  const fleetId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `f-${Math.random().toString(36).slice(2)}`;
  const fleets = getFleets();
  fleets[fleetId] = { fleetId, name: fleetName, pinHash, ownerUserId: userId, vessels: {}, voyages: {} };
  setFleets(fleets);
  setSession({ fleetId });
  return fleets[fleetId];
}

async function findFleetByPin(pin){
  const hash = await sha256Hex(String(pin||''));
  const fleets = getFleets();
  for(const id in fleets){ if(fleets[id].pinHash === hash) return fleets[id]; }
  return null;
}

async function joinFleetByPin(pin){
  const fleet = await findFleetByPin(pin);
  if(!fleet) return null;
  const fleets = getFleets();
  const { userId } = getSession();
  const v = getVessel();
  if(!v) throw new Error('Vessel must be registered first.');
  // Registrer fartøyet under denne brukeren
  fleets[fleet.fleetId].vessels[userId] = { ...v };
  fleets[fleet.fleetId].voyages[userId] = fleets[fleet.fleetId].voyages[userId] || [];
  setFleets(fleets);
  setSession({ fleetId: fleet.fleetId });
  return fleets[fleet.fleetId];
}

// ===== Vessel API =====
function registerVessel({ vesselName, callSign, language }){
  if(!vesselName) throw new Error('Vessel name is required.');
  const v = {
    vesselName: vesselName.trim(),
    callSign: (callSign || '').trim().toUpperCase() || undefined,
    language: language || 'English'
  };
  setVessel(v);
  // Sync til valgt fleet (om medlem)
  const { fleetId, userId } = getSession();
  if(fleetId){
    const fleets = getFleets();
    if(fleets[fleetId]){
      fleets[fleetId].vessels[userId] = { ...v };
      setFleets(fleets);
    }
  }
  return v;
}

// ===== Voyages API =====
function sendVoyageToFleet(voyage){
  const { userId, fleetId } = getSession();
  if(!fleetId) throw new Error('Join or create a fleet first.');
  const fleets = getFleets();
  if(!fleets[fleetId]) throw new Error('Fleet missing.');
  fleets[fleetId].voyages[userId] = fleets[fleetId].voyages[userId] || [];
  fleets[fleetId].voyages[userId].push({ ...voyage, ts: Date.now() });
  setFleets(fleets);
}





function clearRegistration({ keepFleets = true, keepSession = true } = {}){
  localStorage.removeItem(SN_KEYS.user);
  localStorage.removeItem(SN_KEYS.vessel);
  localStorage.removeItem(SN_KEYS.subscription);
  if(!keepSession) localStorage.removeItem(SN_KEYS.session);
  if(!keepFleets)  localStorage.removeItem(SN_KEYS.fleets);
}
window.SN = window.SN || {};
window.SN.clearRegistration = clearRegistration;
