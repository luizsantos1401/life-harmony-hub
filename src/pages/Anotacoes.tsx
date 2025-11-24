import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Plus, FileText, Target, Trash2, Check } from "lucide-react";
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

const Anotacoes = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [noteOpen, setNoteOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"note" | "goal">("note");
  const [noteFormData, setNoteFormData] = useState({
    title: "",
    content: "",
    category: "",
  });
  const [goalFormData, setGoalFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    progress: "0",
  });

  useEffect(() => {
    loadNotes();
    loadGoals();
  }, []);

  const loadNotes = async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false });

    setNotes(data || []);
  };

  const loadGoals = async () => {
    const { data } = await supabase
      .from("goals")
      .select("*")
      .order("deadline", { ascending: true });

    setGoals(data || []);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("notes").insert([{
      ...noteFormData,
      user_id: user.id,
    }]);

    if (error) {
      toast.error("Erro ao criar anotação");
      return;
    }

    toast.success("Anotação criada!");
    setNoteOpen(false);
    setNoteFormData({ title: "", content: "", category: "" });
    loadNotes();
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("goals").insert([{
      ...goalFormData,
      progress: parseInt(goalFormData.progress),
      user_id: user.id,
    }]);

    if (error) {
      toast.error("Erro ao criar meta");
      return;
    }

    toast.success("Meta criada!");
    setGoalOpen(false);
    setGoalFormData({ title: "", description: "", deadline: "", progress: "0" });
    loadGoals();
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const table = deleteType === "note" ? "notes" : "goals";
    const { error } = await supabase.from(table).delete().eq("id", deleteId);

    if (error) {
      toast.error(`Erro ao deletar ${deleteType === "note" ? "anotação" : "meta"}`);
      return;
    }

    toast.success(`${deleteType === "note" ? "Anotação" : "Meta"} deletada!`);
    setDeleteId(null);
    deleteType === "note" ? loadNotes() : loadGoals();
  };

  const toggleGoalComplete = async (goal: any) => {
    const { error } = await supabase
      .from("goals")
      .update({ completed: !goal.completed, progress: !goal.completed ? 100 : goal.progress })
      .eq("id", goal.id);

    if (error) {
      toast.error("Erro ao atualizar meta");
      return;
    }

    toast.success(!goal.completed ? "Meta concluída!" : "Meta reaberta");
    loadGoals();
  };

  const updateGoalProgress = async (goalId: string, newProgress: number) => {
    const { error } = await supabase
      .from("goals")
      .update({ progress: newProgress })
      .eq("id", goalId);

    if (error) {
      toast.error("Erro ao atualizar progresso");
      return;
    }

    loadGoals();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Anotações & Metas</h1>
          <p className="text-muted-foreground mt-1 font-light">
            Organize suas ideias e objetivos
          </p>
        </div>

        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="notes">Anotações</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
          </TabsList>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Anotação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Anotação</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleNoteSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        value={noteFormData.title}
                        onChange={(e) => setNoteFormData({ ...noteFormData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Input
                        value={noteFormData.category}
                        onChange={(e) => setNoteFormData({ ...noteFormData, category: e.target.value })}
                        placeholder="Ex: Pessoal, Trabalho, Ideias..."
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Conteúdo</Label>
                      <Textarea
                        value={noteFormData.content}
                        onChange={(e) => setNoteFormData({ ...noteFormData, content: e.target.value })}
                        rows={6}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Criar Anotação
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {notes.length === 0 ? (
                <Card className="card-premium col-span-full">
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-light">
                      Nenhuma anotação criada ainda
                    </p>
                  </CardContent>
                </Card>
              ) : (
                notes.map((note) => (
                  <Card key={note.id} className="card-premium">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-medium">{note.title}</CardTitle>
                          {note.category && (
                            <span className="text-xs text-muted-foreground font-light mt-1 inline-block">
                              {note.category}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteId(note.id);
                            setDeleteType("note");
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground font-light whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <p className="text-xs text-muted-foreground font-light mt-3">
                        {new Date(note.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="mt-6 space-y-4">
            <div className="flex justify-end">
              <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Meta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Meta</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleGoalSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Título da Meta</Label>
                      <Input
                        value={goalFormData.title}
                        onChange={(e) => setGoalFormData({ ...goalFormData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Textarea
                        value={goalFormData.description}
                        onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Data Limite</Label>
                      <Input
                        type="date"
                        value={goalFormData.deadline}
                        onChange={(e) => setGoalFormData({ ...goalFormData, deadline: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Progresso Inicial (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={goalFormData.progress}
                        onChange={(e) => setGoalFormData({ ...goalFormData, progress: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Criar Meta
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {goals.length === 0 ? (
                <Card className="card-premium col-span-full">
                  <CardContent className="py-12 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-light">
                      Nenhuma meta criada ainda
                    </p>
                  </CardContent>
                </Card>
              ) : (
                goals.map((goal) => (
                  <Card key={goal.id} className={`card-premium ${goal.completed ? "opacity-75" : ""}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-0.5"
                            onClick={() => toggleGoalComplete(goal)}
                          >
                            <Check className={`h-5 w-5 ${goal.completed ? "text-success" : "text-muted-foreground"}`} />
                          </Button>
                          <div className="flex-1">
                            <CardTitle className={`text-lg font-medium ${goal.completed ? "line-through" : ""}`}>
                              {goal.title}
                            </CardTitle>
                            {goal.deadline && (
                              <p className="text-xs text-muted-foreground font-light mt-1">
                                Prazo: {new Date(goal.deadline).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDeleteId(goal.id);
                            setDeleteType("goal");
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {goal.description && (
                        <p className="text-sm text-muted-foreground font-light">
                          {goal.description}
                        </p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-light">Progresso</span>
                          <span className="text-sm font-medium">{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                        {!goal.completed && (
                          <Input
                            type="range"
                            min="0"
                            max="100"
                            value={goal.progress}
                            onChange={(e) => updateGoalProgress(goal.id, parseInt(e.target.value))}
                            className="w-full"
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Deletar {deleteType === "note" ? "anotação" : "meta"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Anotacoes;
