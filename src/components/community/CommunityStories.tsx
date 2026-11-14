import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { Camera, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { COMMUNITY_MEDIA_BUCKET, validateCommunityMedia } from "@/lib/community-media";

const db = supabase as unknown as SupabaseClient;
type Story = {
  id: string; user_id: string; media_path: string; media_kind: "image"|"video";
  caption: string; expires_at: string;
};
type StoryItem = Story & { url: string; label: string };

export function CommunityStories({ user }: { user: User | null }) {
  const [items, setItems] = useState<StoryItem[]>([]);
  const [selected, setSelected] = useState<StoryItem | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadStories = useCallback(async () => {
    if (!user) return;
    const { data, error } = await db.from("community_stories")
      .select("id,user_id,media_path,media_kind,caption,expires_at")
      .eq("status","published").gt("expires_at",new Date().toISOString())
      .order("created_at", { ascending:false }).limit(24);
    if (error) { setItems([]); return; }
    const stories = (data ?? []) as Story[];
    const ids = [...new Set(stories.map(s=>s.user_id))];
    const { data: people } = ids.length ? await db.from("community_member_profiles")
      .select("id,display_name").in("id",ids) : { data: [] };
    const names = new Map(((people??[]) as {id:string;display_name:string|null}[]).map(p=>[p.id,p.display_name??"Membro"]));
    const signed = await Promise.all(stories.map(async story=>{
      const { data: url } = await db.storage.from(COMMUNITY_MEDIA_BUCKET).createSignedUrl(story.media_path,600);
      return url?.signedUrl ? { ...story, url:url.signedUrl,
        label:story.user_id===user.id ? "Seu story" : names.get(story.user_id)??"Membro" } : null;
    }));
    setItems(signed.filter((item):item is StoryItem=>item!==null));
  }, [user?.id]);

  useEffect(()=>{
    void loadStories();
    const interval=window.setInterval(()=>void loadStories(),60_000);
    return ()=>window.clearInterval(interval);
  },[loadStories]);

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!user||!file||uploading) return;
    setUploading(true);
    let path: string|null=null;
    try {
      const info=await validateCommunityMedia(file);
      path=`${user.id}/stories/${crypto.randomUUID()}.${info.extension}`;
      const {error:uploadError}=await db.storage.from(COMMUNITY_MEDIA_BUCKET)
        .upload(path,file,{contentType:file.type,upsert:false});
      if(uploadError) throw uploadError;
      const {error}=await db.from("community_stories")
        .insert({user_id:user.id,media_path:path,media_kind:info.kind,
          media_seconds:info.seconds,caption:caption.trim().slice(0,240)});
      if(error) throw error;
      toast.success("Story publicado por 24 horas.");
      path=null;
      setShowForm(false);setFile(null);setCaption("");
      if(inputRef.current)inputRef.current.value="";
      await loadStories();
    }catch(error) {
      if(path) await db.storage.from(COMMUNITY_MEDIA_BUCKET).remove([path]);
      toast.error(error instanceof Error?error.message:"Não foi possível publicar o story.");
    }finally{setUploading(false);}
  }

  async function removeStory(story: StoryItem){
    if(story.user_id!==user?.id)return;
    if(!window.confirm("Remover seu story?"))return;
    const {error}=await db.from("community_stories").delete().eq("id",story.id).eq("user_id",user.id);
    if(error){toast.error("Não foi possível remover o story.");return;}
    await db.storage.from(COMMUNITY_MEDIA_BUCKET).remove([story.media_path]);
    setSelected(null);await loadStories();
  }

  return (
    <section id="community-stories" aria-label="Stories da comunidade" className="rounded-[1.5rem] border border-blue-100 bg-white/95 p-3 shadow-sm dark:border-slate-700 dark:bg-card sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#10345e] dark:text-foreground">Momentos da Comunidade</h3>
        <span className="text-xs text-slate-500">Stories de 24 horas</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 sm:gap-3">
        <button type="button" onClick={()=>setShowForm(v=>!v)}
          className="flex min-w-20 shrink-0 flex-col items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-3 text-blue-800 focus-visible:outline-2 focus-visible:outline-blue-600">
          <span className="flex size-14 items-center justify-center rounded-full border-2 border-blue-600"><Plus className="size-8" /></span>
          <span className="text-xs font-bold">Seu story</span>
        </button>
        {items.map(story=>(
          <button key={story.id} type="button" onClick={()=>setSelected(story)}
            className="flex w-24 shrink-0 flex-col items-center gap-1.5 overflow-hidden rounded-2xl border border-blue-100 bg-white px-2 py-2 text-slate-800 shadow-sm focus-visible:outline-2 focus-visible:outline-blue-600 dark:bg-slate-800 dark:text-white">
            <span className="flex size-16 overflow-hidden rounded-full border-[3px] border-blue-600 p-0.5">
              {story.media_kind==="image"
                ? <img src={story.url} alt="" className="size-full rounded-full object-cover" />
                : <span className="flex size-full items-center justify-center rounded-full bg-gradient-to-br from-blue-700 to-amber-500 text-white"><Camera className="size-6"/></span>}
            </span>
            <span className="w-full truncate text-xs font-semibold">{story.label}</span>
          </button>
        ))}
        {items.length===0 && <span className="self-center text-xs text-slate-600 dark:text-slate-300">Nenhum story publicado agora.</span>}
      </div>
      {showForm&&(
        <form onSubmit={publish} className="mt-3 space-y-2 rounded-xl bg-blue-50 p-3 dark:bg-slate-900">
          <label className="block text-xs font-semibold">Foto ou vídeo de até 60 segundos
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
              required onChange={e=>setFile(e.target.files?.[0]??null)}
              className="mt-2 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-blue-700 file:px-3 file:py-2 file:text-white" />
          </label>
          <input value={caption} maxLength={240} onChange={e=>setCaption(e.target.value)}
            aria-label="Legenda do story" placeholder="Legenda opcional"
            className="min-h-11 w-full rounded-xl border border-blue-200 bg-white px-3 text-base text-slate-900" />
          <button type="submit" disabled={!file||uploading}
            className="inline-flex min-h-10 items-center gap-2 rounded-full bg-blue-700 px-4 text-sm font-bold text-white disabled:opacity-50">
            {uploading&&<Loader2 className="size-4 animate-spin"/>}{uploading?"Enviando…":"Publicar story"}
          </button>
        </form>
      )}
      {selected&&(
        <div role="dialog" aria-modal="true" aria-label="Story" className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/95 p-4">
          <div className="relative w-full max-w-lg space-y-3">
            <div className="flex items-center justify-between text-white">
              <p className="text-sm font-semibold">{selected.label}</p>
              <div className="flex gap-2">
                {selected.user_id===user?.id&&(
                  <button aria-label="Excluir meu story" type="button" onClick={()=>void removeStory(selected)}
                    className="flex size-11 items-center justify-center rounded-full bg-white/15"><Trash2 className="size-5"/></button>
                )}
                <button aria-label="Fechar story" type="button" onClick={()=>setSelected(null)}
                  className="flex size-11 items-center justify-center rounded-full bg-white/15"><X className="size-6"/></button>
              </div>
            </div>
            {selected.media_kind==="video"
              ?<video src={selected.url} playsInline controls className="max-h-[75svh] w-full rounded-xl object-contain" />
              :<img src={selected.url} alt={selected.caption||"Story"} className="max-h-[75svh] w-full rounded-xl object-contain"/>}
            {selected.caption&&<p className="text-center text-sm text-white">{selected.caption}</p>}
          </div>
        </div>
      )}
    </section>
  );
}
