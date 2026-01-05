
import React, { useState, useEffect, useMemo } from 'react';
import { GOALS_2026 } from './constants';
import { Goal, GoalFrequency, DailyLog } from './types';
import { getTodayDateString, getWeekNumber, getMonthString } from './utils/dateUtils';
import { getMotivationalInsight } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PASSWORD = "apxanaeui"; // troque pela senha que quiser
const App: React.FC = () => {
 const [authorized, setAuthorized] = useState<boolean>(() => {
  return localStorage.getItem("authorized") === "true";
});

  const [logs, setLogs] = useState<DailyLog[]>(() => {
    const saved = localStorage.getItem('metas_2026_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeTab, setActiveTab] = useState<'daily' | 'stats' | 'coach'>('daily');
  const [insight, setInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    localStorage.setItem('metas_2026_logs', JSON.stringify(logs));
  }, [logs]);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");

  const todayStr = getTodayDateString();
  const currentLogsToday = logs.find(l => l.date === todayStr);

  const toggleGoal = (goalId: string) => {
    setLogs(prev => {
      const existing = prev.find(l => l.date === todayStr);
      
      if (existing) {
        const isCompleted = existing.completedGoalIds.includes(goalId);
        const newIds = isCompleted 
          ? existing.completedGoalIds.filter(id => id !== goalId)
          : [...existing.completedGoalIds, goalId];
        return prev.map(l => l.date === todayStr ? { ...l, completedGoalIds: newIds } : l);
      } else {
        return [...prev, { date: todayStr, completedGoalIds: [goalId] }];
      }
    });
  };

  const stats = useMemo(() => {
    const totalDays = 365; // Simulating a full year or just current progress
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      log.completedGoalIds.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
    });

    return GOALS_2026.map(goal => ({
      ...goal,
      current: counts[goal.id] || 0,
      percent: Math.min(100, Math.round(((counts[goal.id] || 0) / goal.target) * 100))
    }));
  }, [logs]);

  const fetchInsight = async () => {
    setLoadingInsight(true);
    const summary = stats.map(s => `${s.title}: ${s.current}/${s.target} ${s.unit}`);
    const res = await getMotivationalInsight(summary);
    setInsight(res);
    setLoadingInsight(false);
  };
if (!authorized) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f1f5f9"
    }}>
      <div style={{
        background: "#ffffff",
        padding: 24,
        borderRadius: 12,
        width: 320,
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ marginBottom: 12 }}>🔒 Acesso restrito</h2>

        <input
          type="password"
          placeholder="Digite a senha"
          value={passwordInput}
          onChange={(e) => {
            setPasswordInput(e.target.value);
            setError("");
          }}
          style={{
            width: "100%",
            padding: 10,
            marginBottom: 10,
            borderRadius: 6,
            border: "1px solid #cbd5e1"
          }}
        />

        {error && (
          <div style={{ color: "red", fontSize: 14, marginBottom: 8 }}>
            {error}
          </div>
        )}

        <button
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            background: "#4f46e5",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            cursor: "pointer"
          }}
          onClick={() => {
            if (passwordInput === PASSWORD) {
              localStorage.setItem("authorized", "true");
              setAuthorized(true);
            } else {
              setError("Senha incorreta");
            }
          }}
        >
          Entrar
        </button>
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Planos 2026</h1>
            <p className="text-indigo-100 text-sm">Desenvolvimento Pessoal & Projetos</p>
          </div>
          <div className="text-right">
            <span className="text-xs uppercase tracking-wider opacity-75">Hoje</span>
            <div className="text-lg font-semibold">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 mt-4">
        {activeTab === 'daily' && (
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                Checklist Diário
              </h2>
              <div className="grid gap-3">
                {GOALS_2026.filter(g => g.frequency === GoalFrequency.DAILY).map(goal => (
                  <button
                    key={goal.id}
                    onClick={() => toggleGoal(goal.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${
                      currentLogsToday?.completedGoalIds.includes(goal.id)
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-100'
                    }`}
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{goal.title}</span>
                      <span className="text-xs opacity-70">{goal.description}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      currentLogsToday?.completedGoalIds.includes(goal.id)
                        ? 'bg-indigo-500 border-indigo-500'
                        : 'border-slate-300'
                    }`}>
                      {currentLogsToday?.completedGoalIds.includes(goal.id) && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-emerald-500 rounded-full"></span>
                Outras Metas (Semanais/Mensais/Anuais)
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {GOALS_2026.filter(g => g.frequency !== GoalFrequency.DAILY).map(goal => {
                  const s = stats.find(item => item.id === goal.id);
                  return (
                    <div key={goal.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-slate-700">{goal.title}</h3>
                          <p className="text-xs text-slate-400">{goal.description}</p>
                        </div>
                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${
                          goal.frequency === GoalFrequency.WEEKLY ? 'bg-blue-100 text-blue-600' :
                          goal.frequency === GoalFrequency.MONTHLY ? 'bg-purple-100 text-purple-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {goal.frequency}
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-500">Progresso total</span>
                          <span className="font-bold text-indigo-600">{s?.current} / {goal.target} {goal.unit}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full transition-all duration-500"
                            style={{ width: `${s?.percent}%` }}
                          ></div>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleGoal(goal.id)}
                        className="mt-3 w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium rounded-lg border border-slate-200 transition-colors"
                      >
                        Registrar +1
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-6 text-slate-800">Visualização de Impacto</h2>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.filter(s => s.frequency !== GoalFrequency.DAILY)}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="title" hide />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 shadow-xl border border-slate-100 rounded-lg">
                              <p className="font-bold text-slate-800">{data.title}</p>
                              <p className="text-sm text-indigo-600">{data.current} de {data.target} {data.unit}</p>
                              <p className="text-xs text-slate-400">{data.percent}% concluído</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                      {stats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.percent > 70 ? '#10b981' : '#6366f1'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.slice(0, 4).map(s => (
                  <div key={s.id} className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">{s.percent}%</div>
                    <div className="text-[10px] uppercase text-slate-400 font-bold">{s.title}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-4">Metas de Longo Prazo</h3>
              <div className="space-y-4">
                {stats.filter(s => s.frequency === GoalFrequency.YEARLY).map(s => (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-slate-700">{s.title}</span>
                      <span className="text-slate-500 font-mono">{s.current} / {s.target}</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-amber-400 h-full transition-all duration-1000"
                        style={{ width: `${s.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coach' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-bold mb-2">Coach de IA Gemini</h2>
                <p className="opacity-90 mb-6 text-sm">Analisando seu progresso para 2026 e oferecendo insights personalizados.</p>
                
                {insight ? (
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 italic text-lg leading-relaxed">
                    "{insight}"
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center py-12">
                    <p className="opacity-70">Pronto para sua mentoria de hoje?</p>
                  </div>
                )}

                <button 
                  onClick={fetchInsight}
                  disabled={loadingInsight}
                  className="mt-6 w-full bg-white text-indigo-600 font-bold py-4 rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loadingInsight ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analisando...
                    </>
                  ) : 'Gerar Insights para 2026'}
                </button>
              </div>
              
              {/* Background shapes */}
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-800/20 rounded-full blur-3xl"></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-2">Dica de Produtividade</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Você sabia que o hábito de "Não mexer no celular após as 23h" pode aumentar sua produtividade em 30% no dia seguinte? O descanso de qualidade é a base de todas as outras metas.
                  </p>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-bold text-slate-800 mb-2">Foco Financeiro</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Para atingir R$ 5.000,00 constantes, revise seus processos mensais. O crescimento sustentável vem de bons hábitos diários aplicados ao negócio.
                  </p>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-slate-200 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-8 z-50">
        <button 
          onClick={() => setActiveTab('daily')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'daily' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-[10px] font-bold uppercase">Hoje</span>
        </button>
        <button 
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'stats' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span className="text-[10px] font-bold uppercase">Stats</span>
        </button>
        <button 
          onClick={() => setActiveTab('coach')}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'coach' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[10px] font-bold uppercase">Coach</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
