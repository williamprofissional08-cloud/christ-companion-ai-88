import { useRef, useState } from "react";
import { Download, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportNodeAsImage, exportNodeAsPdf, shareNodeAsImage } from "@/lib/share";

/** Envolve um conteúdo e oferece exportação em imagem/PDF e compartilhamento. */
export function ExportCard({
  filename,
  title,
  children,
}: {
  filename: string;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function run(kind: "image" | "pdf" | "share") {
    if (!ref.current) return;
    setBusy(kind);
    try {
      if (kind === "image") {
        await exportNodeAsImage(ref.current, filename);
        toast.success("Imagem salva.");
      } else if (kind === "pdf") {
        await exportNodeAsPdf(ref.current, filename);
        toast.success("PDF salvo.");
      } else {
        const result = await shareNodeAsImage(ref.current, filename, title);
        toast.success(result === "shared" ? "Compartilhado!" : "Imagem salva para compartilhar.");
      }
    } catch {
      toast.error("Não foi possível exportar agora.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => run("image")}>
          <Download className="size-4" /> Imagem
        </Button>
        <Button size="sm" variant="secondary" disabled={busy !== null} onClick={() => run("pdf")}>
          <FileText className="size-4" /> PDF
        </Button>
        <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => run("share")}>
          <Share2 className="size-4" /> Compartilhar
        </Button>
      </div>
      <div ref={ref} className="bg-background">
        {children}
      </div>
    </div>
  );
}
