import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Trash2, Loader2, Save, GripVertical, Upload, Eye, Edit3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/pages/Dashboard";
import { DATASHEET_LANGUAGES, type DatasheetLanguage } from "@/lib/datasheetI18n";
import { Link, useLocation, useParams } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import DatasheetPreview from "@/components/DatasheetPreview";

interface DescriptionSection {
  title: string;
  items: string[];
}

interface TechnicalDataRow {
  label: string;
  values: string[];
}



const DEFAULT_SECTIONS: DescriptionSection[] = [
  { title: "MATERIAL", items: [""] },
  { title: "FARBE", items: [""] },
  { title: "AUSFÜHRUNG", items: [""] },
  { title: "VARIANTEN", items: [""] },
  { title: "PACKWEISE", items: [""] },
];

const DEFAULT_COLUMNS = ["30 L", "35 L", "40 L", "50 L", "60 L"];

const DEFAULT_TECHNICAL_DATA: TechnicalDataRow[] = [
  { label: "Typ", values: ["", "", "", "", ""] },
  { label: "Nennvolumen [l]", values: ["", "", "", "", ""] },
  { label: "Länge [mm]", values: ["", "", "", "", ""] },
  { label: "Breite [mm]", values: ["", "", "", "", ""] },
  { label: "Gesamthöhe [mm]", values: ["", "", "", "", ""] },
];

export default function ProductForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get template ID from URL query params
  const searchParams = new URLSearchParams(window.location.search);
  const templateId = searchParams.get('template');

  // Form state
  const [productName, setProductName] = useState("");
  const [productSubtitle, setProductSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageScale, setImageScale] = useState(100);
  const [descriptionSections, setDescriptionSections] = useState<DescriptionSection[]>(DEFAULT_SECTIONS);
  const [technicalDataColumns, setTechnicalDataColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [technicalDataRows, setTechnicalDataRows] = useState<TechnicalDataRow[]>(DEFAULT_TECHNICAL_DATA);
  const [documentNumber, setDocumentNumber] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [language, setLanguage] = useState<DatasheetLanguage>("de");
  
  // UI state
  const [activeTab, setActiveTab] = useState("edit");
  const [isUploading, setIsUploading] = useState(false);

  // Load existing product data
  const { data: existingProduct, isLoading: isLoadingProduct } = trpc.products.getById.useQuery(
    { id: parseInt(id || "0") },
    { enabled: isEditing }
  );
  
  // Load template data if creating from template
  const { data: templateData, isLoading: isLoadingTemplate } = trpc.templates.getById.useQuery(
    { id: parseInt(templateId || "0") },
    { enabled: !isEditing && !!templateId }
  );

  useEffect(() => {
    if (existingProduct) {
      setProductName(existingProduct.productName);
      setProductSubtitle(existingProduct.productSubtitle || "");
      setImageUrl(existingProduct.imageUrl || "");
      setImageScale(existingProduct.imageScale || 100);
      setDescriptionSections(existingProduct.descriptionSections || DEFAULT_SECTIONS);
      setTechnicalDataColumns(existingProduct.technicalDataColumns || DEFAULT_COLUMNS);
      setColumnWidths((existingProduct.columnWidths as number[]) || []);
      setTechnicalDataRows((existingProduct.technicalDataRows as TechnicalDataRow[]) || DEFAULT_TECHNICAL_DATA);
      setDocumentNumber(existingProduct.documentNumber || "");
      setCategory((existingProduct as any).category || null);
      setLanguage(((existingProduct as any).language as DatasheetLanguage) || "de");
    }
  }, [existingProduct]);
  
  // Load template data when creating from template
  useEffect(() => {
    if (templateData && !isEditing) {
      setDescriptionSections(templateData.descriptionSections || DEFAULT_SECTIONS);
      setTechnicalDataColumns(templateData.technicalDataColumns || DEFAULT_COLUMNS);
      setColumnWidths((templateData.columnWidths as number[]) || []);
      setTechnicalDataRows((templateData.technicalDataRows as TechnicalDataRow[]) || DEFAULT_TECHNICAL_DATA);
      toast.success(`Vorlage "${templateData.name}" geladen`);
    }
  }, [templateData, isEditing]);

  // Mutations
  const createProduct = trpc.products.create.useMutation();
  const updateProduct = trpc.products.update.useMutation();
  const uploadImage = trpc.upload.image.useMutation();

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!productName.trim()) {
      toast.error("Bitte geben Sie einen Produktnamen ein");
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        productName,
        productSubtitle: productSubtitle || undefined,
        imageUrl: imageUrl || undefined,
        imageScale: imageScale,
        descriptionSections: descriptionSections.filter(s => s.items.some(i => i.trim())),
        technicalDataColumns: technicalDataColumns.filter(c => c.trim()),
        columnWidths: columnWidths.length > 0 ? columnWidths : undefined,
        technicalDataRows: technicalDataRows.filter(t => t.label.trim()),
        documentNumber: documentNumber || undefined,
        category: category || undefined,
        language: language,
      };

      let productId: number;

      if (isEditing) {
        await updateProduct.mutateAsync({ id: parseInt(id!), ...productData });
        productId = parseInt(id!);
      } else {
        const result = await createProduct.mutateAsync(productData);
        productId = result.id;
      }

      utils.products.list.invalidate();
      utils.products.getById.invalidate({ id: productId });
      toast.success(isEditing ? "Datenblatt aktualisiert" : "Datenblatt erstellt");
      setLocation(`/product/${productId}`);
    } catch (error) {
      toast.error("Fehler beim Speichern");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  // File upload handler
  const handleFileUpload = async (file: File, type: 'product') => {
    if (!file) return;
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Datei ist zu groß (max. 5MB)");
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Nur JPEG, PNG, GIF und WebP erlaubt");
      return;
    }

    setIsUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        try {
          const result = await uploadImage.mutateAsync({
            fileName: file.name,
            fileData: base64,
            contentType: file.type,
          });

          setImageUrl(result.url);
          toast.success("Produktbild hochgeladen");
        } catch (error) {
          toast.error("Fehler beim Hochladen");
          console.error(error);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Fehler beim Hochladen");
      console.error(error);
      setIsUploading(false);
    }
  };

  // Description sections handlers
  const updateSectionTitle = (index: number, title: string) => {
    const newSections = [...descriptionSections];
    newSections[index] = { ...newSections[index], title };
    setDescriptionSections(newSections);
  };

  const updateSectionItem = (sectionIndex: number, itemIndex: number, value: string) => {
    const newSections = [...descriptionSections];
    const newItems = [...newSections[sectionIndex].items];
    newItems[itemIndex] = value;
    newSections[sectionIndex] = { ...newSections[sectionIndex], items: newItems };
    setDescriptionSections(newSections);
  };

  const addSectionItem = (sectionIndex: number) => {
    const newSections = [...descriptionSections];
    newSections[sectionIndex] = { 
      ...newSections[sectionIndex], 
      items: [...newSections[sectionIndex].items, ""] 
    };
    setDescriptionSections(newSections);
  };

  const removeSectionItem = (sectionIndex: number, itemIndex: number) => {
    const newSections = [...descriptionSections];
    newSections[sectionIndex] = { 
      ...newSections[sectionIndex], 
      items: newSections[sectionIndex].items.filter((_, i) => i !== itemIndex)
    };
    setDescriptionSections(newSections);
  };

  const addSection = () => {
    setDescriptionSections([...descriptionSections, { title: "NEUE SEKTION", items: [""] }]);
  };

  const removeSection = (index: number) => {
    setDescriptionSections(descriptionSections.filter((_, i) => i !== index));
  };

  // Technical data handlers - Multi-column
  const addColumn = () => {
    setTechnicalDataColumns([...technicalDataColumns, ""]);
    setColumnWidths([...columnWidths, 0]); // Add default width
    setTechnicalDataRows(technicalDataRows.map(row => ({
      ...row,
      values: [...row.values, ""]
    })));
  };

  const removeColumn = (colIndex: number) => {
    if (technicalDataColumns.length <= 1) return;
    setTechnicalDataColumns(technicalDataColumns.filter((_, i) => i !== colIndex));
    setColumnWidths(columnWidths.filter((_, i) => i !== colIndex)); // Remove corresponding width
    setTechnicalDataRows(technicalDataRows.map(row => ({
      ...row,
      values: row.values.filter((_, i) => i !== colIndex)
    })));
  };

  const updateColumnHeader = (colIndex: number, value: string) => {
    const newColumns = [...technicalDataColumns];
    newColumns[colIndex] = value;
    setTechnicalDataColumns(newColumns);
  };

  const updateRowLabel = (rowIndex: number, label: string) => {
    const newRows = [...technicalDataRows];
    newRows[rowIndex] = { ...newRows[rowIndex], label };
    setTechnicalDataRows(newRows);
  };

  const updateCellValue = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...technicalDataRows];
    const newValues = [...newRows[rowIndex].values];
    newValues[colIndex] = value;
    newRows[rowIndex] = { ...newRows[rowIndex], values: newValues };
    setTechnicalDataRows(newRows);
  };

  const addRow = () => {
    setTechnicalDataRows([{ 
      label: "", 
      values: Array(technicalDataColumns.length).fill("") 
    }, ...technicalDataRows]);
  };

  const removeRow = (rowIndex: number) => {
    setTechnicalDataRows(technicalDataRows.filter((_, i) => i !== rowIndex));
  };



  if (isEditing && isLoadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'product');
          e.target.value = '';
        }}
      />


      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {isEditing ? "Datenblatt bearbeiten" : "Neues Datenblatt"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tab switcher for mobile */}
            <div className="md:hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="edit" className="gap-1">
                    <Edit3 className="h-4 w-4" />
                    Bearbeiten
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="gap-1">
                    <Eye className="h-4 w-4" />
                    Vorschau
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <Button onClick={handleSave} disabled={isSaving} className="bg-primary hover:bg-primary/90">
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Speichern
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="flex gap-8">
          {/* Left side: Form */}
          <div className={`flex-1 space-y-6 ${activeTab === 'preview' ? 'hidden md:block' : ''}`}>
            {/* Basic Info */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-800">Produktinformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Produktname *</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="z.B. DECKELFÄSSER 30 L / 35 L / 40 L"
                      className="text-lg font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productSubtitle">Untertitel</Label>
                    <Input
                      id="productSubtitle"
                      value={productSubtitle}
                      onChange={(e) => setProductSubtitle(e.target.value)}
                      placeholder="z.B. PSTG"
                    />
                  </div>
                </div>

                {/* Language + Category row */}
                <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sprache / Language</Label>
                  <Select
                    value={language}
                    onValueChange={(val) => setLanguage(val as DatasheetLanguage)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATASHEET_LANGUAGES.map((l) => (
                        <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Category */}
                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select
                    value={category || "__none__"}
                    onValueChange={(val) => setCategory(val === "__none__" ? null : val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Ohne Kategorie</SelectItem>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                </div>{/* end language+category grid */}

                {/* Product Image */}
                <div className="space-y-2">
                  <Label>Produktbild</Label>
                  <div className="flex flex-col gap-3">
                    {/* Upload Button - Primary Action */}
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full h-24 border-2 border-dashed border-gray-300 hover:border-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <span className="text-sm text-gray-600">Wird hochgeladen...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-600">Bild hochladen</span>
                          <span className="text-xs text-gray-400">JPEG, PNG, GIF, WebP (max. 5MB)</span>
                        </>
                      )}
                    </Button>
                    
                    {/* Alternative: URL Input */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <span className="text-xs text-gray-400">oder URL eingeben</span>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    <Input
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/bild.jpg"
                    />
                  </div>
                  
                  {/* Image Scale Slider */}
                  {imageUrl && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-600">Bildgröße: {imageScale}%</Label>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setImageScale(100)}
                          className="text-xs h-6"
                        >
                          Zurücksetzen
                        </Button>
                      </div>
                      <Slider
                        value={[imageScale]}
                        onValueChange={([value]) => setImageScale(value)}
                        min={10}
                        max={200}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {imageUrl && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg">
                      <img 
                        src={imageUrl} 
                        alt="Vorschau" 
                        className="max-h-48 object-contain mx-auto"
                        style={{ width: `${imageScale}%`, maxWidth: '100%' }}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description Sections */}
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gray-800">Beschreibungssektionen</CardTitle>
                <Button onClick={addSection} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Sektion hinzufügen
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {descriptionSections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center gap-2 mb-3">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <Input
                        value={section.title}
                        onChange={(e) => updateSectionTitle(sectionIndex, e.target.value)}
                        className="font-semibold uppercase bg-white"
                        placeholder="Sektionstitel"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSection(sectionIndex)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2 pl-6">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex items-center gap-2">
                          <span className="text-gray-400">•</span>
                          <Textarea
                            value={item}
                            onChange={(e) => updateSectionItem(sectionIndex, itemIndex, e.target.value)}
                            placeholder="Eintrag hinzufügen... (Enter für Zeilenumbruch)"
                            className="bg-white min-h-[38px] resize-y"
                            rows={1}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSectionItem(sectionIndex, itemIndex)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addSectionItem(sectionIndex)}
                        className="text-primary"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Eintrag hinzufügen
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Technical Data - Multi-Column Table */}
            <Card className="bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-gray-800">Technische Daten</CardTitle>
                <div className="flex gap-2">
                  <Button onClick={addColumn} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Spalte
                  </Button>
                  <Button onClick={addRow} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Zeile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2 w-48">Eigenschaft</th>
                        {technicalDataColumns.map((col, colIndex) => (
                          <th key={colIndex} className="py-2 px-1">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                <Input
                                  value={col}
                                  onChange={(e) => updateColumnHeader(colIndex, e.target.value)}
                                  placeholder="Spalte"
                                  className="text-center text-sm h-8"
                                />
                                {technicalDataColumns.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeColumn(colIndex)}
                                    className="h-6 w-6 text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                              <Input
                                type="number"
                                value={columnWidths[colIndex] || ''}
                                onChange={(e) => {
                                  const newWidths = [...columnWidths];
                                  newWidths[colIndex] = parseInt(e.target.value) || 0;
                                  setColumnWidths(newWidths);
                                }}
                                placeholder="Breite %"
                                className="text-center text-xs h-7"
                                min="5"
                                max="50"
                              />
                            </div>
                          </th>
                        ))}
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {technicalDataRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                          <td className="py-1 px-2">
                            <Input
                              value={row.label}
                              onChange={(e) => updateRowLabel(rowIndex, e.target.value)}
                              placeholder="Eigenschaft"
                              className="h-8"
                            />
                          </td>
                          {row.values.map((value, colIndex) => (
                            <td key={colIndex} className="py-1 px-1">
                              <Input
                                value={value}
                                onChange={(e) => updateCellValue(rowIndex, colIndex, e.target.value)}
                                placeholder="-"
                                className="text-center h-8 min-w-[120px]"
                              />
                            </td>
                          ))}
                          <td className="py-1 px-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(rowIndex)}
                              className="h-6 w-6 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Company Info */}


            {/* Footer Info */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-gray-800">Prospektnummer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="documentNumber">Prospektnummer</Label>
                  <Input
                    id="documentNumber"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="z.B. 06/2025 | Prospekt Nr. 523"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side: Live Preview */}
          <div className={`w-[500px] shrink-0 ${activeTab === 'edit' ? 'hidden md:block' : ''}`}>
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-gray-500" />
                <h2 className="font-semibold text-gray-700">Live-Vorschau</h2>
              </div>
              <div className="overflow-hidden rounded-lg border shadow-sm" style={{ height: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                <DatasheetPreview
                  productName={productName}
                  productSubtitle={productSubtitle}
                  imageUrl={imageUrl}
                  imageScale={imageScale}
                  descriptionSections={descriptionSections}
                  technicalDataColumns={technicalDataColumns}
                  columnWidths={columnWidths}
                  technicalDataRows={technicalDataRows}
                  documentNumber={documentNumber}
                  language={language}
                  scale={0.55}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
