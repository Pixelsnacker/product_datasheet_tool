# Project TODO

## KRITISCH - PDF Layout komplett falsch (im Vergleich zum Muster)
- [x] Bild auf 45mm x 60mm korrigiert (kompakt wie im Muster)
- [x] Beschreibungen (MATERIAL, FARBE) erscheinen jetzt rechts neben dem Bild
- [x] Bild überlappt nicht mehr mit "TECHNISCHE DATEN" Überschrift
- [x] Ausreichend Abstand zwischen Bild-Bereich und Tabelle
- [x] Layout wie Muster-PDF: Bild links (kompakt), Beschreibungen rechts daneben

## Abgeschlossene Aufgaben

### Logo-Probleme behoben
- [x] Logo aus dem Footer entfernt (nur oben rechts)
- [x] Schwarzen Hintergrund beim Logo entfernt (JPG mit weißem Hintergrund)
- [x] Logo-Größe korrigiert (12mm Höhe)
- [x] Logo-Darstellung funktioniert korrekt

### Footer-Anpassungen
- [x] Footer mit festen Firmeninformationen und Standorten
- [x] Standorte-Bereich aus dem Bearbeitungsformular entfernt
- [x] Nur Prospektnummer als editierbares Feld behalten
- [x] Feste Standorte: Kerpen, Staßfurt, Eisenberg mit vollständigen Adressen
- [x] Schriftart und Typografie beibehalten
- [x] PDF-Export mit festem Footer getestet
- [x] Browser-Ansicht mit festem Footer getestet

### Layout-Anpassungen nach Muster-PDF
- [x] Logo oben rechts positioniert (rechtsbündig mit der Linie abschließend)
- [x] Technische Daten weiter nach unten verschoben (Platz für mindestens 10 Tabellenzeilen)
- [x] Logo-Upload-Feld aus dem Bearbeitungsformular entfernt

### Logo-Anpassungen
- [x] Logo-Unterkante bündig mit Untertitel-Unterkante ausgerichtet
- [x] Logo 15% größer gemacht
- [x] Neues Logo (SiepeLogo300DPI.png) verwendet

## Produktname Groß-/Kleinschreibung
- [x] Automatische Großschreibung des Produktnamens entfernt (PDF)
- [x] Automatische Großschreibung des Produktnamens entfernt (Browser-Ansicht)
- [x] Dashboard hatte bereits keine Großschreibung
- [x] Benutzer kann jetzt selbst entscheiden ob Groß- oder Kleinschreibung

## KRITISCH - Live-Vorschau zeigt noch Großbuchstaben
- [x] DatasheetPreview-Komponente uppercase CSS-Klassen entfernt
- [x] Produktname und Untertitel werden jetzt korrekt in Groß-/Kleinschreibung angezeigt
- [x] Eingabe wird 1:1 übernommen

## KRITISCH - Sektionentitel noch in Großbuchstaben
- [x] Beschreibungssektionen-Titel uppercase CSS entfernt
- [x] "TECHNISCHE DATEN" Überschrift uppercase CSS entfernt
- [x] ALLE Texte respektieren jetzt Groß-/Kleinschreibung

## Drucken-Button entfernen
- [x] Drucken-Button aus der Produktansicht entfernt
- [x] Nur "Link kopieren" und "PDF Download" Buttons behalten

## Mehrzeilige Einträge mit hängender Einrückung
- [x] Beschreibungssektionen (Material, Farbe, etc.) sollen mehrzeilige Einträge unterstützen
- [x] Zweite Zeile soll bündig mit dem Text der ersten Zeile beginnen (hanging indent)
- [x] Gilt für Browser-Ansicht, Live-Vorschau und PDF-Export
- [x] Browser-Ansicht: Flexbox mit flex-shrink-0 und flex-1
- [x] Live-Vorschau: Gleiche Flexbox-Implementierung
- [x] PDF-Export: splitTextToSize() mit separater X-Position für Text
- [x] Getestet mit langem Text: "Polyethylen mit hoher Dichte und UV-Stabilisierung für langlebige Outdoor-Anwendungen"

## Dynamische Tabellenspalten
- [ ] Tabellenspalten sollen produktspezifisch sein (nicht fest "30 L, 35 L, 40 L, 50 L, 60 L")
- [ ] Benutzer soll Spalten hinzufügen, bearbeiten und löschen können
- [ ] Jedes Produkt kann unterschiedliche Varianten/Größen haben
- [ ] Spaltenanzahl sollte flexibel sein (z.B. 3 Spalten für ein Produkt, 7 für ein anderes)

## Vorlagensystem für Produktkategorien
- [x] Datenbank-Schema für Vorlagen erweitern (templates Tabelle)
- [x] Backend-Prozeduren für Vorlagen (erstellen, abrufen, löschen)
- [x] UI für Vorlagen-Auswahl beim Erstellen neuer Datenblätter
- [x] Vordefinierte Vorlagen: Fässer (mit typischen Sektionen und Tabellenspalten)
- [x] Vordefinierte Vorlagen: Behälter (mit typischen Sektionen und Tabellenspalten)
- [x] Vordefinierte Vorlagen: Kanister (zusätzliche Kategorie)
- [x] "Leere Vorlage" Option für komplett neue Produkte
- [x] Vorlagen enthalten: Beschreibungssektionen, Tabellenspalten, Beispieldaten
- [x] Benutzer kann vorausgefüllte Daten nach Bedarf anpassen
- [x] Template-Auswahl-Dialog mit Icons und Kategorien
- [x] URL-Parameter für Template-ID (?template=1)
- [x] Toast-Benachrichtigung beim Laden einer Vorlage
- [x] Getestet: Fässer Standard Vorlage lädt korrekt

## Technische Daten Korrekturen
- [x] "TECHNISCHE DATEN" → "Technische Daten" (normale Kapitalisierung statt Großbuchstaben)
- [x] DatasheetPreview.tsx korrigiert
- [x] ProductView.tsx PDF-Generierung korrigiert
- [x] ProductView.tsx Browser-Ansicht korrigiert
- [x] Neue Zeilen in Tabelle oben einfügen statt unten
- [x] "Zeile hinzufügen" Button fügt neue Zeile an Position 0 ein

## Variable Spaltenbreiten für Technische Daten
- [x] Datenbank-Schema erweitern: columnWidths Array für prozentuale Breiten
- [x] Backend-Prozeduren aktualisieren für columnWidths
- [x] UI: Eingabefeld für Spaltenbreite neben jedem Spaltennamen
- [x] Standardwert: Gleichmäßige Verteilung (automatisch berechnet)
- [x] Live-Vorschau: Spaltenbreiten aus columnWidths anwenden
- [x] PDF-Export: Spaltenbreiten aus columnWidths anwenden
- [x] Browser-Ansicht: Spaltenbreiten aus columnWidths anwenden
- [x] Datenbank: columnWidths Spalte in products und templates Tabellen
- [x] Frontend: State-Management synchronisiert columnWidths mit Spalten
- [x] addColumn/removeColumn Funktionen aktualisiert
- [x] Getestet mit 4 Spalten (15%, 20%, 30%, 35%)
- [x] Alle drei Ansichten funktionieren perfekt


## Rollback zu stabiler Version
- [x] Rollback zu Version ccb997ce (vor Drag & Drop Änderungen)
- [x] Bild-Upload funktioniert wieder
- [x] PDF-Export mit Bildern funktioniert wieder
- [x] Alle stabilen Features erhalten (Variable Spaltenbreiten, Vorlagen, Hanging Indentation)

- [x] Dev-Version getestet: PDF mit Bild funktioniert (69 KB)
- [x] Browser-Ansicht zeigt Bild korrekt

## PDF-Bild CORS-Problem behoben
- [x] Server-seitigen Image-Proxy implementiert (/api/image-proxy)
- [x] Frontend loadImageAsBase64 nutzt jetzt Proxy für externe URLs
- [x] PDF-Download zeigt Bilder korrekt (89 KB mit Bild)

## Version 15.01.2026
- [x] Image-Proxy für CORS-Problem implementiert
- [x] PDF-Export mit Bildern funktioniert in Dev-Version


## Bugs behoben (15.01.2026)
- [x] Vorschau zeigt kein Bild - CORS crossOrigin Attribut entfernt
- [x] PDF hat doppeltes Logo - Logo unten rechts entfernt
- [x] Beschreibungssektionen werden jetzt angezeigt (Material, Farbe, Ausführung)
- [x] PDF-Layout korrigiert - Bild wird korrekt angezeigt

## Feature-Anfrage (15.01.2026)
- [x] Manuelle Zeilenumbrüche in Beschreibungssektionen ermöglichen


## Bug zu beheben (16.01.2026) - EINZELN
- [x] Bild im PDF verzerrt - CORS crossOrigin entfernt
- [x] Beschreibungstitel in Großbuchstaben - toUpperCase() entfernt
- [x] Zweite Spalte in Tabelle nicht sichtbar - Code korrigiert für 1-5+ Spalten
- [x] Test mit 5 Spalten erfolgreich (30 L, 35 L, 40 L, 50 L, 60 L)
- [x] Bild-Seitenverhältnis im PDF beibehalten (nicht mehr verzerrt)

## Veröffentlichung 16.01.2026
- [x] Dev-Version getestet - PDF-Download funktioniert ohne Fehler


## Bug zu beheben (19.01.2026)
- [x] Bildgröße vom Schieberegler wird im PDF nicht übernommen
- [x] Textblock (Material, Farbe etc.) soll immer rechtsbündig mit Siepe Logo sein

- [x] Textblock (Material, Farben) weiter nach rechts - rechtsbündig unter Siepe Logo

- [x] Textblock bündig unter dem "S" des Siepe-Logos positionieren (155mm von links)
- [x] Textbreite auf 40mm reduziert damit Text nicht abgeschnitten wird

- [x] Homepage-Text angepasst - "im SIEPE-Stil" entfernt

- [x] Eingabefelder in 2. Spalte (Wert-Spalte) der technischen Daten vergrößern - Werte nicht vollständig sichtbar

- [ ] Produktansicht (Permanent-Link /product/:id) ohne Login-Pflicht zugänglich machen

- [x] Team-Zugang mit Zugangscode "Siepe2026##" implementieren - vollständiger Zugriff ohne Manus-Login
- [x] Team-Login-Seite erstellen mit Passwort-Eingabe
- [x] Backend: Team-Session-Cookie setzen nach korrektem Code
- [x] Frontend: Auth-Logik anpassen - Team-Session als gültig akzeptieren

- [x] Kategorie-Feld (category) in Produkt-Tabelle hinzufügen und DB migrieren
- [x] Kategorien: Deckelbehälter/-fässer, Kombinationsbehälter, Spundbehälter/-fässer, Kanister, Flaschen, Tuben, Tiegel, Dosen, PCR-Verpackungen
- [x] Backend: create/update Routen um category-Feld erweitern
- [x] Dashboard: Produkte nach Kategorien gruppiert anzeigen (Ordner-Ansicht)
- [x] Drag & Drop zum Verschieben von Produkten zwischen Kategorien
- [x] Kategorie-Zuweisung beim Erstellen/Bearbeiten eines Produkts

- [x] BUG: Team-Login zeigt "Zugang gewährt" aber leitet nicht zum Dashboard weiter - behoben durch echtes JWT-Session-Token

- [x] Login-Schutz komplett entfernen - jeder mit dem Link kommt direkt ins System

- [x] Sprach-Feld (language: de/en) in Datenbank-Schema hinzufügen
- [x] Englische Übersetzungen für alle PDF-Bezeichnungen definieren
- [x] Sprachauswahl (DE/EN) im Produktformular hinzufügen
- [x] PDF-Generierung: Bezeichnungen je nach Sprache auf Deutsch oder Englisch ausgeben

- [x] BUG: Sprachauswahl verursacht DOM-Fehler (removeChild) durch Emoji-Flaggen - behoben durch Text-Labels "DE - Deutsch" / "EN - English"
