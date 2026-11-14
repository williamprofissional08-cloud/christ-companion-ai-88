import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell, BookOpen, ChevronRight, CircleHelp, Download, Headphones,
  Info, LockKeyhole, Mail, Monitor, Moon, Music2, Settings2, Shield,
  Smartphone, Type, UserRound, UsersRound,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { APP_CONTACT } from "@/lib/app-contact";
import { useBackgroundMusic } from "@/components/GlobalBackgroundMusic";
import { useTheme } from "@/hooks/use-auth";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";
const panel = "overflow-hidden rounded-[1.35rem] border border-slate-200 bg-white shadow-[0_4px_18px_rgba(19,52,93,.08)] dark:border-slate-700 dark:bg-card";

function Group({ title, icon: Icon, children }: {
  title: string; icon: typeof UserRound; children: ReactNode;
}) {
  return (
    <section className={panel}>
      <h2 className="flex items-center gap-3 px-4 pb-2 pt-4 text-lg font-bold text-[#0a2050] dark:text-foreground">
        <Icon className="size-6 text-[#087bb3]" aria-hidden="true" />
        {title}
      </h2>
      <div className="divide-y divide-slate-100 px-3 pb-2 dark:divide-slate-700">{children}</div>
    </section>
  );
}

function RowContent({ icon: Icon, title, description, trailing }: {
  icon: typeof UserRound; title: string; description: string; trailing?: ReactNode;
}) {
  return (
    <span className="flex min-h-14 w-full items-center gap-3 py-2 text-left">
      <Icon className="size-5 shrink-0 text-[#315f8c]" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[#0c2347] dark:text-foreground">{title}</span>
        <span className="block text-xs leading-snug text-slate-600 dark:text-slate-300">{description}</span>
      </span>
      {trailing ?? <ChevronRight className="size-5 shrink-0 text-slate-500" aria-hidden="true" />}
    </span>
  );
}
const row = `block w-full rounded-lg px-2 hover:bg-blue-50/70 dark:hover:bg-slate-800 ${focus}`;

function InfoRow({ icon, title, description, details }: {
  icon: typeof UserRound; title: string; description: string; details: string;
}) {
  return (
    <details className="group rounded-lg px-2">
      <summary className={`cursor-pointer list-none hover:bg-blue-50/70 dark:hover:bg-slate-800 ${focus}`}>
        <RowContent icon={icon} title={title} description={description}
          trailing={<ChevronRight className="size-5 shrink-0 text-slate-500 transition-transform group-open:rotate-90" aria-hidden="true" />} />
      </summary>
      <p className="pb-3 pl-8 pr-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{details}</p>
    </details>
  );
}

const FONT_SIZES = [16, 18, 20] as const;
const FONT_KEY = "caminho-divino-font-size";

function loadFontSize(): number {
  if (typeof window === "undefined") return 16;
  try {
    const saved = Number(window.localStorage.getItem(FONT_KEY));
    return FONT_SIZES.includes(saved as (typeof FONT_SIZES)[number]) ? saved : 16;
  } catch {
    return 16;
  }
}

export function SettingsOverview({ reminders, savingReminders, onRemindersChange }: {
  reminders: boolean;
  savingReminders: boolean;
  onRemindersChange: (enabled: boolean) => void;
}) {
  const { theme, toggle } = useTheme();
  const music = useBackgroundMusic();
  const [fontSize, setFontSize] = useState(loadFontSize);
  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  function cycleFontSize() {
    const next = FONT_SIZES[(FONT_SIZES.indexOf(fontSize as (typeof FONT_SIZES)[number]) + 1) % FONT_SIZES.length] ?? 16;
    setFontSize(next);
    try { window.localStorage.setItem(FONT_KEY, String(next)); } catch { /* Storage may be disabled. */ }
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3 sm:space-y-4">
      <Group title="Conta" icon={UserRound}>
        <a href="#profile-editor-details" className={row}>
          <RowContent icon={UserRound} title="Dados da Conta" description="Nome, e-mail e foto do perfil" />
        </a>
        <a href="#account-access" className={row}>
          <RowContent icon={LockKeyhole} title="Segurança" description="Senha, autenticação e troca de conta" />
        </a>
        <InfoRow icon={Monitor} title="Dispositivos Conectados"
          description="Informações de acesso à conta"
          details="O gerenciamento remoto de sessões ainda não está disponível neste aplicativo. Para proteger sua conta, altere a senha na área Segurança." />
      </Group>

      <Group title="Preferências do App" icon={Settings2}>
        <button type="button" className={row} onClick={toggle}>
          <RowContent icon={Moon} title="Aparência" description={theme === "dark" ? "Modo escuro ativo; tocar para mudar" : "Modo claro ativo; tocar para mudar"} />
        </button>
        <button type="button" className={row} onClick={cycleFontSize}>
          <RowContent icon={Type} title="Tamanho do Texto"
            description={`Ajuste para melhor leitura · ${fontSize === 16 ? "Padrão" : fontSize === 18 ? "Médio" : "Grande"}`} />
        </button>
        <div className="px-2">
          <RowContent icon={Music2} title="Música de Fundo"
            description={music?.isReady ? "Música ambiente · toque para pausar ou reproduzir" : "Preparando reprodutor de música"}
            trailing={<Switch checked={music?.isPlaying ?? false} disabled={!music?.isReady}
              onCheckedChange={() => music?.togglePlayback()} aria-label="Música de fundo" />} />
        </div>
        <Link to="/estudos" className={row}>
          <RowContent icon={Headphones} title="Leitura em Áudio (TTS)" description="Ouvir estudos e aulas nos leitores disponíveis" />
        </Link>
        <InfoRow icon={Download} title="Downloads"
          description="Conteúdo offline"
          details="O gerenciamento de conteúdos offline ainda não está disponível. Seus estudos online continuam acessíveis normalmente." />
      </Group>

      <Group title="Notificações e Privacidade" icon={Bell}>
        <div className="px-2">
          <RowContent icon={Bell} title="Notificações"
            description="Lembretes do devocional e da rotina, enquanto o app estiver aberto"
            trailing={<Switch checked={reminders} disabled={savingReminders}
              onCheckedChange={onRemindersChange} aria-label="Ativar ou desativar lembretes" />} />
        </div>
        <a href="#reminders-detail" className={row}>
          <RowContent icon={Smartphone} title="Horários e lembretes" description="Configure horário, repetição e permissão do navegador" />
        </a>
        <InfoRow icon={Shield} title="Privacidade"
          description="Dados do perfil e conversas"
          details="As informações da conta são protegidas pelo sistema de autenticação. Para administrar conversas e amizades, acesse a Comunidade." />
        <Link to="/comunidade" className={row}>
          <RowContent icon={UsersRound} title="Comunidade e contatos" description="Acesse amigos e conversas no aplicativo" />
        </Link>
      </Group>

      <Group title="Suporte e Informações" icon={CircleHelp}>
        <a href={APP_CONTACT.mailto} className={row}>
          <RowContent icon={Headphones} title="Ajuda e Suporte" description="Envie dúvidas, problemas e sugestões" />
        </a>
        <InfoRow icon={BookOpen} title="Perguntas Frequentes (FAQ)"
          description="Dúvidas rápidas sobre sua conta"
          details="Para alterar nome e foto, abra Dados da Conta. Para trocar o e-mail ou senha, acesse Segurança. Para dificuldades de acesso, use Ajuda e Suporte." />
        <InfoRow icon={Info} title="Sobre o Caminho Divino"
          description="Estudo, ensino e comunhão"
          details="Caminho Divino é uma plataforma de estudos bíblicos, cursos e comunidade. O conteúdo deve permanecer fundamentado nas Escrituras." />
        <a href="#account-access" className={row}>
          <RowContent icon={Mail} title="E-mail e dados da conta" description="Confira suas informações e opções de segurança" />
        </a>
      </Group>
    </div>
  );
}
