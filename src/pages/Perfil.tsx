import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Camera, Upload, X, Plus } from "lucide-react";

const Perfil = () => {
  const [profile, setProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [motivationPhotos, setMotivationPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    profession: "",
    bio: "",
    life_goals: "",
    weight: "",
    height: "",
  });

  useEffect(() => {
    loadProfile();
    loadMotivationPhotos();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setProfile(data);
      setFormData({
        name: data.name || "",
        age: data.age?.toString() || "",
        profession: data.profession || "",
        bio: data.bio || "",
        life_goals: data.life_goals || "",
        weight: data.weight?.toString() || "",
        height: data.height?.toString() || "",
      });
    }
  };

  const loadMotivationPhotos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase.storage
      .from("motivation")
      .list(user.id);

    if (data) {
      const urls = data.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from("motivation")
          .getPublicUrl(`${user.id}/${file.name}`);
        return publicUrl;
      });
      setMotivationPhotos(urls);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao fazer upload");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", user.id);

    if (updateError) {
      toast.error("Erro ao atualizar perfil");
    } else {
      toast.success("Foto atualizada!");
      loadProfile();
    }

    setUploading(false);
  };

  const handleMotivationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("motivation")
      .upload(fileName, file);

    if (error) {
      toast.error("Erro ao fazer upload");
    } else {
      toast.success("Foto adicionada!");
      loadMotivationPhotos();
    }

    setUploading(false);
  };

  const handleDeleteMotivation = async (url: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const fileName = url.split("/").slice(-2).join("/");

    const { error } = await supabase.storage
      .from("motivation")
      .remove([fileName]);

    if (error) {
      toast.error("Erro ao deletar foto");
    } else {
      toast.success("Foto removida!");
      loadMotivationPhotos();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name,
        age: formData.age ? parseInt(formData.age) : null,
        profession: formData.profession || null,
        bio: formData.bio || null,
        life_goals: formData.life_goals || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
      return;
    }

    toast.success("Perfil atualizado!");
    loadProfile();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Perfil</h1>
          <p className="text-muted-foreground mt-1 font-light">
            Gerencie suas informações pessoais
          </p>
        </div>

        {/* Avatar Section */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Foto de Perfil</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-3xl">
                {formData.name.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              disabled={uploading}
              className="relative"
            >
              <Camera className="h-4 w-4 mr-2" />
              {uploading ? "Enviando..." : "Alterar Foto"}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </Button>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Idade</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Profissão</Label>
                <Input
                  value={formData.profession}
                  onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Biografia</Label>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  placeholder="Conte um pouco sobre você..."
                />
              </div>

              <div className="space-y-2">
                <Label>Metas de Vida</Label>
                <Textarea
                  value={formData.life_goals}
                  onChange={(e) => setFormData({ ...formData, life_goals: e.target.value })}
                  rows={4}
                  placeholder="Quais são seus objetivos e sonhos?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Peso (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Altura (cm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full">
                Salvar Alterações
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Motivation Photos */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-medium">Mural de Motivação</CardTitle>
                <p className="text-sm text-muted-foreground font-light mt-1">
                  Adicione fotos que te inspiram
                </p>
              </div>
              <Button variant="outline" className="relative" disabled={uploading}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMotivationUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {motivationPhotos.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-light">
                  Nenhuma foto adicionada ainda
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {motivationPhotos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo}
                      alt={`Motivação ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteMotivation(photo)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Perfil;
