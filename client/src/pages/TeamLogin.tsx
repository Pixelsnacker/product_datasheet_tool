import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

export default function TeamLogin() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/team-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: code.trim() }),
      });

      if (res.ok) {
        toast.success("Zugang gewährt!");
        // Small delay to let cookie be set, then redirect
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 300);
      } else {
        toast.error("Ungültiger Zugangscode. Bitte versuchen Sie es erneut.");
        setCode("");
      }
    } catch (err) {
      toast.error("Verbindungsfehler. Bitte versuchen Sie es erneut.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-md mb-4">
              <FileText className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Produktdatenblatt Generator</h1>
            <p className="text-gray-500 text-sm mt-1">Team-Zugang</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="code" className="flex items-center gap-2 text-gray-700">
                <Lock className="h-4 w-4" />
                Zugangscode
              </Label>
              <Input
                id="code"
                type="password"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Zugangscode eingeben..."
                className="h-11 text-base"
                autoFocus
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Wird geprüft...
                </>
              ) : (
                "Zugang öffnen"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-gray-400">
              Für Manus-Admin-Zugang:{" "}
              <a href="/" className="text-primary hover:underline">
                Hier anmelden
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
