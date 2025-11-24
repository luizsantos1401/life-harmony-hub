import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Workout {
  id: string;
  type: string;
  date: string;
  exercises: any[];
}

export function WorkoutCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [allWorkoutTypes, setAllWorkoutTypes] = useState<string[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDateWorkout, setSelectedDateWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    loadWorkouts();
    loadWorkoutTypes();
  }, []);

  const loadWorkouts = async () => {
    const { data } = await supabase
      .from("workouts")
      .select("*")
      .order("date", { ascending: false });

    setWorkouts((data || []) as Workout[]);
  };

  const loadWorkoutTypes = async () => {
    const { data } = await supabase
      .from("workouts")
      .select("type")
      .order("type");

    if (data) {
      const uniqueTypes = Array.from(new Set(data.map((w) => w.type)));
      setAllWorkoutTypes(uniqueTypes);
    }
  };

  const getWorkoutForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return workouts.find((w) => w.date === dateStr);
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) return;
    setDate(selectedDate);
    
    const workout = getWorkoutForDate(selectedDate);
    if (workout) {
      setSelectedDateWorkout(workout);
    } else {
      setSelectedDateWorkout(null);
      setSelectedWorkout("");
    }
    setDialogOpen(true);
  };

  const handleSaveWorkout = async () => {
    if (!date || !selectedWorkout) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const existingWorkout = getWorkoutForDate(date);

    if (existingWorkout) {
      const { error } = await supabase
        .from("workouts")
        .update({ type: selectedWorkout })
        .eq("id", existingWorkout.id);

      if (error) {
        toast.error("Erro ao atualizar treino");
        return;
      }
      toast.success("Treino atualizado!");
    } else {
      const { error } = await supabase.from("workouts").insert([{
        type: selectedWorkout,
        date: dateStr,
        user_id: user.id,
        exercises: [],
      }]);

      if (error) {
        toast.error("Erro ao marcar treino");
        return;
      }
      toast.success("Treino marcado!");
    }

    loadWorkouts();
    setDialogOpen(false);
    setSelectedWorkout("");
  };

  const handleDeleteWorkout = async () => {
    if (!selectedDateWorkout) return;

    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", selectedDateWorkout.id);

    if (error) {
      toast.error("Erro ao remover treino");
      return;
    }

    toast.success("Treino removido!");
    loadWorkouts();
    setDialogOpen(false);
    setSelectedDateWorkout(null);
  };

  const modifiers = {
    workout: workouts.map((w) => new Date(w.date + "T00:00:00")),
  };

  const modifiersStyles = {
    workout: {
      backgroundColor: "hsl(var(--success))",
      color: "hsl(var(--success-foreground))",
      borderRadius: "0.375rem",
    },
  };

  return (
    <>
      <Card className="card-premium max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-xl font-medium">
            Calendário de Treinos
          </CardTitle>
          <p className="text-sm text-muted-foreground font-light">
            Clique em um dia para marcar ou editar seu treino
          </p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            locale={ptBR}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-medium">
              {date && format(date, "dd 'de' MMMM", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDateWorkout ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground font-light mb-1">
                    Treino marcado:
                  </p>
                  <p className="font-medium">{selectedDateWorkout.type}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedDateWorkout(null);
                      setSelectedWorkout(selectedDateWorkout.type);
                    }}
                  >
                    Alterar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDeleteWorkout}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-light">
                    Selecione o treino realizado
                  </label>
                  <Select value={selectedWorkout} onValueChange={setSelectedWorkout}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um treino" />
                    </SelectTrigger>
                    <SelectContent>
                      {allWorkoutTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSaveWorkout}
                  disabled={!selectedWorkout}
                  className="w-full"
                >
                  Marcar Treino
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
