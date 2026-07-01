import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, FileText, Trash2, Edit, ExternalLink, Loader2, Search, X, Copy, Settings, ChevronDown, ChevronRight, FolderOpen, Folder, GripVertical } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useState, useMemo, useCallback } from "react";
import TemplateSelectionDialog from "@/components/TemplateSelectionDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";

// All available product categories
export const PRODUCT_CATEGORIES = [
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

type Product = {
  id: number;
  productName: string;
  productSubtitle?: string | null;
  documentNumber?: string | null;
  category?: string | null;
  sortOrder?: number | null;
  createdAt: Date;
};

// Sortable product card component
function SortableProductCard({
  product,
  onDelete,
  onDuplicate,
  onCategoryChange,
  isDuplicating,
}: {
  product: Product;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onCategoryChange: (id: number, category: string | null) => void;
  isDuplicating: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="hover:shadow-md transition-shadow bg-white group">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-2">
            {/* Drag handle */}
            <button
              {...attributes}
              {...listeners}
              className="mt-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none flex-shrink-0"
              title="Ziehen zum Verschieben"
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate text-gray-800">{product.productName}</CardTitle>
              {product.productSubtitle && (
                <CardDescription className="mt-0.5 truncate text-xs">
                  {product.productSubtitle}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-xs text-gray-400 mb-3">
            Erstellt: {format(new Date(product.createdAt), "dd.MM.yyyy", { locale: de })}
          </div>

          {/* Category selector */}
          <div className="mb-3">
            <Select
              value={product.category || "__none__"}
              onValueChange={(val) => onCategoryChange(product.id, val === "__none__" ? null : val)}
            >
              <SelectTrigger className="h-7 text-xs border-dashed">
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

          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" asChild className="flex-1 h-8 text-xs">
              <Link href={`/product/${product.id}`}>
                <ExternalLink className="h-3 w-3 mr-1" />
                Ansehen
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="h-8 w-8 p-0">
              <Link href={`/edit/${product.id}`}>
                <Edit className="h-3 w-3" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onDuplicate(product.id)}
              disabled={isDuplicating}
              title="Duplizieren"
            >
              {isDuplicating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Datenblatt löschen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Möchten Sie "{product.productName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(product.id)}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Löschen
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Category group component
function CategoryGroup({
  category,
  products,
  isExpanded,
  onToggle,
  onDelete,
  onDuplicate,
  onCategoryChange,
  isDuplicating,
}: {
  category: string;
  products: Product[];
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onCategoryChange: (id: number, category: string | null) => void;
  isDuplicating: boolean;
}) {
  const productIds = products.map((p) => p.id);

  return (
    <div className="mb-4">
      {/* Category header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-white border rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
      >
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 text-primary flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-gray-400 flex-shrink-0" />
        )}
        <span className="font-medium text-gray-800 flex-1 text-left">{category}</span>
        <Badge variant="secondary" className="text-xs">
          {products.length}
        </Badge>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {/* Products grid */}
      {isExpanded && (
        <div className="mt-2 pl-4">
          <SortableContext items={productIds} strategy={verticalListSortingStrategy}>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <SortableProductCard
                  key={product.id}
                  product={product}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onCategoryChange={onCategoryChange}
                  isDuplicating={isDuplicating}
                />
              ))}
            </div>
          </SortableContext>
          {products.length === 0 && (
            <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed rounded-lg">
              Keine Produkte in dieser Kategorie
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [searchQuery, setSearchQuery] = useState("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([...PRODUCT_CATEGORIES, UNCATEGORIZED])
  );
  const [activeId, setActiveId] = useState<number | null>(null);

  const { data: templates = [] } = trpc.templates.list.useQuery();
  const { data: products, isLoading } = trpc.products.list.useQuery();

  const deleteMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      toast.success("Produktdatenblatt gelöscht");
    },
    onError: () => {
      toast.error("Fehler beim Löschen");
    },
  });

  const duplicateMutation = trpc.products.duplicate.useMutation({
    onSuccess: (newProduct) => {
      utils.products.list.invalidate();
      toast.success("Produktdatenblatt dupliziert");
      setLocation(`/edit/${newProduct.id}`);
    },
    onError: () => {
      toast.error("Fehler beim Duplizieren");
    },
  });

  const updateCategoryMutation = trpc.products.updateCategory.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
    },
    onError: () => {
      toast.error("Fehler beim Verschieben");
      utils.products.list.invalidate();
    },
  });

  const handleCategoryChange = useCallback(
    (id: number, category: string | null) => {
      // Optimistic update
      utils.products.list.setData(undefined, (old) => {
        if (!old) return old;
        return old.map((p) => (p.id === id ? { ...p, category } : p));
      });
      updateCategoryMutation.mutate({ id, category });
    },
    [utils, updateCategoryMutation]
  );

  // Drag & Drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find which category the drop target belongs to
    const overId = over.id as number;
    const overProduct = products?.find((p) => p.id === overId);
    if (!overProduct) return;

    const activeProduct = products?.find((p) => p.id === active.id);
    if (!activeProduct) return;

    // If dropped into a different category, update category
    if (activeProduct.category !== overProduct.category) {
      handleCategoryChange(activeProduct.id, overProduct.category ?? null);
      toast.success(`"${activeProduct.productName}" nach "${overProduct.category || UNCATEGORIZED}" verschoben`);
    }
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Filter and group products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    const searchLower = searchQuery.toLowerCase().trim();
    return products.filter(
      (p) =>
        !searchLower ||
        p.productName.toLowerCase().includes(searchLower) ||
        (p.productSubtitle?.toLowerCase().includes(searchLower)) ||
        (p.documentNumber?.toLowerCase().includes(searchLower))
    );
  }, [products, searchQuery]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    // Initialize all categories
    for (const cat of PRODUCT_CATEGORIES) {
      groups[cat] = [];
    }
    groups[UNCATEGORIZED] = [];

    for (const product of filteredProducts) {
      const cat = product.category && PRODUCT_CATEGORIES.includes(product.category as any)
        ? product.category
        : UNCATEGORIZED;
      groups[cat].push(product);
    }
    return groups;
  }, [filteredProducts]);

  const activeProduct = activeId ? products?.find((p) => p.id === activeId) : null;
  const hasActiveFilters = searchQuery.trim() !== "";

  // Categories to display (only those with products, or all if no search)
  const categoriesToShow = useMemo(() => {
    const allCats = [...PRODUCT_CATEGORIES, UNCATEGORIZED];
    if (hasActiveFilters) {
      return allCats.filter((cat) => (groupedProducts[cat]?.length ?? 0) > 0);
    }
    return allCats;
  }, [groupedProducts, hasActiveFilters]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-gray-800">Produktdatenblatt Generator</h1>
              <p className="text-sm text-gray-500">Produktdatenblatt Verwaltung</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => setShowTemplateDialog(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Neues Datenblatt
            </Button>
            <Button variant="outline" size="icon" onClick={() => setLocation("/settings/pdf")} title="PDF-Einstellungen">
              <Settings className="h-5 w-5" />
            </Button>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Ihre Produktdatenblätter</h2>
          <p className="text-gray-500 text-sm mt-1">
            Produkte per Drag & Drop zwischen Kategorien verschieben oder Kategorie direkt am Produkt ändern.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Produktname, Untertitel, Dokumentnummer..."
              className="pl-10 pr-10 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={() => setSearchQuery("")} className="gap-2 text-gray-500">
              <X className="h-4 w-4" />
              Suche löschen
            </Button>
          )}
        </div>

        {/* Results count */}
        {products && products.length > 0 && (
          <div className="mb-4 text-sm text-gray-500">
            {hasActiveFilters ? (
              <span>{filteredProducts.length} von {products.length} Produkten gefunden</span>
            ) : (
              <span>{products.length} Produkte in {PRODUCT_CATEGORIES.length + 1} Kategorien</span>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products && products.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-2">
              {categoriesToShow.map((category) => (
                <CategoryGroup
                  key={category}
                  category={category}
                  products={groupedProducts[category] || []}
                  isExpanded={expandedCategories.has(category)}
                  onToggle={() => toggleCategory(category)}
                  onDelete={(id) => deleteMutation.mutate({ id })}
                  onDuplicate={(id) => duplicateMutation.mutate({ id })}
                  onCategoryChange={handleCategoryChange}
                  isDuplicating={duplicateMutation.isPending}
                />
              ))}
            </div>

            <DragOverlay>
              {activeProduct ? (
                <Card className="shadow-xl bg-white opacity-95 border-primary border-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-gray-800">{activeProduct.productName}</CardTitle>
                    {activeProduct.productSubtitle && (
                      <CardDescription className="text-xs">{activeProduct.productSubtitle}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <Card className="text-center py-12 bg-white">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2 text-gray-800">Keine Produktdatenblätter</h3>
              <p className="text-gray-500 mb-4">
                Erstellen Sie Ihr erstes Produktdatenblatt, um loszulegen.
              </p>
              <Button onClick={() => setShowTemplateDialog(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Erstes Datenblatt erstellen
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Template Selection Dialog */}
      <TemplateSelectionDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        templates={templates}
        onSelectTemplate={(templateId) => {
          if (templateId === null) {
            setLocation("/create");
          } else {
            setLocation(`/create?template=${templateId}`);
          }
        }}
      />
    </div>
  );
}
