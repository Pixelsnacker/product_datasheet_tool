// Translations for the labels the datasheet generates itself (not the
// user-entered product content). Driven by the product's `language` field.

export type DatasheetLanguage = "de" | "en" | "pl" | "es";

export const DATASHEET_LANGUAGES: { value: DatasheetLanguage; label: string }[] = [
  { value: "de", label: "DE - Deutsch" },
  { value: "en", label: "EN - English" },
  { value: "pl", label: "PL - Polski" },
  { value: "es", label: "ES - Español" },
];

interface DatasheetLabels {
  technicalData: string;
  footerNote: string;
}

export const DATASHEET_LABELS: Record<DatasheetLanguage, DatasheetLabels> = {
  de: {
    technicalData: "Technische Daten",
    footerNote:
      "Die Angaben in mm, g und ml sind Circaangaben. Weitere Produktinformationen erhalten Sie auf Anfrage.",
  },
  en: {
    technicalData: "Technical Data",
    footerNote:
      "Figures in mm, g and ml are approximate. Further product information is available on request.",
  },
  pl: {
    technicalData: "Dane techniczne",
    footerNote:
      "Dane w mm, g i ml są wartościami orientacyjnymi. Dalsze informacje o produkcie dostępne na życzenie.",
  },
  es: {
    technicalData: "Datos técnicos",
    footerNote:
      "Los valores en mm, g y ml son aproximados. Más información sobre el producto disponible a petición.",
  },
};

export function getDatasheetLabels(lang?: string | null): DatasheetLabels {
  return DATASHEET_LABELS[(lang as DatasheetLanguage) ?? "de"] ?? DATASHEET_LABELS.de;
}

// ─────────────────────────────────────────────────────────────────────────────
// Glossary for the German source terms that editors type into a datasheet
// (technical-data row labels, description section titles and description
// items). Known terms are translated automatically; anything not listed stays
// as typed. Keys are matched case-insensitively and trimmed.
//
// To add a term: put the exact German wording as the key plus its en/pl/es
// translations. Numeric values (e.g. "30 L", "220") are never translated.
// ─────────────────────────────────────────────────────────────────────────────

type TermTranslations = { en: string; pl: string; es: string };

export const DATASHEET_GLOSSARY: Record<string, TermTranslations> = {
  // ── Technical-data row labels ──
  "typ": { en: "Type", pl: "Typ", es: "Tipo" },
  "nennvolumen [l]": { en: "Nominal volume [l]", pl: "Objętość nominalna [l]", es: "Volumen nominal [l]" },
  "volumen [l]": { en: "Volume [l]", pl: "Objętość [l]", es: "Volumen [l]" },
  "länge [mm]": { en: "Length [mm]", pl: "Długość [mm]", es: "Longitud [mm]" },
  "breite [mm]": { en: "Width [mm]", pl: "Szerokość [mm]", es: "Anchura [mm]" },
  "höhe [mm]": { en: "Height [mm]", pl: "Wysokość [mm]", es: "Altura [mm]" },
  "gesamthöhe [mm]": { en: "Overall height [mm]", pl: "Wysokość całkowita [mm]", es: "Altura total [mm]" },
  "außendurchmesser [mm]": { en: "Outer diameter [mm]", pl: "Średnica zewnętrzna [mm]", es: "Diámetro exterior [mm]" },
  "stapelhöhe [mm]": { en: "Stacking height [mm]", pl: "Wysokość sztaplowania [mm]", es: "Altura de apilado [mm]" },
  "gewicht [kg]": { en: "Weight [kg]", pl: "Waga [kg]", es: "Peso [kg]" },
  "un-kennzeichnung": { en: "UN marking", pl: "Oznakowanie UN", es: "Marcado UN" },

  // ── Description section titles ──
  "material": { en: "Material", pl: "Materiał", es: "Material" },
  "farbe": { en: "Colour", pl: "Kolor", es: "Color" },
  "ausführung": { en: "Version", pl: "Wykonanie", es: "Ejecución" },
  "zulassung": { en: "Approval", pl: "Dopuszczenie", es: "Homologación" },
  "eigenschaften": { en: "Properties", pl: "Właściwości", es: "Propiedades" },

  // ── Common cell values / subtitles ──
  "ja": { en: "Yes", pl: "Tak", es: "Sí" },
  "nein": { en: "No", pl: "Nie", es: "No" },
  "auf anfrage": { en: "On request", pl: "Na życzenie", es: "Bajo petición" },
  "optional": { en: "Optional", pl: "Opcjonalnie", es: "Opcional" },
  "standard": { en: "Standard", pl: "Standard", es: "Estándar" },
  "chemikalienbeständig": { en: "Chemical-resistant", pl: "Odporny na chemikalia", es: "Resistente a productos químicos" },

  // ── Description items ──
  "polyethylen mit hoher dichte (hdpe)": { en: "High-density polyethylene (HDPE)", pl: "Polietylen wysokiej gęstości (HDPE)", es: "Polietileno de alta densidad (HDPE)" },
  "polypropylen (pp)": { en: "Polypropylene (PP)", pl: "Polipropylen (PP)", es: "Polipropileno (PP)" },
  "auch pet möglich": { en: "PET also possible", pl: "PET również możliwy", es: "PET también posible" },
  "uv-stabilisiert": { en: "UV-stabilised", pl: "Stabilizowany UV", es: "Estabilizado a los rayos UV" },
  "lebensmittelecht": { en: "Food-safe", pl: "Dopuszczony do kontaktu z żywnością", es: "Apto para alimentos" },
  "lebensmittelecht nach eu-verordnung": { en: "Food-safe in accordance with EU regulation", pl: "Dopuszczony do kontaktu z żywnością zgodnie z rozporządzeniem UE", es: "Apto para alimentos según el reglamento de la UE" },
  "individuelle einfärbung möglich": { en: "Custom colouring possible", pl: "Możliwe indywidualne barwienie", es: "Posible coloración individual" },
  "andere farben auf anfrage": { en: "Other colours on request", pl: "Inne kolory na życzenie", es: "Otros colores bajo petición" },
  "natur (weiß)": { en: "Natural (white)", pl: "Naturalny (biały)", es: "Natural (blanco)" },
  "mit deckel": { en: "With lid", pl: "Z pokrywą", es: "Con tapa" },
  "mit schraubverschluss": { en: "With screw cap", pl: "Z zakrętką", es: "Con tapón roscado" },
  "mit tragegriff": { en: "With carrying handle", pl: "Z uchwytem do przenoszenia", es: "Con asa de transporte" },
  "standdeckel mit moosgummidichtung (st)": { en: "Standing lid with foam rubber seal (ST)", pl: "Pokrywa z uszczelką z gumy piankowej (ST)", es: "Tapa con junta de goma esponjosa (ST)" },
  "un-zulassung für gefährliche güter": { en: "UN approval for dangerous goods", pl: "Dopuszczenie UN dla towarów niebezpiecznych", es: "Homologación UN para mercancías peligrosas" },
  "un-zulassung optional erhältlich": { en: "UN approval available as an option", pl: "Dopuszczenie UN dostępne opcjonalnie", es: "Homologación UN disponible opcionalmente" },
  "runde bauchige form (r)": { en: "Round bulbous shape (R)", pl: "Okrągły, wybrzuszony kształt (R)", es: "Forma redonda abombada (R)" },
  "palettengerechte form (p)": { en: "Pallet-optimised shape (P)", pl: "Kształt dopasowany do palety (P)", es: "Forma adaptada a palés (P)" },
};

const isAllCaps = (value: string): boolean => {
  const letters = value.replace(/[^A-Za-zÄÖÜäöüßÀ-ÿ]/g, "");
  return letters.length > 1 && letters === letters.toUpperCase();
};

/**
 * Translate a single German source term into the datasheet language.
 * Unknown text is returned unchanged. Multi-line values are translated line by
 * line, and ALL-CAPS input keeps its ALL-CAPS styling.
 */
export function translateTerm(
  text: string | null | undefined,
  lang?: string | null
): string {
  if (!text) return text ?? "";
  const language = (lang as DatasheetLanguage) || "de";
  if (language === "de") return text;
  if (language !== "en" && language !== "pl" && language !== "es") return text;

  return text
    .split("\n")
    .map(line => {
      const hit = DATASHEET_GLOSSARY[line.trim().toLowerCase()];
      if (!hit) return line;
      const translated = hit[language];
      return isAllCaps(line) ? translated.toUpperCase() : translated;
    })
    .join("\n");
}
