import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FoodPhotoAnalyzer } from "@/components/dieta/FoodPhotoAnalyzer";
import { toast } from "sonner";
import { Plus, UtensilsCrossed } from "lucide-react";

const mealTypes = [
  { value: "breakfast", label: "Café da Manhã" },
  { value: "lunch", label: "Almoço" },
  { value: "dinner", label: "Jantar" },
  { value: "snack", label: "Lanche" },
];

const Dieta = () => {
  const [meals, setMeals] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    meal_type: "breakfast",
    foods: "",
    protein: "",
    carbs: "",
    fats: "",
    calories: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadMeals();
  }, []);

  const loadMeals = async () => {
    const { data } = await supabase
      .from("meals")
      .select("*")
      .order("date", { ascending: false })
      .order("meal_type", { ascending: true });

    setMeals(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("meals").insert([{
      ...formData,
      protein: formData.protein ? parseFloat(formData.protein) : null,
      carbs: formData.carbs ? parseFloat(formData.carbs) : null,
      fats: formData.fats ? parseFloat(formData.fats) : null,
      calories: formData.calories ? parseInt(formData.calories) : null,
      user_id: user.id,
    }]);

    if (error) {
      toast.error("Erro ao registrar refeição");
      return;
    }

    toast.success("Refeição registrada!");
    setOpen(false);
    setFormData({
      meal_type: "breakfast",
      foods: "",
      protein: "",
      carbs: "",
      fats: "",
      calories: "",
      date: new Date().toISOString().split("T")[0],
    });
    loadMeals();
  };

  const handleAnalysisComplete = (result: any) => {
    setFormData({
      ...formData,
      foods: result.foods.join(", "),
      protein: result.protein.toString(),
      carbs: result.carbs.toString(),
      fats: result.fats.toString(),
      calories: result.calories.toString(),
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Dieta</h1>
            <p className="text-muted-foreground mt-2">
              Registre suas refeições e acompanhe sua nutrição
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Registrar Refeição
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Refeição</DialogTitle>
              </DialogHeader>

              <FoodPhotoAnalyzer onAnalysisComplete={handleAnalysisComplete} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Ou preencha manualmente
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Refeição</Label>
                  <Select
                    value={formData.meal_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, meal_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mealTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Alimentos</Label>
                  <Input
                    placeholder="Ex: 200g frango, arroz, salada"
                    value={formData.foods}
                    onChange={(e) =>
                      setFormData({ ...formData, foods: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Proteína (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.protein}
                      onChange={(e) =>
                        setFormData({ ...formData, protein: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Carboidratos (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.carbs}
                      onChange={(e) =>
                        setFormData({ ...formData, carbs: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gorduras (g)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={formData.fats}
                      onChange={(e) =>
                        setFormData({ ...formData, fats: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Calorias</Label>
                    <Input
                      type="number"
                      value={formData.calories}
                      onChange={(e) =>
                        setFormData({ ...formData, calories: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Registrar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {meals.map((meal) => (
            <Card key={meal.id} className="card-soft">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    {mealTypes.find((t) => t.value === meal.meal_type)?.label}
                  </div>
                  <span className="text-sm text-muted-foreground font-normal">
                    {new Date(meal.date).toLocaleDateString("pt-BR")}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{meal.foods}</p>
                <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 rounded-lg">
                  {meal.protein && (
                    <div>
                      <p className="text-xs text-muted-foreground">Proteína</p>
                      <p className="font-semibold">{meal.protein}g</p>
                    </div>
                  )}
                  {meal.carbs && (
                    <div>
                      <p className="text-xs text-muted-foreground">Carboidratos</p>
                      <p className="font-semibold">{meal.carbs}g</p>
                    </div>
                  )}
                  {meal.fats && (
                    <div>
                      <p className="text-xs text-muted-foreground">Gorduras</p>
                      <p className="font-semibold">{meal.fats}g</p>
                    </div>
                  )}
                  {meal.calories && (
                    <div>
                      <p className="text-xs text-muted-foreground">Calorias</p>
                      <p className="font-semibold">{meal.calories}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dieta;
