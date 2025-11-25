import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

const GerarPlano = () => {
  const [loading, setLoading] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);

  // Routine form
  const [routineGoal, setRoutineGoal] = useState("");
  const [routineTime, setRoutineTime] = useState("");
  const [routinePreferences, setRoutinePreferences] = useState("");

  // Diet form
  const [dietGoal, setDietGoal] = useState("");
  const [foodPreferences, setFoodPreferences] = useState("");
  const [restrictions, setRestrictions] = useState("");

  // Workout form
  const [workoutGoal, setWorkoutGoal] = useState("");
  const [workoutTime, setWorkoutTime] = useState("");
  const [workoutStyle, setWorkoutStyle] = useState("");
  const [workoutLevel, setWorkoutLevel] = useState("beginner");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const generatePlan = async (type: "routine" | "diet" | "workout") => {
    setLoading(true);
    setGeneratedPlan("");

    try {
      let userInfo: any = {};

      if (type === "routine") {
        if (!routineGoal || !routineTime) {
          toast.error("Preencha todos os campos obrigatórios");
          setLoading(false);
          return;
        }
        userInfo = {
          goal: routineGoal,
          availableTime: routineTime,
          preferences: routinePreferences,
        };
      } else if (type === "diet") {
        if (!dietGoal) {
          toast.error("Preencha o objetivo");
          setLoading(false);
          return;
        }
        userInfo = {
          goal: dietGoal,
          foodPreferences,
          restrictions,
          weight: userProfile?.weight,
          height: userProfile?.height,
        };
      } else if (type === "workout") {
        if (!workoutGoal || !workoutTime) {
          toast.error("Preencha todos os campos obrigatórios");
          setLoading(false);
          return;
        }
        userInfo = {
          goal: workoutGoal,
          availableTime: workoutTime,
          workoutStyle,
          level: workoutLevel,
        };
      }

      const { data, error } = await supabase.functions.invoke("generate-plan", {
        body: { type, userInfo },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      setGeneratedPlan(data.plan);
      toast.success("Plano gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast.error("Erro ao gerar plano. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Gerar Plano com IA</h1>
          <p className="text-muted-foreground mt-1 font-light">
            Crie rotinas, dietas e treinos personalizados
          </p>
        </div>

        <Tabs defaultValue="routine" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="routine">Rotina</TabsTrigger>
            <TabsTrigger value="diet">Dieta</TabsTrigger>
            <TabsTrigger value="workout">Treino</TabsTrigger>
          </TabsList>

          <TabsContent value="routine" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerar Rotina Diária</CardTitle>
                <CardDescription>
                  Preencha as informações para criar uma rotina personalizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="routine-goal">Objetivo *</Label>
                  <Input
                    id="routine-goal"
                    placeholder="Ex: Melhorar produtividade, equilibrar vida pessoal e trabalho"
                    value={routineGoal}
                    onChange={(e) => setRoutineGoal(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routine-time">Horários Disponíveis *</Label>
                  <Input
                    id="routine-time"
                    placeholder="Ex: Manhã (6h-9h), Tarde (14h-17h)"
                    value={routineTime}
                    onChange={(e) => setRoutineTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="routine-preferences">Preferências</Label>
                  <Textarea
                    id="routine-preferences"
                    placeholder="Ex: Gosto de exercícios pela manhã, prefiro ler à noite"
                    value={routinePreferences}
                    onChange={(e) => setRoutinePreferences(e.target.value)}
                  />
                </div>

                <Button
                  onClick={() => generatePlan("routine")}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Rotina
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diet" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerar Plano Alimentar</CardTitle>
                <CardDescription>
                  Preencha as informações para criar uma dieta personalizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="diet-goal">Objetivo *</Label>
                  <Input
                    id="diet-goal"
                    placeholder="Ex: Perder peso, ganhar massa muscular, alimentação saudável"
                    value={dietGoal}
                    onChange={(e) => setDietGoal(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="food-preferences">Preferências Alimentares</Label>
                  <Textarea
                    id="food-preferences"
                    placeholder="Ex: Vegetariano, gosto de frango, não gosto de peixe"
                    value={foodPreferences}
                    onChange={(e) => setFoodPreferences(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restrictions">Restrições</Label>
                  <Textarea
                    id="restrictions"
                    placeholder="Ex: Intolerante à lactose, alérgico a amendoim"
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                  />
                </div>

                {userProfile?.weight && (
                  <p className="text-sm text-muted-foreground">
                    Peso do perfil: {userProfile.weight} kg
                  </p>
                )}
                {userProfile?.height && (
                  <p className="text-sm text-muted-foreground">
                    Altura do perfil: {userProfile.height} cm
                  </p>
                )}

                <Button
                  onClick={() => generatePlan("diet")}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Dieta
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="workout" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Gerar Plano de Treino</CardTitle>
                <CardDescription>
                  Preencha as informações para criar um treino personalizado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workout-goal">Objetivo *</Label>
                  <Input
                    id="workout-goal"
                    placeholder="Ex: Hipertrofia, perda de gordura, condicionamento"
                    value={workoutGoal}
                    onChange={(e) => setWorkoutGoal(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workout-time">Horários Disponíveis *</Label>
                  <Input
                    id="workout-time"
                    placeholder="Ex: Manhã (6h-7h), 3x por semana"
                    value={workoutTime}
                    onChange={(e) => setWorkoutTime(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workout-style">Estilo de Treino</Label>
                  <Input
                    id="workout-style"
                    placeholder="Ex: Musculação, funcional, crossfit"
                    value={workoutStyle}
                    onChange={(e) => setWorkoutStyle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workout-level">Nível de Experiência</Label>
                  <Select value={workoutLevel} onValueChange={setWorkoutLevel}>
                    <SelectTrigger id="workout-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => generatePlan("workout")}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Gerar Treino
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {generatedPlan && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Plano Gerado</CardTitle>
              <CardDescription className="text-amber-600 dark:text-amber-500">
                ⚠️ Este plano é uma sugestão e não substitui orientação profissional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{generatedPlan}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GerarPlano;
