import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings, DollarSign, Palette } from "lucide-react";

const Configuracoes = () => {
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    monthly_income: "",
    fixed_expenses: "",
    color_investments: "#ef4444",
    color_expenses: "#3b82f6",
    color_income: "#22c55e",
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setPreferences({
        monthly_income: data.monthly_income?.toString() || "",
        fixed_expenses: data.fixed_expenses?.toString() || "",
        color_investments: data.color_investments || "#ef4444",
        color_expenses: data.color_expenses || "#3b82f6",
        color_income: data.color_income || "#22c55e",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Verificar se já existe preferência
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const payload = {
      user_id: user.id,
      monthly_income: preferences.monthly_income ? parseFloat(preferences.monthly_income) : 0,
      fixed_expenses: preferences.fixed_expenses ? parseFloat(preferences.fixed_expenses) : 0,
      color_investments: preferences.color_investments,
      color_expenses: preferences.color_expenses,
      color_income: preferences.color_income,
    };

    let error;
    if (existing) {
      const result = await supabase
        .from("user_preferences")
        .update(payload)
        .eq("user_id", user.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("user_preferences")
        .insert([payload]);
      error = result.error;
    }

    if (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } else {
      toast.success("Configurações salvas com sucesso!");
    }

    setLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Configurações</h1>
          <p className="text-muted-foreground mt-1 font-light">
            Personalize seu Essenza
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Automação Financeira */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Automação Financeira
              </CardTitle>
              <CardDescription>
                Configure valores que serão registrados automaticamente todo dia 1º do mês
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ganho Mensal (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={preferences.monthly_income}
                  onChange={(e) =>
                    setPreferences({ ...preferences, monthly_income: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Será registrado como "Salário" todo início de mês
                </p>
              </div>

              <div className="space-y-2">
                <Label>Gastos Fixos Mensais (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={preferences.fixed_expenses}
                  onChange={(e) =>
                    setPreferences({ ...preferences, fixed_expenses: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Será registrado como "Gastos Fixos" todo início de mês
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Personalização de Cores */}
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Personalização de Cores
              </CardTitle>
              <CardDescription>
                Escolha as cores para cada categoria financeira
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Investimentos</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={preferences.color_investments}
                      onChange={(e) =>
                        setPreferences({ ...preferences, color_investments: e.target.value })
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={preferences.color_investments}
                      onChange={(e) =>
                        setPreferences({ ...preferences, color_investments: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Despesas</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={preferences.color_expenses}
                      onChange={(e) =>
                        setPreferences({ ...preferences, color_expenses: e.target.value })
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={preferences.color_expenses}
                      onChange={(e) =>
                        setPreferences({ ...preferences, color_expenses: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Receitas</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={preferences.color_income}
                      onChange={(e) =>
                        setPreferences({ ...preferences, color_income: e.target.value })
                      }
                      className="w-16 h-10"
                    />
                    <Input
                      type="text"
                      value={preferences.color_income}
                      onChange={(e) =>
                        setPreferences({ ...preferences, color_income: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                As cores personalizadas serão aplicadas nos gráficos e visualizações
              </p>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default Configuracoes;
