import { useRef, useState } from 'react';
import { generateProgram } from '../logic/generator';
import { fmtDate, localDate } from '../logic/util';
import { isValidBackup, useProfile, useStore } from '../store';
import type { AppData } from '../types';
import { Button, Card, SectionTitle, Sheet } from '../components/ui';

export function downloadJson(filename: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ImportButton({ label = 'Importar backup' }: { label?: string }) {
  const store = useStore();
  const input = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  const onFile = async (f: File) => {
    try {
      const parsed = JSON.parse(await f.text());
      if (!isValidBackup(parsed)) throw new Error('inválido');
      const d = parsed as AppData;
      store.mergeProfiles(d.profiles);
      setMsg(`✅ ${d.profiles.length} perfil(is) importado(s): ${d.profiles.map((p) => p.questionnaire.name).join(', ')}`);
    } catch {
      setMsg('❌ Arquivo inválido. Use um backup exportado por este app.');
    }
  };
  return (
    <div>
      <input ref={input} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      <Button variant="secondary" full onClick={() => input.current?.click()}>
        📥 {label}
      </Button>
      {msg && <p className="mt-2 text-xs text-slate-300">{msg}</p>}
    </div>
  );
}

export function SettingsView({ onEdit }: { onEdit: () => void }) {
  const { profile, update, store } = useProfile();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmVariant, setConfirmVariant] = useState(false);

  const exportAll = () => {
    downloadJson(`treino-backup-${localDate()}.json`, store.data);
    store.markBackup();
  };
  const exportMine = () => {
    downloadJson(`treino-${profile.questionnaire.name.toLowerCase().replace(/\s+/g, '-')}-${localDate()}.json`, { version: 1, profiles: [profile] });
    store.markBackup();
  };
  const newVariant = () => {
    const variant = (profile.program.variant ?? 0) + 1;
    update((p) => ({ ...p, program: generateProgram(p.questionnaire, variant) }));
    setConfirmVariant(false);
  };

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-slate-950" style={{ background: profile.color }}>
          {profile.questionnaire.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="font-semibold">{profile.questionnaire.name}</div>
          <div className="text-xs text-slate-500">Perfil criado em {fmtDate(profile.createdAt)}</div>
        </div>
        <Button variant="secondary" onClick={() => store.selectProfile(undefined)}>
          Trocar perfil
        </Button>
      </Card>

      <div>
        <SectionTitle>Plano</SectionTitle>
        <div className="space-y-2">
          <Button variant="secondary" full onClick={onEdit}>
            ✏️ Refazer questionário (gera novo plano)
          </Button>
          <Button variant="secondary" full onClick={() => setConfirmVariant(true)}>
            🔀 Variar exercícios (mesma estrutura)
          </Button>
          <p className="px-1 text-xs text-slate-500">O histórico de cargas é sempre mantido. Um novo plano recomeça na semana 1 do bloco. Variar exercícios a cada 1–2 blocos ajuda a motivação e distribui o estímulo.</p>
        </div>
      </div>

      <div>
        <SectionTitle>Backup e outro celular</SectionTitle>
        <Card className="space-y-2">
          <p className="text-xs leading-relaxed text-slate-400">
            Os dados ficam salvos <b>neste navegador/celular</b>. Para não perder nada (ou usar em outro aparelho), exporte um backup de vez em quando e importe no outro celular — dá para mandar o arquivo pelo WhatsApp/e-mail.
            {store.data.lastBackupAt ? ` Último backup: ${fmtDate(store.data.lastBackupAt)}.` : ' Nenhum backup feito ainda.'}
          </p>
          <Button variant="secondary" full onClick={exportMine}>
            📤 Exportar só meu perfil
          </Button>
          <Button variant="secondary" full onClick={exportAll}>
            📤 Exportar todos os perfis
          </Button>
          <ImportButton />
        </Card>
      </div>

      <div>
        <SectionTitle>Instalar no celular</SectionTitle>
        <Card className="space-y-1 text-xs leading-relaxed text-slate-400">
          <p>
            <b>Android (Chrome):</b> menu ⋮ → “Adicionar à tela inicial”/“Instalar app”.
          </p>
          <p>
            <b>iPhone (Safari):</b> botão compartilhar → “Adicionar à Tela de Início”.
          </p>
          <p>Assim ele abre em tela cheia, como um aplicativo, e funciona offline depois do primeiro acesso.</p>
        </Card>
      </div>

      <div>
        <SectionTitle>Zona de perigo</SectionTitle>
        <Button variant="danger" full onClick={() => setConfirmDelete(true)}>
          Excluir perfil “{profile.questionnaire.name}”
        </Button>
      </div>

      <Sheet open={confirmVariant} onClose={() => setConfirmVariant(false)} title="Variar exercícios?">
        <p className="text-sm text-slate-400">Mantém a mesma divisão, séries e repetições, trocando os exercícios por variações equivalentes. O bloco recomeça na semana 1.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" full onClick={() => setConfirmVariant(false)}>
            Cancelar
          </Button>
          <Button full onClick={newVariant}>
            Variar
          </Button>
        </div>
      </Sheet>

      <Sheet open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Excluir perfil?">
        <p className="text-sm text-slate-400">Todo o histórico de {profile.questionnaire.name} será apagado deste aparelho. Considere exportar um backup antes.</p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" full onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button variant="danger" full onClick={() => store.deleteProfile(profile.id)}>
            Excluir
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
