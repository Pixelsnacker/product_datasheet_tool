import { cn } from "@/lib/utils";

interface DescriptionSection {
  title: string;
  items: string[];
}

interface TechnicalDataRow {
  label: string;
  values: string[];
}

interface LocationData {
  locationName: string;  // Werk / Standortname
  street: string;        // Straße + Hausnummer
  zipCity: string;       // PLZ + Ort
  phone: string;         // Telefonnummer
}

interface DatasheetPreviewProps {
  productName: string;
  productSubtitle?: string;
  imageUrl?: string;
  imageScale?: number;
  descriptionSections?: DescriptionSection[];
  technicalDataColumns?: string[];
  columnWidths?: number[]; // Column widths in percentage
  technicalDataRows?: TechnicalDataRow[];
  companyName?: string;
  companyWebsite?: string;
  companyEmail?: string;
  locations?: LocationData[];
  logoUrl?: string;
  footerNote?: string;
  documentNumber?: string;
  className?: string;
  scale?: number;
}

export default function DatasheetPreview({
  productName,
  productSubtitle,
  imageUrl,
  imageScale = 100,
  descriptionSections = [],
  technicalDataColumns = [],
  columnWidths = [],
  technicalDataRows = [],
  companyName,
  companyWebsite,
  companyEmail,
  locations = [],
  logoUrl,
  footerNote,
  documentNumber,
  className,
  scale = 0.6,
}: DatasheetPreviewProps) {
  return (
    <div 
      className={cn("bg-white shadow-lg border rounded-lg overflow-hidden", className)}
      style={{ 
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: `${100 / scale}%`,
      }}
    >
      <div className="p-8" style={{ minHeight: '842px' }}>
        {/* Header */}
        <div className="mb-6">
          <h1 className={cn(
            "text-2xl font-bold text-gray-700 tracking-wide",
            !productName && "text-gray-300 italic"
          )}>
            {productName || "Produktname eingeben..."}
          </h1>
          {(productSubtitle || !productName) && (
            <h2 className={cn(
              "text-lg text-gray-600 mt-1",
              !productSubtitle && "text-gray-300 italic text-sm"
            )}>
              {productSubtitle || "Untertitel (optional)"}
            </h2>
          )}
          <div className="h-0.5 bg-gray-300 mt-4 w-full"></div>
        </div>

        {/* Main Content: Image + Description */}
        <div className="flex gap-6 mb-8">
          {/* Product Image */}
          <div className="w-1/2 flex items-start justify-center">
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={productName || "Produkt"}
                className="object-contain"
                style={{ 
                  maxHeight: '300px',
                  width: `${imageScale}%`,
                  maxWidth: '100%',
                }}
              />
            ) : (
              <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-sm rounded">
                Produktbild hier
              </div>
            )}
          </div>

          {/* Description Sections */}
          <div className="w-1/2 space-y-4">
            {descriptionSections.length > 0 ? (
              descriptionSections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-[11px] font-semibold text-gray-600 mb-1">
                    {section.title || "SEKTION"}
                  </h3>
                  <ul className="text-[11px] text-gray-700 leading-relaxed space-y-0.5">
                    {section.items.filter(item => item.trim()).map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <span className="mr-2 text-gray-500 flex-shrink-0">•</span>
                        <span className="flex-1 whitespace-pre-wrap">{item}</span>
                      </li>
                    ))}
                    {section.items.filter(item => item.trim()).length === 0 && (
                      <li className="text-gray-300 italic">Einträge hinzufügen...</li>
                    )}
                  </ul>
                </div>
              ))
            ) : (
              <div className="text-gray-300 italic text-sm">
                Beschreibungssektionen werden hier angezeigt
              </div>
            )}
          </div>
        </div>

        {/* Technical Data Table with Multiple Columns */}
        <div className="mb-6">
          <h3 className="text-[11px] font-semibold text-gray-600 mb-3">
            Technische Daten
          </h3>
          <div className="h-0.5 bg-gray-200 mb-2"></div>
          
          {technicalDataRows.length > 0 && technicalDataRows.some(r => r.label.trim()) ? (
            <table className="w-full text-[11px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-1.5 px-2 text-gray-600 font-normal"></th>
                  {technicalDataColumns.map((col, idx) => (
                    <th 
                      key={idx} 
                      className="text-center py-1.5 px-2 text-gray-600 font-semibold border-b border-gray-200"
                      style={{ width: columnWidths[idx] ? `${columnWidths[idx]}%` : 'auto' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {technicalDataRows.filter(row => row.label.trim()).map((row, index) => (
                  <tr 
                    key={index} 
                    className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                  >
                    <td className="py-1.5 px-2 text-gray-700 border-b border-gray-100">
                      {row.label}
                    </td>
                    {row.values.map((value, vIdx) => (
                      <td 
                        key={vIdx} 
                        className="py-1.5 px-2 text-gray-800 text-center border-b border-gray-100"
                        style={{ width: columnWidths[vIdx] ? `${columnWidths[vIdx]}%` : 'auto' }}
                      >
                        {value || "-"}
                      </td>
                    ))}
                    {/* Fill empty cells if values array is shorter than columns */}
                    {Array.from({ length: Math.max(0, technicalDataColumns.length - row.values.length) }).map((_, i) => (
                      <td 
                        key={`empty-${i}`} 
                        className="py-1.5 px-2 text-gray-400 text-center border-b border-gray-100"
                        style={{ width: columnWidths[row.values.length + i] ? `${columnWidths[row.values.length + i]}%` : 'auto' }}
                      >
                        -
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-gray-300 italic text-sm py-4 text-center border border-dashed border-gray-200 rounded">
              Technische Daten werden hier angezeigt
            </div>
          )}
        </div>

        {/* Footer Note */}
        {footerNote && (
          <p className="text-[9px] text-gray-500 mb-4 leading-relaxed">
            {footerNote}
          </p>
        )}

        {/* Company Footer */}
        <div className="border-t pt-4 mt-auto">
          <div className="flex items-end justify-between gap-4">
            {/* Company Info with vertical dividers */}
            <div className="flex gap-0 text-[9px] text-gray-600">
              {companyName && (
                <div className="pr-3">
                  <p className="font-semibold">{companyName}</p>
                  {companyWebsite && <p>{companyWebsite}</p>}
                  {companyEmail && <p>{companyEmail}</p>}
                </div>
              )}
              
              {/* Locations with vertical dividers */}
              {locations.filter(l => l.locationName || l.street).map((loc, index) => (
                <div key={index} className="px-3 border-l border-gray-300">
                  {loc.locationName && <p className="font-semibold">{loc.locationName}</p>}
                  {loc.street && <p>{loc.street}</p>}
                  {loc.zipCity && <p>{loc.zipCity}</p>}
                  {loc.phone && <p>Tel. {loc.phone}</p>}
                </div>
              ))}
              
              {!companyName && locations.length === 0 && (
                <div className="text-gray-300 italic">
                  Firmeninfo hier
                </div>
              )}
            </div>

            {/* Logo - 15% größer, unten rechts fixiert */}
            <div className="flex-shrink-0">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="h-10 object-contain"
                  style={{ maxWidth: '100px' }}
                />
              ) : (
                <div className="w-20 h-8 bg-gray-100 border border-dashed border-gray-300 flex items-center justify-center text-[8px] text-gray-400 rounded">
                  Logo
                </div>
              )}
            </div>
          </div>

          {/* Document Number */}
          {documentNumber && (
            <p className="text-[8px] text-gray-400 mt-3">
              {documentNumber}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
