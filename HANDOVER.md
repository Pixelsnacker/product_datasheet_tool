# Übergabe-Dokumentation — Produkt-Datenblatt-Tool

Dieses Dokument richtet sich an eine technische Person (IT / Entwickler:in), die
den Betrieb und die Weiterentwicklung dieses Tools übernimmt. Es beschreibt, wo
alles liegt, wie es läuft, wie man es deployed und welche Besonderheiten es gibt.

> Ergänzend: `SETUP.md` (Setup-Schritte im Detail), `README`/Code-Kommentare.

---

## 1. Was ist das Tool?

Ein Web-Tool zum Erstellen von **Produkt-Datenblättern als PDF**. Man pflegt
Produkte (Name, Bild, Beschreibungsblöcke, technische Daten in Spalten,
Firmen-/Standortdaten), wählt optional ein Template und exportiert das Datenblatt
als PDF (Layout im SIEPE-Stil).

**Ursprung:** Ursprünglich auf der Plattform *Manus* generiert, dann von den
Manus-Abhängigkeiten gelöst und eigenständig auf **Railway** deployed.

---

## 2. Zugänge, die der/die Nachfolger:in braucht

| Zugang | Wofür | Wie übergeben |
|--------|-------|---------------|
| **GitHub** `Pixelsnacker/product_datasheet_tool` | Quellcode, Deployments | Als Collaborator einladen oder Konto-Zugang |
| **Railway** (Projekt „heroic-spontaneity") | Hosting, DB, Env-Variablen, Logs | In Railway-Projekt einladen (Members) |
| **TEAM_ACCESS_CODE** | Login ins laufende Tool | Wert aus Railway-Variablen weitergeben |
| **Env-Werte** (JWT_SECRET etc.) | Betrieb | Liegen in Railway → Variables |

> Der GitHub-Push-Token, der beim Einrichten genutzt wurde, liegt im macOS-
> Schlüsselbund des ursprünglichen Rechners. Die neue Person legt sich ein
> **eigenes** Token / eigene Zugänge an.

---

## 3. Wo alles liegt

- **Quellcode (GitHub):** https://github.com/Pixelsnacker/product_datasheet_tool
- **Hosting (Railway):** Projekt **„heroic-spontaneity"**, Environment `production`
  - Dienst **„Datenblatt Konfigurator"** — die App (deployt vom GitHub-Branch `main`)
  - Dienst **„MySQL"** — die Datenbank
  - Volume **„datenblatt-konfigurator-volume"** — Bild-Speicher, Mount `/data`, 5 GB
- **Live-URL:** https://datenblatt-konfigurator-production.up.railway.app

---

## 4. Technischer Aufbau

**Stack**
- Frontend: React 19 + Vite, TailwindCSS 4, shadcn/ui (Radix), Wouter (Routing),
  tRPC-Client + TanStack Query
- Backend: Express + tRPC, Drizzle ORM auf **MySQL** (`mysql2`)
- PDF: **jsPDF** (client-seitig, aktiver Download-Weg) und **Puppeteer**
  (server-seitig, siehe Abschnitt 10)
- Sprache: TypeScript, Paketmanager **pnpm**

**Wichtige Verzeichnisse/Dateien**
```
client/          Frontend (React)
  src/pages/     Seiten (Dashboard, ProductForm, ProductView, PdfSettings …)
  src/components/DatasheetPreview.tsx  Live-Vorschau des Datenblatts
server/
  _core/         Infrastruktur (index.ts = Serverstart, trpc, auth, context, vite)
  routers.ts     tRPC-API (products, templates, pdfSettings, upload, auth …)
  db.ts          Datenbankzugriffe (Drizzle)
  storage.ts     Datei-Uploads (lokales FS / Railway-Volume)
  pdfGenerator.ts  Server-PDF (Puppeteer) — siehe Abschnitt 10
drizzle/         DB-Schema (schema.ts) + Migrationen (VERALTET, s. Abschnitt 7)
SETUP.md         Setup-Anleitung
HANDOVER.md      dieses Dokument
```

**Datenmodell** (MySQL, definiert in `drizzle/schema.ts`): 4 Tabellen —
`users`, `products`, `templates`, `pdfSettings`.

**npm/pnpm-Scripts** (`package.json`)
| Script | Zweck |
|--------|-------|
| `pnpm dev` | lokaler Dev-Server (Hot Reload) |
| `pnpm build` | Produktions-Build (Client + Server) |
| `pnpm start` | Produktion starten (nach build) |
| `pnpm check` | TypeScript-Typprüfung |
| `pnpm test` | Tests (Vitest) |
| `pnpm seed:owner` | Owner-User anlegen (für Login) |
| `pnpm seed:templates` | Standard-Templates einspielen |
| `pnpm db:migrate` | Migrationen anwenden — ⚠️ s. Abschnitt 7 |

---

## 5. Deployment (wie Änderungen live gehen)

Railway ist mit dem GitHub-Repo verbunden: **jeder Push auf den Branch `main`
löst automatisch einen Neubau + Deployment aus.** Ablauf:

```bash
git add -A
git commit -m "…"
git push origin main        # -> Railway baut & deployt automatisch
```

- Build-Command: `pnpm build` · Start-Command: `pnpm start` (von Railway erkannt)
- Logs & Status: Railway → Dienst „Datenblatt Konfigurator" → *Deployments* / *Logs*
- Rollback: in Railway ein früheres Deployment „Redeploy"en

---

## 6. Environment-Variablen (Referenz)

Gesetzt in Railway → Dienst „Datenblatt Konfigurator" → **Variables**. Vorlage:
`.env.example`.

| Variable | Zweck |
|----------|-------|
| `DATABASE_URL` | MySQL-Verbindung |
| `JWT_SECRET` | Signatur der Login-Sitzungen (Cookies) |
| `OWNER_OPEN_ID` | ID des Owner-Users (`owner`) — muss in `users` existieren |
| `TEAM_ACCESS_CODE` | gemeinsames Login-Passwort (Team-Login) |
| `VITE_APP_ID` | App-Kennung (auch clientseitig; **darf nicht leer sein**, sonst Login kaputt) |
| `NODE_ENV` | `production` |
| `UPLOAD_DIR` | `/data/uploads` (auf dem Volume) |
| `PUBLIC_BASE_URL` | öffentliche App-URL — nötig, damit PDFs Bilder laden |
| `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` | optional (Manus-OAuth); leer = aus |

---

## 7. Datenbank — ⚠️ wichtige Besonderheit

Das Schema ist die **Quelle der Wahrheit** in `drizzle/schema.ts`.

**Achtung:** Die Migrations-Dateien in `drizzle/*.sql` sind **veraltet** und
passen NICHT mehr zum aktuellen Schema (Altlast aus der Manus-Zeit). Die
Live-Datenbank wurde deshalb **nicht** per `pnpm db:migrate`, sondern per
`drizzle-kit push` (direkter Abgleich Schema → DB) eingerichtet:

```bash
DATABASE_URL="<mysql-url>" pnpm exec drizzle-kit push
```

**Empfehlung für die Übernahme:** Migrationen einmal sauber neu generieren
(alte `drizzle/*.sql` verwerfen, `drizzle-kit generate` gegen das aktuelle
Schema), damit `db:migrate` wieder verlässlich funktioniert. Bis dahin: für
Schema-Änderungen `drizzle-kit push` verwenden.

**Erststart/Neuaufsetzen einer DB:**
```bash
DATABASE_URL="…" pnpm exec drizzle-kit push   # Tabellen anlegen
DATABASE_URL="…" OWNER_OPEN_ID=owner pnpm seed:owner
DATABASE_URL="…" pnpm seed:templates          # optional
```

**Zugriff/Backup:** MySQL läuft als Railway-Dienst. Public-Connection-URL unter
MySQL → *Variables* → `MYSQL_PUBLIC_URL`. Backups über Railway (Dienst → *Backups*)
oder klassisch `mysqldump`.

---

## 8. Bild-Speicher

Hochgeladene Produktbilder werden als **Dateien** gespeichert (nicht in einer
Cloud), und zwar auf einem **Railway-Volume**:

- Volume gemountet unter **`/data`**, `UPLOAD_DIR=/data/uploads`
- Ausgeliefert von der App selbst unter `/uploads/...` (siehe
  `server/_core/index.ts` → `express.static`)
- `storagePut` (in `server/storage.ts`) schreibt die Datei und gibt eine
  **absolute** URL zurück (`PUBLIC_BASE_URL` + `/uploads/...`) — absolut, weil
  die PDF-Erzeugung die Bilder sonst nicht laden kann.

> Wichtig: Das Volume ist der einzige Ort, an dem Bilder dauerhaft liegen. Ohne
> Volume (oder bei falschem Mount-Pfad) gehen Bilder bei jedem Deploy verloren.

---

## 9. Login & Sicherheit — ⚠️ bitte bewusst sein

Der Login läuft über einen **gemeinsamen Team-Code** (`TEAM_ACCESS_CODE`), der
alle als „Owner" anmeldet. **Zusätzlich** gibt es einen Fallback in
`server/_core/context.ts`: Ist keine gültige Sitzung vorhanden, wird der/die
Besucher:in **automatisch als Owner** behandelt.

**Konsequenz:** Aktuell hat das Tool **keine echte Zugriffssperre** — wer die
URL kennt, ist praktisch drin. Für ein internes Werkzeug oft vertretbar. Wenn
echte Zugangskontrolle gewünscht ist, muss der Owner-Fallback in `context.ts`
entfernt und ein echter Login (z. B. nur Team-Code, ohne Auto-Owner) erzwungen
werden.

Manus-OAuth (echter Einzel-Login pro Nutzer) ist im Code vorhanden, aber
deaktiviert (`OAUTH_SERVER_URL`/`VITE_OAUTH_PORTAL_URL` leer).

---

## 10. PDF-Erzeugung — zwei Wege (wichtig zu wissen)

Es gibt **zwei** PDF-Codepfade:

1. **Client-seitig (jsPDF)** — `client/src/pages/ProductView.tsx`,
   Funktion `handleDownloadPdf`. **Das ist der aktive Weg** hinter dem
   „PDF Download"-Button. Layout (Logo-Größe, Linien, Spalten) wird hier mit
   jsPDF-Befehlen gezeichnet.
2. **Server-seitig (Puppeteer)** — `server/pdfGenerator.ts`, aufgerufen über die
   tRPC-Prozedur `products.generatePdf`. Erzeugt HTML und rendert es mit
   headless Chrome. **Aktuell vom Download-Button nicht genutzt.**

> Wer am PDF-**Aussehen** schraubt, ändert i. d. R. `ProductView.tsx` (Weg 1).
> Puppeteer (Weg 2) braucht auf dem Server eine Chromium-Runtime; falls dieser
> Weg reaktiviert wird, ggf. `puppeteer`-Cache/Executable auf Railway
> konfigurieren.

---

## 11. Lokal entwickeln

```bash
pnpm install
cp .env.example .env         # Werte eintragen (mind. DATABASE_URL, JWT_SECRET,
                             #   OWNER_OPEN_ID, TEAM_ACCESS_CODE, VITE_APP_ID)
pnpm exec drizzle-kit push   # Tabellen in lokaler/entfernter MySQL anlegen
pnpm seed:owner              # Owner-User
pnpm dev                     # http://localhost:3000
```

Für lokale Bild-Uploads reicht `UPLOAD_DIR=./uploads` (Standard); `PUBLIC_BASE_URL`
kann lokal leer bleiben (dann relative Bild-URLs).

---

## 12. Bekannte Einschränkungen / offene To-dos

- **Veraltete Migrationen** (Abschnitt 7) — neu generieren empfohlen.
- **Keine echte Zugriffssperre** (Abschnitt 9) — bei Bedarf härten.
- **Zwei PDF-Pfade** (Abschnitt 10) — der Server-Pfad ist ungenutzter Altbestand;
  ggf. konsolidieren.
- Ungenutzte Demo-Komponenten im Client (z. B. `AIChatBox`, `ComponentShowcase`,
  `Map`) — Reste aus dem Manus-Template, können aufgeräumt werden.
- Große Client-Bundle-Warnung beim Build (kein Fehler; ggf. Code-Splitting).

---

## 13. Typische Wartungsaufgaben

- **Änderung deployen:** committen + `git push origin main` (Railway deployt).
- **Owner/Team-Code ändern:** Railway-Variable `TEAM_ACCESS_CODE` anpassen.
- **DB-Backup:** Railway → MySQL → *Backups*, oder `mysqldump` via `MYSQL_PUBLIC_URL`.
- **Neuen Standort/Firmendaten:** über die App-Oberfläche (PDF-Einstellungen/Produkt).
- **Logs prüfen:** Railway → Dienst → *Logs* / *Deployments*.

---

## 14. Kurz-Troubleshooting

| Symptom | Ursache / Lösung |
|---------|------------------|
| App lädt, aber „Sign in"/keine Daten | `OWNER_OPEN_ID`-User fehlt in DB → `pnpm seed:owner`; `VITE_APP_ID` leer? |
| „Fehler beim Hochladen" (Bild) | `UPLOAD_DIR`/Volume nicht gesetzt oder Mount ≠ `/data` |
| Bilder nach Deploy verschwunden | Volume fehlt oder falscher Mount-Pfad |
| PDF ohne Bild | `PUBLIC_BASE_URL` nicht gesetzt (Bild-URL relativ) |
| DB-Fehler „Unknown column …" | Schema-Drift → `drizzle-kit push` (Abschnitt 7) |
| Absturz bei Browser-Übersetzung | bereits abgefangen in `client/src/main.tsx` |
