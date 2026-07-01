import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Save, RotateCcw, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PdfSettingsData {
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

export default function PdfSettings() {
  const [settings, setSettings] = useState<PdfSettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: savedSettings, isLoading } = trpc.pdfSettings.get.useQuery();
  const updateMutation = trpc.pdfSettings.update.useMutation();
  const resetMutation = trpc.pdfSettings.reset.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (savedSettings) {
      setSettings({
        marginTop: savedSettings.marginTop ?? defaultSettings.marginTop,
        marginBottom: savedSettings.marginBottom ?? defaultSettings.marginBottom,
        marginLeft: savedSettings.marginLeft ?? defaultSettings.marginLeft,
        marginRight: savedSettings.marginRight ?? defaultSettings.marginRight,
        fontSizeTitle: savedSettings.fontSizeTitle ?? defaultSettings.fontSizeTitle,
        fontSizeSubtitle: savedSettings.fontSizeSubtitle ?? defaultSettings.fontSizeSubtitle,
        fontSizeHeading: savedSettings.fontSizeHeading ?? defaultSettings.fontSizeHeading,
        fontSizeText: savedSettings.fontSizeText ?? defaultSettings.fontSizeText,
        fontSizeTable: savedSettings.fontSizeTable ?? defaultSettings.fontSizeTable,
        fontSizeFooter: savedSettings.fontSizeFooter ?? defaultSettings.fontSizeFooter,
        sectionSpacing: savedSettings.sectionSpacing ?? defaultSettings.sectionSpacing,
        lineHeight: savedSettings.lineHeight ?? defaultSettings.lineHeight,
        maxImageHeight: savedSettings.maxImageHeight ?? defaultSettings.maxImageHeight,
        logoHeight: savedSettings.logoHeight ?? defaultSettings.logoHeight,
        tableRowPadding: savedSettings.tableRowPadding ?? defaultSettings.tableRowPadding,
      });
    }
  }, [savedSettings]);

  const updateSetting = <K extends keyof PdfSettingsData>(key: K, value: PdfSettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(settings);
      await utils.pdfSettings.get.invalidate();
      setHasChanges(false);
      toast.success("Einstellungen gespeichert!");
    } catch (error) {
      toast.error("Fehler beim Speichern");
    }
  };

  const handleReset = async () => {
    try {
      await resetMutation.mutateAsync();
      await utils.pdfSettings.get.invalidate();
      setSettings(defaultSettings);
      setHasChanges(false);
      toast.success("Einstellungen zurückgesetzt!");
    } catch (error) {
      toast.error("Fehler beim Zurücksetzen");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">PDF-Layout Einstellungen</h1>
              <p className="text-sm text-gray-500">Passen Sie das PDF-Layout nach Ihren Wünschen an</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleReset}
              disabled={resetMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Zurücksetzen
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || updateMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Speichern
            </Button>
          </div>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Seitenränder */}
          <Card>
            <CardHeader>
              <CardTitle>Seitenränder</CardTitle>
              <CardDescription>Abstände zum Seitenrand in Millimetern (mm)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Oben: {settings.marginTop} mm</Label>
                  <Slider
                    value={[settings.marginTop]}
                    onValueChange={([v]) => updateSetting("marginTop", v)}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unten: {settings.marginBottom} mm</Label>
                  <Slider
                    value={[settings.marginBottom]}
                    onValueChange={([v]) => updateSetting("marginBottom", v)}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Links: {settings.marginLeft} mm</Label>
                  <Slider
                    value={[settings.marginLeft]}
                    onValueChange={([v]) => updateSetting("marginLeft", v)}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rechts: {settings.marginRight} mm</Label>
                  <Slider
                    value={[settings.marginRight]}
                    onValueChange={([v]) => updateSetting("marginRight", v)}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schriftgrößen */}
          <Card>
            <CardHeader>
              <CardTitle>Schriftgrößen</CardTitle>
              <CardDescription>Textgrößen in Pixeln (px)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titel: {settings.fontSizeTitle} px</Label>
                  <Slider
                    value={[settings.fontSizeTitle]}
                    onValueChange={([v]) => updateSetting("fontSizeTitle", v)}
                    min={8}
                    max={36}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Untertitel: {settings.fontSizeSubtitle} px</Label>
                  <Slider
                    value={[settings.fontSizeSubtitle]}
                    onValueChange={([v]) => updateSetting("fontSizeSubtitle", v)}
                    min={6}
                    max={28}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Überschriften: {settings.fontSizeHeading} px</Label>
                  <Slider
                    value={[settings.fontSizeHeading]}
                    onValueChange={([v]) => updateSetting("fontSizeHeading", v)}
                    min={5}
                    max={20}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Text: {settings.fontSizeText} px</Label>
                  <Slider
                    value={[settings.fontSizeText]}
                    onValueChange={([v]) => updateSetting("fontSizeText", v)}
                    min={4}
                    max={16}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tabelle: {settings.fontSizeTable} px</Label>
                  <Slider
                    value={[settings.fontSizeTable]}
                    onValueChange={([v]) => updateSetting("fontSizeTable", v)}
                    min={4}
                    max={14}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Footer: {settings.fontSizeFooter} px</Label>
                  <Slider
                    value={[settings.fontSizeFooter]}
                    onValueChange={([v]) => updateSetting("fontSizeFooter", v)}
                    min={4}
                    max={12}
                    step={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Abstände */}
          <Card>
            <CardHeader>
              <CardTitle>Abstände</CardTitle>
              <CardDescription>Abstände zwischen Elementen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Abschnitt-Abstand: {settings.sectionSpacing} px</Label>
                  <Slider
                    value={[settings.sectionSpacing]}
                    onValueChange={([v]) => updateSetting("sectionSpacing", v)}
                    min={0}
                    max={30}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Zeilenhöhe: {settings.lineHeight}%</Label>
                  <Slider
                    value={[settings.lineHeight]}
                    onValueChange={([v]) => updateSetting("lineHeight", v)}
                    min={100}
                    max={200}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tabellen-Zellenabstand: {settings.tableRowPadding} px</Label>
                  <Slider
                    value={[settings.tableRowPadding]}
                    onValueChange={([v]) => updateSetting("tableRowPadding", v)}
                    min={1}
                    max={12}
                    step={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bilder */}
          <Card>
            <CardHeader>
              <CardTitle>Bilder</CardTitle>
              <CardDescription>Größen für Produktbild und Logo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Max. Bildhöhe: {settings.maxImageHeight} px</Label>
                  <Slider
                    value={[settings.maxImageHeight]}
                    onValueChange={([v]) => updateSetting("maxImageHeight", v)}
                    min={50}
                    max={400}
                    step={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo-Höhe: {settings.logoHeight} px</Label>
                  <Slider
                    value={[settings.logoHeight]}
                    onValueChange={([v]) => updateSetting("logoHeight", v)}
                    min={16}
                    max={80}
                    step={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hinweis */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Tipps für ein optimales Layout</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Reduzieren Sie die Seitenränder auf 5-8 mm für mehr Platz</li>
            <li>• Kleinere Schriftgrößen (6-7 px für Text/Tabelle) helfen, alles auf eine Seite zu bekommen</li>
            <li>• Die maximale Bildhöhe sollte 150-180 px nicht überschreiten</li>
            <li>• Testen Sie die Einstellungen mit dem PDF-Download eines Produkts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
