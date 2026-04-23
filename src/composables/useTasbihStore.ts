import { reactive, computed, watch } from "vue";

export interface DzikirType {
  id: string;
  name: string;
  arabic: string;
  defaultTarget: number;
}

export const DZIKIR_TYPES: DzikirType[] = [
  { id: "subhanallah", name: "Subhanallah", arabic: "سُبْحَانَ ٱللَّٰهِ", defaultTarget: 33 },
  { id: "alhamdulillah", name: "Alhamdulillah", arabic: "ٱلْحَمْدُ لِلَّٰهِ", defaultTarget: 33 },
  { id: "allahuakbar", name: "Allahu Akbar", arabic: "ٱللَّٰهُ أَكْبَرُ", defaultTarget: 34 },
  { id: "lailahaillallah", name: "La ilaha illallah", arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ", defaultTarget: 100 },
  { id: "astaghfirullah", name: "Astaghfirullah", arabic: "أَسْتَغْفِرُ ٱللَّٰهَ", defaultTarget: 100 },
  { id: "shalawat", name: "Shalawat Nabi", arabic: "ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ", defaultTarget: 100 },
  { id: "custom", name: "Bebas", arabic: "ذِكْر", defaultTarget: 100 },
];

const STORAGE_KEY = "tasbih_state_v1";

interface DailyEntry {
  counts: Record<string, number>;
}

interface PersistedState {
  selectedId: string;
  targets: Record<string, number>;
  history: Record<string, DailyEntry>;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    // ignore
  }
  const targets: Record<string, number> = {};
  DZIKIR_TYPES.forEach((d) => (targets[d.id] = d.defaultTarget));
  return {
    selectedId: DZIKIR_TYPES[0].id,
    targets,
    history: {},
  };
}

const state = reactive<PersistedState>(loadState());

watch(
  state,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
    } catch {
      // ignore quota errors
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

  function increment() {
    const today = ensureToday();
    today.counts[state.selectedId] = (today.counts[state.selectedId] ?? 0) + 1;
  }

  function reset() {
    const today = ensureToday();
    today.counts[state.selectedId] = 0;
  }

  function resetAllToday() {
    const today = ensureToday();
    today.counts = {};
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
    // If today has no count yet, allow streak to start counting from yesterday.
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

  return {
    DZIKIR_TYPES,
    selectedId,
    selectedType,
    target,
    count,
    totalToday,
    streak,
    history,
    increment,
    reset,
    resetAllToday,
    clearHistory,
  };
}
