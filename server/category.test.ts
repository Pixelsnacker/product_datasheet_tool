import { describe, it, expect } from "vitest";

// Test category constants and logic
const PRODUCT_CATEGORIES = [
  "Deckelbehälter/-fässer",
  "Kombinationsbehälter",
  "Spundbehälter/-fässer",
  "Kanister",
  "Flaschen",
  "Tuben",
  "Tiegel",
  "Dosen",
  "PCR-Verpackungen",
] as const;

const UNCATEGORIZED = "Ohne Kategorie";

describe("Product Category Logic", () => {
  it("should have 9 predefined categories", () => {
    expect(PRODUCT_CATEGORIES.length).toBe(9);
  });

  it("should include all required categories", () => {
    expect(PRODUCT_CATEGORIES).toContain("Deckelbehälter/-fässer");
    expect(PRODUCT_CATEGORIES).toContain("Kombinationsbehälter");
    expect(PRODUCT_CATEGORIES).toContain("Spundbehälter/-fässer");
    expect(PRODUCT_CATEGORIES).toContain("Kanister");
    expect(PRODUCT_CATEGORIES).toContain("Flaschen");
    expect(PRODUCT_CATEGORIES).toContain("Tuben");
    expect(PRODUCT_CATEGORIES).toContain("Tiegel");
    expect(PRODUCT_CATEGORIES).toContain("Dosen");
    expect(PRODUCT_CATEGORIES).toContain("PCR-Verpackungen");
  });

  it("should group products by category correctly", () => {
    const products = [
      { id: 1, productName: "Fass 1", category: "Deckelbehälter/-fässer" },
      { id: 2, productName: "Fass 2", category: "Deckelbehälter/-fässer" },
      { id: 3, productName: "Kanister 1", category: "Kanister" },
      { id: 4, productName: "Ohne Kat", category: null },
    ];

    const groups: Record<string, typeof products> = {};
    for (const cat of [...PRODUCT_CATEGORIES, UNCATEGORIZED]) {
      groups[cat] = [];
    }
    for (const product of products) {
      const cat = product.category && PRODUCT_CATEGORIES.includes(product.category as any)
        ? product.category
        : UNCATEGORIZED;
      groups[cat].push(product);
    }

    expect(groups["Deckelbehälter/-fässer"].length).toBe(2);
    expect(groups["Kanister"].length).toBe(1);
    expect(groups[UNCATEGORIZED].length).toBe(1);
    expect(groups["Flaschen"].length).toBe(0);
  });

  it("should put unknown categories into UNCATEGORIZED", () => {
    const product = { id: 1, productName: "Test", category: "UnbekannteKategorie" };
    const cat = product.category && PRODUCT_CATEGORIES.includes(product.category as any)
      ? product.category
      : UNCATEGORIZED;
    expect(cat).toBe(UNCATEGORIZED);
  });

  it("should handle null category as UNCATEGORIZED", () => {
    const product = { id: 1, productName: "Test", category: null };
    const cat = product.category && PRODUCT_CATEGORIES.includes(product.category as any)
      ? product.category
      : UNCATEGORIZED;
    expect(cat).toBe(UNCATEGORIZED);
  });
});
