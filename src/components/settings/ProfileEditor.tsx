import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Profile = { display_name: string | null; avatar_url: string | null };

export function ProfileEditor() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const profile = useQuery({
    queryKey: ["account-profile", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<Profile> => {
      const { data, error } = await supabase.from("profiles")
        .select("display_name, avatar_url").eq("id", user!.id).maybeSingle();
      if (error) throw error;
      return { display_name: data?.display_name ?? null, avatar_url: data?.avatar_url ?? null };
    },
  });

  useEffect(() => { setName(profile.data?.display_name ?? String(user?.user_metadata?.["full_name"] ?? "")); }, [profile.data, user]);

  async function saveName() {
    if (!user) return;
    const value = name.trim();
    if (value.length < 2 || value.length > 80) {
      toast.error("O nome deve ter entre 2 e 80 caracteres.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert(
        { id: user.id, display_name: value }, { onConflict: "id" },
      );
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["account-profile", user.id] });
      toast.success("Nome do perfil atualizado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
    } finally { setSaving(false); }
  }

  async function uploadAvatar(file?: File) {
    if (!user || !file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Use uma imagem JPG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = user.id + "/" + crypto.randomUUID() + "." + extension;
      const { error: uploadError } = await supabase.storage.from("profile-avatars")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("profile-avatars").getPublicUrl(path);
      const { error: profileError } = await supabase.from("profiles")
        .upsert({ id: user.id, avatar_url: data.publicUrl }, { onConflict: "id" });
      if (profileError) throw profileError;
      await queryClient.invalidateQueries({ queryKey: ["account-profile", user.id] });
      toast.success("Foto de perfil atualizada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const initials = (name || user?.email || "U").trim().slice(0, 2).toUpperCase();
  return (
    <Card className="border-border/50 p-6 shadow-soft">
      <h2 className="font-display text-lg font-semibold">Meu perfil</h2>
      <p className="mt-1 text-sm text-muted-foreground">Atualize como seu nome e sua foto aparecem no aplicativo.</p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Avatar className="size-20">
          <AvatarImage src={profile.data?.avatar_url ?? undefined} alt="Foto do perfil" />
          <AvatarFallback><UserRound className="size-8" /></AvatarFallback>
        </Avatar>
        <div className="space-y-2">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={(event) => void uploadAvatar(event.target.files?.[0])} />
          <Button type="button" variant="outline" size="sm" disabled={uploading}
            onClick={() => fileRef.current?.click()}>
            <Camera className="mr-2 size-4" />{uploading ? "Enviando foto..." : "Alterar foto"}
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WebP · até 5 MB</p>
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <Label htmlFor="profile-display-name">Nome de exibição</Label>
        <Input id="profile-display-name" value={name} maxLength={80}
          onChange={(event) => setName(event.target.value)} placeholder="Como deseja ser chamado?" />
        <Button type="button" size="sm" onClick={() => void saveName()} disabled={saving}>
          {saving ? "Salvando..." : "Salvar perfil"}
        </Button>
      </div>
    </Card>
  );
}
