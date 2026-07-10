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
