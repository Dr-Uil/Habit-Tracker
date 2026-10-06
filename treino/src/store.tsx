import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppData, Profile } from './types';

const KEY = 'treino-casal-v1';

function emptyData(): AppData {
  return { version: 1, profiles: [] };
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed || !Array.isArray(parsed.profiles)) return emptyData();
    return parsed;
  } catch {
    return emptyData();
  }
}

function saveData(d: AppData): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export function isValidBackup(x: unknown): x is AppData {
  const d = x as AppData;
  return !!d && d.version === 1 && Array.isArray(d.profiles) && d.profiles.every((p) => p.id && p.questionnaire && p.program);
}

interface Store {
  data: AppData;
  profile: Profile | null;
  saveError: boolean;
  selectProfile: (id: string | undefined) => void;
  addProfile: (p: Profile) => void;
  updateProfile: (id: string, fn: (p: Profile) => Profile) => void;
  deleteProfile: (id: string) => void;
  replaceAll: (d: AppData) => void;
  mergeProfiles: (profiles: Profile[]) => void;
  markBackup: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    setSaveError(!saveData(data));
  }, [data]);

  useEffect(() => {
    // Pede ao navegador para não apagar os dados automaticamente
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  const selectProfile = useCallback((id: string | undefined) => setData((d) => ({ ...d, activeProfileId: id })), []);
  const addProfile = useCallback((p: Profile) => setData((d) => ({ ...d, profiles: [...d.profiles, p], activeProfileId: p.id })), []);
  const updateProfile = useCallback(
    (id: string, fn: (p: Profile) => Profile) => setData((d) => ({ ...d, profiles: d.profiles.map((p) => (p.id === id ? fn(p) : p)) })),
    [],
  );
  const deleteProfile = useCallback(
    (id: string) =>
      setData((d) => ({ ...d, profiles: d.profiles.filter((p) => p.id !== id), activeProfileId: d.activeProfileId === id ? undefined : d.activeProfileId })),
    [],
  );
  const replaceAll = useCallback((d: AppData) => setData({ ...d, activeProfileId: undefined }), []);
  const mergeProfiles = useCallback(
    (profiles: Profile[]) =>
      setData((d) => {
        const map = new Map(d.profiles.map((p) => [p.id, p]));
        for (const p of profiles) map.set(p.id, p);
        return { ...d, profiles: [...map.values()] };
      }),
    [],
  );

  const markBackup = useCallback(() => setData((d) => ({ ...d, lastBackupAt: new Date().toISOString() })), []);

  const profile = useMemo(() => data.profiles.find((p) => p.id === data.activeProfileId) ?? null, [data]);

  const value = useMemo(
    () => ({ data, profile, saveError, selectProfile, addProfile, updateProfile, deleteProfile, replaceAll, mergeProfiles, markBackup }),
    [data, profile, saveError, selectProfile, addProfile, updateProfile, deleteProfile, replaceAll, mergeProfiles, markBackup],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider ausente');
  return s;
}

/** Atalho para o perfil ativo (garantido nas telas internas). */
export function useProfile() {
  const s = useStore();
  if (!s.profile) throw new Error('Nenhum perfil ativo');
  const p = s.profile;
  const update = (fn: (p: Profile) => Profile) => s.updateProfile(p.id, fn);
  return { profile: p, update, store: s };
}
