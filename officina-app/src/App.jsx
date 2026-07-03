import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Calendar, Plus, Users, Camera, Sparkles, X, Check, Trash2, Edit3, Phone,
  FileText, Search, ChevronLeft, ChevronRight, Loader2, ImagePlus, User,
  Clock, AlertCircle, ArrowLeft, Wrench, ClipboardList, CircleUserRound,
  CalendarDays, ChevronDown, CarFront, Settings, Download, Upload
} from "lucide-react";
import { supabase } from "./supabaseClient.js";

/* ============================== TOKENS ============================== */

const COLORS = {
  bg: "#F2F4F5",
  surface: "#FFFFFF",
  ink: "#1B1E20",
  inkSoft: "#666E73",
  accent: "#2AA6D8",
  accentDark: "#1C82AE",
  accentSoft: "#DEF1F9",
  accent2: "#43484D",
  accent2Soft: "#E7E9EB",
  line: "#E2E5E7",
  lineStrong: "#CBD0D3",
  plateBlue: "#0B4EA2",
  plateYellow: "#FFD54A",
  danger: "#C4402E",
  dangerSoft: "#F7DDD8",
};

const FONT_DISPLAY = "'Oswald', sans-serif";
const FONT_BODY = "'Inter', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@600;700&display=swap');
* { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
body { margin: 0; }
.oc-root { font-family: ${FONT_BODY}; color: ${COLORS.ink}; background: ${COLORS.bg}; }
.oc-input, .oc-textarea, .oc-select {
  width: 100%; font-size: 16.5px; padding: 12px 14px; border-radius: 10px;
  border: 2px solid ${COLORS.line}; font-family: ${FONT_BODY}; background: #fff;
  color: ${COLORS.ink}; outline: none; transition: border-color .15s ease;
}
.oc-input:focus, .oc-textarea:focus, .oc-select:focus { border-color: ${COLORS.accent}; }
.oc-textarea { resize: vertical; min-height: 90px; line-height: 1.4; }
.oc-btn { cursor: pointer; border: none; font-family: ${FONT_BODY}; transition: transform .08s ease, opacity .15s ease; }
.oc-btn:active { transform: scale(0.97); }
.oc-btn:disabled { opacity: .5; cursor: not-allowed; }
.oc-chip { cursor: pointer; transition: all .12s ease; }
.oc-chip:active { transform: scale(0.96); }
.oc-scroll::-webkit-scrollbar { display: none; }
.oc-scroll { -ms-overflow-style: none; scrollbar-width: none; }
@keyframes oc-slideup { from { transform: translateY(24px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
@keyframes oc-spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.oc-spin { animation: oc-spin 0.8s linear infinite; }
@keyframes oc-fadein { from { opacity: 0 } to { opacity: 1 } }
.oc-modal-panel { animation: oc-slideup .22s ease; }
.oc-modal-backdrop { animation: oc-fadein .15s ease; }
`;

/* ============================== STORAGE ============================== */

/* ============================== DATA LAYER (Supabase) ============================== */

const CLIENT_LIST_COLUMNS = "id, nome, cognome, telefono, auto";
const APPT_LIST_COLUMNS = "id, clientId, clientNome, clientCognome, auto, lavoro, data, ora";

async function dbFetchClientsList() {
  const { data, error } = await supabase.from("clients").select(CLIENT_LIST_COLUMNS).order("cognome", { ascending: true });
  if (error) {
    console.error("Errore caricamento clienti", error);
    return [];
  }
  return data || [];
}
async function dbFetchAppointmentsList() {
  const { data, error } = await supabase.from("appointments").select(APPT_LIST_COLUMNS);
  if (error) {
    console.error("Errore caricamento appuntamenti", error);
    return [];
  }
  return data || [];
}
async function dbFetchClientFull(id) {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("Errore caricamento scheda cliente", error);
    return null;
  }
  return data;
}
async function dbFetchApptFull(id) {
  const { data, error } = await supabase.from("appointments").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("Errore caricamento appuntamento", error);
    return null;
  }
  return data;
}
async function dbUpsertClient(clientObj) {
  const { error } = await supabase.from("clients").upsert(clientObj, { onConflict: "id" });
  if (error) console.error("Errore salvataggio cliente", error);
  return !error;
}
async function dbUpsertAppointment(apptObj) {
  const { error } = await supabase.from("appointments").upsert(apptObj, { onConflict: "id" });
  if (error) console.error("Errore salvataggio appuntamento", error);
  return !error;
}
async function dbDeleteClient(id) {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) console.error("Errore eliminazione cliente", error);
  return !error;
}
async function dbDeleteAppointment(id) {
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) console.error("Errore eliminazione appuntamento", error);
  return !error;
}
async function dbUpdateAppointmentSchedule(id, data, ora) {
  const { error } = await supabase.from("appointments").update({ data, ora, updatedAt: Date.now() }).eq("id", id);
  if (error) console.error("Errore spostamento appuntamento", error);
  return !error;
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/* ============================== DATE HELPERS ============================== */

function pad(n) {
  return String(n).padStart(2, "0");
}
function toISODate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function todayISO() {
  return toISODate(new Date());
}
function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getWeekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
function getMonthMatrix(date) {
  const year = date.getFullYear(),
    month = date.getMonth();
  const first = new Date(year, month, 1);
  const firstWeekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - firstWeekday);
  const weeks = [];
  let cur = new Date(start);
  for (let w = 0; w < 6; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(days);
  }
  return weeks;
}
const WEEKDAY_SHORT = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const HOUR_SLOTS = Array.from({ length: 12 }, (_, i) => `${pad(i + 8)}:00`); // 08:00 .. 19:00
function nearestHourSlot(hhmm) {
  if (!hhmm) return "";
  const h = parseInt(hhmm.split(":")[0], 10);
  if (isNaN(h)) return "";
  const clamped = Math.min(19, Math.max(8, h));
  return `${pad(clamped)}:00`;
}
function fmtDayLabel(d) {
  return new Intl.DateTimeFormat("it-IT", { weekday: "short", day: "numeric", month: "short" }).format(d);
}
function fmtMonthYear(d) {
  const s = new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function fmtDateHuman(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const s = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" }).format(dt);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ============================== IMAGE HELPERS ============================== */

function compressImage(file, maxWidth = 860, quality = 0.55) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width,
          h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * (maxWidth / w));
          w = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const JOB_KEYWORDS = [
  "tagliando", "cambio olio", "cambio gomme", "revisione", "pastiglie freni", "freni",
  "gomme", "pneumatici", "frizione", "batteria", "candele", "filtri", "filtro",
  "climatizzatore", "aria condizionata", "carrozzeria", "diagnosi", "bollino blu",
  "ammortizzatori", "cinghia", "distribuzione", "scarico", "marmitta", "cambio olio motore",
];
const ITALIAN_WEEKDAYS = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
const ITALIAN_MONTHS = {
  gennaio: 0, febbraio: 1, marzo: 2, aprile: 3, maggio: 4, giugno: 5,
  luglio: 6, agosto: 7, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11,
};
const ITALIAN_NUMBER_WORDS = {
  uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10,
  undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16,
  diciassette: 17, diciotto: 18, diciannove: 19, venti: 20, ventuno: 21, ventidue: 22,
  ventitre: 23, "ventitré": 23, ventiquattro: 24, venticinque: 25, ventisei: 26,
  ventisette: 27, ventotto: 28, ventinove: 29, trenta: 30, trentuno: 31,
};
const NUM_WORD_ALT = Object.keys(ITALIAN_NUMBER_WORDS).sort((a, b) => b.length - a.length).join("|");
const MONTH_ALT = Object.keys(ITALIAN_MONTHS).join("|");

function wordOrDigitToDay(str) {
  const n = parseInt(str, 10);
  if (!isNaN(n)) return n;
  return ITALIAN_NUMBER_WORDS[str.toLowerCase()] || null;
}

function localExtract(text) {
  const result = { nome: "", cognome: "", telefono: "", lavoro: "", modello: "", targa: "", data: "", ora: "" };
  if (!text) return result;
  const lower = text.toLowerCase();

  const plateMatch = text.match(/\b[A-Za-z]{2}\s?\d{3}\s?[A-Za-z]{2}\b/);
  if (plateMatch) result.targa = plateMatch[0].replace(/\s/g, "").toUpperCase();

  const phoneMatch = text.match(/(\+39[\s.-]?)?3\d{2}[\s.-]?\d{3}[\s.-]?\d{3,4}/);
  if (phoneMatch) result.telefono = phoneMatch[0].trim();

  const nameMatch = text.match(/\b([A-ZÀ-Ý][a-zà-ý'-]+)\s+([A-ZÀ-Ý][a-zà-ý'-]+)\b/);
  if (nameMatch) {
    result.nome = nameMatch[1];
    result.cognome = nameMatch[2];
  }

  const today = new Date();
  function isoOffset(days) {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return toISODate(d);
  }
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let dateFound = "";

  // 1. Explicit "giorno [di] mese" (digit or word), e.g. "10 luglio", "dieci luglio", "il 10 di luglio"
  const explicitDateRe = new RegExp(`\\b(\\d{1,2}|${NUM_WORD_ALT})\\s+(?:di\\s+)?(${MONTH_ALT})\\b`, "i");
  const dm = lower.match(explicitDateRe);
  if (dm) {
    const day = wordOrDigitToDay(dm[1]);
    const month = ITALIAN_MONTHS[dm[2].toLowerCase()];
    if (day >= 1 && day <= 31) {
      let year = today.getFullYear();
      let candidate = new Date(year, month, day);
      if ((candidate - todayMidnight) / 86400000 < -20) candidate = new Date(year + 1, month, day);
      dateFound = toISODate(candidate);
    }
  }

  // 2. Weekday followed directly by a bare day number, no month, e.g. "venerdì dieci" / "venerdì il 10"
  if (!dateFound) {
    const weekdayAlt = ITALIAN_WEEKDAYS.join("|");
    const dayOnlyRe = new RegExp(`(?:${weekdayAlt})\\s+(?:il\\s+)?(\\d{1,2}|${NUM_WORD_ALT})\\b(?!\\s*(?:e\\s+)?(?:mezza|alle|ore))`, "i");
    const dm2 = lower.match(dayOnlyRe);
    if (dm2) {
      const day = wordOrDigitToDay(dm2[1]);
      if (day >= 1 && day <= 31) {
        let year = today.getFullYear(),
          month = today.getMonth();
        let candidate = new Date(year, month, day);
        if (candidate < todayMidnight) {
          month += 1;
          candidate = new Date(year, month, day);
        }
        dateFound = toISODate(candidate);
      }
    }
  }

  // 3. Relative keywords
  if (!dateFound) {
    if (/dopodomani/.test(lower)) dateFound = isoOffset(2);
    else if (/\bdomani\b/.test(lower)) dateFound = isoOffset(1);
    else if (/\boggi\b/.test(lower)) dateFound = isoOffset(0);
  }

  // 4. Bare weekday name only -> next occurrence
  if (!dateFound) {
    const todayIdx = (today.getDay() + 6) % 7;
    for (let i = 0; i < 7; i++) {
      if (lower.includes(ITALIAN_WEEKDAYS[i])) {
        let diff = (i - todayIdx + 7) % 7;
        if (diff === 0) diff = 7;
        dateFound = isoOffset(diff);
        break;
      }
    }
  }
  result.data = dateFound;

  const timeMatch = lower.match(/(?:alle|ore)\s*(\d{1,2})/);
  if (timeMatch) {
    const h = parseInt(timeMatch[1], 10);
    if (!isNaN(h)) result.ora = nearestHourSlot(`${pad(h)}:00`);
  }

  const foundJobs = JOB_KEYWORDS.filter((k) => lower.includes(k));
  if (foundJobs.length) {
    const uniqueJobs = [...new Set(foundJobs.map((j) => j.charAt(0).toUpperCase() + j.slice(1)))];
    result.lavoro = uniqueJobs.join(", ");
  }

  const modelMatch = text.match(/\b(fiat|audi|bmw|mercedes|volkswagen|vw|ford|opel|renault|peugeot|citroen|citroën|toyota|lancia|alfa romeo|nissan|hyundai|kia|skoda|seat|jeep|mini|volvo|mazda|honda|suzuki|dacia|smart)\s+[a-zà-ý0-9]+/i);
  if (modelMatch) result.modello = modelMatch[0].replace(/\s+/g, " ").trim();

  return result;
}



/* ============================== SMALL UI ATOMS ============================== */

function Targa({ plate, size = "md" }) {
  const h = size === "sm" ? 22 : 28;
  const fs = size === "sm" ? 11 : 14;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        border: "2px solid #16161a",
        borderRadius: 4,
        overflow: "hidden",
        height: h,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          background: COLORS.plateBlue,
          width: h * 0.55,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        <span style={{ color: COLORS.plateYellow, fontSize: fs * 0.5, fontWeight: 700, lineHeight: 1 }}>★</span>
        <span style={{ color: "#fff", fontSize: fs * 0.42, fontWeight: 700, lineHeight: 1 }}>I</span>
      </div>
      <div style={{ background: "#fff", padding: "0 7px", display: "flex", alignItems: "center" }}>
        <span style={{ fontFamily: FONT_MONO, fontWeight: 700, fontSize: fs, letterSpacing: 1, color: "#111" }}>
          {plate ? plate.toUpperCase() : "— — — —"}
        </span>
      </div>
    </div>
  );
}

function SectionLabel({ children, icon: Icon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT_DISPLAY,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: 0.6,
        fontSize: 13.5,
        color: COLORS.inkSoft,
        marginBottom: 8,
      }}
    >
      {Icon && <Icon size={15} strokeWidth={2.5} />}
      {children}
    </div>
  );
}

function BigButton({ children, onClick, icon: Icon, variant = "primary", full = true, disabled, type = "button" }) {
  const styles = {
    primary: { background: COLORS.accent, color: "#fff" },
    secondary: { background: COLORS.surface, color: COLORS.ink, border: `2px solid ${COLORS.line}` },
    ghost: { background: "transparent", color: COLORS.inkSoft },
    danger: { background: COLORS.dangerSoft, color: COLORS.danger },
    dark: { background: COLORS.ink, color: "#fff" },
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="oc-btn"
      style={{
        ...styles[variant],
        width: full ? "100%" : undefined,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "13px 18px",
        borderRadius: 12,
        fontSize: 16,
        fontWeight: 700,
        fontFamily: FONT_BODY,
      }}
    >
      {Icon && <Icon size={19} />}
      {children}
    </button>
  );
}

function Spinner({ size = 18, color = COLORS.accent }) {
  return <Loader2 className="oc-spin" size={size} color={color} />;
}

function Banner({ tone = "info", children }) {
  const tones = {
    info: { bg: COLORS.accent2Soft, color: COLORS.accent2, icon: Sparkles },
    error: { bg: COLORS.dangerSoft, color: COLORS.danger, icon: AlertCircle },
  };
  const t = tones[tone];
  const I = t.icon;
  return (
    <div
      style={{
        background: t.bg,
        color: t.color,
        borderRadius: 10,
        padding: "10px 12px",
        fontSize: 14,
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        fontWeight: 500,
      }}
    >
      <I size={16} style={{ marginTop: 1, flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

function ModalShell({ onClose, children, title }) {
  return (
    <div
      className="oc-modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,18,14,0.45)",
        zIndex: 50,
        display: "flex",
        alignItems: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        className="oc-modal-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: COLORS.bg,
          width: "100%",
          maxHeight: "92vh",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 16px",
            borderBottom: `1px solid ${COLORS.line}`,
            background: COLORS.surface,
            flexShrink: 0,
          }}
        >
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 18, textTransform: "uppercase", letterSpacing: 0.4 }}>
            {title}
          </span>
          <button className="oc-btn" onClick={onClose} style={{ background: COLORS.bg, borderRadius: 999, padding: 8, display: "flex" }}>
            <X size={20} />
          </button>
        </div>
        <div className="oc-scroll" style={{ overflowY: "auto", padding: 16, paddingBottom: 32 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function PhotoSlot({ label, dataUrl, onPick, onClear, height = 120 }) {
  const inputRef = useRef(null);
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.inkSoft, marginBottom: 6 }}>{label}</div>
      {dataUrl ? (
        <div style={{ position: "relative" }}>
          <img
            src={dataUrl}
            alt={label}
            style={{ width: "100%", height, objectFit: "cover", borderRadius: 12, border: `2px solid ${COLORS.line}` }}
          />
          <button
            className="oc-btn"
            onClick={onClear}
            style={{
              position: "absolute",
              top: 6,
              right: 6,
              background: "rgba(20,18,14,0.7)",
              color: "#fff",
              borderRadius: 999,
              padding: 6,
              display: "flex",
            }}
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <button
          className="oc-btn"
          onClick={() => inputRef.current?.click()}
          style={{
            width: "100%",
            height,
            borderRadius: 12,
            border: `2px dashed ${COLORS.lineStrong}`,
            background: COLORS.surface,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            color: COLORS.inkSoft,
          }}
        >
          <ImagePlus size={22} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Aggiungi foto</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (f) onPick(await compressImage(f));
          e.target.value = "";
        }}
      />
    </div>
  );
}

/* ============================== HEADER / NAV ============================== */

function Header({ onOpenSettings }) {
  return (
    <div
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: COLORS.surface,
        borderBottom: `1px solid ${COLORS.line}`,
        padding: "13px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          background: COLORS.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Wrench size={18} color={COLORS.accentSoft} />
      </div>
      <div style={{ lineHeight: 1.1, flex: 1 }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, letterSpacing: 0.5, textTransform: "uppercase" }}>
          Gestione Officina
        </div>
        <div style={{ fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 500 }}>Appuntamenti e clienti</div>
      </div>
      <button
        className="oc-btn"
        onClick={onOpenSettings}
        style={{ background: COLORS.bg, borderRadius: 999, padding: 9, display: "flex", flexShrink: 0 }}
      >
        <Settings size={18} color={COLORS.inkSoft} />
      </button>
    </div>
  );
}

function BottomNav({ tab, setTab }) {
  const items = [
    { key: "calendar", label: "Calendario", icon: Calendar },
    { key: "new", label: "Nuovo", icon: Plus },
    { key: "clients", label: "Clienti", icon: Users },
  ];
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 20,
        background: COLORS.surface,
        borderTop: `1px solid ${COLORS.line}`,
        display: "flex",
        paddingBottom: "env(safe-area-inset-bottom, 6px)",
      }}
    >
      {items.map((it) => {
        const active = tab === it.key;
        const isCenter = it.key === "new";
        return (
          <button
            key={it.key}
            className="oc-btn"
            onClick={() => setTab(it.key)}
            style={{
              flex: 1,
              background: "transparent",
              padding: "9px 4px 8px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
            }}
          >
            {isCenter ? (
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: COLORS.accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: -18,
                  boxShadow: "0 3px 10px rgba(42,166,216,0.45)",
                }}
              >
                <Plus size={22} color="#fff" strokeWidth={2.5} />
              </div>
            ) : (
              <it.icon size={21} color={active ? COLORS.accent : COLORS.inkSoft} strokeWidth={active ? 2.4 : 2} />
            )}
            <span style={{ fontSize: 11, fontWeight: 600, color: active ? COLORS.accent : COLORS.inkSoft }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================== APPOINTMENT CARD ============================== */

function ApptCard({ appt, onOpen }) {
  return (
    <button
      className="oc-btn"
      onClick={() => onOpen(appt.id)}
      style={{
        width: "100%",
        textAlign: "left",
        background: COLORS.surface,
        border: `1.5px solid ${COLORS.line}`,
        borderRadius: 14,
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          background: COLORS.accentSoft,
          color: COLORS.accentDark,
          borderRadius: 10,
          padding: "6px 9px",
          fontFamily: FONT_DISPLAY,
          fontWeight: 700,
          fontSize: 16,
          textAlign: "center",
          flexShrink: 0,
          minWidth: 52,
        }}
      >
        {appt.ora || "--:--"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 15.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {appt.clientNome} {appt.clientCognome}
        </div>
        <div style={{ fontSize: 13.5, color: COLORS.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {appt.lavoro || "—"}
        </div>
        <div style={{ marginTop: 6 }}>
          <Targa plate={appt.auto?.targa} size="sm" />
        </div>
      </div>
    </button>
  );
}

/* ============================== CALENDAR VIEW ============================== */

function CalendarView({ appointments, onOpenAppt, onNewAtDate }) {
  const [mode, setMode] = useState("week");
  const [refDate, setRefDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(todayISO());

  const apptsByDate = useMemo(() => {
    const map = {};
    for (const a of appointments) {
      if (!map[a.data]) map[a.data] = [];
      map[a.data].push(a);
    }
    Object.values(map).forEach((arr) => arr.sort((x, y) => (x.ora || "").localeCompare(y.ora || "")));
    return map;
  }, [appointments]);

  function shift(delta) {
    const d = new Date(refDate);
    if (mode === "week") d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setRefDate(d);
  }

  const weekDays = useMemo(() => getWeekDays(refDate), [refDate]);
  const monthWeeks = useMemo(() => getMonthMatrix(refDate), [refDate]);
  const periodLabel = mode === "week" ? `${fmtDayLabel(weekDays[0])} – ${fmtDayLabel(weekDays[6])}` : fmtMonthYear(refDate);

  return (
    <div style={{ padding: 16, paddingBottom: 12 }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["week", "month"].map((m) => (
          <button
            key={m}
            className="oc-btn"
            onClick={() => setMode(m)}
            style={{
              flex: 1,
              padding: "9px 0",
              borderRadius: 10,
              background: mode === m ? COLORS.ink : COLORS.surface,
              color: mode === m ? "#fff" : COLORS.inkSoft,
              border: `1.5px solid ${mode === m ? COLORS.ink : COLORS.line}`,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {m === "week" ? "Settimana" : "Mese"}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <button className="oc-btn" onClick={() => shift(-1)} style={{ background: COLORS.surface, borderRadius: 999, padding: 8 }}>
          <ChevronLeft size={19} />
        </button>
        <button
          className="oc-btn"
          onClick={() => {
            setRefDate(new Date());
            setSelectedDay(todayISO());
          }}
          style={{ background: "transparent", fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 16.5, textTransform: "capitalize" }}
        >
          {periodLabel}
        </button>
        <button className="oc-btn" onClick={() => shift(1)} style={{ background: COLORS.surface, borderRadius: 999, padding: 8 }}>
          <ChevronRight size={19} />
        </button>
      </div>

      {mode === "week" ? (
        <div>
          {weekDays.map((d) => {
            const iso = toISODate(d);
            const isToday = iso === todayISO();
            const dayAppts = apptsByDate[iso] || [];
            return (
              <div key={iso} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: isToday ? COLORS.accent : "transparent",
                        color: isToday ? "#fff" : COLORS.ink,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: FONT_DISPLAY,
                        fontWeight: 700,
                        fontSize: 14.5,
                      }}
                    >
                      {d.getDate()}
                    </div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: COLORS.inkSoft, textTransform: "capitalize" }}>
                      {new Intl.DateTimeFormat("it-IT", { weekday: "long" }).format(d)}
                    </span>
                  </div>
                  <button
                    className="oc-btn"
                    onClick={() => onNewAtDate(iso)}
                    style={{ background: "transparent", color: COLORS.accent, padding: 4, display: "flex" }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {dayAppts.length === 0 ? (
                  <div style={{ fontSize: 13, color: COLORS.inkSoft, paddingLeft: 38, fontStyle: "italic" }}>Nessun appuntamento</div>
                ) : (
                  dayAppts.map((a) => <ApptCard key={a.id} appt={a} onOpen={onOpenAppt} />)
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
            {WEEKDAY_SHORT.map((w) => (
              <div key={w} style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: COLORS.inkSoft }}>
                {w}
              </div>
            ))}
          </div>
          {monthWeeks.map((week, wi) => (
            <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4, marginBottom: 4 }}>
              {week.map((d) => {
                const iso = toISODate(d);
                const inMonth = d.getMonth() === refDate.getMonth();
                const count = (apptsByDate[iso] || []).length;
                const isToday = iso === todayISO();
                const isSelected = iso === selectedDay;
                return (
                  <button
                    key={iso}
                    className="oc-btn"
                    onClick={() => setSelectedDay(iso)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 10,
                      background: isSelected ? COLORS.ink : isToday ? COLORS.accentSoft : COLORS.surface,
                      border: `1px solid ${isSelected ? COLORS.ink : COLORS.line}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: inMonth ? 1 : 0.35,
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: isSelected ? "#fff" : COLORS.ink,
                        fontFamily: FONT_DISPLAY,
                      }}
                    >
                      {d.getDate()}
                    </span>
                    {count > 0 && (
                      <span
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: 999,
                          background: isSelected ? COLORS.plateYellow : COLORS.accent,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          <div style={{ marginTop: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 15, textTransform: "capitalize" }}>
                {fmtDateHuman(selectedDay)}
              </span>
              <button
                className="oc-btn"
                onClick={() => onNewAtDate(selectedDay)}
                style={{ background: "transparent", color: COLORS.accent, padding: 4, display: "flex" }}
              >
                <Plus size={18} />
              </button>
            </div>
            {(apptsByDate[selectedDay] || []).length === 0 ? (
              <div style={{ fontSize: 13.5, color: COLORS.inkSoft, fontStyle: "italic" }}>Nessun appuntamento</div>
            ) : (
              (apptsByDate[selectedDay] || []).map((a) => <ApptCard key={a.id} appt={a} onOpen={onOpenAppt} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================== APPOINTMENT DETAIL MODAL ============================== */

function AppointmentDetailModal({ apptId, onClose, onEdit, loadApptFull, onDelete, onReschedule }) {
  const [full, setFull] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newData, setNewData] = useState("");
  const [newOra, setNewOra] = useState("");
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    let alive = true;
    loadApptFull(apptId).then((f) => {
      if (!alive) return;
      setFull(f);
      if (f) {
        setNewData(f.data);
        setNewOra(f.ora);
      }
    });
    return () => {
      alive = false;
    };
  }, [apptId]);

  if (!full) {
    return (
      <ModalShell onClose={onClose} title="Appuntamento">
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <Spinner />
        </div>
      </ModalShell>
    );
  }

  async function confirmMove() {
    setMoving(true);
    await onReschedule(full.id, newData, newOra);
    setMoving(false);
    onClose();
  }

  return (
    <ModalShell onClose={onClose} title="Dettaglio appuntamento">
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22 }}>
              {full.clientNome} {full.clientCognome}
            </div>
            {full.clientTelefono && (
              <a
                href={`tel:${full.clientTelefono}`}
                style={{ color: COLORS.accent2, fontSize: 14.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5, marginTop: 2 }}
              >
                <Phone size={14} /> {full.clientTelefono}
              </a>
            )}
          </div>
          <Targa plate={full.auto?.targa} />
        </div>

        {full.fotoAuto && (
          <img src={full.fotoAuto} alt="auto" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12 }} />
        )}

        <div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1, background: COLORS.surface, borderRadius: 12, padding: 12, border: `1px solid ${COLORS.line}` }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 700, textTransform: "uppercase" }}>Data</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{fmtDateHuman(full.data)}</div>
            </div>
            <div style={{ background: COLORS.surface, borderRadius: 12, padding: 12, border: `1px solid ${COLORS.line}` }}>
              <div style={{ fontSize: 11.5, color: COLORS.inkSoft, fontWeight: 700, textTransform: "uppercase" }}>Ora</div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{full.ora || "—"}</div>
            </div>
          </div>

          {!showReschedule ? (
            <button
              className="oc-btn"
              onClick={() => setShowReschedule(true)}
              style={{
                marginTop: 8,
                width: "100%",
                background: "transparent",
                color: COLORS.accentDark,
                fontWeight: 700,
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "8px 0",
              }}
            >
              <CalendarDays size={16} /> Sposta appuntamento
            </button>
          ) : (
            <div style={{ marginTop: 10, background: COLORS.accentSoft, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.accentDark, marginBottom: 8, textTransform: "uppercase" }}>
                Nuova data e ora
              </div>
              <input className="oc-input" type="date" value={newData} onChange={(e) => setNewData(e.target.value)} style={{ marginBottom: 8 }} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                {HOUR_SLOTS.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="oc-chip"
                    onClick={() => setNewOra(h)}
                    style={{
                      padding: "8px 0",
                      borderRadius: 8,
                      border: `1.5px solid ${newOra === h ? COLORS.accentDark : COLORS.line}`,
                      background: newOra === h ? COLORS.accentDark : "#fff",
                      color: newOra === h ? "#fff" : COLORS.ink,
                      fontWeight: 700,
                      fontSize: 13,
                      fontFamily: FONT_MONO,
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <BigButton variant="secondary" onClick={() => setShowReschedule(false)} disabled={moving}>
                  Annulla
                </BigButton>
                <BigButton icon={moving ? undefined : Check} onClick={confirmMove} disabled={moving || !newData || !newOra}>
                  {moving ? <Spinner size={16} color="#fff" /> : "Conferma spostamento"}
                </BigButton>
              </div>
            </div>
          )}
        </div>

        <div>
          <SectionLabel icon={ClipboardList}>Lavoro da fare</SectionLabel>
          <div style={{ background: COLORS.surface, borderRadius: 12, padding: 12, border: `1px solid ${COLORS.line}`, fontSize: 15, lineHeight: 1.4 }}>
            {full.lavoro || "—"}
          </div>
        </div>

        {full.auto?.modello && (
          <div>
            <SectionLabel icon={CarFront}>Auto</SectionLabel>
            <div style={{ fontSize: 15 }}>{full.auto.modello}</div>
          </div>
        )}

        {full.note && (
          <div>
            <SectionLabel>Note</SectionLabel>
            <div style={{ fontSize: 14.5, color: COLORS.inkSoft }}>{full.note}</div>
          </div>
        )}

        {full.preventivo && (
          <div>
            <SectionLabel icon={FileText}>Preventivo</SectionLabel>
            <img src={full.preventivo} alt="preventivo" style={{ width: "100%", borderRadius: 12, border: `1px solid ${COLORS.line}` }} />
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <BigButton icon={Edit3} variant="secondary" onClick={() => onEdit(full)}>
            Modifica
          </BigButton>
          {!confirmDel ? (
            <BigButton icon={Trash2} variant="danger" onClick={() => setConfirmDel(true)}>
              Elimina
            </BigButton>
          ) : (
            <BigButton
              icon={Check}
              variant="danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await onDelete(full.id);
                setBusy(false);
                onClose();
              }}
            >
              {busy ? <Spinner size={16} color={COLORS.danger} /> : "Confermi eliminazione?"}
            </BigButton>
          )}
        </div>
      </div>
    </ModalShell>
  );
}

/* ============================== APPOINTMENT FORM (new / edit) ============================== */

function emptyApptForm(presetDate) {
  return {
    clientId: null,
    clientNome: "",
    clientCognome: "",
    clientTelefono: "",
    clientNote: "",
    docFronte: null,
    docRetro: null,
    availableAuto: [],
    selectedAutoId: "new",
    modello: "",
    targa: "",
    fotoAuto: null,
    rawText: "",
    lavoro: "",
    note: "",
    data: presetDate || todayISO(),
    ora: "",
    preventivo: null,
    createdAt: null,
  };
}

function AppointmentForm({ clientsIndex, loadClientFull, onSaveAppointment, onDeleteAppointment, onClose, editingAppt, presetDate }) {
  const [form, setForm] = useState(emptyApptForm(presetDate));
  const [clientQuery, setClientQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [extractMsg, setExtractMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    (async () => {
      if (editingAppt) {
        let auto = [];
        if (editingAppt.clientId) {
          const cf = await loadClientFull(editingAppt.clientId);
          auto = cf?.auto || [];
        }
        const matched = auto.find((a) => a.modello === editingAppt.auto?.modello && a.targa === editingAppt.auto?.targa);
        setForm({
          ...emptyApptForm(),
          clientId: editingAppt.clientId,
          clientNome: editingAppt.clientNome,
          clientCognome: editingAppt.clientCognome,
          clientTelefono: editingAppt.clientTelefono,
          docFronte: null,
          docRetro: null,
          availableAuto: auto,
          selectedAutoId: matched ? matched.id : "new",
          modello: editingAppt.auto?.modello || "",
          targa: editingAppt.auto?.targa || "",
          fotoAuto: editingAppt.fotoAuto || null,
          lavoro: editingAppt.lavoro || "",
          note: editingAppt.note || "",
          data: editingAppt.data,
          ora: editingAppt.ora,
          preventivo: editingAppt.preventivo || null,
          createdAt: editingAppt.createdAt,
        });
        setClientQuery(`${editingAppt.clientNome} ${editingAppt.clientCognome}`);
      }
    })();
  }, [editingAppt]);

  const filteredClients = useMemo(() => {
    if (!clientQuery.trim() || form.clientId) return [];
    const q = clientQuery.trim().toLowerCase();
    return clientsIndex.filter((c) => `${c.nome} ${c.cognome}`.toLowerCase().includes(q)).slice(0, 6);
  }, [clientQuery, clientsIndex, form.clientId]);

  async function selectClient(c) {
    const full = await loadClientFull(c.id);
    setForm((f) => ({
      ...f,
      clientId: c.id,
      clientNome: full?.nome || c.nome,
      clientCognome: full?.cognome || c.cognome,
      clientTelefono: full?.telefono || c.telefono || "",
      clientNote: full?.note || "",
      docFronte: full?.docFronte || null,
      docRetro: full?.docRetro || null,
      availableAuto: full?.auto || [],
      selectedAutoId: full?.auto?.[0]?.id || "new",
      modello: full?.auto?.[0]?.modello || "",
      targa: full?.auto?.[0]?.targa || "",
    }));
    setClientQuery(`${full?.nome || c.nome} ${full?.cognome || c.cognome}`);
    setShowDropdown(false);
  }

  function changeClient() {
    setForm((f) => ({ ...emptyApptForm(f.data), rawText: f.rawText, lavoro: f.lavoro, ora: f.ora }));
    setClientQuery("");
  }

  function handlePhotoPick(dataUrl) {
    setForm((f) => ({ ...f, fotoAuto: dataUrl }));
  }

  function handleExtract() {
    if (!form.rawText.trim()) return;
    setExtractMsg(null);

    const finalData = localExtract(form.rawText);
    const hasAnyData = Object.values(finalData).some((v) => v);
    if (hasAnyData) {
      setForm((f) => ({
        ...f,
        clientNome: !f.clientId && finalData.nome ? finalData.nome : f.clientNome,
        clientCognome: !f.clientId && finalData.cognome ? finalData.cognome : f.clientCognome,
        clientTelefono: !f.clientId && finalData.telefono ? finalData.telefono : f.clientTelefono,
        lavoro: finalData.lavoro || f.lavoro,
        modello: !f.modello && finalData.modello ? finalData.modello : f.modello,
        targa: !f.targa && finalData.targa ? finalData.targa : f.targa,
        data: finalData.data || f.data,
        ora: finalData.ora ? nearestHourSlot(finalData.ora) : f.ora,
      }));
      if (!form.clientId && (finalData.nome || finalData.cognome)) {
        setClientQuery(`${finalData.nome || ""} ${finalData.cognome || ""}`.trim());
      }
      setExtractMsg({ tone: "info", text: "Dati estratti: controlla e correggi i campi se serve." });
    } else {
      setExtractMsg({ tone: "error", text: "Non sono riuscito a estrarre dati da questo testo. Compila i campi manualmente." });
    }
  }

  const canSave = form.clientNome.trim() && form.lavoro.trim() && form.data;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSaveAppointment(form, editingAppt?.id || null);
      onClose();
    } catch (e) {
      setExtractMsg({ tone: "error", text: "Errore nel salvataggio. Riprova." });
    }
    setSaving(false);
  }

  return (
    <ModalShell onClose={onClose} title={editingAppt ? "Modifica appuntamento" : "Nuovo appuntamento"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Descrizione / dettatura */}
        <div>
          <SectionLabel icon={Sparkles}>Descrizione (scrivi o detta)</SectionLabel>
          <textarea
            className="oc-textarea"
            placeholder={`Es: "Mario Rossi, cambio olio e filtri, targa AB123CD, domani alle 10". Usa il microfono della tastiera per dettare.`}
            value={form.rawText}
            onChange={(e) => setForm((f) => ({ ...f, rawText: e.target.value }))}
          />
          <div style={{ marginTop: 8 }}>
            <BigButton icon={Sparkles} onClick={handleExtract} disabled={!form.rawText.trim()} variant="dark">
              Estrai dati automaticamente
            </BigButton>
          </div>
          {extractMsg && (
            <div style={{ marginTop: 8 }}>
              <Banner tone={extractMsg.tone}>{extractMsg.text}</Banner>
            </div>
          )}
        </div>

        {/* Cliente */}
        <div>
          <SectionLabel icon={User}>Cliente</SectionLabel>
          {form.clientId ? (
            <div
              style={{
                background: COLORS.surface,
                border: `1.5px solid ${COLORS.line}`,
                borderRadius: 12,
                padding: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                  {form.clientNome} {form.clientCognome}
                </div>
                <div style={{ fontSize: 13, color: COLORS.inkSoft }}>{form.clientTelefono || "Nessun telefono"}</div>
              </div>
              <button className="oc-btn" onClick={changeClient} style={{ background: COLORS.bg, borderRadius: 8, padding: "7px 10px", fontSize: 12.5, fontWeight: 700, color: COLORS.accent }}>
                Cambia
              </button>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft }} />
                <input
                  className="oc-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="Cerca cliente per nome..."
                  value={clientQuery}
                  onChange={(e) => {
                    setClientQuery(e.target.value);
                    setShowDropdown(true);
                    setForm((f) => ({ ...f, clientNome: e.target.value }));
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
              </div>
              {showDropdown && filteredClients.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "105%",
                    left: 0,
                    right: 0,
                    background: "#fff",
                    borderRadius: 12,
                    border: `1.5px solid ${COLORS.line}`,
                    zIndex: 10,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.12)",
                    overflow: "hidden",
                  }}
                >
                  {filteredClients.map((c) => (
                    <button
                      key={c.id}
                      className="oc-btn"
                      onClick={() => selectClient(c)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 14px",
                        background: "#fff",
                        borderBottom: `1px solid ${COLORS.line}`,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <CircleUserRound size={20} color={COLORS.inkSoft} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14.5 }}>
                          {c.nome} {c.cognome}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{c.telefono}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <input
                  className="oc-input"
                  placeholder="Cognome"
                  value={form.clientCognome}
                  onChange={(e) => setForm((f) => ({ ...f, clientCognome: e.target.value }))}
                />
                <input
                  className="oc-input"
                  placeholder="Telefono"
                  type="tel"
                  value={form.clientTelefono}
                  onChange={(e) => setForm((f) => ({ ...f, clientTelefono: e.target.value }))}
                />
              </div>
              <div style={{ fontSize: 12, color: COLORS.inkSoft, marginTop: 6 }}>
                Cliente non trovato? Verrà creato automaticamente al salvataggio.
              </div>
            </div>
          )}
        </div>

        {/* Auto */}
        <div>
          <SectionLabel icon={CarFront}>Auto</SectionLabel>
          {form.availableAuto.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {form.availableAuto.map((a) => (
                <button
                  key={a.id}
                  className="oc-chip"
                  onClick={() =>
                    setForm((f) => ({ ...f, selectedAutoId: a.id, modello: a.modello, targa: a.targa, fotoAuto: null }))
                  }
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: `1.5px solid ${form.selectedAutoId === a.id ? COLORS.accent : COLORS.line}`,
                    background: form.selectedAutoId === a.id ? COLORS.accentSoft : "#fff",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  {a.modello || "Auto"} · {a.targa || "—"}
                </button>
              ))}
              <button
                className="oc-chip"
                onClick={() => setForm((f) => ({ ...f, selectedAutoId: "new", modello: "", targa: "", fotoAuto: null }))}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: `1.5px solid ${form.selectedAutoId === "new" ? COLORS.accent : COLORS.line}`,
                  background: form.selectedAutoId === "new" ? COLORS.accentSoft : "#fff",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                + Nuova auto
              </button>
            </div>
          )}

          {form.selectedAutoId === "new" && (
            <div style={{ marginBottom: 10 }}>
              <PhotoSlot label="Foto auto" dataUrl={form.fotoAuto} onPick={handlePhotoPick} onClear={() => setForm((f) => ({ ...f, fotoAuto: null }))} height={140} />
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="oc-input"
              placeholder="Modello (es. Fiat Panda)"
              value={form.modello}
              onChange={(e) => setForm((f) => ({ ...f, modello: e.target.value }))}
            />
            <input
              className="oc-input"
              style={{ fontFamily: FONT_MONO, textTransform: "uppercase", maxWidth: 130 }}
              placeholder="TARGA"
              value={form.targa}
              onChange={(e) => setForm((f) => ({ ...f, targa: e.target.value.toUpperCase() }))}
            />
          </div>
        </div>

        {/* Lavoro */}
        <div>
          <SectionLabel icon={ClipboardList}>Lavoro da fare</SectionLabel>
          <textarea
            className="oc-textarea"
            style={{ minHeight: 70 }}
            placeholder="Es. Cambio olio e filtri"
            value={form.lavoro}
            onChange={(e) => setForm((f) => ({ ...f, lavoro: e.target.value }))}
          />
        </div>

        {/* Data e ora */}
        <div>
          <SectionLabel icon={CalendarDays}>Data e ora</SectionLabel>
          <input className="oc-input" type="date" value={form.data} onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))} style={{ marginBottom: 10 }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {HOUR_SLOTS.map((h) => (
              <button
                key={h}
                type="button"
                className="oc-chip"
                onClick={() => setForm((f) => ({ ...f, ora: h }))}
                style={{
                  padding: "10px 0",
                  borderRadius: 10,
                  border: `1.5px solid ${form.ora === h ? COLORS.accent : COLORS.line}`,
                  background: form.ora === h ? COLORS.accent : "#fff",
                  color: form.ora === h ? "#fff" : COLORS.ink,
                  fontWeight: 700,
                  fontSize: 14.5,
                  fontFamily: FONT_MONO,
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Documenti */}
        <div>
          <SectionLabel icon={FileText}>Documenti cliente</SectionLabel>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <PhotoSlot label="Fronte" dataUrl={form.docFronte} onPick={(d) => setForm((f) => ({ ...f, docFronte: d }))} onClear={() => setForm((f) => ({ ...f, docFronte: null }))} height={90} />
            <PhotoSlot label="Retro" dataUrl={form.docRetro} onPick={(d) => setForm((f) => ({ ...f, docRetro: d }))} onClear={() => setForm((f) => ({ ...f, docRetro: null }))} height={90} />
          </div>
          <PhotoSlot label="Preventivo (per questo appuntamento)" dataUrl={form.preventivo} onPick={(d) => setForm((f) => ({ ...f, preventivo: d }))} onClear={() => setForm((f) => ({ ...f, preventivo: null }))} height={110} />
        </div>

        {/* Note */}
        <div>
          <SectionLabel>Note</SectionLabel>
          <textarea className="oc-textarea" style={{ minHeight: 60 }} value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <BigButton icon={saving ? undefined : Check} onClick={handleSave} disabled={!canSave || saving}>
            {saving ? <Spinner size={17} color="#fff" /> : editingAppt ? "Salva modifiche" : "Salva appuntamento"}
          </BigButton>
          {editingAppt &&
            (!confirmDel ? (
              <BigButton variant="ghost" icon={Trash2} onClick={() => setConfirmDel(true)}>
                Elimina appuntamento
              </BigButton>
            ) : (
              <BigButton
                variant="danger"
                icon={Check}
                onClick={async () => {
                  await onDeleteAppointment(editingAppt.id);
                  onClose();
                }}
              >
                Confermi eliminazione?
              </BigButton>
            ))}
          {!canSave && <div style={{ fontSize: 12.5, color: COLORS.inkSoft, textAlign: "center" }}>Servono almeno nome cliente, lavoro e data.</div>}
        </div>
      </div>
    </ModalShell>
  );
}

/* ============================== CLIENTS VIEW ============================== */

function ClientsView({ clientsIndex, onOpenClient, onNewClient }) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return clientsIndex;
    const s = q.trim().toLowerCase();
    return clientsIndex.filter((c) => `${c.nome} ${c.cognome} ${c.telefono}`.toLowerCase().includes(s));
  }, [q, clientsIndex]);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 22, textTransform: "uppercase" }}>Clienti</span>
        <button className="oc-btn" onClick={onNewClient} style={{ background: COLORS.ink, color: "#fff", borderRadius: 999, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6, fontWeight: 700, fontSize: 13.5 }}>
          <Plus size={16} /> Nuovo
        </button>
      </div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: COLORS.inkSoft }} />
        <input className="oc-input" style={{ paddingLeft: 36 }} placeholder="Cerca cliente..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: COLORS.inkSoft, fontSize: 14 }}>Nessun cliente trovato.</div>
      ) : (
        filtered
          .slice()
          .sort((a, b) => `${a.nome}${a.cognome}`.localeCompare(`${b.nome}${b.cognome}`))
          .map((c) => (
            <button
              key={c.id}
              className="oc-btn"
              onClick={() => onOpenClient(c.id)}
              style={{
                width: "100%",
                textAlign: "left",
                background: COLORS.surface,
                border: `1.5px solid ${COLORS.line}`,
                borderRadius: 14,
                padding: 12,
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 999,
                  background: COLORS.accentSoft,
                  color: COLORS.accentDark,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {(c.nome[0] || "").toUpperCase()}
                {(c.cognome[0] || "").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                  {c.nome} {c.cognome}
                </div>
                <div style={{ fontSize: 13, color: COLORS.inkSoft }}>
                  {c.telefono || "—"} · {(c.auto || []).length} auto
                </div>
              </div>
            </button>
          ))
      )}
    </div>
  );
}

/* ============================== CLIENT DETAIL / EDIT MODAL ============================== */

function ClientDetailModal({ clientId, isNew, loadClientFull, onSaveClient, onDeleteClient, onClose, appointmentsIndex, onOpenAppt }) {
  const [data, setData] = useState({ nome: "", cognome: "", telefono: "", note: "", docFronte: null, docRetro: null, auto: [] });
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!isNew && clientId) {
      loadClientFull(clientId).then((f) => {
        if (f) setData(f);
        setLoading(false);
      });
    }
  }, [clientId, isNew]);

  function updateAuto(idx, field, value) {
    setData((d) => ({ ...d, auto: d.auto.map((a, i) => (i === idx ? { ...a, [field]: value } : a)) }));
  }
  function addAuto() {
    setData((d) => ({ ...d, auto: [...d.auto, { id: newId("auto"), modello: "", targa: "" }] }));
  }
  function removeAuto(idx) {
    setData((d) => ({ ...d, auto: d.auto.filter((_, i) => i !== idx) }));
  }

  const canSave = data.nome.trim().length > 0;
  const relatedAppts = clientId ? appointmentsIndex.filter((a) => a.clientId === clientId) : [];

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSaveClient(data, isNew ? null : clientId);
      onClose();
    } catch (e) {}
    setSaving(false);
  }

  if (loading) {
    return (
      <ModalShell onClose={onClose} title="Cliente">
        <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
          <Spinner />
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} title={isNew ? "Nuovo cliente" : "Scheda cliente"}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input className="oc-input" placeholder="Nome" value={data.nome} onChange={(e) => setData((d) => ({ ...d, nome: e.target.value }))} />
          <input className="oc-input" placeholder="Cognome" value={data.cognome} onChange={(e) => setData((d) => ({ ...d, cognome: e.target.value }))} />
        </div>
        <input className="oc-input" placeholder="Telefono" type="tel" value={data.telefono} onChange={(e) => setData((d) => ({ ...d, telefono: e.target.value }))} />

        <div>
          <SectionLabel icon={CarFront}>Auto</SectionLabel>
          {data.auto.map((a, idx) => (
            <div key={a.id} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input className="oc-input" placeholder="Modello" value={a.modello} onChange={(e) => updateAuto(idx, "modello", e.target.value)} />
              <input
                className="oc-input"
                style={{ fontFamily: FONT_MONO, textTransform: "uppercase", maxWidth: 110 }}
                placeholder="TARGA"
                value={a.targa}
                onChange={(e) => updateAuto(idx, "targa", e.target.value.toUpperCase())}
              />
              <button className="oc-btn" onClick={() => removeAuto(idx)} style={{ background: COLORS.dangerSoft, color: COLORS.danger, borderRadius: 10, padding: 10, display: "flex" }}>
                <X size={16} />
              </button>
            </div>
          ))}
          <BigButton variant="secondary" icon={Plus} onClick={addAuto}>
            Aggiungi auto
          </BigButton>
        </div>

        <div>
          <SectionLabel icon={FileText}>Documento</SectionLabel>
          <div style={{ display: "flex", gap: 10 }}>
            <PhotoSlot label="Fronte" dataUrl={data.docFronte} onPick={(d2) => setData((d) => ({ ...d, docFronte: d2 }))} onClear={() => setData((d) => ({ ...d, docFronte: null }))} height={95} />
            <PhotoSlot label="Retro" dataUrl={data.docRetro} onPick={(d2) => setData((d) => ({ ...d, docRetro: d2 }))} onClear={() => setData((d) => ({ ...d, docRetro: null }))} height={95} />
          </div>
        </div>

        <div>
          <SectionLabel>Note</SectionLabel>
          <textarea className="oc-textarea" style={{ minHeight: 60 }} value={data.note} onChange={(e) => setData((d) => ({ ...d, note: e.target.value }))} />
        </div>

        {!isNew && relatedAppts.length > 0 && (
          <div>
            <SectionLabel icon={Calendar}>Appuntamenti</SectionLabel>
            {relatedAppts
              .slice()
              .sort((a, b) => (b.data + b.ora).localeCompare(a.data + a.ora))
              .map((a) => (
                <button
                  key={a.id}
                  className="oc-btn"
                  onClick={() => onOpenAppt(a.id)}
                  style={{ width: "100%", textAlign: "left", background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 10, padding: 10, marginBottom: 6, display: "flex", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 13.5, fontWeight: 600 }}>{a.lavoro || "—"}</span>
                  <span style={{ fontSize: 12.5, color: COLORS.inkSoft }}>
                    {fmtDateHuman(a.data)} {a.ora}
                  </span>
                </button>
              ))}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
          <BigButton icon={saving ? undefined : Check} onClick={handleSave} disabled={!canSave || saving}>
            {saving ? <Spinner size={17} color="#fff" /> : "Salva cliente"}
          </BigButton>
          {!isNew &&
            (!confirmDel ? (
              <BigButton variant="ghost" icon={Trash2} onClick={() => setConfirmDel(true)}>
                Elimina cliente
              </BigButton>
            ) : (
              <BigButton
                variant="danger"
                icon={Check}
                onClick={async () => {
                  await onDeleteClient(clientId);
                  onClose();
                }}
              >
                Confermi eliminazione?
              </BigButton>
            ))}
        </div>
      </div>
    </ModalShell>
  );
}

/* ============================== SETTINGS / BACKUP MODAL ============================== */

function SettingsModal({ onClose, clientsCount, appointmentsCount, onExport, onImport }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  async function handleExportClick() {
    setBusy(true);
    setMsg(null);
    try {
      await onExport();
      setMsg({ tone: "info", text: "Backup scaricato. Trovi il file nei download del telefono." });
    } catch (e) {
      console.error(e);
      setMsg({ tone: "error", text: "Errore durante l'esportazione. Riprova." });
    }
    setBusy(false);
  }

  async function handleFileChosen(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const counts = await onImport(file);
      setMsg({ tone: "info", text: `Importazione completata: ${counts.clients} clienti, ${counts.appointments} appuntamenti.` });
    } catch (e) {
      console.error(e);
      setMsg({ tone: "error", text: "File non valido o corrotto. Verifica di aver selezionato un backup esportato da questa app." });
    }
    setBusy(false);
  }

  return (
    <ModalShell onClose={onClose} title="Backup dati">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Banner tone="info">
          I dati sono salvati in modo persistente e legati a questo gestionale. Esporta un backup ogni tanto e conservalo: ti
          permette di recuperare tutto all'istante, anche su una nuova versione dell'app.
        </Banner>

        <div style={{ background: COLORS.surface, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.line}`, display: "flex", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT_DISPLAY }}>{clientsCount}</div>
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600 }}>Clienti</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: FONT_DISPLAY }}>{appointmentsCount}</div>
            <div style={{ fontSize: 12.5, color: COLORS.inkSoft, fontWeight: 600 }}>Appuntamenti</div>
          </div>
        </div>

        <div>
          <SectionLabel icon={Download}>Esporta backup</SectionLabel>
          <div style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 8 }}>
            Scarica un unico file con tutti i clienti e gli appuntamenti (documenti e foto inclusi).
          </div>
          <BigButton icon={busy ? undefined : Download} onClick={handleExportClick} disabled={busy}>
            {busy ? <Spinner size={16} color="#fff" /> : "Scarica backup (.json)"}
          </BigButton>
        </div>

        <div>
          <SectionLabel icon={Upload}>Importa backup</SectionLabel>
          <div style={{ fontSize: 13.5, color: COLORS.inkSoft, marginBottom: 8 }}>
            Carica un file di backup esportato in precedenza. I dati importati si aggiungono a quelli esistenti (i clienti o
            appuntamenti con lo stesso ID vengono aggiornati, non duplicati).
          </div>
          <BigButton icon={busy ? undefined : Upload} variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? <Spinner size={16} /> : "Scegli file backup"}
          </BigButton>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={handleFileChosen} />
        </div>

        {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
      </div>
    </ModalShell>
  );
}

/* ============================== APP ROOT ============================== */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [tab, setTab] = useState("calendar");

  const [openApptId, setOpenApptId] = useState(null);
  const [formState, setFormState] = useState(null); // { editingAppt, presetDate } or null
  const [clientModal, setClientModal] = useState(null); // { id, isNew }
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cl, ap] = await Promise.all([dbFetchClientsList(), dbFetchAppointmentsList()]);
      if (cancelled) return;
      setClients(cl);
      setAppointments(ap);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadClientFull = useCallback(async (id) => dbFetchClientFull(id), []);
  const loadApptFull = useCallback(async (id) => dbFetchApptFull(id), []);

  function updateClientsIndex(updater) {
    setClients((prev) => updater(prev));
  }
  function updateAppointmentsIndex(updater) {
    setAppointments((prev) => updater(prev));
  }

  const handleSaveClient = useCallback(async (form, editingId) => {
    const id = editingId || newId("client");
    const full = {
      id,
      nome: form.nome.trim(),
      cognome: form.cognome.trim(),
      telefono: form.telefono.trim(),
      note: form.note || "",
      docFronte: form.docFronte || null,
      docRetro: form.docRetro || null,
      auto: form.auto || [],
      createdAt: form.createdAt || Date.now(),
    };
    const idxEntry = { id, nome: full.nome, cognome: full.cognome, telefono: full.telefono, auto: full.auto };
    updateClientsIndex((prev) => (editingId ? prev.map((c) => (c.id === id ? idxEntry : c)) : [...prev, idxEntry]));
    dbUpsertClient(full);
    return id;
  }, []);

  const handleDeleteClient = useCallback(async (id) => {
    updateClientsIndex((prev) => prev.filter((c) => c.id !== id));
    dbDeleteClient(id);
  }, []);

  const handleSaveAppointment = useCallback(async (form, editingId) => {
    let clientId = form.clientId;
    let clientFull;

    if (!clientId) {
      clientId = newId("client");
      const auto = [{ id: newId("auto"), modello: form.modello, targa: form.targa }];
      clientFull = {
        id: clientId,
        nome: form.clientNome.trim(),
        cognome: form.clientCognome.trim(),
        telefono: form.clientTelefono.trim(),
        note: form.clientNote || "",
        docFronte: form.docFronte || null,
        docRetro: form.docRetro || null,
        auto,
        createdAt: Date.now(),
      };
    } else {
      // The car list was already fetched when the client was picked in the form — no extra round-trip needed here.
      let auto = form.availableAuto || [];
      if (form.selectedAutoId === "new") {
        auto = [...auto, { id: newId("auto"), modello: form.modello, targa: form.targa }];
      } else {
        auto = auto.map((a) => (a.id === form.selectedAutoId ? { ...a, modello: form.modello, targa: form.targa } : a));
      }
      clientFull = {
        id: clientId,
        nome: form.clientNome.trim(),
        cognome: form.clientCognome.trim(),
        telefono: form.clientTelefono.trim(),
        docFronte: form.docFronte || null,
        docRetro: form.docRetro || null,
        note: form.clientNote || "",
        auto,
      };
    }
    const clientIdxEntry = { id: clientId, nome: clientFull.nome, cognome: clientFull.cognome, telefono: clientFull.telefono, auto: clientFull.auto };

    const apptId = editingId || newId("appt");
    const apptFull = {
      id: apptId,
      clientId,
      clientNome: clientFull.nome,
      clientCognome: clientFull.cognome,
      clientTelefono: clientFull.telefono,
      auto: { modello: form.modello, targa: form.targa },
      fotoAuto: form.fotoAuto || null,
      lavoro: form.lavoro.trim(),
      note: form.note || "",
      data: form.data,
      ora: form.ora,
      preventivo: form.preventivo || null,
      createdAt: editingId ? form.createdAt || Date.now() : Date.now(),
      updatedAt: Date.now(),
    };
    const apptIdxEntry = {
      id: apptId,
      clientId,
      clientNome: apptFull.clientNome,
      clientCognome: apptFull.clientCognome,
      auto: apptFull.auto,
      lavoro: apptFull.lavoro,
      data: apptFull.data,
      ora: apptFull.ora,
    };

    // Update the UI immediately (optimistic) so it feels instant — persistence happens in the background right after.
    updateClientsIndex((prev) => (form.clientId ? prev.map((c) => (c.id === clientId ? clientIdxEntry : c)) : [...prev, clientIdxEntry]));
    updateAppointmentsIndex((prev) => (editingId ? prev.map((a) => (a.id === apptId ? apptIdxEntry : a)) : [...prev, apptIdxEntry]));

    Promise.all([dbUpsertClient(clientFull), dbUpsertAppointment(apptFull)]).catch((e) => console.error("Errore salvataggio in background", e));
    return apptId;
  }, []);

  const handleRescheduleAppointment = useCallback(async (apptId, newData, newOra) => {
    // Fast path: update the visible calendar instantly, persist in the background.
    updateAppointmentsIndex((prev) => prev.map((a) => (a.id === apptId ? { ...a, data: newData, ora: newOra } : a)));
    dbUpdateAppointmentSchedule(apptId, newData, newOra).catch((e) => console.error("Errore spostamento in background", e));
  }, []);

  const handleExportBackup = useCallback(async () => {
    const [clientFulls, apptFulls] = await Promise.all([
      Promise.all(clients.map((c) => loadClientFull(c.id))),
      Promise.all(appointments.map((a) => loadApptFull(a.id))),
    ]);
    const backup = {
      appType: "gestionale-officina-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      clients: clientFulls.filter(Boolean),
      appointments: apptFulls.filter(Boolean),
    };
    const json = JSON.stringify(backup);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-officina-${todayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, [clients, appointments, loadClientFull, loadApptFull]);

  const handleImportBackup = useCallback(async (file) => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || !Array.isArray(data.clients) || !Array.isArray(data.appointments)) {
      throw new Error("Formato file non valido");
    }

    await Promise.all([...data.clients.map((c) => dbUpsertClient(c)), ...data.appointments.map((a) => dbUpsertAppointment(a))]);

    const clientIdxIncoming = data.clients.map((c) => ({
      id: c.id,
      nome: c.nome || "",
      cognome: c.cognome || "",
      telefono: c.telefono || "",
      auto: c.auto || [],
    }));
    const apptIdxIncoming = data.appointments.map((a) => ({
      id: a.id,
      clientId: a.clientId,
      clientNome: a.clientNome || "",
      clientCognome: a.clientCognome || "",
      auto: a.auto || {},
      lavoro: a.lavoro || "",
      data: a.data || "",
      ora: a.ora || "",
    }));

    updateClientsIndex((prev) => {
      const map = new Map(prev.map((c) => [c.id, c]));
      clientIdxIncoming.forEach((c) => map.set(c.id, c));
      return Array.from(map.values());
    });
    updateAppointmentsIndex((prev) => {
      const map = new Map(prev.map((a) => [a.id, a]));
      apptIdxIncoming.forEach((a) => map.set(a.id, a));
      return Array.from(map.values());
    });

    return { clients: clientIdxIncoming.length, appointments: apptIdxIncoming.length };
  }, []);

  const handleDeleteAppointment = useCallback(async (id) => {
    updateAppointmentsIndex((prev) => prev.filter((a) => a.id !== id));
    dbDeleteAppointment(id);
  }, []);

  if (loading) {
    return (
      <div className="oc-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <style>{GLOBAL_CSS}</style>
        <Wrench size={28} className="oc-spin" color={COLORS.accent} />
        <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, color: COLORS.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Caricamento officina...
        </span>
      </div>
    );
  }

  return (
    <div className="oc-root" style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{GLOBAL_CSS}</style>
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <div style={{ flex: 1, paddingBottom: 8 }}>
        {tab === "calendar" && (
          <CalendarView
            appointments={appointments}
            onOpenAppt={(id) => setOpenApptId(id)}
            onNewAtDate={(iso) => setFormState({ editingAppt: null, presetDate: iso })}
          />
        )}
        {tab === "clients" && (
          <ClientsView clientsIndex={clients} onOpenClient={(id) => setClientModal({ id, isNew: false })} onNewClient={() => setClientModal({ id: null, isNew: true })} />
        )}
        {tab === "new" && (
          <div style={{ padding: 40, textAlign: "center" }}>
            <BigButton icon={Plus} onClick={() => setFormState({ editingAppt: null, presetDate: todayISO() })}>
              Nuovo appuntamento
            </BigButton>
          </div>
        )}
      </div>

      <BottomNav tab={tab} setTab={setTab} />

      {openApptId && (
        <AppointmentDetailModal
          apptId={openApptId}
          loadApptFull={loadApptFull}
          onClose={() => setOpenApptId(null)}
          onEdit={(full) => {
            setOpenApptId(null);
            setFormState({ editingAppt: full, presetDate: null });
          }}
          onDelete={handleDeleteAppointment}
          onReschedule={handleRescheduleAppointment}
        />
      )}

      {formState && (
        <AppointmentForm
          clientsIndex={clients}
          loadClientFull={loadClientFull}
          onSaveAppointment={handleSaveAppointment}
          onDeleteAppointment={handleDeleteAppointment}
          onClose={() => setFormState(null)}
          editingAppt={formState.editingAppt}
          presetDate={formState.presetDate}
        />
      )}

      {clientModal && (
        <ClientDetailModal
          clientId={clientModal.id}
          isNew={clientModal.isNew}
          loadClientFull={loadClientFull}
          onSaveClient={handleSaveClient}
          onDeleteClient={handleDeleteClient}
          onClose={() => setClientModal(null)}
          appointmentsIndex={appointments}
          onOpenAppt={(id) => {
            setClientModal(null);
            setOpenApptId(id);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          onClose={() => setSettingsOpen(false)}
          clientsCount={clients.length}
          appointmentsCount={appointments.length}
          onExport={handleExportBackup}
          onImport={handleImportBackup}
        />
      )}
    </div>
  );
}
