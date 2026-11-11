export type TrackImageOption = {
  id: string;
  title: string;
  theme: string;
  description: string;
  alt: string;
  src: string;
};

export const TRACK_IMAGE_CATALOG: TrackImageOption[] = [
  {
    id: "paz",
    title: "Paz ao amanhecer",
    theme: "Ansiedade",
    description: "Lago sereno e luz suave para uma caminhada de descanso.",
    alt: "Lago tranquilo ao amanhecer, cercado por montanhas suaves.",
    src: "/images/tracks-catalog/paz.webp",
  },
  {
    id: "fe",
    title: "Fé que persevera",
    theme: "Fé",
    description: "Um caminho entre montanhas em direção à luz.",
    alt: "Trilha subindo uma montanha ao nascer do sol.",
    src: "/images/tracks-catalog/fe.webp",
  },
  {
    id: "oracao",
    title: "Um momento de oração",
    theme: "Oração",
    description: "Bíblia aberta e um instante de quietude junto à janela.",
    alt: "Bíblia aberta à luz suave da manhã, junto a uma janela.",
    src: "/images/tracks-catalog/oracao.webp",
  },
  {
    id: "perdao",
    title: "Caminho de reconciliação",
    theme: "Perdão",
    description: "Um gesto delicado de apoio e aproximação.",
    alt: "Duas mãos se encontrando em um gesto de apoio.",
    src: "/images/tracks-catalog/perdao.webp",
  },
  {
    id: "identidade",
    title: "Amado e acolhido",
    theme: "Identidade",
    description: "Uma pausa em meio à natureza para contemplar seu valor.",
    alt: "Pessoa contemplando um campo iluminado pelo sol da manhã.",
    src: "/images/tracks-catalog/identidade.webp",
  },
  {
    id: "proposito",
    title: "Passos com propósito",
    theme: "Propósito",
    description: "Uma trilha serena que segue em direção ao horizonte.",
    alt: "Caminho entre colinas verdes em direção a um horizonte claro.",
    src: "/images/tracks-catalog/proposito.webp",
  },
  {
    id: "gratidao",
    title: "Pequenas bênçãos",
    theme: "Gratidão",
    description: "Flores iluminadas pelo sol para celebrar o cotidiano.",
    alt: "Flores do campo com gotas de orvalho à luz da manhã.",
    src: "/images/tracks-catalog/gratidao.webp",
  },
  {
    id: "esperanca",
    title: "Uma nova esperança",
    theme: "Esperança",
    description: "A luz do amanhecer se abrindo sobre o vale.",
    alt: "Amanhecer dourado sobre colinas azuis e um vale tranquilo.",
    src: "/images/tracks-catalog/esperanca.webp",
  },
];

const DEFAULT_IMAGE_BY_THEME: Record<string, string> = {
  Ansiedade: "paz",
  Fé: "fe",
  Oração: "oracao",
  Perdão: "perdao",
  Identidade: "identidade",
  Propósito: "proposito",
  Gratidão: "gratidao",
  Esperança: "esperanca",
};

export function getTrackImageById(
  imageId: string | null | undefined,
): TrackImageOption | undefined {
  return TRACK_IMAGE_CATALOG.find((image) => image.id === imageId);
}

export function getTrackImage(
  trackSlug: string,
  theme: string,
  assignments: Record<string, string> = {},
): TrackImageOption | undefined {
  const imageId = assignments[trackSlug] ?? DEFAULT_IMAGE_BY_THEME[theme];
  return getTrackImageById(imageId);
}
