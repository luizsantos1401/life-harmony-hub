import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const Habitos = () => {
  const [habits, setHabits] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });

  useEffect(() => {
    loadHabits();
  }, []);

  const loadHabits = async () => {
    const { data } = await supabase
      .from("habits")
      .select(`
        *,
        habit_completions(*)
      `)
      .order("created_at", { ascending: false });

    setHabits(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("habits").insert([{
      ...formData,
      user_id: user.id,
    }]);

    if (error) {
      toast.error("Erro ao criar hábito");
      return;
    }

    toast.success("Hábito criado!");
    setOpen(false);
    setFormData({ title: "", description: "" });
    loadHabits();
  };

  const toggleHabit = async (habitId: string, isCompleted: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isCompleted) {
      // Find today's completion and delete it
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const habit = habits.find((h) => h.id === habitId);
      const completion = habit?.habit_completions?.find(
        (c: any) => new Date(c.completed_at) >= todayStart
      );

      if (completion) {
        await supabase.from("habit_completions").delete().eq("id", completion.id);
      }
    } else {
      await supabase.from("habit_completions").insert([{
        habit_id: habitId,
        user_id: user.id,
      }]);
    }

    loadHabits();
  };

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase.from("habits").delete().eq("id", habitId);

    if (error) {
      toast.error("Erro ao deletar hábito");
      return;
    }

    toast.success("Hábito deletado!");
    loadHabits();
  };

  const isCompletedToday = (habit: any) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return habit.habit_completions?.some(
      (c: any) => new Date(c.completed_at) >= todayStart
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Hábitos</h1>
            <p className="text-muted-foreground mt-2">
              Crie e acompanhe seus hábitos diários
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Hábito
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Hábito</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Título</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" className="w-full">
                  Criar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {habits.map((habit) => {
            const completed = isCompletedToday(habit);
            return (
              <Card key={habit.id} className="card-soft">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span>{habit.title}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteHabit(habit.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {habit.description && (
                    <p className="text-sm text-muted-foreground">
                      {habit.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={habit.id}
                      checked={completed}
                      onCheckedChange={() =>
                        toggleHabit(habit.id, completed)
                      }
                    />
                    <label
                      htmlFor={habit.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Concluir hoje
                    </label>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Habitos;
