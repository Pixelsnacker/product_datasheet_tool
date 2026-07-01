/**
 * Fixed footer data for all product datasheets
 * Based on SIEPE template
 */

export const FIXED_FOOTER = {
  companyName: "Siepe GmbH",
  companyWebsite: "www.siepe.net",
  companyEmail: "verkauf@siepe.net",
  footerNote: "Die Angaben in mm, g und ml sind Circaangaben. Weitere Produktinformationen erhalten Sie auf Anfrage.",
  logoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310419663031764330/n6XisdfiUmoqasRoKN33Lg/products/1/0u71QgFdYgi7EU8I6PI3G.jpeg",
  locations: [
    {
      locationName: "Siepe GmbH",
      street: "Hüttenstr. 185",
      zipCity: "50170 Kerpen",
      phone: "+49 2273 569-0"
    },
    {
      locationName: "Siepe GmbH",
      street: "Industriestr. 25",
      zipCity: "39418 Staßfurt",
      phone: "+49 3925 8011-20"
    },
    {
      locationName: "Siepe GmbH & Co. KG",
      street: "Siemensstraße 2a",
      zipCity: "67304 Eisenberg",
      phone: "+49 63 51 13 12-0"
    }
  ]
} as const;

export type LocationData = {
  locationName: string;
  street: string;
  zipCity: string;
  phone: string;
};
