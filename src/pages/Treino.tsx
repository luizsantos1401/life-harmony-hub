import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Dumbbell } from "lucide-react";

const Treino = () => {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    exercises: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    const { data } = await supabase
      .from("workouts")
      .select("*")
      .order("date", { ascending: false });

    setWorkouts(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("workouts").insert([{
      ...formData,
      exercises: formData.exercises ? JSON.parse(formData.exercises) : null,
      user_id: user.id,
    }]);

    if (error) {
      toast.error("Erro ao registrar treino");
      return;
    }

    toast.success("Treino registrado!");
    setOpen(false);
    setFormData({
      type: "",
      exercises: "",
      notes: "",
      date: new Date().toISOString().split("T")[0],
    });
    loadWorkouts();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Treino</h1>
            <p className="text-muted-foreground mt-2">
              Registre e acompanhe seus treinos
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Registrar Treino
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Treino</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Treino</Label>
                  <Input
                    placeholder="Ex: Upper Body, Lower Body, Cardio"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Exercícios (JSON)</Label>
                  <Textarea
                    placeholder='[{"nome": "Supino", "series": 4, "reps": 10}]'
                    value={formData.exercises}
                    onChange={(e) =>
                      setFormData({ ...formData, exercises: e.target.value })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Formato JSON ou deixe vazio
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Como foi o treino?"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workouts.map((workout) => (
            <Card key={workout.id} className="card-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-primary" />
                  {workout.type}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {new Date(workout.date).toLocaleDateString("pt-BR")}
                </p>
                {workout.notes && (
                  <p className="text-sm">{workout.notes}</p>
                )}
                {workout.exercises && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium mb-2">Exercícios:</p>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(workout.exercises, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Treino;
