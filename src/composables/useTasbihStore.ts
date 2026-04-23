import { reactive, computed, watch } from "vue";

export interface DzikirType {
  id: string;
  name: string;
  arabic: string;
  defaultTarget: number;
  translation?: string;
}

export const DZIKIR_TYPES: DzikirType[] = [
  {
    id: "subhanallah",
    name: "Subhanallah",
    arabic: "سُبْحَانَ ٱللَّٰهِ",
    defaultTarget: 33,
    translation: "Maha Suci Allah",
  },
  {
    id: "alhamdulillah",
    name: "Alhamdulillah",
    arabic: "ٱلْحَمْدُ لِلَّٰهِ",
    defaultTarget: 33,
    translation: "Segala puji bagi Allah",
  },
  {
    id: "allahuakbar",
    name: "Allahu Akbar",
    arabic: "ٱللَّٰهُ أَكْبَرُ",
    defaultTarget: 34,
    translation: "Allah Maha Besar",
  },
  {
    id: "lailahaillallah",
    name: "La ilaha illallah",
    arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
    defaultTarget: 100,
    translation: "Tiada Tuhan selain Allah",
  },
  {
    id: "astaghfirullah",
    name: "Astaghfirullah",
    arabic: "أَسْتَغْفِرُ ٱللَّٰهَ",
    defaultTarget: 100,
    translation: "Aku memohon ampun kepada Allah",
  },
  {
    id: "shalawat",
    name: "Shalawat Nabi",
    arabic: "ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ",
    defaultTarget: 100,
    translation: "Ya Allah, limpahkan shalawat kepada Nabi Muhammad",
  },
  {
    id: "subhanallahbihamdihi",
    name: "Subhanallah wa bihamdihi",
    arabic: "سُبْحَانَ ٱللَّٰهِ وَبِحَمْدِهِ",
    defaultTarget: 100,
    translation: "Maha Suci Allah dan segala puji bagi-Nya",
  },
  {
    id: "subhanallahalazhim",
    name: "Subhanallahil 'Azhim",
    arabic: "سُبْحَانَ ٱللَّٰهِ ٱلْعَظِيمِ",
    defaultTarget: 100,
    translation: "Maha Suci Allah Yang Maha Agung",
  },
  {
    id: "hawqala",
    name: "La Hawla wa la Quwwata",
    arabic: "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِٱللَّٰهِ",
    defaultTarget: 100,
    translation: "Tiada daya dan kekuatan kecuali dengan Allah",
  },
  {
    id: "hasbunallah",
    name: "Hasbunallah wa ni'mal Wakil",
    arabic: "حَسْبُنَا ٱللَّٰهُ وَنِعْمَ ٱلْوَكِيلُ",
    defaultTarget: 100,
    translation: "Cukuplah Allah bagi kami, dan Dia sebaik-baik pelindung",
  },
  {
    id: "bismillah",
    name: "Bismillah",
    arabic: "بِسْمِ ٱللَّٰهِ",
    defaultTarget: 100,
    translation: "Dengan menyebut nama Allah",
  },
  {
    id: "custom",
    name: "Bebas",
    arabic: "ذِكْر",
    defaultTarget: 100,
    translation: "Dzikir bebas",
  },
];

export interface RoutineStep {
  dzikirId: string;
  target: number;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  steps: RoutineStep[];
}

export const ROUTINES: Routine[] = [
  {
    id: "tasbihat",
    name: "Tasbihat Ba'da Shalat",
    description: "33 Subhanallah, 33 Alhamdulillah, 34 Allahu Akbar",
    steps: [
      { dzikirId: "subhanallah", target: 33 },
      { dzikirId: "alhamdulillah", target: 33 },
      { dzikirId: "allahuakbar", target: 34 },
    ],
  },
  {
    id: "tasbihat100",
    name: "Tasbihat + Tahlil",
    description: "33 Subhanallah, 33 Alhamdulillah, 33 Allahu Akbar, 1 Tahlil",
    steps: [
      { dzikirId: "subhanallah", target: 33 },
      { dzikirId: "alhamdulillah", target: 33 },
      { dzikirId: "allahuakbar", target: 33 },
      { dzikirId: "lailahaillallah", target: 1 },
    ],
  },
  {
    id: "istighfar100",
    name: "Istighfar 100x",
    description: "100x Astaghfirullah",
    steps: [{ dzikirId: "astaghfirullah", target: 100 }],
  },
  {
    id: "shalawat100",
    name: "Shalawat 100x",
    description: "100x Shalawat Nabi",
    steps: [{ dzikirId: "shalawat", target: 100 }],
  },
];

const STORAGE_KEY = "tasbih_state_v2";
const LEGACY_KEY = "tasbih_state_v1";

interface DailyEntry {
  counts: Record<string, number>;
}

interface PersistedState {
  selectedId: string;
  targets: Record<string, number>;
  history: Record<string, DailyEntry>;
  settings: {
    sound: boolean;
  };
  routine: {
    activeId: string | null;
    stepIndex: number;
  };
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultState(): PersistedState {
  const targets: Record<string, number> = {};
  DZIKIR_TYPES.forEach((d) => (targets[d.id] = d.defaultTarget));
  return {
    selectedId: DZIKIR_TYPES[0].id,
    targets,
    history: {},
    settings: { sound: false },
    routine: { activeId: null, stepIndex: 0 },
  };
}

function loadState(): PersistedState {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const base = defaultState();
      return {
        ...base,
        ...parsed,
        targets: { ...base.targets, ...(parsed.targets || {}) },
        history: parsed.history || {},
        settings: { ...base.settings, ...(parsed.settings || {}) },
        routine: { ...base.routine, ...(parsed.routine || {}) },
      };
    }
  } catch {
    // ignore
  }
  return defaultState();
}

const state = reactive<PersistedState>(loadState());

watch(
  state,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch {
      // ignore
    }
  },
  { deep: true },
);

function ensureToday() {
  const key = todayKey();
  if (!state.history[key]) state.history[key] = { counts: {} };
  return state.history[key];
}

export function useTasbihStore() {
  const selectedId = computed({
    get: () => state.selectedId,
    set: (v: string) => {
      state.selectedId = v;
    },
  });

  const selectedType = computed(
    () => DZIKIR_TYPES.find((d) => d.id === state.selectedId) || DZIKIR_TYPES[0],
  );

  const target = computed({
    get: () => state.targets[state.selectedId] ?? selectedType.value.defaultTarget,
    set: (v: number) => {
      state.targets[state.selectedId] = Math.max(1, Math.floor(v) || 1);
    },
  });

  const count = computed({
    get: () => {
      const today = ensureToday();
      return today.counts[state.selectedId] ?? 0;
    },
    set: (v: number) => {
      const today = ensureToday();
      today.counts[state.selectedId] = Math.max(0, Math.floor(v) || 0);
    },
  });

  const totalToday = computed(() => {
    const today = ensureToday();
    return Object.values(today.counts).reduce((a, b) => a + b, 0);
  });

  const lifetimeTotal = computed(() => {
    let sum = 0;
    for (const day of Object.values(state.history)) {
      for (const c of Object.values(day.counts)) sum += c;
    }
    return sum;
  });

  const activeRoutine = computed<Routine | null>(() => {
    if (!state.routine.activeId) return null;
    return ROUTINES.find((r) => r.id === state.routine.activeId) ?? null;
  });

  const routineStep = computed(() => {
    const r = activeRoutine.value;
    if (!r) return null;
    return r.steps[state.routine.stepIndex] ?? null;
  });

  function increment() {
    const today = ensureToday();
    const next = (today.counts[state.selectedId] ?? 0) + 1;
    today.counts[state.selectedId] = next;
    return next;
  }

  function undo() {
    const today = ensureToday();
    const cur = today.counts[state.selectedId] ?? 0;
    if (cur > 0) today.counts[state.selectedId] = cur - 1;
  }

  function reset() {
    const today = ensureToday();
    today.counts[state.selectedId] = 0;
  }

  function startRoutine(id: string) {
    const r = ROUTINES.find((x) => x.id === id);
    if (!r) return;
    state.routine.activeId = id;
    state.routine.stepIndex = 0;
    const step = r.steps[0];
    state.selectedId = step.dzikirId;
    state.targets[step.dzikirId] = step.target;
    // reset today count for that dzikir so the routine starts fresh
    const today = ensureToday();
    today.counts[step.dzikirId] = 0;
  }

  function advanceRoutine(): { done: boolean; nextStep?: RoutineStep } {
    const r = activeRoutine.value;
    if (!r) return { done: true };
    const nextIndex = state.routine.stepIndex + 1;
    if (nextIndex >= r.steps.length) {
      // routine complete
      state.routine.activeId = null;
      state.routine.stepIndex = 0;
      return { done: true };
    }
    state.routine.stepIndex = nextIndex;
    const step = r.steps[nextIndex];
    state.selectedId = step.dzikirId;
    state.targets[step.dzikirId] = step.target;
    const today = ensureToday();
    today.counts[step.dzikirId] = 0;
    return { done: false, nextStep: step };
  }

  function cancelRoutine() {
    state.routine.activeId = null;
    state.routine.stepIndex = 0;
  }

  // Streak: consecutive days (ending today or yesterday) with at least 1 dzikir.
  const streak = computed(() => {
    const days = Object.keys(state.history).sort();
    if (days.length === 0) return 0;
    const hasCount = (key: string) => {
      const e = state.history[key];
      if (!e) return false;
      return Object.values(e.counts).some((c) => c > 0);
    };
    let streakCount = 0;
    const cursor = new Date();
    if (!hasCount(todayKey())) cursor.setDate(cursor.getDate() - 1);
    while (true) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${d}`;
      if (hasCount(key)) {
        streakCount++;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return streakCount;
  });

  const history = computed(() => {
    return Object.entries(state.history)
      .map(([date, entry]) => ({
        date,
        counts: entry.counts,
        total: Object.values(entry.counts).reduce((a, b) => a + b, 0),
      }))
      .filter((e) => e.total > 0)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  });

  function clearHistory() {
    state.history = {};
  }

  const soundEnabled = computed({
    get: () => state.settings.sound,
    set: (v: boolean) => {
      state.settings.sound = v;
    },
  });

  return {
    DZIKIR_TYPES,
    ROUTINES,
    selectedId,
    selectedType,
    target,
    count,
    totalToday,
    lifetimeTotal,
    streak,
    history,
    activeRoutine,
    routineStep,
    soundEnabled,
    increment,
    undo,
    reset,
    clearHistory,
    startRoutine,
    advanceRoutine,
    cancelRoutine,
  };
}
