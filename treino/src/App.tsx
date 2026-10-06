import { useState } from 'react';
import { generateProgram } from './logic/generator';
import { fmtDate, localDate, uid } from './logic/util';
import { StoreProvider, useStore } from './store';
import type { Profile, Questionnaire as Q } from './types';
import { Questionnaire } from './views/Questionnaire';
import { TodayView } from './views/TodayView';
import { PlanView } from './views/PlanView';
import { ProgressView } from './views/ProgressView';
import { NutritionView } from './views/NutritionView';
import { GuideView } from './views/GuideView';
import { SettingsView, ImportButton } from './views/SettingsView';
import { WorkoutSession } from './views/WorkoutSession';
import { Button, Card, cx } from './components/ui';

export default function App() {
  return (
    <StoreProvider>
      <Root />
    </StoreProvider>
  );
}

type Tab = 'hoje' | 'plano' | 'progresso' | 'nutricao' | 'guia' | 'config';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'hoje', icon: '🏠', label: 'Hoje' },
  { id: 'plano', icon: '📋', label: 'Plano' },
  { id: 'progresso', icon: '📈', label: 'Progresso' },
  { id: 'nutricao', icon: '🥗', label: 'Nutrição' },
  { id: 'guia', icon: '📚', label: 'Guia' },
];

function Root() {
  const store = useStore();
  const { profile } = store;
  const [mode, setMode] = useState<'normal' | 'new' | 'edit'>('normal');
  const [tab, setTab] = useState<Tab>('hoje');

  const createProfile = (q: Q, color: string) => {
    const p: Profile = {
      id: uid(),
      createdAt: new Date().toISOString(),
      color,
      questionnaire: q,
      program: generateProgram(q),
      workouts: [],
      bodyLogs: [{ date: localDate(), weightKg: q.weightKg }],
      cardioLogs: [],
    };
    store.addProfile(p);
    setTab('plano');
    setMode('normal');
  };

  const editProfile = (q: Q, color: string) => {
    if (!profile) return;
    store.updateProfile(profile.id, (p) => {
      const today = localDate();
      const lastW = [...p.bodyLogs].sort((a, b) => a.date.localeCompare(b.date)).pop()?.weightKg;
      const bodyLogs = lastW !== q.weightKg ? [...p.bodyLogs.filter((b) => b.date !== today), { date: today, weightKg: q.weightKg }] : p.bodyLogs;
      return { ...p, color, questionnaire: q, program: generateProgram(q), bodyLogs, activeWorkout: undefined };
    });
    setTab('plano');
    setMode('normal');
  };

  if (mode === 'new') return <Questionnaire onDone={createProfile} onCancel={store.data.profiles.length ? () => setMode('normal') : undefined} />;
  if (!profile) return <ProfilePicker onNew={() => setMode('new')} />;
  if (mode === 'edit')
    return <Questionnaire initial={profile.questionnaire} initialColor={profile.color} onDone={editProfile} onCancel={() => setMode('normal')} />;

  const style = { ['--accent' as string]: profile.color };

  if (profile.activeWorkout)
    return (
      <div style={style} className="min-h-dvh">
        <WorkoutSession />
      </div>
    );

  return (
    <div style={style} className="min-h-dvh">
      <header className="safe-top sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <button className="flex items-center gap-2.5" onClick={() => store.selectProfile(undefined)} aria-label="Trocar perfil">
            <span className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-slate-950" style={{ background: profile.color }}>
              {profile.questionnaire.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-left">
              <span className="block text-sm font-semibold leading-tight">{profile.questionnaire.name}</span>
              <span className="block text-xs text-slate-500">trocar perfil</span>
            </span>
          </button>
          <button onClick={() => setTab('config')} className={cx('rounded-xl px-3 py-2 text-lg', tab === 'config' ? 'bg-slate-800' : 'hover:bg-slate-800')} aria-label="Configurações">
            ⚙️
          </button>
        </div>
      </header>

      {store.saveError && (
        <div className="mx-auto max-w-lg px-4 pt-3">
          <div className="rounded-xl bg-red-500/15 p-3 text-xs text-red-200">Não foi possível salvar os dados neste navegador (modo anônimo ou armazenamento cheio). Exporte um backup em ⚙️.</div>
        </div>
      )}

      <main className="mx-auto max-w-lg px-4 pb-28 pt-4">
        {tab === 'hoje' && <TodayView />}
        {tab === 'plano' && <PlanView onEdit={() => setMode('edit')} />}
        {tab === 'progresso' && <ProgressView />}
        {tab === 'nutricao' && <NutritionView />}
        {tab === 'guia' && <GuideView />}
        {tab === 'config' && <SettingsView onEdit={() => setMode('edit')} />}
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                window.scrollTo({ top: 0 });
              }}
              className={cx('flex flex-col items-center gap-0.5 py-2 text-[11px] transition', tab === t.id ? 'text-accent' : 'text-slate-500')}
            >
              <span className={cx('text-xl transition', tab !== t.id && 'opacity-60 grayscale')}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function ProfilePicker({ onNew }: { onNew: () => void }) {
  const store = useStore();
  const profiles = store.data.profiles;
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mb-3 text-5xl">🏋️‍♀️🏋️</div>
        <h1 className="text-3xl font-bold">Treino Casal</h1>
        <p className="mt-2 text-slate-400">Musculação e cardio baseados em evidências, com um perfil para cada um.</p>
      </div>

      {profiles.length > 0 && <div className="mb-3 text-center text-sm text-slate-400">Quem vai treinar?</div>}
      <div className="space-y-3">
        {profiles.map((p) => {
          const last = p.workouts[p.workouts.length - 1];
          return (
            <Card key={p.id} onClick={() => store.selectProfile(p.id)} className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-slate-950" style={{ background: p.color }}>
                {p.questionnaire.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="flex-1">
                <div className="text-lg font-semibold">{p.questionnaire.name}</div>
                <div className="text-xs text-slate-500">
                  {p.workouts.length} treinos{last ? ` · último em ${fmtDate(last.finishedAt)}` : ''}
                  {p.activeWorkout ? ' · treino em andamento' : ''}
                </div>
              </div>
              <span className="text-slate-600">›</span>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <Button full className="py-4 text-base" onClick={onNew}>
          + {profiles.length ? 'Novo perfil' : 'Criar meu perfil'}
        </Button>
        <ImportButton label="Importar backup (de outro celular)" />
      </div>

      <p className="mt-auto pt-10 text-center text-xs text-slate-600">Os dados ficam salvos apenas neste aparelho. Use o backup para levar para outro celular.</p>
    </div>
  );
}
