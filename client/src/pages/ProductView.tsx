import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Copy, Check, Download } from "lucide-react";
import { Link, useParams } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { buildDatasheetPdf, type DatasheetProduct } from "@/lib/datasheetPdf";
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

  // Load an image via the CORS proxy and return its data URL + natural size.
  const loadImage = (
    url: string
  ): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.9),
          width: img.width,
          height: img.height,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
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
      const [logo, productImage] = await Promise.all([
        loadImage(FIXED_FOOTER.logoUrl).catch(() => null),
        product.imageUrl
          ? loadImage(product.imageUrl).catch(() => null)
          : Promise.resolve(null),
      ]);

      const pdf = buildDatasheetPdf({
        product: product as unknown as DatasheetProduct,
        footer: FIXED_FOOTER,
        logo,
        productImage,
      });

      const filename = `${(product.productName || "Unbenanntes Produkt").replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf`;
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
        {/* Fixed-height image zone so scaling the image never moves the table. */}
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          {/* Product Image */}
          <div className="md:w-1/2 flex items-start justify-center" style={{ height: '340px' }}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={productName}
                className="object-contain"
                style={{ maxHeight: '100%', width: `${imageScale}%`, maxWidth: '100%' }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
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
