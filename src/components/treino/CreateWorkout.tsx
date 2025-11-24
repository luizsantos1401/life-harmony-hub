import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  sets: string;
  reps: string;
  weight: string;
}

export function CreateWorkout() {
  const [workoutName, setWorkoutName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: "1", name: "", sets: "", reps: "", weight: "" },
  ]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      { id: Date.now().toString(), name: "", sets: "", reps: "", weight: "" },
    ]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter((ex) => ex.id !== id));
    }
  };

  const updateExercise = (id: string, field: keyof Exercise, value: string) => {
    setExercises(
      exercises.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
  };

  const handleSave = async () => {
    if (!workoutName.trim()) {
      toast.error("Digite um nome para o treino");
      return;
    }

    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      toast.error("Adicione pelo menos um exercício");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const exercisesData = validExercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets ? parseInt(ex.sets) : null,
      reps: ex.reps ? parseInt(ex.reps) : null,
      weight: ex.weight ? parseFloat(ex.weight) : null,
    }));

    const { error } = await supabase.from("workouts").insert([{
      type: workoutName,
      exercises: exercisesData,
      user_id: user.id,
      date: new Date().toISOString().split("T")[0],
    }]);

    if (error) {
      toast.error("Erro ao salvar treino");
      return;
    }

    toast.success("Treino salvo com sucesso!");
    setWorkoutName("");
    setExercises([{ id: "1", name: "", sets: "", reps: "", weight: "" }]);
  };

  return (
    <Card className="card-premium">
      <CardHeader>
        <CardTitle className="text-xl font-medium">Novo Treino</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Nome do Treino</Label>
          <Input
            placeholder="Ex: Upper Body, Lower, Push, Pull..."
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="font-light"
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Exercícios</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExercise}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <Card key={exercise.id} className="p-4 bg-muted/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground font-light">
                      Exercício {index + 1}
                    </span>
                    {exercises.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(exercise.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Input
                      placeholder="Nome do exercício"
                      value={exercise.name}
                      onChange={(e) =>
                        updateExercise(exercise.id, "name", e.target.value)
                      }
                      className="font-light"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground font-light">
                        Séries
                      </Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={exercise.sets}
                        onChange={(e) =>
                          updateExercise(exercise.id, "sets", e.target.value)
                        }
                        className="font-light"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground font-light">
                        Reps
                      </Label>
                      <Input
                        type="number"
                        placeholder="12"
                        value={exercise.reps}
                        onChange={(e) =>
                          updateExercise(exercise.id, "reps", e.target.value)
                        }
                        className="font-light"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground font-light">
                        Carga (kg)
                      </Label>
                      <Input
                        type="number"
                        placeholder="20"
                        value={exercise.weight}
                        onChange={(e) =>
                          updateExercise(exercise.id, "weight", e.target.value)
                        }
                        className="font-light"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          Salvar Treino
        </Button>
      </CardContent>
    </Card>
  );
}
