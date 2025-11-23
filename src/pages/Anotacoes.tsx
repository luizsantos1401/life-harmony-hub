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
import { Plus, StickyNote, Trash2, Pencil } from "lucide-react";

const Anotacoes = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
  });

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    const { data } = await supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });

    setNotes(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (editingNote) {
      const { error } = await supabase
        .from("notes")
        .update(formData)
        .eq("id", editingNote.id);

      if (error) {
        toast.error("Erro ao atualizar anotação");
        return;
      }
      toast.success("Anotação atualizada!");
    } else {
      const { error } = await supabase.from("notes").insert([{
        ...formData,
        user_id: user.id,
      }]);

      if (error) {
        toast.error("Erro ao criar anotação");
        return;
      }
      toast.success("Anotação criada!");
    }

    setOpen(false);
    setEditingNote(null);
    setFormData({ title: "", content: "", category: "" });
    loadNotes();
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase.from("notes").delete().eq("id", noteId);

    if (error) {
      toast.error("Erro ao deletar anotação");
      return;
    }

    toast.success("Anotação deletada!");
    loadNotes();
  };

  const startEdit = (note: any) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content || "",
      category: note.category || "",
    });
    setOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Anotações</h1>
            <p className="text-muted-foreground mt-2">
              Organize suas ideias e informações importantes
            </p>
          </div>

          <Dialog
            open={open}
            onOpenChange={(isOpen) => {
              setOpen(isOpen);
              if (!isOpen) {
                setEditingNote(null);
                setFormData({ title: "", content: "", category: "" });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Anotação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? "Editar Anotação" : "Nova Anotação"}
                </DialogTitle>
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
                  <Label>Categoria</Label>
                  <Input
                    placeholder="Ex: Trabalho, Pessoal, Ideias"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo</Label>
                  <Textarea
                    rows={8}
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" className="w-full">
                  {editingNote ? "Atualizar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {notes.map((note) => (
            <Card key={note.id} className="card-soft">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1">
                    <StickyNote className="h-5 w-5 text-primary mt-0.5" />
                    <span className="line-clamp-2">{note.title}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(note)}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteNote(note.id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {note.category && (
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {note.category}
                  </span>
                )}
                {note.content && (
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {note.content}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {new Date(note.updated_at).toLocaleDateString("pt-BR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Anotacoes;
