import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Plus, Minus, Trash2, Loader2, Save, GripVertical, Upload, Eye, Edit3, RotateCcw, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_CATEGORIES } from "@/pages/Dashboard";
import { DATASHEET_LANGUAGES, type DatasheetLanguage } from "@/lib/datasheetI18n";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  _id?: string; // stable id for drag & drop (stripped before saving)
}

const genRowId = () => `r_${Math.random().toString(36).slice(2)}`;
const withRowIds = (rows: TechnicalDataRow[]): TechnicalDataRow[] =>
  (Array.isArray(rows) ? rows : []).map(r => (r && r._id ? r : { ...r, _id: genRowId() }));



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

function SortableTechRow({
  row,
  rowIndex,
  onLabel,
  onValue,
  onRemove,
}: {
  row: TechnicalDataRow;
  rowIndex: number;
  onLabel: (i: number, v: string) => void;
  onValue: (i: number, c: number, v: string) => void;
  onRemove: (i: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row._id! });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <tr ref={setNodeRef} style={style} className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}>
      <td className="py-1 px-1 w-8 align-middle">
        <button
          type="button"
          {...attributes}
          {...listeners}
          title="Zum Verschieben ziehen"
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600 touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="py-1 px-2">
        <Input
          value={row.label}
          onChange={(e) => onLabel(rowIndex, e.target.value)}
          placeholder="Eigenschaft"
          className="h-8"
        />
      </td>
      {row.values.map((value, colIndex) => (
        <td key={colIndex} className="py-1 px-1">
          <Input
            value={value}
            onChange={(e) => onValue(rowIndex, colIndex, e.target.value)}
            placeholder="-"
            className="text-center h-8 min-w-[120px]"
          />
        </td>
      ))}
      <td className="py-1 px-1 w-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(rowIndex)}
          title="Zeile löschen"
          className="h-6 w-6 text-gray-400 hover:text-red-500"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </td>
    </tr>
  );
}

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
  const [technicalDataRows, setTechnicalDataRows] = useState<TechnicalDataRow[]>(withRowIds(DEFAULT_TECHNICAL_DATA));
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
  const { data: templateData } = trpc.templates.getById.useQuery(
    { id: parseInt(templateId || "0") },
    { enabled: !isEditing && !!templateId }
  );

  // --- Entwurf-Sicherung (lokal im Browser) -------------------------------
  // Eindeutiger Schlüssel pro Datenblatt bzw. pro "Neu"-Formular.
  const draftKey = isEditing
    ? `pdt-draft-edit-${id}`
    : templateId
      ? `pdt-draft-new-tpl-${templateId}`
      : "pdt-draft-new";

  const didLoadRef = useRef(false);        // Lade-Guard: Felder nur EINMAL befüllen
  const draftReadyRef = useRef(false);     // ab wann automatisch lokal gesichert wird
  const storedDraftRef = useRef<any | null>(null); // beim Öffnen vorgefundener Entwurf
  const savedRef = useRef(false);          // nach echtem Speichern keinen Entwurf mehr schreiben
  const [recoverableDraft, setRecoverableDraft] = useState<any | null>(null);

  // Vergleichs-Fingerabdruck (nur inhaltliche Felder, ohne interne Zeilen-IDs)
  const contentFingerprint = (s: any) => JSON.stringify({
    productName: s.productName || "",
    productSubtitle: s.productSubtitle || "",
    imageUrl: s.imageUrl || "",
    imageScale: s.imageScale,
    descriptionSections: s.descriptionSections || [],
    technicalDataColumns: s.technicalDataColumns || [],
    columnWidths: s.columnWidths || [],
    technicalDataRows: (s.technicalDataRows || []).map((r: any) => ({ label: r.label, values: r.values })),
    documentNumber: s.documentNumber || "",
    category: s.category ?? null,
    language: s.language || "de",
  });

  // Beim Öffnen einen evtl. vorhandenen Entwurf aus dem Browser lesen.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) storedDraftRef.current = JSON.parse(raw);
    } catch { /* localStorage nicht verfügbar – dann eben ohne Entwurf */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Prüft, ob der vorgefundene Entwurf von der geladenen Grundlage abweicht,
  // und bietet ihn dann zur Wiederherstellung an (sonst verwerfen).
  const offerDraftIfDifferent = (baseline: any) => {
    const d = storedDraftRef.current;
    if (!d) return;
    try {
      if (contentFingerprint(d) !== contentFingerprint(baseline)) {
        setRecoverableDraft(d);
      } else {
        localStorage.removeItem(draftKey);
      }
    } catch { /* ignorieren */ }
  };

  // Vorhandenes Produkt EINMAL in die Felder laden (Lade-Guard verhindert,
  // dass ein späteres Neuladen die Eingaben überschreibt).
  useEffect(() => {
    if (existingProduct && !didLoadRef.current) {
      didLoadRef.current = true;
      const baseline = {
        productName: existingProduct.productName,
        productSubtitle: existingProduct.productSubtitle || "",
        imageUrl: existingProduct.imageUrl || "",
        imageScale: Math.min(100, existingProduct.imageScale || 100),
        descriptionSections: existingProduct.descriptionSections || DEFAULT_SECTIONS,
        technicalDataColumns: existingProduct.technicalDataColumns || DEFAULT_COLUMNS,
        columnWidths: (existingProduct.columnWidths as number[]) || [],
        technicalDataRows: ((existingProduct.technicalDataRows as TechnicalDataRow[]) || DEFAULT_TECHNICAL_DATA),
        documentNumber: existingProduct.documentNumber || "",
        category: (existingProduct as any).category || null,
        language: ((existingProduct as any).language as DatasheetLanguage) || "de",
      };
      setProductName(baseline.productName);
      setProductSubtitle(baseline.productSubtitle);
      setImageUrl(baseline.imageUrl);
      setImageScale(baseline.imageScale);
      setDescriptionSections(baseline.descriptionSections);
      setTechnicalDataColumns(baseline.technicalDataColumns);
      setColumnWidths(baseline.columnWidths);
      setTechnicalDataRows(withRowIds(baseline.technicalDataRows));
      setDocumentNumber(baseline.documentNumber);
      setCategory(baseline.category);
      setLanguage(baseline.language);
      offerDraftIfDifferent(baseline);
      draftReadyRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingProduct]);

  // Load template data when creating from template (ebenfalls nur EINMAL).
  useEffect(() => {
    if (templateData && !isEditing && !didLoadRef.current) {
      didLoadRef.current = true;
      setDescriptionSections(templateData.descriptionSections || DEFAULT_SECTIONS);
      setTechnicalDataColumns(templateData.technicalDataColumns || DEFAULT_COLUMNS);
      setColumnWidths((templateData.columnWidths as number[]) || []);
      setTechnicalDataRows(withRowIds((templateData.technicalDataRows as TechnicalDataRow[]) || DEFAULT_TECHNICAL_DATA));
      toast.success(`Vorlage "${templateData.name}" geladen`);
      offerDraftIfDifferent({
        productName: "", productSubtitle: "", imageUrl: "", imageScale: 100,
        descriptionSections: templateData.descriptionSections || DEFAULT_SECTIONS,
        technicalDataColumns: templateData.technicalDataColumns || DEFAULT_COLUMNS,
        columnWidths: (templateData.columnWidths as number[]) || [],
        technicalDataRows: (templateData.technicalDataRows as TechnicalDataRow[]) || DEFAULT_TECHNICAL_DATA,
        documentNumber: "", category: null, language: "de",
      });
      draftReadyRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateData, isEditing]);

  // Neues, leeres Formular (ohne Vorlage): sofort als "geladen" markieren.
  useEffect(() => {
    if (!isEditing && !templateId && !didLoadRef.current) {
      didLoadRef.current = true;
      offerDraftIfDifferent({
        productName: "", productSubtitle: "", imageUrl: "", imageScale: 100,
        descriptionSections: DEFAULT_SECTIONS, technicalDataColumns: DEFAULT_COLUMNS,
        columnWidths: [], technicalDataRows: DEFAULT_TECHNICAL_DATA,
        documentNumber: "", category: null, language: "de",
      });
      draftReadyRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Laufende Eingaben still im Browser sichern (leicht verzögert).
  useEffect(() => {
    if (!draftReadyRef.current || savedRef.current || recoverableDraft) return;
    const snapshot = {
      productName, productSubtitle, imageUrl, imageScale,
      descriptionSections, technicalDataColumns, columnWidths,
      technicalDataRows, documentNumber, category, language,
      savedAt: Date.now(),
    };
    const t = setTimeout(() => {
      if (savedRef.current) return;
      try { localStorage.setItem(draftKey, JSON.stringify(snapshot)); } catch { /* ignorieren */ }
    }, 500);
    return () => clearTimeout(t);
  }, [productName, productSubtitle, imageUrl, imageScale, descriptionSections,
      technicalDataColumns, columnWidths, technicalDataRows, documentNumber,
      category, language, draftKey, recoverableDraft]);

  // Entwurf in die Felder übernehmen.
  const restoreDraft = () => {
    const d = recoverableDraft;
    if (!d) return;
    setProductName(d.productName || "");
    setProductSubtitle(d.productSubtitle || "");
    setImageUrl(d.imageUrl || "");
    setImageScale(Math.min(100, d.imageScale || 100));
    setDescriptionSections(d.descriptionSections || DEFAULT_SECTIONS);
    setTechnicalDataColumns(d.technicalDataColumns || DEFAULT_COLUMNS);
    setColumnWidths(d.columnWidths || []);
    setTechnicalDataRows(withRowIds(d.technicalDataRows || DEFAULT_TECHNICAL_DATA));
    setDocumentNumber(d.documentNumber || "");
    setCategory(d.category ?? null);
    setLanguage(d.language || "de");
    setRecoverableDraft(null);
    toast.success("Entwurf wiederhergestellt");
  };

  // Entwurf verwerfen.
  const discardDraft = () => {
    try { localStorage.removeItem(draftKey); } catch { /* ignorieren */ }
    setRecoverableDraft(null);
  };

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

    if (!documentNumber.trim()) {
      toast.error("Bitte geben Sie eine Prospektnummer ein");
      return;
    }

    setIsSaving(true);
    try {
      const productData = {
        productName,
        productSubtitle: productSubtitle || undefined,
        imageUrl: imageUrl || "", // leeres Feld bewusst als "" senden, damit ein entferntes Bild wirklich gelöscht wird (undefined würde vom Server ignoriert)
        imageScale: imageScale,
        descriptionSections: descriptionSections.filter(s => s.items.some(i => i.trim())),
        technicalDataColumns: technicalDataColumns.filter(c => c.trim()),
        columnWidths: columnWidths.length > 0 ? columnWidths : undefined,
        technicalDataRows: technicalDataRows.filter(t => t.label.trim()).map(t => ({ label: t.label, values: t.values })),
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

      // Gespeichert -> lokalen Entwurf entfernen und keinen neuen mehr schreiben.
      savedRef.current = true;
      try { localStorage.removeItem(draftKey); } catch { /* ignorieren */ }

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
          setImageScale(100); // new images start at maximum size (fills the zone)
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

  // Effektive Spaltenzahl: nicht nur aus den (evtl. leeren) Spaltenköpfen,
  // sondern auch aus der tatsächlichen Werte-Anzahl der Zeilen. So lassen sich
  // auch Datenblätter OHNE gesetzte Spaltenköpfe (importierte/ältere) spaltenweise
  // bearbeiten und löschen.
  const effectiveColumnCount = Math.max(
    technicalDataColumns.length,
    technicalDataRows.reduce((m, r) => Math.max(m, r.values?.length || 0), 0)
  );

  const removeColumn = (colIndex: number) => {
    if (effectiveColumnCount <= 1) return;
    // filter() lässt den Index unverändert, falls technicalDataColumns kürzer ist
    // (z. B. [] bei kopfzeilenlosen Blättern) – dann werden nur die Zeilen-Werte gekürzt.
    setTechnicalDataColumns(technicalDataColumns.filter((_, i) => i !== colIndex));
    setColumnWidths(columnWidths.filter((_, i) => i !== colIndex));
    setTechnicalDataRows(technicalDataRows.map(row => ({
      ...row,
      values: row.values.filter((_, i) => i !== colIndex)
    })));
  };

  const updateColumnHeader = (colIndex: number, value: string) => {
    const newColumns = [...technicalDataColumns];
    while (newColumns.length <= colIndex) newColumns.push(""); // auf Länge auffüllen, falls Köpfe fehlten
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
      values: Array(technicalDataColumns.length).fill(""),
      _id: genRowId(),
    }, ...technicalDataRows]);
  };

  const removeRow = (rowIndex: number) => {
    setTechnicalDataRows(technicalDataRows.filter((_, i) => i !== rowIndex));
  };

  // Drag & drop reordering of technical-data rows
  const rowSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );
  const handleRowDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = technicalDataRows.findIndex(r => r._id === active.id);
    const newIndex = technicalDataRows.findIndex(r => r._id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setTechnicalDataRows(arrayMove(technicalDataRows, oldIndex, newIndex));
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
        {recoverableDraft && (
          <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex items-start gap-3">
            <RotateCcw className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                Nicht gespeicherter Entwurf gefunden
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Beim letzten Mal wurden Eingaben nicht gespeichert
                {recoverableDraft.savedAt
                  ? ` (zuletzt bearbeitet am ${new Date(recoverableDraft.savedAt).toLocaleString("de-DE")})`
                  : ""}
                . Möchten Sie diese wiederherstellen?
              </p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="h-8 bg-amber-600 hover:bg-amber-700 text-white" onClick={restoreDraft}>
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Wiederherstellen
                </Button>
                <Button size="sm" variant="outline" className="h-8 border-amber-300 text-amber-800 hover:bg-amber-100" onClick={discardDraft}>
                  <X className="h-3.5 w-3.5 mr-1.5" />
                  Verwerfen
                </Button>
              </div>
            </div>
          </div>
        )}
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
                    {imageUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => { setImageUrl(""); setImageScale(100); }}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Bild entfernen
                      </Button>
                    )}
                  </div>
                  
                  {/* Image size: exact number input + fine-step buttons + presets + slider */}
                  {imageUrl && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-gray-600">Bildgröße</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setImageScale(100)}
                          className="text-xs h-6"
                        >
                          Zurücksetzen
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Exact value: − [number] % + */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setImageScale(Math.max(10, imageScale - 1))}
                            aria-label="Kleiner"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="relative">
                            <Input
                              type="number"
                              min={10}
                              max={100}
                              value={imageScale}
                              onChange={(e) => {
                                const v = parseInt(e.target.value, 10);
                                if (!isNaN(v)) setImageScale(Math.max(10, Math.min(100, v)));
                              }}
                              className="h-8 w-[72px] text-center pr-6"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">%</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setImageScale(Math.min(100, imageScale + 1))}
                            aria-label="Größer"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {/* Quick presets */}
                        <div className="flex gap-1 ml-auto">
                          <Button type="button" variant={imageScale === 60 ? "default" : "outline"} size="sm" className="h-8 text-xs px-2" onClick={() => setImageScale(60)}>Klein</Button>
                          <Button type="button" variant={imageScale === 80 ? "default" : "outline"} size="sm" className="h-8 text-xs px-2" onClick={() => setImageScale(80)}>Mittel</Button>
                          <Button type="button" variant={imageScale === 100 ? "default" : "outline"} size="sm" className="h-8 text-xs px-2" onClick={() => setImageScale(100)}>Groß</Button>
                        </div>
                      </div>
                      {/* Slider for quick dragging */}
                      <Slider
                        value={[imageScale]}
                        onValueChange={([value]) => setImageScale(value)}
                        min={10}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  {imageUrl && (
                    <div className="mt-2 p-4 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="flex items-center justify-center aspect-[115/135] max-w-full overflow-hidden" style={{ height: '220px' }}>
                        <img
                          src={imageUrl}
                          alt="Vorschau"
                          className="object-contain"
                          style={{ maxHeight: `${imageScale}%`, maxWidth: `${imageScale}%` }}
                        />
                      </div>
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
                  <DndContext sensors={rowSensors} collisionDetection={closestCenter} onDragEnd={handleRowDragEnd}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="w-8"></th>
                        <th className="text-left py-2 px-2 w-48">Eigenschaft</th>
                        {Array.from({ length: effectiveColumnCount }).map((_, colIndex) => (
                          <th key={colIndex} className="py-2 px-1">
                            <div className="flex flex-col gap-1">
                              <Input
                                value={technicalDataColumns[colIndex] ?? ""}
                                onChange={(e) => updateColumnHeader(colIndex, e.target.value)}
                                placeholder="Spalte"
                                className="text-center text-sm h-8"
                              />
                              <Input
                                type="number"
                                value={columnWidths[colIndex] || ''}
                                onChange={(e) => {
                                  const newWidths = [...columnWidths];
                                  while (newWidths.length <= colIndex) newWidths.push(0); // auffüllen, falls Breiten fehlten
                                  newWidths[colIndex] = parseInt(e.target.value) || 0;
                                  setColumnWidths(newWidths);
                                }}
                                placeholder="Breite %"
                                className="text-center text-xs h-7"
                                min="5"
                                max="50"
                              />
                              {effectiveColumnCount > 1 && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeColumn(colIndex)}
                                  title="Diese Spalte löschen"
                                  className="h-7 w-full px-1 text-[11px] whitespace-nowrap border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 gap-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Spalte löschen
                                </Button>
                              )}
                            </div>
                          </th>
                        ))}
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <SortableContext items={technicalDataRows.map(r => r._id!)} strategy={verticalListSortingStrategy}>
                      <tbody>
                        {technicalDataRows.map((row, rowIndex) => (
                          <SortableTechRow
                            key={row._id}
                            row={row}
                            rowIndex={rowIndex}
                            onLabel={updateRowLabel}
                            onValue={updateCellValue}
                            onRemove={removeRow}
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                  </DndContext>
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
                  <Label htmlFor="documentNumber">Prospektnummer *</Label>
                  <Input
                    id="documentNumber"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    placeholder="z.B. 06/2025 | Prospekt Nr. 523"
                    required
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
