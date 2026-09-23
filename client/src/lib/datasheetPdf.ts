import { jsPDF } from "jspdf";
import { getDatasheetLabels, translateTerm } from "@/lib/datasheetI18n";
import { ROBOTO_REGULAR_BASE64, ROBOTO_BOLD_BASE64 } from "@/lib/datasheetFonts";

// Embedded Unicode font — jsPDF's built-in Helvetica cannot render Polish
// characters (ł, ż, ę, ś, ć, ą, ź, ń) and mangles them.
const FONT = "Roboto";

function registerFonts(pdf: jsPDF): void {
  pdf.addFileToVFS("Roboto-Regular.ttf", ROBOTO_REGULAR_BASE64);
  pdf.addFont("Roboto-Regular.ttf", FONT, "normal");
  pdf.addFileToVFS("Roboto-Bold.ttf", ROBOTO_BOLD_BASE64);
  pdf.addFont("Roboto-Bold.ttf", FONT, "bold");
}

// Pure, DOM-free PDF layout for a product datasheet. Images must be preloaded
// (base64 data URL + natural pixel dimensions) so this can be unit-tested in
// Node. See client/src/pages/ProductView.tsx for the browser-side loader.

export interface LoadedImage {
  dataUrl: string;
  width: number; // natural pixel width (for aspect ratio)
  height: number; // natural pixel height
}

export interface DatasheetLocation {
  locationName: string;
  street: string;
  zipCity: string;
  phone: string;
}

export interface DatasheetFooter {
  companyName: string;
  companyWebsite: string;
  companyEmail: string;
  footerNote: string;
  locations: DatasheetLocation[];
}

export interface DatasheetProduct {
  productName?: string | null;
  productSubtitle?: string | null;
  language?: string | null;
  imageScale?: number | null;
  documentNumber?: string | null;
  descriptionSections?: Array<{ title: string; items: string[] }> | null;
  technicalDataColumns?: string[] | null;
  columnWidths?: number[] | null;
  technicalDataRows?: Array<{ label: string; values: string[] }> | null;
}

const imgFormat = (dataUrl: string): "PNG" | "JPEG" =>
  dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";

export function buildDatasheetPdf(opts: {
  product: DatasheetProduct;
  footer: DatasheetFooter;
  logo?: LoadedImage | null;
  productImage?: LoadedImage | null;
}): jsPDF {
  const { product, footer } = opts;
  const labels = getDatasheetLabels(product.language);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  registerFonts(pdf);

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 10;
  const contentWidth = pageWidth - 2 * margin;

  // Title
  pdf.setFontSize(20);
  pdf.setFont(FONT,"bold");
  pdf.setTextColor(80, 80, 80);
  const productName =
    translateTerm(product.productName, product.language) || "Unbenanntes Produkt";
  const titleWidth = pageWidth - 2 * margin - 60; // Leave space for logo
  const titleLines = pdf.splitTextToSize(productName, titleWidth);
  pdf.text(titleLines, margin, margin + 7);

  // Subtitle
  if (product.productSubtitle) {
    pdf.setFontSize(14);
    pdf.setFont(FONT,"normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      translateTerm(product.productSubtitle, product.language),
      margin,
      margin + 16
    );
  }

  // Fixed divider position so EVERY datasheet aligns identically, whether or
  // not a subtitle is present.
  const dividerY = 30;
  let y = dividerY;

  // Logo — top-right, constrained by width, kept fully ABOVE the divider line.
  if (opts.logo) {
    const aspect = opts.logo.width / opts.logo.height; // wide logo -> large aspect
    let logoWidth = 50; // target width in mm
    let logoHeight = logoWidth / aspect;
    // Never let the logo reach the divider line.
    const maxLogoHeight = Math.max(6, dividerY - margin - 2);
    if (logoHeight > maxLogoHeight) {
      logoHeight = maxLogoHeight;
      logoWidth = logoHeight * aspect;
    }
    const logoX = pageWidth - margin - logoWidth;
    const logoY = margin; // top-aligned with the title
    pdf.addImage(
      opts.logo.dataUrl,
      imgFormat(opts.logo.dataUrl),
      logoX,
      logoY,
      logoWidth,
      logoHeight
    );
  }

  // Divider line
  y = dividerY;
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.3);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Main content area — image on left, descriptions on right.
  // The image lives in a FIXED-height zone so that changing the image size
  // never moves the technical-data table (identical layout across datasheets).
  const startY = y;
  const IMAGE_ZONE_HEIGHT = 90; // mm reserved for the product image

  // Product image — keep aspect ratio, scaled by imageScale, but never larger
  // than the reserved zone.
  const imageScale = product.imageScale || 100;
  const scaleFactor = imageScale / 100;
  const baseMaxImgWidth = 80; // mm at 100%
  const baseMaxImgHeight = 90; // mm at 100%
  const maxImgWidth = Math.min(baseMaxImgWidth * scaleFactor, 130);
  const maxImgHeight = Math.min(baseMaxImgHeight * scaleFactor, IMAGE_ZONE_HEIGHT);

  if (opts.productImage) {
    const aspectRatio = opts.productImage.width / opts.productImage.height;
    let imgWidth: number;
    let imgHeight: number;
    if (aspectRatio > maxImgWidth / maxImgHeight) {
      imgWidth = maxImgWidth;
      imgHeight = maxImgWidth / aspectRatio;
    } else {
      imgHeight = maxImgHeight;
      imgWidth = maxImgHeight * aspectRatio;
    }
    pdf.addImage(
      opts.productImage.dataUrl,
      imgFormat(opts.productImage.dataUrl),
      margin,
      y,
      imgWidth,
      imgHeight
    );
  }

  // Description sections on the right, aligned under the logo column.
  let descY = startY;
  const descX = pageWidth - margin - 45;
  const descMaxWidth = 45 - 5;

  const descriptionSections = Array.isArray(product.descriptionSections)
    ? product.descriptionSections.filter(s => s && typeof s === "object")
    : [];

  for (const section of descriptionSections) {
    if (!section.title && (!section.items || section.items.length === 0)) continue;

    if (section.title) {
      pdf.setFontSize(9);
      pdf.setFont(FONT,"bold");
      pdf.setTextColor(120, 120, 120);
      pdf.text(translateTerm(section.title, product.language), descX, descY);
      descY += 4;
    }

    const items = Array.isArray(section.items)
      ? section.items.filter(i => i && i.trim())
      : [];
    pdf.setFontSize(9);
    pdf.setFont(FONT,"normal");
    pdf.setTextColor(60, 60, 60);

    for (const item of items) {
      const bulletWidth = 3;
      const textX = descX + bulletWidth;
      const maxWidth = descMaxWidth - bulletWidth;
      const manualLines = translateTerm(item, product.language).split("\n");
      pdf.text("•", descX, descY);
      for (let lineIdx = 0; lineIdx < manualLines.length; lineIdx++) {
        const wrappedLines = pdf.splitTextToSize(manualLines[lineIdx], maxWidth);
        for (let i = 0; i < wrappedLines.length; i++) {
          pdf.text(wrappedLines[i], textX, descY);
          descY += 4;
        }
      }
    }
    descY += 3;
  }

  // ── Fixed gap between the image zone and the technical-data heading ──
  // The table start is independent of the actual image height, so it is the
  // same on every datasheet. A long description column can still push it down.
  const IMAGE_TABLE_GAP = 12;
  y = Math.max(startY + IMAGE_ZONE_HEIGHT, descY) + IMAGE_TABLE_GAP;

  const technicalDataColumns = Array.isArray(product.technicalDataColumns)
    ? product.technicalDataColumns
    : [];
  const technicalDataRows = Array.isArray(product.technicalDataRows)
    ? product.technicalDataRows.filter(row => row && typeof row === "object")
    : [];

  // ── Footer geometry: fixed positions at the bottom of the page ──
  const companyFooterY = pageHeight - 25; // company name baseline
  const footerDividerY = companyFooterY - 5; // rule above the company block
  const noteLines = pdf.splitTextToSize(labels.footerNote, contentWidth);
  const NOTE_LINE_H = 3;
  const noteTopY = footerDividerY - 4 - noteLines.length * NOTE_LINE_H;
  // The technical-data table may grow down to here; everything below belongs to
  // the footer block and must never be overlapped by the table.
  const CONTENT_BOTTOM_LIMIT = noteTopY - 4;
  const PAGE_TOP_MARGIN = 20; // where a continued table restarts on a new page
  const rowHeight = 5;

  const drawFooter = () => {
  // ── Footer block: fixed at the bottom of the (last) page ──
  // Disclaimer note, sitting just above the company rule.
  pdf.setFontSize(7);
  pdf.setFont(FONT, "normal");
  pdf.setTextColor(120, 120, 120);
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, noteTopY - 2, pageWidth - margin, noteTopY - 2);
  pdf.text(noteLines, margin, noteTopY + NOTE_LINE_H);

  // Company footer
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, footerDividerY, pageWidth - margin, footerDividerY);
  let footerX = margin;
  pdf.setFontSize(8);
  pdf.setFont(FONT, "bold");
  pdf.setTextColor(60, 60, 60);
  pdf.text(footer.companyName, footerX, companyFooterY);
  pdf.setFont(FONT, "normal");
  let infoY = companyFooterY + 3;
  pdf.text(footer.companyWebsite, footerX, infoY);
  infoY += 3;
  pdf.text(footer.companyEmail, footerX, infoY);
  footerX += 40;

  for (const loc of footer.locations) {
    if (!loc.locationName && !loc.street && !loc.zipCity && !loc.phone) continue;
    pdf.setDrawColor(180, 180, 180);
    pdf.line(footerX, companyFooterY - 2, footerX, companyFooterY + 10);
    footerX += 3;
    pdf.setFontSize(8);
    let locY = companyFooterY;
    if (loc.locationName) {
      pdf.setFont(FONT, "bold");
      pdf.text(loc.locationName, footerX, locY);
      locY += 3;
    }
    pdf.setFont(FONT, "normal");
    if (loc.street) {
      pdf.text(loc.street, footerX, locY);
      locY += 3;
    }
    if (loc.zipCity) {
      pdf.text(loc.zipCity, footerX, locY);
      locY += 3;
    }
    if (loc.phone) {
      pdf.text("Tel. " + loc.phone, footerX, locY);
    }
    footerX += 35;
  }

  if (product.documentNumber) {
    pdf.setFontSize(7);
    pdf.setTextColor(150, 150, 150);
    pdf.text(product.documentNumber, margin, pageHeight - margin);
  }
  };

  if (technicalDataRows.length > 0) {
    // Section heading + rule (first page only)
    pdf.setFontSize(9);
    pdf.setFont(FONT, "bold");
    pdf.setTextColor(120, 120, 120);
    pdf.text(labels.technicalData, margin, y);
    y += 3;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 4;

    // Column widths
    const labelColWidth = contentWidth * 0.35;
    const hasCustomWidths =
      Array.isArray(product.columnWidths) &&
      product.columnWidths.length === technicalDataColumns.length;
    const dataColWidths: number[] = [];
    if (hasCustomWidths) {
      const remainingWidth = contentWidth - labelColWidth;
      const totalPercent = (product.columnWidths as number[]).reduce(
        (sum, w) => sum + w,
        0
      );
      for (const widthPercent of product.columnWidths as number[]) {
        dataColWidths.push((widthPercent / totalPercent) * remainingWidth);
      }
    } else {
      const equalWidth =
        (contentWidth - labelColWidth) /
        Math.max(technicalDataColumns.length, 1);
      for (let i = 0; i < technicalDataColumns.length; i++) {
        dataColWidths.push(equalWidth);
      }
    }

    // Column header row — repeated at the top of every page the table spans.
    const drawColumnHeader = () => {
      if (technicalDataColumns.length === 0) return;
      pdf.setFontSize(8);
      pdf.setFont(FONT, "bold");
      pdf.setTextColor(80, 80, 80);
      let colX = margin + labelColWidth;
      for (let i = 0; i < technicalDataColumns.length; i++) {
        const colWidth = dataColWidths[i];
        pdf.text(
          translateTerm(technicalDataColumns[i] || "", product.language),
          colX + colWidth / 2,
          y,
          { align: "center" }
        );
        colX += colWidth;
      }
      y += 5;
    };

    drawColumnHeader();

    // Data rows — grow downward; break to a new page before reaching the footer.
    pdf.setFontSize(8);
    pdf.setFont(FONT, "normal");
    let visibleIndex = 0;
    for (let i = 0; i < technicalDataRows.length; i++) {
      const row = technicalDataRows[i];
      if (!row.label || !row.label.trim()) continue;

      if (y + rowHeight > CONTENT_BOTTOM_LIMIT) {
        drawFooter();
        pdf.addPage();
        y = PAGE_TOP_MARGIN;
        drawColumnHeader();
        pdf.setFontSize(8);
        pdf.setFont(FONT, "normal");
      }

      if (visibleIndex % 2 === 0) {
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, y - 3.5, contentWidth, rowHeight, "F");
      }

      pdf.setTextColor(60, 60, 60);
      pdf.text(translateTerm(row.label, product.language), margin + 2, y);

      const values = Array.isArray(row.values) ? row.values : [];
      const numValueCols = Math.max(technicalDataColumns.length, values.length);
      let colX = margin + labelColWidth;
      const valueColWidth =
        numValueCols > 0 ? (contentWidth - labelColWidth) / numValueCols : 0;
      for (let j = 0; j < numValueCols; j++) {
        const value = values[j] || "-";
        const colWidth = dataColWidths[j] || valueColWidth;
        pdf.text(
          translateTerm(value, product.language),
          colX + colWidth / 2,
          y,
          { align: "center" }
        );
        colX += colWidth;
      }
      y += rowHeight;
      visibleIndex += 1;
    }
  }

  // Footer on every page, always at the fixed bottom position.
  drawFooter();

  return pdf;
}
