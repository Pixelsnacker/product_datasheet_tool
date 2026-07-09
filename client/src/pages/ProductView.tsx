import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Copy, Check, Download } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { jsPDF } from 'jspdf';
// Fixed footer data for all product datasheets
const FIXED_FOOTER: {
  companyName: string;
  companyWebsite: string;
  companyEmail: string;
  footerNote: string;
  logoUrl: string;
  locations: LocationData[];
} = {
  companyName: "Siepe GmbH",
  companyWebsite: "www.siepe.net",
  companyEmail: "verkauf@siepe.net",
  footerNote: "Die Angaben in mm, g und ml sind Circaangaben. Weitere Produktinformationen erhalten Sie auf Anfrage.",
  logoUrl: "/siepe-logo.jpg",
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
};

type LocationData = {
  locationName: string;
  street: string;
  zipCity: string;
  phone: string;
};

interface TechnicalDataRow {
  label: string;
  values: string[];
}



interface DescriptionSection {
  title: string;
  items: string[];
}

export default function ProductView() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const datasheetRef = useRef<HTMLDivElement>(null);
  
  const { data: product, isLoading } = trpc.products.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: !!id }
  );



  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link kopiert!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper function to load image as base64 via proxy to bypass CORS
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Kein crossOrigin - CloudFront sendet keine CORS-Header
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.9));
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Use proxy for external URLs (CloudFront/S3) to bypass CORS
      if (url.startsWith('http') && !url.startsWith(window.location.origin)) {
        img.src = `/api/image-proxy?url=${encodeURIComponent(url)}`;
      } else {
        img.src = url;
      }
    });
  };

  const handleDownloadPdf = async () => {
    if (!product) {
      toast.error("Produktdaten nicht verfügbar");
      return;
    }
    
    setIsGeneratingPdf(true);
    try {
      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const contentWidth = pageWidth - 2 * margin;
      
      let y = margin;
      
      // Title
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(80, 80, 80);
      const productName = product.productName || "Unbenanntes Produkt";
      const titleWidth = pageWidth - 2 * margin - 60; // Leave space for logo
      const titleLines = pdf.splitTextToSize(productName, titleWidth);
      pdf.text(titleLines, margin, y + 7);
      const titleBottomY = y + 7;
      y += 10;
      
      // Subtitle
      let subtitleBottomY = y + 5;
      if (product.productSubtitle) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(100, 100, 100);
        pdf.text(product.productSubtitle, margin, y + 5);
        subtitleBottomY = y + 5;
        y += 8;
      }
      
      // Logo oben rechts - Unterkante bündig mit Untertitel-Unterkante
      if (FIXED_FOOTER.logoUrl) {
        try {
          const logoData = await loadImageAsBase64(FIXED_FOOTER.logoUrl);
          const img = new Image();
          img.src = logoData;
          await new Promise((resolve) => { img.onload = resolve; });
          
          const logoHeight = 8; // Logo-Höhe in mm (kleiner, wie in der Vorschau)
          const logoWidth = (img.width / img.height) * logoHeight;
          const logoX = pageWidth - margin - logoWidth;
          const logoY = subtitleBottomY - logoHeight; // Unterkante bündig
          
          pdf.addImage(logoData, 'JPEG', logoX, logoY, logoWidth, logoHeight);
        } catch (error) {
          console.log('Could not load logo:', error);
        }
      }
      
      // Divider line
      y += 3;
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;
      
      // Main content area - Image on left, descriptions on right
      const imageWidth = contentWidth * 0.45;
      const descWidth = contentWidth * 0.5;
      const startY = y;
      
      // Try to add product image - Seitenverhältnis beibehalten mit imageScale
      const imageScale = product.imageScale || 100;
      const scaleFactor = imageScale / 100;
      const baseMaxImgWidth = 45; // Basis-Breite 45mm bei 100%
      const baseMaxImgHeight = 60; // Basis-Höhe 60mm bei 100%
      const maxImgWidth = baseMaxImgWidth * scaleFactor;
      const maxImgHeight = baseMaxImgHeight * scaleFactor;
      let imgWidth = maxImgWidth;
      let imgHeight = maxImgHeight;
      
      if (product.imageUrl) {
        try {
          const imgData = await loadImageAsBase64(product.imageUrl);
          
          // Originale Bildgröße ermitteln um Seitenverhältnis zu berechnen
          const img = new Image();
          img.src = imgData;
          await new Promise((resolve) => { img.onload = resolve; });
          
          const aspectRatio = img.width / img.height;
          
          // Seitenverhältnis beibehalten, innerhalb der max. Grenzen
          if (aspectRatio > maxImgWidth / maxImgHeight) {
            // Bild ist breiter - Breite begrenzt
            imgWidth = maxImgWidth;
            imgHeight = maxImgWidth / aspectRatio;
          } else {
            // Bild ist höher - Höhe begrenzt
            imgHeight = maxImgHeight;
            imgWidth = maxImgHeight * aspectRatio;
          }
          
          pdf.addImage(imgData, 'JPEG', margin, y, imgWidth, imgHeight);
        } catch (imgError) {
          console.log('Could not load product image:', imgError);
        }
      }
      
      // Description sections on the right - FESTE Position, bündig unter dem S des Logos
      let descY = startY;
      // Textblock beginnt bündig unter dem "S" des Siepe-Logos
      const descX = pageWidth - margin - 45; // Bündig unter dem Logo-Anfang (ca. 155mm von links)
      const descMaxWidth = 45 - 5; // Maximale Textbreite: 40mm (Logo-Breite minus Rand)
      
      const descriptionSections: DescriptionSection[] = Array.isArray(product.descriptionSections) 
        ? (product.descriptionSections as DescriptionSection[]).filter(s => s && typeof s === 'object')
        : [];
      
      for (const section of descriptionSections) {
        if (!section.title && (!section.items || section.items.length === 0)) continue;
        
        if (section.title) {
          pdf.setFontSize(9);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(120, 120, 120);
          pdf.text(section.title, descX, descY);
          descY += 4;
        }
        
        const items = Array.isArray(section.items) ? section.items.filter(i => i && i.trim()) : [];
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(60, 60, 60);
        
        for (const item of items) {
          // Implement hanging indent for multi-line items
          const bulletWidth = 3; // Width reserved for bullet point
          const textX = descX + bulletWidth; // Text starts after bullet
          const maxWidth = descMaxWidth - bulletWidth; // Available width for text
          
          // Handle manual line breaks (\n) in the text
          const manualLines = item.split('\n');
          
          // Draw bullet point only once at the start
          pdf.text('•', descX, descY);
          
          for (let lineIdx = 0; lineIdx < manualLines.length; lineIdx++) {
            const linePart = manualLines[lineIdx];
            // Split each manual line to fit available width
            const wrappedLines = pdf.splitTextToSize(linePart, maxWidth);
            
            for (let i = 0; i < wrappedLines.length; i++) {
              pdf.text(wrappedLines[i], textX, descY);
              descY += 4;
            }
          }
        }
        descY += 3;
      }
      
      // More space before technical data section (for 10 rows minimum)
      // Stelle sicher dass die Tabelle unter dem Bild beginnt (Bild ist 60mm hoch)
      y = Math.max(startY + imgHeight + 10, descY + 10);
      
      // Technical Data Table
      const technicalDataColumns: string[] = Array.isArray(product.technicalDataColumns) 
        ? product.technicalDataColumns 
        : [];
      
      const technicalDataRows: TechnicalDataRow[] = Array.isArray(product.technicalDataRows) 
        ? (product.technicalDataRows as TechnicalDataRow[]).filter(row => row && typeof row === 'object')
        : [];
      
      if (technicalDataRows.length > 0) {
        // Section title
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(120, 120, 120);
        pdf.text('Technische Daten', margin, y);
        y += 3;
        
        // Divider
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.3);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 4;
        
        // Calculate column widths
        const numCols = technicalDataColumns.length + 1;
        const labelColWidth = contentWidth * 0.35;
        
        // Use custom column widths if available, otherwise equal distribution
        const hasCustomWidths = product.columnWidths && Array.isArray(product.columnWidths) && product.columnWidths.length === technicalDataColumns.length;
        const dataColWidths: number[] = [];
        
        if (hasCustomWidths) {
          // Convert percentages to mm, using remaining width after label column
          const remainingWidth = contentWidth - labelColWidth;
          const totalPercent = (product.columnWidths as number[]).reduce((sum, w) => sum + w, 0);
          for (const widthPercent of (product.columnWidths as number[])) {
            dataColWidths.push((widthPercent / totalPercent) * remainingWidth);
          }
        } else {
          // Equal distribution
          const equalWidth = (contentWidth - labelColWidth) / Math.max(technicalDataColumns.length, 1);
          for (let i = 0; i < technicalDataColumns.length; i++) {
            dataColWidths.push(equalWidth);
          }
        }
        
        // Header row
        if (technicalDataColumns.length > 0) {
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(80, 80, 80);
          
          let colX = margin + labelColWidth;
          for (let i = 0; i < technicalDataColumns.length; i++) {
            const col = technicalDataColumns[i];
            const colWidth = dataColWidths[i];
            pdf.text(col || '', colX + colWidth / 2, y, { align: 'center' });
            colX += colWidth;
          }
          y += 5;
        }
        
        // Data rows with alternating colors
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        for (let i = 0; i < technicalDataRows.length; i++) {
          const row = technicalDataRows[i];
          if (!row.label || !row.label.trim()) continue;
          
          const rowHeight = 5;
          
          // Alternating background
          if (i % 2 === 0) {
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margin, y - 3.5, contentWidth, rowHeight, 'F');
          }
          
          // Label
          pdf.setTextColor(60, 60, 60);
          pdf.text(row.label, margin + 2, y);
          
          // Values - use values.length if no columns defined
          const values = Array.isArray(row.values) ? row.values : [];
          const numValueCols = Math.max(technicalDataColumns.length, values.length);
          let colX = margin + labelColWidth;
          
          // Calculate column width for values if no columns defined
          const valueColWidth = numValueCols > 0 ? (contentWidth - labelColWidth) / numValueCols : 0;
          
          for (let j = 0; j < numValueCols; j++) {
            const value = values[j] || '-';
            const colWidth = dataColWidths[j] || valueColWidth;
            pdf.text(value, colX + colWidth / 2, y, { align: 'center' });
            colX += colWidth;
          }
          
          y += rowHeight;
        }
        y += 5;
      }
      
      // Footer note - use fixed data
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(120, 120, 120);
      
      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 4;
      
      const lines = pdf.splitTextToSize(FIXED_FOOTER.footerNote, contentWidth);
      pdf.text(lines, margin, y);
      y += lines.length * 3 + 3;
      
      // Company footer at bottom
      const footerY = pageHeight - 25;
      
      // Divider
      pdf.setDrawColor(200, 200, 200);
      pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      let footerX = margin;
      
      // Company info - use fixed data
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60, 60, 60);
      pdf.text(FIXED_FOOTER.companyName, footerX, footerY);
      
      pdf.setFont('helvetica', 'normal');
      let infoY = footerY + 3;
      pdf.text(FIXED_FOOTER.companyWebsite, footerX, infoY);
      infoY += 3;
      pdf.text(FIXED_FOOTER.companyEmail, footerX, infoY);
      footerX += 40;
      
      // Locations - use fixed data
      for (const loc of FIXED_FOOTER.locations) {
        if (!loc.locationName && !loc.street && !loc.zipCity && !loc.phone) continue;
        
        // Vertical divider
        pdf.setDrawColor(180, 180, 180);
        pdf.line(footerX, footerY - 2, footerX, footerY + 10);
        footerX += 3;
        
        pdf.setFontSize(8);
        let locY = footerY;
        
        if (loc.locationName) {
          pdf.setFont('helvetica', 'bold');
          pdf.text(loc.locationName, footerX, locY);
          locY += 3;
        }
        
        pdf.setFont('helvetica', 'normal');
        if (loc.street) {
          pdf.text(loc.street, footerX, locY);
          locY += 3;
        }
        if (loc.zipCity) {
          pdf.text(loc.zipCity, footerX, locY);
          locY += 3;
        }
        if (loc.phone) {
          pdf.text('Tel. ' + loc.phone, footerX, locY);
        }
        
        footerX += 35;
      }
      
      
      // Document number
      if (product.documentNumber) {
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(product.documentNumber, margin, pageHeight - margin);
      }
      
      // Save PDF
      const filename = `${productName.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf`;
      pdf.save(filename);
      
      toast.success("PDF heruntergeladen!");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Fehler beim Generieren des PDFs: " + (error instanceof Error ? error.message : 'Unbekannter Fehler'));
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Produkt nicht gefunden</h1>
        <Button asChild>
          <Link href="/dashboard">Zurück zum Dashboard</Link>
        </Button>
      </div>
    );
  }

  const isOwner = user && product.userId === user.id;
  
  // Safe data extraction with defaults
  const technicalDataColumns: string[] = Array.isArray(product.technicalDataColumns) 
    ? product.technicalDataColumns 
    : [];
  
  const technicalDataRows: TechnicalDataRow[] = Array.isArray(product.technicalDataRows) 
    ? (product.technicalDataRows as TechnicalDataRow[]).filter(row => row && typeof row === 'object')
    : [];
  
  const descriptionSections: DescriptionSection[] = Array.isArray(product.descriptionSections) 
    ? (product.descriptionSections as DescriptionSection[]).filter(s => s && typeof s === 'object')
    : [];
  
  // Use fixed footer data from constants
  const locations = FIXED_FOOTER.locations;
  const footerNote = FIXED_FOOTER.footerNote;
  const companyName = FIXED_FOOTER.companyName;
  const companyWebsite = FIXED_FOOTER.companyWebsite;
  const companyEmail = FIXED_FOOTER.companyEmail;
  const logoUrl = FIXED_FOOTER.logoUrl;

  const productName = product.productName || "Unbenanntes Produkt";
  const productSubtitle = product.productSubtitle || "";
  const imageUrl = product.imageUrl || "";
  const imageScale = product.imageScale || 100;
  const documentNumber = product.documentNumber || "";

  return (
    <div className="min-h-screen bg-white">
      {/* Action Bar - Only visible for logged-in users, hidden when printing */}
      {user ? (
      <div className="no-print bg-gray-100 border-b sticky top-0 z-10">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={user ? "/dashboard" : "/"}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <span className="text-sm text-gray-600">Produktdatenblatt</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              Link kopieren
            </Button>
            <Button 
              onClick={handleDownloadPdf} 
              size="sm" 
              variant="outline"
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              PDF Download
            </Button>

          </div>
        </div>
      </div>
      ) : null}

      {/* Datasheet Content */}
      <div 
        ref={datasheetRef}
        className="datasheet-container max-w-4xl mx-auto p-4 md:p-8 print:p-0 print:max-w-none bg-white"
      >
        {/* Header with Logo */}
        <div className="mb-6">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-700 tracking-wide">
                {productName}
              </h1>
              {productSubtitle ? (
                <h2 className="text-lg md:text-xl text-gray-600 mt-1">
                  {productSubtitle}
                </h2>
              ) : null}
            </div>
            {/* Logo oben rechts - Unterkante bündig mit Untertitel */}
            {logoUrl ? (
              <div className="flex-shrink-0">
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-14 md:h-[4.5rem] object-contain"
                  style={{ maxWidth: '180px' }}
                />
              </div>
            ) : null}
          </div>
          <div className="h-1 bg-gray-300 mt-4 w-full"></div>
        </div>

        {/* Main Content: Image + Description */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Product Image */}
          <div className="md:w-1/2">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={productName}
                className="object-contain max-h-96"
                style={{ width: `${imageScale}%`, maxWidth: '100%' }}
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400">
                Kein Bild vorhanden
              </div>
            )}
          </div>

          {/* Description Sections */}
          <div className="md:w-1/2 space-y-4">
            {descriptionSections.length > 0 ? descriptionSections.map((section, index) => {
              const title = section.title || "";
              const items = Array.isArray(section.items) ? section.items : [];
              const filteredItems = items.filter(item => typeof item === 'string' && item.trim());
              
              if (!title && filteredItems.length === 0) return null;
              
              return (
                <div key={index}>
                  {title ? (
                    <h3 className="text-sm font-semibold text-gray-500 uppercase mb-1">
                      {title}
                    </h3>
                  ) : null}
                  {filteredItems.length > 0 ? (
                    <ul className="text-sm text-gray-700 space-y-1">
                      {filteredItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start">
                          <span className="mr-2 flex-shrink-0">•</span>
                          <span className="flex-1 whitespace-pre-wrap">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            }) : null}
          </div>
        </div>

        {/* Technical Data Table with Multiple Columns */}
        {technicalDataRows.length > 0 ? (
          <div className="mb-8 mt-12">
            <h3 className="text-sm font-semibold text-gray-500 mb-3">
              Technische Daten
            </h3>
            <div className="h-0.5 bg-gray-200 mb-2"></div>
            <table className="w-full text-sm">
              {technicalDataColumns.length > 0 ? (
                <thead>
                  <tr>
                    <th className="text-left py-2 px-3 text-gray-600 font-normal"></th>
                    {technicalDataColumns.map((col, idx) => (
                      <th 
                        key={idx} 
                        className="text-center py-2 px-3 text-gray-600 font-semibold border-b border-gray-200"
                        style={{ width: product.columnWidths && (product.columnWidths as number[])[idx] ? `${(product.columnWidths as number[])[idx]}%` : 'auto' }}
                      >
                        {col || ""}
                      </th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {technicalDataRows.map((row, index) => {
                  const label = row.label || "";
                  const values = Array.isArray(row.values) ? row.values : [];
                  
                  if (!label.trim()) return null;
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      <td className="py-2 px-3 text-gray-700 border-b border-gray-100">
                        {label}
                      </td>
                      {values.map((value, vIdx) => (
                        <td 
                          key={vIdx} 
                          className="py-2 px-3 text-gray-800 text-center border-b border-gray-100"
                          style={{ width: product.columnWidths && (product.columnWidths as number[])[vIdx] ? `${(product.columnWidths as number[])[vIdx]}%` : 'auto' }}
                        >
                          {value || "-"}
                        </td>
                      ))}
                      {/* Fill empty cells if values array is shorter than columns */}
                      {technicalDataColumns.length > values.length ? 
                        Array.from({ length: technicalDataColumns.length - values.length }).map((_, i) => (
                          <td 
                            key={`empty-${i}`} 
                            className="py-2 px-3 text-gray-400 text-center border-b border-gray-100"
                            style={{ width: product.columnWidths && (product.columnWidths as number[])[values.length + i] ? `${(product.columnWidths as number[])[values.length + i]}%` : 'auto' }}
                          >
                            -
                          </td>
                        )) : null
                      }
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* Footer Note */}
        {footerNote ? (
          <p className="text-xs text-gray-500 mb-6 border-t pt-4">
            {footerNote}
          </p>
        ) : null}

        {/* Company Footer */}
        <div className="border-t pt-4 mt-8">
          <div className="flex flex-wrap justify-between items-end gap-4">
            {/* Company Info with vertical dividers */}
            <div className="flex gap-0 text-xs text-gray-600">
              {companyName ? (
                <div className="pr-4">
                  <p className="font-semibold">{companyName}</p>
                  {companyWebsite ? <p>{companyWebsite}</p> : null}
                  {companyEmail ? <p>{companyEmail}</p> : null}
                </div>
              ) : null}
              
              {/* Locations with vertical dividers */}
              {locations.length > 0 ? locations.map((loc, index) => {
                const locationName = loc.locationName || "";
                const street = loc.street || "";
                const zipCity = loc.zipCity || "";
                const phone = loc.phone || "";
                
                if (!locationName && !street && !zipCity && !phone) return null;
                
                return (
                  <div key={index} className="px-4 border-l border-gray-300">
                    {locationName ? <p className="font-semibold">{locationName}</p> : null}
                    {street ? <p>{street}</p> : null}
                    {zipCity ? <p>{zipCity}</p> : null}
                    {phone ? <p>Tel. {phone}</p> : null}
                  </div>
                );
              }) : null}
            </div>

            {/* Logo nur oben rechts - nicht im Footer */}
          </div>

          {/* Document Number */}
          {documentNumber ? (
            <p className="text-xs text-gray-400 mt-4">
              {documentNumber}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
