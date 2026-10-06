import { useState } from 'react';
import { ALL_MUSCLES, getExercise, MUSCLE_LABEL } from '../data/exercises';
import { timingTips } from '../data/science';
import { CARDIO_MODE_LABEL, groupExercises } from '../logic/generator';
import { blockInfo } from '../logic/progression';
import { useProfile } from '../store';
import { Badge, Button, Card, Collapsible, SectionTitle, Sheet, cx } from '../components/ui';
import { TargetBars } from '../components/LineChart';
import { ExerciseInfo } from './WorkoutSession';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const RIR_WEEKS = (beginner: boolean) => (beginner ? ['3', '3', '2', '2', '2', 'deload'] : ['3', '2', '2', '1', '1', 'deload']);

function fmtRest(sec: number) {
  return sec >= 60 ? `${Math.floor(sec / 60)}${sec % 60 ? `:${String(sec % 60).padStart(2, '0')}` : ''} min` : `${sec} s`;
}

export function PlanView({ onEdit }: { onEdit: () => void }) {
  const { profile } = useProfile();
  const p = profile.program;
  const q = profile.questionnaire;
  const info = blockInfo(profile);
  const [open, setOpen] = useState<string | null>(null);
  const [infoEx, setInfoEx] = useState<string | null>(null);
  const hr = p.hrMax;

  return (
    <div className="space-y-4">
      <Card>
        <div className="text-xs uppercase tracking-wide text-slate-500">Divisão</div>
        <div className="mt-1 text-lg font-bold">{p.splitName}</div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge>{q.daysPerWeek} dias/semana</Badge>
          <Badge>até {q.sessionMinutes} min</Badge>
          <Badge>{{ iniciante: 'Iniciante', intermediario: 'Intermediário', avancado: 'Avançado' }[q.experience]}</Badge>
          <Badge tone="accent">
            {{ hipertrofia: 'Hipertrofia', recomposicao: 'Recomposição', emagrecimento: 'Emagrecimento', condicionamento: 'Condicionamento' }[q.goal]}
          </Badge>
        </div>
      </Card>

      <div>
        <SectionTitle>Treinos</SectionTitle>
        <div className="space-y-2">
          {p.sessions.map((s) => (
            <Card key={s.id} className="p-0">
              <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpen(open === s.id ? null : s.id)}>
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-slate-400">
                    ~{s.estimatedMinutes} min · {s.exercises.length} exercícios{s.finisher ? ' + cardio' : ''}
                  </div>
                </div>
                <span className="text-slate-500">{open === s.id ? '▴' : '▾'}</span>
              </button>
              {open === s.id && (
                <div className="space-y-2 border-t border-slate-800 p-3">
                  {groupExercises(s.exercises).map((g) => (
                    <div key={g[0].key} className={cx(g.length > 1 && 'rounded-2xl border border-dashed border-accent/40 p-1.5')}>
                      {g.length > 1 && <div className="px-1.5 pb-1 text-[11px] font-semibold text-accent">BI-SET {g[0].superset}</div>}
                      {g.map((e) => {
                        const ex = getExercise(e.exerciseId);
                        return (
                          <button
                            key={e.key}
                            onClick={() => setInfoEx(e.exerciseId)}
                            className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2 text-left hover:bg-slate-800/60"
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                                {ex.name}
                                {ex.lengthened && <Badge tone="accent">alongado</Badge>}
                                {e.priority && <Badge tone="ok">★ prioridade</Badge>}
                              </div>
                              <div className="text-xs text-slate-500">
                                {e.role === 'main' ? 'Principal' : e.role === 'secondary' ? 'Secundário' : 'Acessório'} · descanso {fmtRest(e.restSec)}
                              </div>
                            </div>
                            <div className="shrink-0 text-right text-sm font-semibold tabular-nums">
                              {e.sets}×{e.repMin}–{e.repMax}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                  {s.finisher && (
                    <div className="rounded-xl bg-slate-950 p-3 text-sm">
                      <div className="font-medium">❤️ {s.finisher.title}</div>
                      <div className="text-xs text-slate-400">{CARDIO_MODE_LABEL[s.finisher.mode]}</div>
                      <p className="mt-1 text-xs text-slate-400">{s.finisher.details}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Semana sugerida</SectionTitle>
        <Card className="space-y-1.5">
          {p.weekdays.map((items, d) => (
            <div key={d} className="flex gap-3 text-sm">
              <span className="w-9 shrink-0 font-semibold text-slate-500">{WEEKDAYS[d]}</span>
              <span className={cx(items[0].startsWith('Treino') ? 'text-slate-100' : items[0].startsWith('Descanso') ? 'text-slate-500' : 'text-sky-300')}>
                {items.join(' + ')}
              </span>
            </div>
          ))}
          <p className="pt-2 text-xs text-slate-500">
            Os dias são só uma sugestão: o app sempre mostra o próximo treino da sequência. Tente deixar ~48 h entre treinos dos mesmos músculos.
          </p>
        </Card>
      </div>

      <SectionTitle>Entenda o seu plano</SectionTitle>
      <div className="space-y-2">
        <Collapsible icon="🧩" title="Por que esta divisão?">
          <p className="text-sm leading-relaxed text-slate-300">{p.splitWhy}</p>
        </Collapsible>
        <Collapsible icon="📈" title="Periodização (blocos de 6 semanas)" subtitle={info.deload ? 'Semana de deload' : `Você está na semana ${info.week}`}>
          <div className="grid grid-cols-6 gap-1.5 text-center">
            {RIR_WEEKS(q.experience === 'iniciante').map((r, i) => (
              <div key={i} className={cx('rounded-xl p-2', i + 1 === info.week ? 'bg-accent text-slate-950' : 'bg-slate-950 text-slate-300')}>
                <div className="text-[10px] uppercase opacity-70">Sem {i + 1}</div>
                <div className="text-sm font-bold">{r === 'deload' ? '🔋' : `RIR ${r}`}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            O esforço sobe ao longo do bloco (RIR menor = mais perto da falha) e a 6ª semana é de recuperação. A semana avança a cada {q.daysPerWeek} treinos
            concluídos — se uma semana for corrida, o plano espera por você.
          </p>
        </Collapsible>
        <Collapsible icon="📊" title="Volume semanal por músculo">
          <TargetBars
            rows={ALL_MUSCLES.map((mu) => ({
              label: MUSCLE_LABEL[mu],
              value: Math.round((p.weeklyVolume[mu] ?? 0) * 10) / 10,
              target: p.volumeTarget[mu],
              priority: q.priorityMuscles.includes(mu),
            }))}
          />
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            Séries “duras” por semana (o músculo secundário conta meia série). A faixa verde é a meta baseada na literatura para o seu nível; com pouco tempo,
            ficar um pouco abaixo ainda gera ótimos resultados.
          </p>
        </Collapsible>
        <Collapsible
          icon="❤️"
          title="Cardio e zonas de frequência cardíaca"
          subtitle={`~${p.cardioMinutesWeek} min/semana · ${p.stepsTarget.toLocaleString('pt-BR')} passos/dia`}
        >
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-slate-950 p-2">
                <div className="text-xs text-slate-500">FC máx. estimada</div>
                <div className="font-bold">{hr} bpm</div>
              </div>
              <div className="rounded-xl bg-slate-950 p-2">
                <div className="text-xs text-slate-500">Zona 2</div>
                <div className="font-bold">
                  {Math.round(hr * 0.6)}–{Math.round(hr * 0.7)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-950 p-2">
                <div className="text-xs text-slate-500">HIIT</div>
                <div className="font-bold">
                  {Math.round(hr * 0.85)}–{Math.round(hr * 0.95)}
                </div>
              </div>
            </div>
            <div className="text-slate-300">
              <b>Meta de passos:</b> {p.stepsTarget.toLocaleString('pt-BR')}/dia · <b>Cardio planejado:</b> ~{p.cardioMinutesWeek} min/semana (equivalente
              moderado; HIIT conta em dobro)
            </div>
            {p.extraCardio.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Dias extras de cardio</div>
                {p.extraCardio.map((c) => (
                  <div key={c.id} className="rounded-xl bg-slate-950 p-3">
                    <div className="font-medium">{c.title}</div>
                    <div className="text-xs text-slate-400">{CARDIO_MODE_LABEL[c.mode]}</div>
                    <p className="mt-1 text-xs text-slate-400">{c.details}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Sem dias extras de cardio no plano. Se conseguirem encaixar um dia a mais, 30–40 min de Zona 2 já fazem diferença (ajuste em Configurações →
                refazer questionário).
              </p>
            )}
          </div>
        </Collapsible>
        <Collapsible icon="🕒" title="Melhor horário para cada coisa">
          <div className="space-y-3">
            {timingTips(q).map((t) => (
              <div key={t.title}>
                <div className="text-sm font-semibold">
                  {t.icon} {t.title}
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-300">{t.text}</p>
              </div>
            ))}
          </div>
        </Collapsible>
        {p.notes.length > 0 && (
          <Collapsible icon="📝" title="Observações para você">
            <div className="space-y-2 text-sm text-slate-300">
              {p.notes.map((n) => (
                <p key={n}>• {n}</p>
              ))}
            </div>
          </Collapsible>
        )}
      </div>

      <Button variant="secondary" full onClick={onEdit}>
        ✏️ Refazer questionário e gerar novo plano
      </Button>

      <Sheet open={!!infoEx} onClose={() => setInfoEx(null)} title={infoEx ? getExercise(infoEx).name : ''}>
        {infoEx && <ExerciseInfo id={infoEx} />}
      </Sheet>
    </div>
  );
}
