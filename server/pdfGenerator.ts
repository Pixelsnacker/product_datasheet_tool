import puppeteer from 'puppeteer';

interface DescriptionSection {
  title: string;
  items: string[];
}

interface TechnicalDataRow {
  label: string;
  values: string[];
}

interface LocationData {
  locationName: string;
  street: string;
  zipCity: string;
  phone: string;
}

interface ProductData {
  productName: string;
  productSubtitle?: string | null;
  imageUrl?: string | null;
  imageScale?: number | null;
  descriptionSections?: DescriptionSection[] | null;
  technicalDataColumns?: string[] | null;
  technicalDataRows?: TechnicalDataRow[] | null;
  companyName?: string | null;
  companyWebsite?: string | null;
  companyEmail?: string | null;
  locations?: LocationData[] | null;
  logoUrl?: string | null;
  footerNote?: string | null;
  documentNumber?: string | null;
  language?: string | null;
}

// Translation labels for PDF
const translations = {
  de: {
    technicalData: "TECHNISCHE DATEN",
  },
  en: {
    technicalData: "TECHNICAL DATA",
  },
};

export interface PdfSettingsData {
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  fontSizeTitle: number;
  fontSizeSubtitle: number;
  fontSizeHeading: number;
  fontSizeText: number;
  fontSizeTable: number;
  fontSizeFooter: number;
  sectionSpacing: number;
  lineHeight: number;
  maxImageHeight: number;
  logoHeight: number;
  tableRowPadding: number;
}

const defaultSettings: PdfSettingsData = {
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  fontSizeTitle: 18,
  fontSizeSubtitle: 14,
  fontSizeHeading: 9,
  fontSizeText: 8,
  fontSizeTable: 7,
  fontSizeFooter: 6,
  sectionSpacing: 8,
  lineHeight: 130,
  maxImageHeight: 180,
  logoHeight: 32,
  tableRowPadding: 4,
};

export async function generateProductPDF(product: ProductData, settings?: Partial<PdfSettingsData>): Promise<Buffer> {
  const mergedSettings = { ...defaultSettings, ...settings };
  const html = generateHTML(product, mergedSettings);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      preferCSSPageSize: true,
    });
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('PDF-Generierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function generateHTML(product: ProductData, s: PdfSettingsData): string {
  const lang = (product.language === 'en') ? 'en' : 'de';
  const t = translations[lang];
  const descriptionSections = product.descriptionSections || [];
  const technicalDataColumns = product.technicalDataColumns || [];
  const technicalDataRows = (product.technicalDataRows || []) as TechnicalDataRow[];
  const locations = product.locations || [];
  const imageScale = product.imageScale || 100;
  
  // Calculate available height
  const pageHeight = 297; // mm
  const contentHeight = pageHeight - s.marginTop - s.marginBottom;

  return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.productName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: A4;
      margin: 0;
    }
    
    html, body {
      width: 210mm;
      height: 297mm;
      overflow: hidden;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: ${s.fontSizeText}px;
      line-height: ${s.lineHeight / 100};
      color: #333;
      background: white;
      padding: ${s.marginTop}mm ${s.marginRight}mm ${s.marginBottom}mm ${s.marginLeft}mm;
    }
    
    .container {
      width: 100%;
      height: ${contentHeight}mm;
      max-height: ${contentHeight}mm;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      page-break-inside: avoid;
      page-break-after: avoid;
      break-inside: avoid;
    }
    
    .header {
      margin-bottom: ${s.sectionSpacing}px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: ${s.sectionSpacing / 2}px;
    }
    
    .product-name {
      font-size: ${s.fontSizeTitle}px;
      font-weight: bold;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 1px;
    }
    
    .product-subtitle {
      font-size: ${s.fontSizeSubtitle}px;
      color: #6b7280;
      text-transform: uppercase;
    }
    
    .main-content {
      display: flex;
      gap: 12px;
      margin-bottom: ${s.sectionSpacing}px;
      flex: 0 0 auto;
    }
    
    .image-section {
      width: 35%;
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    
    .product-image {
      max-width: 100%;
      max-height: ${s.maxImageHeight}px;
      object-fit: contain;
    }
    
    .description-section {
      width: 65%;
    }
    
    .desc-block {
      margin-bottom: ${s.sectionSpacing / 2}px;
    }
    
    .desc-title {
      font-size: ${s.fontSizeHeading}px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 1px;
      letter-spacing: 0.3px;
    }
    
    .desc-items {
      list-style: none;
      padding-left: 0;
    }
    
    .desc-items li {
      font-size: ${s.fontSizeText}px;
      color: #374151;
      padding-left: 8px;
      position: relative;
      margin-bottom: 0px;
    }
    
    .desc-items li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #9ca3af;
    }
    
    .technical-section {
      margin-bottom: ${s.sectionSpacing}px;
      flex: 1 1 auto;
      max-height: 45%;
      overflow: hidden;
    }
    
    .technical-title {
      font-size: ${s.fontSizeHeading}px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 3px;
      padding-bottom: 2px;
      border-bottom: 1px solid #e5e7eb;
      letter-spacing: 0.3px;
    }
    
    .technical-table {
      width: 100%;
      border-collapse: collapse;
      font-size: ${s.fontSizeTable}px;
    }
    
    .technical-table th {
      padding: ${s.tableRowPadding}px;
      font-size: ${s.fontSizeTable}px;
      font-weight: 600;
      color: #374151;
      text-align: center;
      border-bottom: 1px solid #d1d5db;
      background: #f3f4f6;
    }
    
    .technical-table th:first-child {
      text-align: left;
    }
    
    .technical-table tr:nth-child(odd) td {
      background: #f9fafb;
    }
    
    .technical-table tr:nth-child(even) td {
      background: #ffffff;
    }
    
    .technical-table td {
      padding: ${s.tableRowPadding}px;
      font-size: ${s.fontSizeTable}px;
      border-bottom: 1px solid #e5e7eb;
      text-align: center;
    }
    
    .technical-table td:first-child {
      color: #374151;
      text-align: left;
      font-weight: 500;
    }
    
    .footer-note {
      font-size: ${s.fontSizeFooter}px;
      color: #9ca3af;
      margin-bottom: ${s.sectionSpacing / 2}px;
      padding-top: 3px;
      border-top: 1px solid #e5e7eb;
    }
    
    .company-footer {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding-top: ${s.sectionSpacing / 2}px;
      border-top: 1px solid #e5e7eb;
      margin-top: auto;
      flex-shrink: 0;
    }
    
    .company-info {
      display: flex;
      gap: 0;
      flex-wrap: wrap;
      flex: 1;
    }
    
    .company-block {
      font-size: ${s.fontSizeFooter}px;
      color: #6b7280;
      padding-right: 8px;
    }
    
    .company-block.with-border {
      padding-left: 8px;
      border-left: 1px solid #d1d5db;
    }
    
    .company-block strong {
      display: block;
      color: #374151;
      margin-bottom: 0px;
    }
    
    .logo-container {
      display: flex;
      align-items: flex-end;
      justify-content: flex-end;
      flex-shrink: 0;
    }
    
    .company-logo {
      height: ${s.logoHeight}px;
      max-width: 100px;
      object-fit: contain;
    }
    
    .document-number {
      font-size: ${s.fontSizeFooter}px;
      color: #9ca3af;
      margin-top: 3px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1 class="product-name">${product.productName}</h1>
      ${product.productSubtitle ? `<h2 class="product-subtitle">${product.productSubtitle}</h2>` : ''}
    </div>
    
    <!-- Main Content -->
    <div class="main-content">
      <div class="image-section">
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.productName}" class="product-image" style="width: ${imageScale}%; max-width: 100%;">` : ''}
      </div>
      <div class="description-section">
        ${descriptionSections.map(section => `
          <div class="desc-block">
            <h3 class="desc-title">${section.title}</h3>
            <ul class="desc-items">
              ${section.items.filter(item => item.trim()).map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
    
    <!-- Technical Data with Multiple Columns -->
    ${technicalDataRows.length > 0 ? `
      <div class="technical-section">
        <h3 class="technical-title">${t.technicalData}</h3>
        <table class="technical-table">
          ${technicalDataColumns.length > 0 ? `
            <thead>
              <tr>
                <th></th>
                ${technicalDataColumns.map(col => `<th>${col}</th>`).join('')}
              </tr>
            </thead>
          ` : ''}
          <tbody>
            ${technicalDataRows.filter(row => row.label.trim()).map(row => `
              <tr>
                <td>${row.label}</td>
                ${row.values.map(val => `<td>${val || '-'}</td>`).join('')}
                ${Array.from({ length: Math.max(0, technicalDataColumns.length - row.values.length) }).map(() => '<td>-</td>').join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}
    
    <!-- Footer Note -->
    ${product.footerNote ? `<p class="footer-note">${product.footerNote}</p>` : ''}
    
    <!-- Company Footer -->
    <div class="company-footer">
      <div class="company-info">
        ${product.companyName ? `
          <div class="company-block">
            <strong>${product.companyName}</strong>
            ${product.companyWebsite ? `<div>${product.companyWebsite}</div>` : ''}
            ${product.companyEmail ? `<div>${product.companyEmail}</div>` : ''}
          </div>
        ` : ''}
        ${locations.map((loc, index) => `
          <div class="company-block ${index > 0 || product.companyName ? 'with-border' : ''}">
            ${loc.locationName ? `<strong>${loc.locationName}</strong>` : ''}
            ${loc.street ? `<div>${loc.street}</div>` : ''}
            ${loc.zipCity ? `<div>${loc.zipCity}</div>` : ''}
            ${loc.phone ? `<div>Tel. ${loc.phone}</div>` : ''}
          </div>
        `).join('')}
      </div>
      <!-- Logo nur oben rechts, nicht im Footer -->
    </div>
    
    <!-- Document Number -->
    ${product.documentNumber ? `<p class="document-number">${product.documentNumber}</p>` : ''}
  </div>
</body>
</html>
  `;
}
