import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Loader2, Sparkles } from "lucide-react";

interface AnalysisResult {
  foods: string[];
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

interface FoodPhotoAnalyzerProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export function FoodPhotoAnalyzer({ onAnalysisComplete }: FoodPhotoAnalyzerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Analyze photo
    await analyzePhoto(file);
  };

  const analyzePhoto = async (file: File) => {
    setAnalyzing(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;

        const { data, error } = await supabase.functions.invoke("analyze-food", {
          body: { imageBase64: base64 },
        });

        if (error) throw error;

        if (data?.error) {
          toast.error(data.error);
          setAnalyzing(false);
          return;
        }

        toast.success("Análise concluída! Dados preenchidos automaticamente");
        onAnalysisComplete(data);
        setAnalyzing(false);
      };

      reader.onerror = () => {
        toast.error("Erro ao processar imagem");
        setAnalyzing(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error analyzing photo:", error);
      toast.error("Erro ao analisar foto. Tente novamente.");
      setAnalyzing(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Análise com IA
        </CardTitle>
        <CardDescription>
          Tire ou envie uma foto do prato e a IA identificará os alimentos e valores nutricionais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {previewUrl && (
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              Tirar/Enviar Foto
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Funciona melhor com fotos claras e de ângulo superior
        </p>
      </CardContent>
    </Card>
  );
}
