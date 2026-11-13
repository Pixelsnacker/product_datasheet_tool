// Erzeugt aus dem deutschen Original eine vollständige Übersetzung eines
// Datenblatt-Inhalts: bekannte Fachbegriffe kommen aus dem Glossar
// (translateTerm), alles Übrige über DeepL (per übergebener Funktion).
import { translateTerm, type DatasheetLanguage } from "./datasheetI18n";

export interface DatasheetContent {
  productName: string;
  productSubtitle?: string;
  descriptionSections: Array<{ title: string; items: string[] }>;
  technicalDataColumns: string[];
  technicalDataRows: Array<{ label: string; values: string[] }>;
}

export interface StoredTranslation extends DatasheetContent {
  translatedAt: string;
  sourceHash: string;
}

const hasLetters = (s: string) => /[A-Za-zÄÖÜäöüßÀ-ÿ]/.test(s);
const isAllCaps = (s: string) => {
  const letters = s.replace(/[^A-Za-zÄÖÜäöüßÀ-ÿ]/g, "");
  return letters.length > 1 && letters === letters.toUpperCase();
};

/** Stabiler, kurzer Hash des übersetzbaren Inhalts (erkennt spätere Änderungen am Original). */
export function hashSource(c: DatasheetContent): string {
  const payload = JSON.stringify({
    n: c.productName || "",
    s: c.productSubtitle || "",
    d: (c.descriptionSections || []).map(x => ({ t: x.title, i: x.items })),
    c: c.technicalDataColumns || [],
    r: (c.technicalDataRows || []).map(x => ({ l: x.label, v: x.values })),
  });
  let h = 5381;
  for (let i = 0; i < payload.length; i++) h = ((h << 5) + h + payload.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/** Baut die flache Nachschlage-Tabelle Quelle→Übersetzung für die Anzeige. */
export function buildOverrideMap(source: DatasheetContent, tr: DatasheetContent): Record<string, string> {
  const map: Record<string, string> = {};
  const put = (from?: string, to?: string) => {
    if (from == null || to == null) return;
    const key = String(from).trim();
    if (key) map[key] = to;
  };
  put(source.productName, tr.productName);
  put(source.productSubtitle, tr.productSubtitle);
  (source.descriptionSections || []).forEach((sec, i) => {
    const t = tr.descriptionSections?.[i];
    if (!t) return;
    put(sec.title, t.title);
    (sec.items || []).forEach((it, j) => put(it, t.items?.[j]));
  });
  (source.technicalDataColumns || []).forEach((col, i) => put(col, tr.technicalDataColumns?.[i]));
  (source.technicalDataRows || []).forEach((row, i) => {
    const t = tr.technicalDataRows?.[i];
    if (!t) return;
    put(row.label, t.label);
    (row.values || []).forEach((v, j) => put(v, t.values?.[j]));
  });
  return map;
}

/**
 * Übersetzt den gesamten Inhalt. deeplFn bekommt eine Liste deutscher Texte und
 * liefert die Übersetzungen in gleicher Reihenfolge zurück.
 */
export async function translateProductContent(
  source: DatasheetContent,
  lang: DatasheetLanguage,
  deeplFn: (texts: string[]) => Promise<string[]>
): Promise<StoredTranslation> {
  // 1) Für jeden Text entscheiden: Glossar-Treffer, DeepL oder unverändert (Zahlen).
  const needDeepl = new Set<string>();
  const decide = (s: string): { done?: string } => {
    if (!s || !s.trim()) return { done: s };
    const g = translateTerm(s, lang); // nur Glossar (ohne Override)
    if (g !== s) return { done: g };   // Glossar-Treffer
    if (!hasLetters(s)) return { done: s }; // reine Zahlen/Zeichen bleiben
    needDeepl.add(s);
    return {}; // per DeepL
  };

  // Alle Felder einmal durchgehen, um needDeepl zu füllen.
  decide(source.productName);
  if (source.productSubtitle) decide(source.productSubtitle);
  (source.descriptionSections || []).forEach(sec => { decide(sec.title); (sec.items || []).forEach(decide); });
  (source.technicalDataColumns || []).forEach(decide);
  (source.technicalDataRows || []).forEach(row => { decide(row.label); (row.values || []).forEach(decide); });

  // 2) DeepL einmal für alle unbekannten Texte aufrufen.
  const deeplList = Array.from(needDeepl);
  const deeplResult = deeplList.length ? await deeplFn(deeplList) : [];
  const deeplMap = new Map<string, string>();
  deeplList.forEach((src, i) => deeplMap.set(src, deeplResult[i] ?? src));

  // 3) Einen Text final übersetzen (Glossar → DeepL → unverändert), Großschreibung erhalten.
  const tr = (s: string): string => {
    if (!s || !s.trim()) return s;
    const g = translateTerm(s, lang);
    if (g !== s) return g;
    if (!hasLetters(s)) return s;
    const d = deeplMap.get(s) ?? s;
    return isAllCaps(s) ? d.toUpperCase() : d;
  };

  return {
    productName: tr(source.productName),
    productSubtitle: source.productSubtitle ? tr(source.productSubtitle) : source.productSubtitle,
    descriptionSections: (source.descriptionSections || []).map(sec => ({
      title: tr(sec.title),
      items: (sec.items || []).map(tr),
    })),
    technicalDataColumns: (source.technicalDataColumns || []).map(tr),
    technicalDataRows: (source.technicalDataRows || []).map(row => ({
      label: tr(row.label),
      values: (row.values || []).map(tr),
    })),
    translatedAt: new Date().toISOString(),
    sourceHash: hashSource(source),
  };
}
