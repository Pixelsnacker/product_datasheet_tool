// Serverseitige DeepL-Anbindung. Der API-Schlüssel bleibt hier (geheim) und
// wird NIE an den Browser gesendet. Der Client ruft nur die tRPC-Mutation auf.
import { ENV } from "./_core/env";

// DeepL-Zielsprachen-Codes für unsere App-Sprachen.
const DEEPL_TARGET: Record<string, string> = { en: "EN-GB", pl: "PL", es: "ES" };

/** Übersetzt eine Liste von Texten aus dem Deutschen in die Zielsprache. */
export async function deeplTranslate(texts: string[], targetLang: string): Promise<string[]> {
  const key = ENV.deeplApiKey.trim();
  if (!key) throw new Error("DeepL ist noch nicht eingerichtet (DEEPL_API_KEY fehlt).");
  const target = DEEPL_TARGET[targetLang];
  if (!target) throw new Error("Nicht unterstützte Sprache: " + targetLang);
  if (texts.length === 0) return [];

  // Free-Schlüssel enden auf ":fx" und nutzen eine andere Basis-URL als Pro.
  const base = key.endsWith(":fx") ? "https://api-free.deepl.com" : "https://api.deepl.com";
  const url = base + "/v2/translate";

  const out: string[] = [];
  const CHUNK = 45; // DeepL erlaubt bis zu 50 Texte pro Anfrage
  for (let i = 0; i < texts.length; i += CHUNK) {
    const batch = texts.slice(i, i + CHUNK);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: "DeepL-Auth-Key " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: batch,
        source_lang: "DE",
        target_lang: target,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error("DeepL-Fehler " + res.status + ": " + body.slice(0, 300));
    }
    const data = (await res.json()) as { translations: { text: string }[] };
    for (const t of data.translations) out.push(t.text);
  }
  return out;
}
