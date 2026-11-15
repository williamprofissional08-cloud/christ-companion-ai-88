import type { BibleBook } from "./bible-books";

// Capas ilustradas originais em SVG: independentes de serviços externos,
// sem fotografias de terceiros e distintas para os 66 livros canônicos.
const BOOK_SCENES: Record<string, string> = {
  genesis: "creation", exodo: "sea", levitico: "altar", numeros: "desert",
  deuteronomio: "scroll", josue: "wall", juizes: "sword", rute: "wheat",
  "1-samuel": "oil", "2-samuel": "crown", "1-reis": "temple", "2-reis": "fire",
  "1-cronicas": "scroll", "2-cronicas": "temple", esdras: "scroll",
  neemias: "wall", ester: "crown", jo: "storm", salmos: "harp",
  proverbios: "lamp", eclesiastes: "hourglass", "cantico-dos-canticos": "vine",
  isaias: "star", jeremias: "scroll", lamentacoes: "tear", ezequiel: "wheel",
  daniel: "lion", oseias: "heart", joel: "fire", amos: "scales",
  obadias: "mountain", jonas: "fish", miqueias: "scales", naum: "wall",
  habacuque: "mountain", sofonias: "fire", ageu: "temple", zacarias: "olive",
  malaquias: "sun", mateus: "crown", marcos: "lion", lucas: "heart",
  joao: "eagle", atos: "fire", romanos: "cross", "1-corintios": "heart",
  "2-corintios": "scroll", galatas: "cross", efesios: "shield",
  filipenses: "sun", colossenses: "star", "1-tessalonicenses": "trumpet",
  "2-tessalonicenses": "trumpet", "1-timoteo": "scroll", "2-timoteo": "fire",
  tito: "anchor", filemom: "heart", hebreus: "altar", tiago: "wheat",
  "1-pedro": "anchor", "2-pedro": "lamp", "1-joao": "heart",
  "2-joao": "letter", "3-joao": "letter", judas: "shield", apocalipse: "star",
};

// Desenhos simbólicos autorais; não sugerem que a imagem seja fotografia histórica.
const GLYPHS: Record<string, string> = {
  creation: "<circle r='36'/><ellipse rx='36' ry='15'/><path d='M-35 0H35M0-36C-20-15-20 15 0 36M0-36C20-15 20 15 0 36'/>",
  sea: "<path d='M-50 4Q-27-19-5 4T40 4M-50 24Q-27 1-5 24T40 24M-50-20Q-27-43-5-20T40-20'/>",
  altar: "<path d='M-40 35H40M-30 22H30L24-22H-24Z M-40-30H40M0-52C-18-36 13-27 0-13C19-21 21-39 0-52Z'/>",
  desert: "<path d='M-54 30L-13-31L18 11L39-20L58 30Z M-47 40H50M-15-3H10'/>",
  scroll: "<path d='M-32-30H28V34H-32Q-48 29-40 15Q-36 10-28 10M-32-30Q-49-29-42-14Q-40-8-32-8M-15-11H15M-15 3H15M-15 17H6'/>",
  wall: "<path d='M-47 34V-13H-27V-26H-8V-13H8V-26H27V-13H47V34Z M-47 8H47M-47-10H47M-25 8V34M22 8V34M0-10V8'/>",
  sword: "<path d='M-8 23L23-43L34-34L1 29M-24 16L13 37M-11 34L-24 48'/>",
  wheat: "<path d='M0 45V-45M0-24L-21-42M0-11L22-30M0 0L-23-17M0 13L22-5M0 26L-23 8M0 37L22 21'/>",
  oil: "<path d='M-35 23Q-30-10-10-15V-37H20V-15Q41-7 35 23Q32 39 0 39Q-32 39-35 23ZM-10-15H20M-6-37V-47'/>",
  crown: "<path d='M-46-19L-29 22L-9-10L10 22L31-19L46 22L40 37H-40L-46 22Z M-29 22H31'/>",
  temple: "<path d='M-50 32H50M-46-30H46L0-49Z M-39-27V28M-16-27V28M16-27V28M39-27V28M-46 28H46'/>",
  fire: "<path d='M-28 27Q-47-1-10-40Q-11-10 4-14Q21-24 17-42Q53 3 27 30Q0 53-28 27Z M-9 27Q-15 11 4-6Q9 8 17 11Q29 38-9 27Z'/>",
  storm: "<path d='M-45-9Q-41-37-15-37Q12-49 31-18Q60-15 44 16H-42Q-57 4-45-9Z M3 2L-11 32H7L-5 49'/>",
  harp: "<path d='M-28-44V38Q26 38 28-14Q28-34 8-42Z M-25-30H12M-21-18H21M-17-6H25M-14 6H26M-11 18H22'/>",
  lamp: "<path d='M-25-21Q-22-51 9-40Q38-26 20 3Q10 15 10 25H-9Q-9 13-17 5Q-34-8-25-21Z M-11 36H12M-8 44H9'/>",
  hourglass: "<path d='M-31-43H31M-31 43H31M-23-40Q-28-8 0 0Q-28 12-23 40M23-40Q28-8 0 0Q28 12 23 40M-19-31H19M-17 32H17'/>",
  vine: "<path d='M-35 43Q-7 15-3-14Q0-34 30-41M-15 16Q-40 8-33-17Q-10-13-15 16ZM1-8Q34-13 38 9Q16 19 1-8Z M9-24Q-7-41 4-51Q24-40 9-24Z'/>",
  star: "<path d='M0-51L13-15L50-15L20 7L31 44L0 22L-31 44L-20 7L-50-15L-13-15Z'/>",
  tear: "<path d='M0-48C-12-22-35 4-35 18A35 35 0 0 0 35 18C35 4 12-22 0-48Z M-18 16Q-19 36 3 37'/>",
  wheel: "<circle r='39'/><circle r='15'/><path d='M0-39V-15M0 15V39M-39 0H-15M15 0H39M-28-28L-10-10M10 10L28 28M-28 28L-10 10M10-10L28-28'/>",
  lion: "<circle cx='0' cy='-4' r='27'/><path d='M-18-25L-30-37L-23-8M18-25L30-37L23-8M-12-8L-5-7M7-7H13M0 2L-6 9H6Z M0 9V18M-13 19Q0 29 13 19'/>",
  heart: "<path d='M0 40L-38 5Q-57-25-30-38Q-9-48 0-24Q15-48 34-35Q61-16 35 11Z'/>",
  scales: "<path d='M0-43V41M-25 41H25M-45-22H45M-30-22L-45 13H-15Z M30-22L15 13H45Z'/>",
  mountain: "<path d='M-50 35L-8-41L21 8L36-18L54 35Z M-19-19L-8-41L4-20'/>",
  fish: "<path d='M-49 0Q-2-50 39 0Q-2 50-49 0ZM39 0L55-28V28Z M-22-8H-16'/>",
  olive: "<path d='M0 45V-37M0-15Q-33-51-42-16Q-29 3 0-15ZM1 4Q32-37 43-2Q32 18 1 4Z M0 24Q-29-8-38 22Q-26 40 0 24Z'/>",
  sun: "<circle r='24'/><path d='M0-51V-36M0 36V51M-51 0H-36M36 0H51M-36-36L-27-27M27 27L36 36M-36 36L-27 27M27-27L36-36'/>",
  eagle: "<path d='M0-9Q-18-35-58-24Q-41 8-13 12L0 37L13 12Q41 8 58-24Q18-35 0-9Z M-7-4L0 2L7-4'/>",
  cross: "<path d='M-9-48H9V-18H40V0H9V45H-9V0H-40V-18H-9Z'/>",
  shield: "<path d='M0-49L43-30V2Q40 32 0 50Q-40 32-43 2V-30Z M-22 0L-5 17L25-19'/>",
  trumpet: "<path d='M-45 0H-15L21-28V28L-15 0M-23 1L-14 38H4L-4 7M25-20Q44-4 25 15'/>",
  anchor: "<path d='M0-25V43M-25-25H25M-42 12Q-44 48 0 47Q44 48 42 12M-50 13L-42 0L-28 15M50 13L42 0L28 15M0-46A12 12 0 1 0 0-22A12 12 0 1 0 0-46'/>",
  letter: "<rect x='-43' y='-30' width='86' height='61' rx='5'/><path d='M-42-29L0 8L42-29M-42 30L-10 0M42 30L10 0'/>",
};
const PALETTES: readonly [string, string, string][] = [
  ["#062b4c", "#2a6685", "#efd19b"], ["#132e52", "#547c92", "#fad6a4"],
  ["#0e4056", "#7399a2", "#edc48a"], ["#26344e", "#8d777c", "#f3c68a"],
  ["#183854", "#586f9f", "#e9c48c"], ["#143f58", "#6c8b72", "#f1d49d"],
  ["#193456", "#8a8093", "#f7cea8"], ["#103b56", "#9b835b", "#fae0a9"],
];
const cache = new Map<string, string>();
const xmlEscape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Retorna uma capa local para cada livro; nunca depende de rede ou de imagens remotas. */
export function getBibleBookCover(book: Pick<BibleBook, "slug" | "name" | "order">): string {
  const cached = cache.get(book.slug);
  if (cached) return cached;
  const [navy, blue, warm] = PALETTES[(book.order - 1) % PALETTES.length]!;
  const symbol = GLYPHS[BOOK_SCENES[book.slug] ?? "scroll"]!;
  const sunX = 285 + (book.order % 5) * 26;
  const peak = 89 + (book.order % 4) * 12;
  const motifX = 354 + (book.order % 3) * 10;
  const caption = xmlEscape(book.name);
  const svg = [
    "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='260' viewBox='0 0 480 260' role='img'>",
    "<defs><linearGradient id='sky' x2='0.9' y2='1'><stop stop-color='", navy, "'/><stop offset='.7' stop-color='", blue, "'/><stop offset='1' stop-color='", warm, "'/></linearGradient>",
    "<radialGradient id='glow'><stop stop-color='", warm, "' stop-opacity='.85'/><stop offset='1' stop-color='", warm, "' stop-opacity='0'/></radialGradient>",
    "<linearGradient id='lower' x2='0' y2='1'><stop stop-color='", navy, "' stop-opacity='.05'/><stop offset='1' stop-color='", navy, "' stop-opacity='.98'/></linearGradient></defs>",
    "<rect width='480' height='260' fill='url(#sky)'/>",
    "<circle cx='", String(sunX), "' cy='76' r='93' fill='url(#glow)'/><circle cx='", String(sunX), "' cy='76' r='22' fill='", warm, "' opacity='.83'/>",
    "<path d='M0 167L82 ", String(peak), "L147 144L222 66L319 151L385 101L480 174V260H0Z' fill='", navy, "' opacity='.48'/>",
    "<path d='M0 203L89 155L170 200L255 134L330 195L415 146L480 185V260H0Z' fill='", navy, "' opacity='.75'/>",
    "<g transform='translate(", String(motifX), " 118)' fill='none' stroke='", warm, "' stroke-width='5' stroke-linejoin='round' stroke-linecap='round' opacity='.96'>", symbol, "</g>",
    "<rect y='171' width='480' height='89' fill='url(#lower)'/><path d='M20 184H133' stroke='", warm, "' stroke-width='3' stroke-opacity='.65'/>",
    "<text x='22' y='225' font-family='Georgia, serif' font-weight='bold' font-size='", book.name.length > 18 ? "26" : "34", "' fill='#ffffff'>", caption, "</text>",
    "<text x='455' y='238' text-anchor='end' font-family='sans-serif' font-size='15' fill='", warm, "' opacity='.86'>", String(book.order).padStart(2, "0"), " / 66</text>",
    "</svg>"
  ].join("");
  const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  cache.set(book.slug, src);
  return src;
}

export const BIBLE_BOOK_COVER_SLUGS = Object.freeze(Object.keys(BOOK_SCENES));
