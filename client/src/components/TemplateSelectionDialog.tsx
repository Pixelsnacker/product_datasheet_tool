import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Package, Container } from "lucide-react";

interface Template {
  id: number;
  name: string;
  category: string | null;
  isSystemTemplate: boolean;
}

interface TemplateSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: Template[];
  onSelectTemplate: (templateId: number | null) => void;
  isLoading?: boolean;
}

export default function TemplateSelectionDialog({
  open,
  onOpenChange,
  templates,
  onSelectTemplate,
  isLoading = false,
}: TemplateSelectionDialogProps) {
  const getCategoryIcon = (category: string | null) => {
    switch (category) {
      case "Fässer":
        return <Package className="h-8 w-8 text-blue-500" />;
      case "Behälter":
        return <Container className="h-8 w-8 text-green-500" />;
      default:
        return <FileText className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vorlage auswählen</DialogTitle>
          <DialogDescription>
            Wählen Sie eine Vorlage aus, um schneller zu starten, oder beginnen Sie mit einem leeren Datenblatt.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Empty Template Option */}
          <button
            onClick={() => {
              onSelectTemplate(null);
              onOpenChange(false);
            }}
            disabled={isLoading}
            className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileText className="h-8 w-8 text-gray-400" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Leeres Datenblatt</h3>
              <p className="text-sm text-gray-600">Beginnen Sie von Grund auf ohne Vorlage</p>
            </div>
          </button>

          {/* System Templates */}
          {templates
            .filter((t) => t.isSystemTemplate)
            .map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  onSelectTemplate(template.id);
                  onOpenChange(false);
                }}
                disabled={isLoading}
                className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {getCategoryIcon(template.category)}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  {template.category && (
                    <p className="text-sm text-gray-600">Kategorie: {template.category}</p>
                  )}
                </div>
              </button>
            ))}

          {/* User Templates */}
          {templates.filter((t) => !t.isSystemTemplate).length > 0 && (
            <>
              <div className="border-t pt-4 mt-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Ihre eigenen Vorlagen</h4>
              </div>
              {templates
                .filter((t) => !t.isSystemTemplate)
                .map((template) => (
                  <button
                    key={template.id}
                    onClick={() => {
                      onSelectTemplate(template.id);
                      onOpenChange(false);
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {getCategoryIcon(template.category)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      {template.category && (
                        <p className="text-sm text-gray-600">Kategorie: {template.category}</p>
                      )}
                    </div>
                  </button>
                ))}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Abbrechen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
