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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FoodPhotoAnalyzer } from "@/components/dieta/FoodPhotoAnalyzer";
import { toast } from "sonner";
import { Plus, UtensilsCrossed, CheckCircle2, BookOpen } from "lucide-react";

const mealTypes = [
  { value: "breakfast", label: "Café da Manhã" },
  { value: "lunch", label: "Almoço" },
  { value: "dinner", label: "Jantar" },
  { value: "snack", label: "Lanche" },
];

const Dieta = () => {
  const [meals, setMeals] = useState<any[]>([]);
  const [dietPlan, setDietPlan] = useState<string | null>(null);
  const [todayCompletion, setTodayCompletion] = useState<any>(null);
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
    loadDietPlan();
    loadTodayCompletion();
  }, []);

  const loadMeals = async () => {
    const { data } = await supabase
      .from("meals")
      .select("*")
      .order("date", { ascending: false })
      .order("meal_type", { ascending: true });

    setMeals(data || []);
  };

  const loadDietPlan = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("diet_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setDietPlan(data.plan_content);
    }
  };

  const loadTodayCompletion = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("daily_diet_completions")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .single();

    if (data) {
      setTodayCompletion(data);
    }
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

  const handleCompleteDiet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];
    
    const { data: todayMeals } = await supabase
      .from("meals")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today);

    if (!todayMeals || todayMeals.length === 0) {
      toast.error("Nenhuma refeição registrada hoje");
      return;
    }

    const totals = todayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + (meal.protein || 0),
        carbs: acc.carbs + (meal.carbs || 0),
        fats: acc.fats + (meal.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    const { error } = await supabase
      .from("daily_diet_completions")
      .upsert([{
        user_id: user.id,
        date: today,
        total_calories: totals.calories,
        total_protein: totals.protein,
        total_carbs: totals.carbs,
        total_fats: totals.fats,
      }], { onConflict: "user_id,date" });

    if (error) {
      toast.error("Erro ao concluir dieta");
      return;
    }

    toast.success("Dieta do dia concluída!");
    loadTodayCompletion();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Dieta</h1>
          <p className="text-muted-foreground mt-1 font-light">
            Registre suas refeições e acompanhe sua nutrição
          </p>
        </div>

        <Tabs defaultValue="meals" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="meals">Refeições</TabsTrigger>
            <TabsTrigger value="diet-plan">Sua Dieta</TabsTrigger>
          </TabsList>

          <TabsContent value="meals" className="space-y-6 mt-6">
            <div className="flex items-center justify-end">
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
          </TabsContent>

          <TabsContent value="diet-plan" className="space-y-6 mt-6">
            {dietPlan ? (
              <div className="space-y-6">
                <Card className="card-premium">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Seu Plano de Dieta
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={dietPlan}
                      readOnly
                      rows={15}
                      className="resize-none font-light"
                    />
                    <p className="text-xs text-muted-foreground mt-4">
                      ⚠️ Essenza não substitui um profissional de saúde ou nutricionista.
                    </p>
                  </CardContent>
                </Card>

                {todayCompletion ? (
                  <Card className="card-premium">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                        Dieta de Hoje Concluída
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 p-4 bg-success/10 rounded-lg">
                        <div>
                          <p className="text-xs text-muted-foreground">Calorias</p>
                          <p className="text-lg font-semibold text-success">
                            {todayCompletion.total_calories}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Proteínas</p>
                          <p className="text-lg font-semibold text-success">
                            {todayCompletion.total_protein}g
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Carboidratos</p>
                          <p className="text-lg font-semibold text-success">
                            {todayCompletion.total_carbs}g
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Gorduras</p>
                          <p className="text-lg font-semibold text-success">
                            {todayCompletion.total_fats}g
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="card-premium">
                    <CardHeader>
                      <CardTitle>Concluir Dieta de Hoje</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Ao concluir, seus macros de hoje serão somados e salvos automaticamente.
                      </p>
                      <Button onClick={handleCompleteDiet} className="w-full">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Concluí Minha Dieta
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="card-premium">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground font-light">
                    Você ainda não tem um plano de dieta.
                    <br />
                    Vá para "Gerar Plano IA" para criar um.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dieta;
