import { drizzle } from "drizzle-orm/mysql2";
import { mysqlTable, int, varchar, boolean, json, timestamp } from "drizzle-orm/mysql-core";

// Define templates table inline to avoid TypeScript import issues
const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 50 }),
  isSystemTemplate: boolean("isSystemTemplate").default(false).notNull(),
  descriptionSections: json("descriptionSections"),
  technicalDataColumns: json("technicalDataColumns"),
  technicalDataRows: json("technicalDataRows"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is not set");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

const systemTemplates = [
  {
    userId: null,
    name: "Fässer Standard",
    category: "Fässer",
    isSystemTemplate: true,
    descriptionSections: [
      {
        title: "MATERIAL",
        items: ["Polyethylen mit hoher Dichte (HDPE)", "UV-stabilisiert"],
      },
      {
        title: "FARBE",
        items: ["individuelle Einfärbung möglich"],
      },
      {
        title: "AUSFÜHRUNG",
        items: [
          "runde bauchige Form (R)",
          "palettengerechte Form (P)",
          "Standdeckel mit Moosgummidichtung (ST)",
        ],
      },
      {
        title: "ZULASSUNG",
        items: ["UN-Zulassung für gefährliche Güter"],
      },
    ],
    technicalDataColumns: ["30 L", "60 L", "120 L", "220 L"],
    technicalDataRows: [
      { label: "Typ", values: ["-", "-", "-", "-"] },
      { label: "Nennvolumen [l]", values: ["30", "60", "120", "220"] },
      { label: "Außendurchmesser [mm]", values: ["-", "-", "-", "-"] },
      { label: "Gesamthöhe [mm]", values: ["-", "-", "-", "-"] },
      { label: "Gewicht [kg]", values: ["-", "-", "-", "-"] },
      { label: "UN-Kennzeichnung", values: ["-", "-", "-", "-"] },
    ],
  },
  {
    userId: null,
    name: "Behälter Standard",
    category: "Behälter",
    isSystemTemplate: true,
    descriptionSections: [
      {
        title: "MATERIAL",
        items: ["Polypropylen (PP)", "lebensmittelecht"],
      },
      {
        title: "FARBE",
        items: ["transparent", "andere Farben auf Anfrage"],
      },
      {
        title: "AUSFÜHRUNG",
        items: ["mit Deckel", "stapelbar"],
      },
      {
        title: "EIGENSCHAFTEN",
        items: [
          "lebensmittelecht nach EU-Verordnung",
          "temperaturbeständig von -20°C bis +100°C",
          "spülmaschinengeeignet",
        ],
      },
    ],
    technicalDataColumns: ["Klein", "Mittel", "Groß", "XL"],
    technicalDataRows: [
      { label: "Typ", values: ["-", "-", "-", "-"] },
      { label: "Volumen [l]", values: ["-", "-", "-", "-"] },
      { label: "Länge [mm]", values: ["-", "-", "-", "-"] },
      { label: "Breite [mm]", values: ["-", "-", "-", "-"] },
      { label: "Höhe [mm]", values: ["-", "-", "-", "-"] },
      { label: "Stapelhöhe [mm]", values: ["-", "-", "-", "-"] },
    ],
  },
  {
    userId: null,
    name: "Kanister",
    category: "Kanister",
    isSystemTemplate: true,
    descriptionSections: [
      {
        title: "MATERIAL",
        items: ["Polyethylen mit hoher Dichte (HDPE)"],
      },
      {
        title: "FARBE",
        items: ["natur (weiß)", "andere Farben auf Anfrage"],
      },
      {
        title: "AUSFÜHRUNG",
        items: [
          "mit Schraubverschluss",
          "mit Tragegriff",
          "stapelbar",
        ],
      },
      {
        title: "ZULASSUNG",
        items: ["UN-Zulassung optional erhältlich"],
      },
    ],
    technicalDataColumns: ["5 L", "10 L", "20 L", "25 L"],
    technicalDataRows: [
      { label: "Typ", values: ["-", "-", "-", "-"] },
      { label: "Nennvolumen [l]", values: ["5", "10", "20", "25"] },
      { label: "Länge [mm]", values: ["-", "-", "-", "-"] },
      { label: "Breite [mm]", values: ["-", "-", "-", "-"] },
      { label: "Gesamthöhe [mm]", values: ["-", "-", "-", "-"] },
      { label: "Gewicht [kg]", values: ["-", "-", "-", "-"] },
    ],
  },
];

async function seedTemplates() {
  console.log("Seeding system templates...");
  
  try {
    for (const template of systemTemplates) {
      await db.insert(templates).values(template);
      console.log(`✓ Created template: ${template.name}`);
    }
    
    console.log("\n✅ All system templates created successfully!");
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

seedTemplates();
