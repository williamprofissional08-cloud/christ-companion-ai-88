import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

async function nodeToPng(node: HTMLElement) {
  const background = getComputedStyle(document.body).backgroundColor || "#ffffff";
  return toPng(node, { cacheBust: true, pixelRatio: 2, backgroundColor: background });
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export async function exportNodeAsImage(node: HTMLElement, filename: string) {
  const dataUrl = await nodeToPng(node);
  triggerDownload(dataUrl, `${filename}.png`);
}

export async function exportNodeAsPdf(node: HTMLElement, filename: string) {
  const dataUrl = await nodeToPng(node);
  const image = new Image();
  image.src = dataUrl;
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const usableWidth = pageWidth - margin * 2;
  const scaledHeight = (image.height * usableWidth) / image.width;

  let remaining = scaledHeight;
  let offset = 0;
  while (remaining > 0) {
    pdf.addImage(dataUrl, "PNG", margin, margin - offset, usableWidth, scaledHeight);
    remaining -= pageHeight - margin * 2;
    offset += pageHeight - margin * 2;
    if (remaining > 0) pdf.addPage();
  }
  pdf.save(`${filename}.pdf`);
}

export async function shareNodeAsImage(node: HTMLElement, filename: string, title: string) {
  const dataUrl = await nodeToPng(node);
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], `${filename}.png`, { type: "image/png" });
  const canShare =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });
  if (canShare) {
    await navigator.share({ files: [file], title });
    return "shared" as const;
  }
  triggerDownload(dataUrl, `${filename}.png`);
  return "downloaded" as const;
}
