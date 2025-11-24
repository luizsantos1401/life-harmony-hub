import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Workout {
  id: string;
  type: string;
  exercises: any[];
  date: string;
  notes?: string;
}

export function WorkoutList() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const { data } = await supabase
      .from("workouts")
      .select("*")
      .order("date", { ascending: false });

    setWorkouts((data || []) as Workout[]);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("workouts").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao deletar treino");
      return;
    }

    toast.success("Treino deletado!");
    loadWorkouts();
    setDeleteId(null);
  };

  // Group workouts by type
  const groupedWorkouts = workouts.reduce((acc, workout) => {
    if (!acc[workout.type]) {
      acc[workout.type] = [];
    }
    acc[workout.type].push(workout);
    return acc;
  }, {} as Record<string, Workout[]>);

  return (
    <>
      <div className="space-y-6">
        {Object.keys(groupedWorkouts).length === 0 ? (
          <Card className="card-premium">
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-light">
                Nenhum treino criado ainda
              </p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedWorkouts).map(([type, typeWorkouts]) => (
            <Card key={type} className="card-premium">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-medium flex items-center gap-2">
                    <Dumbbell className="h-5 w-5 text-primary" />
                    {type}
                  </CardTitle>
                  <span className="text-sm text-muted-foreground font-light">
                    {typeWorkouts.length} {typeWorkouts.length === 1 ? "registro" : "registros"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {typeWorkouts[0].exercises && typeWorkouts[0].exercises.length > 0 ? (
                  <div className="space-y-3">
                    {typeWorkouts[0].exercises.map((ex: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-muted/30 rounded-lg space-y-1"
                      >
                        <p className="font-medium">{ex.name}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground font-light">
                          {ex.sets && <span>{ex.sets} séries</span>}
                          {ex.reps && <span>{ex.reps} reps</span>}
                          {ex.weight && <span>{ex.weight}kg</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground font-light">
                    Sem exercícios cadastrados
                  </p>
                )}

                <div className="pt-2 flex justify-between items-center border-t">
                  <span className="text-xs text-muted-foreground font-light">
                    Última vez:{" "}
                    {new Date(typeWorkouts[0].date).toLocaleDateString("pt-BR")}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(typeWorkouts[0].id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
