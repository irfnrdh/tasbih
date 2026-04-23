<template>
  <ion-page>
    <ion-header class="modern-header" :translucent="true">
      <ion-toolbar class="modern-toolbar">
        <div class="header-inner">
          <div class="brand">
            <div class="brand-mark">
              <ion-icon :icon="leafOutline"></ion-icon>
            </div>
            <div class="brand-text">
              <div class="greeting">Assalamu'alaikum</div>
              <div class="app-name">Tasbih Digital</div>
            </div>
          </div>
          <div class="header-actions">
            <button class="icon-btn" @click="goHistory" aria-label="Riwayat">
              <ion-icon :icon="timeOutline"></ion-icon>
            </button>
            <button class="icon-btn" @click="settingsOpen = true" aria-label="Pengaturan">
              <ion-icon :icon="settingsOutline"></ion-icon>
            </button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="page-bg">
      <div class="page-wrap">
        <!-- Stats pills -->
        <div class="stats-row">
          <div class="pill streak-pill" @click="goHistory">
            <ion-icon class="pill-icon" :icon="flameOutline"></ion-icon>
            <span class="pill-text">{{ streak }} hari</span>
          </div>
          <div class="pill today-pill">
            <ion-icon class="pill-icon" :icon="ribbonOutline"></ion-icon>
            <span class="pill-text">Hari ini: {{ totalToday }}</span>
          </div>
        </div>

        <!-- Dzikir chips -->
        <div class="chip-row">
          <button
            v-for="d in DZIKIR_TYPES"
            :key="d.id"
            class="dz-chip"
            :class="{ active: d.id === selectedId }"
            @click="selectedId = d.id"
          >
            {{ d.name }}
          </button>
        </div>

        <!-- Arabic display -->
        <div class="arabic">{{ selectedType.arabic }}</div>

        <!-- Big tap counter -->
        <div
          class="tap-area"
          :class="{ tapped: flash, complete: count >= target }"
          @click="incrementCount"
          role="button"
          aria-label="Hitung dzikir"
        >
          <svg class="ring" viewBox="0 0 220 220">
            <circle
              class="ring-bg"
              cx="110"
              cy="110"
              r="100"
              fill="none"
              stroke-width="10"
            />
            <circle
              class="ring-fg"
              cx="110"
              cy="110"
              r="100"
              fill="none"
              stroke-width="10"
              stroke-linecap="round"
              :stroke-dasharray="ringCircumference"
              :stroke-dashoffset="ringOffset"
              transform="rotate(-90 110 110)"
            />
          </svg>
          <div class="tap-inner">
            <div class="count-num">{{ count }}</div>
            <div class="count-sub">dari {{ target }}</div>
            <div class="tap-hint" v-if="count === 0">Tap di sini</div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="action-row">
          <button class="action-btn" @click="resetCount" aria-label="Reset">
            <ion-icon :icon="refreshOutline"></ion-icon>
            <span>Reset</span>
          </button>
          <button
            class="action-btn"
            :class="{ on: isBackgroundMode }"
            @click="toggleBackgroundFromBtn"
            aria-label="Mode Layar Mati"
          >
            <ion-icon
              :icon="isBackgroundMode ? moonOutline : phonePortraitOutline"
            ></ion-icon>
            <span>{{ isBackgroundMode ? "Background ON" : "Background" }}</span>
          </button>
        </div>

        <!-- Hint -->
        <div class="hint-row">
          <ion-icon :icon="volumeMediumOutline"></ion-icon>
          <span>Tekan tombol volume bawah untuk menghitung</span>
        </div>
        <div v-if="volumeStatus" class="status-note">{{ volumeStatus }}</div>
      </div>

      <!-- Settings modal -->
      <ion-modal :is-open="settingsOpen" @didDismiss="settingsOpen = false">
        <ion-header>
          <ion-toolbar>
            <ion-title>Pengaturan</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="settingsOpen = false">Tutup</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <ion-list lines="full">
            <ion-item>
              <ion-label position="stacked">Target ({{ selectedType.name }})</ion-label>
              <ion-input
                type="number"
                :value="target"
                :min="1"
                @ionInput="onTargetInput"
              ></ion-input>
            </ion-item>
            <div class="quick-targets">
              <button
                v-for="t in [33, 99, 100, 1000]"
                :key="t"
                class="qt-btn"
                :class="{ active: target === t }"
                @click="target = t"
              >
                {{ t }}
              </button>
            </div>
            <ion-item lines="none">
              <ion-label>
                <h3>Mode Layar Mati</h3>
                <p class="sub-note">
                  Audio hening menjaga tombol volume aktif saat layar terkunci.
                </p>
              </ion-label>
              <ion-toggle
                :checked="isBackgroundMode"
                @ionChange="toggleBackgroundMode"
              ></ion-toggle>
            </ion-item>
          </ion-list>
        </ion-content>
      </ion-modal>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonToggle,
  IonModal,
  IonList,
  isPlatform,
} from "@ionic/vue";
import { defineComponent } from "vue";
import {
  timeOutline,
  settingsOutline,
  refreshOutline,
  moonOutline,
  phonePortraitOutline,
  volumeMediumOutline,
  flameOutline,
  ribbonOutline,
  leafOutline,
} from "ionicons/icons";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { VolumeButtons } from "@capacitor-community/volume-buttons";
import type { VolumeButtonsResult } from "@capacitor-community/volume-buttons";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";
import { App as CapApp } from "@capacitor/app";
import type { PluginListenerHandle } from "@capacitor/core";
import { useTasbihStore } from "@/composables/useTasbihStore";

export default defineComponent({
  name: "HomePage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonToggle,
    IonModal,
    IonList,
  },
  setup() {
    const store = useTasbihStore();
    return {
      ...store,
      timeOutline,
      settingsOutline,
      refreshOutline,
      moonOutline,
      phonePortraitOutline,
      volumeMediumOutline,
      flameOutline,
      ribbonOutline,
      leafOutline,
    };
  },
  data() {
    return {
      isBackgroundMode: false,
      audioCtx: null as AudioContext | null,
      silentNode: null as AudioBufferSourceNode | null,
      flash: false,
      volumeStatus: "" as string,
      appStateHandle: null as PluginListenerHandle | null,
      keyHandler: null as ((e: KeyboardEvent) => void) | null,
      settingsOpen: false,
    };
  },
  computed: {
    ringCircumference(): number {
      return 2 * Math.PI * 100;
    },
    ringOffset(): number {
      const ratio = Math.min(1, this.count / Math.max(1, this.target));
      return this.ringCircumference * (1 - ratio);
    },
  },
  async mounted() {
    await this.startVolumeWatcher();

    if (isPlatform("hybrid")) {
      try {
        this.appStateHandle = await CapApp.addListener(
          "appStateChange",
          async ({ isActive }) => {
            if (isActive) await this.startVolumeWatcher();
          },
        );
      } catch (e) {
        console.error("Could not attach app state listener:", e);
      }
    }

    if (!isPlatform("hybrid")) {
      this.keyHandler = (e: KeyboardEvent) => {
        if (e.key === "ArrowDown" || e.key === "AudioVolumeDown") {
          e.preventDefault();
          this.handleVolumeDown();
        }
      };
      window.addEventListener("keydown", this.keyHandler);
      this.volumeStatus =
        "Web preview: tekan ArrowDown untuk simulasi tombol volume bawah";
    }
  },
  async unmounted() {
    if (isPlatform("hybrid")) {
      try {
        await VolumeButtons.clearWatch();
      } catch (e) {
        console.error("clearWatch error:", e);
      }
      if (this.appStateHandle) {
        try { await this.appStateHandle.remove(); } catch { /* ignore */ }
        this.appStateHandle = null;
      }
    }
    if (this.keyHandler) {
      window.removeEventListener("keydown", this.keyHandler);
      this.keyHandler = null;
    }
    this.disableBackgroundMode();
  },
  methods: {
    goHistory() {
      this.$router.push("/history");
    },
    onTargetInput(ev: any) {
      const v = parseInt(ev.detail.value, 10);
      if (!isNaN(v)) this.target = v;
    },
    async startVolumeWatcher() {
      if (!isPlatform("hybrid")) return;
      try {
        try { await VolumeButtons.clearWatch(); } catch { /* ignore */ }
        await VolumeButtons.watchVolume(
          {
            disableSystemVolumeHandler: isPlatform("ios"),
            suppressVolumeIndicator: isPlatform("android"),
          },
          (result: VolumeButtonsResult) => {
            if (result.direction === "down") {
              this.handleVolumeDown();
            }
          },
        );
        this.volumeStatus = "Tombol volume bawah aktif";
      } catch (e) {
        console.error("watchVolume failed:", e);
        this.volumeStatus = "Gagal mengaktifkan tombol volume: " + String(e);
      }
    },
    handleVolumeDown() {
      this.flash = true;
      window.setTimeout(() => (this.flash = false), 140);
      this.incrementCount();
    },
    async incrementCount() {
      this.flash = true;
      window.setTimeout(() => (this.flash = false), 120);
      const wasUnder = this.count < this.target;
      this.increment();

      if (wasUnder && this.count >= this.target) {
        await this.vibrate();
      }

      if (this.isBackgroundMode && isPlatform("android")) {
        this.updateForegroundServiceNotification();
      }
    },
    async vibrate() {
      if (isPlatform("android") || isPlatform("ios")) {
        try {
          await Haptics.vibrate();
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch { /* ignore */ }
      } else if ((navigator as any).vibrate) {
        try { (navigator as any).vibrate(80); } catch { /* ignore */ }
      }
    },
    resetCount() {
      this.reset();
      if (this.isBackgroundMode && isPlatform("android")) {
        this.updateForegroundServiceNotification();
      }
    },
    toggleBackgroundFromBtn() {
      this.toggleBackgroundMode({ detail: { checked: !this.isBackgroundMode } });
    },
    async toggleBackgroundMode(event: any) {
      this.isBackgroundMode = event.detail.checked;
      if (this.isBackgroundMode) {
        await this.enableBackgroundMode();
      } else {
        await this.disableBackgroundMode();
      }
    },
    startSilentAudio() {
      try {
        if (!this.audioCtx) {
          const Ctx =
            (window as any).AudioContext ||
            (window as any).webkitAudioContext;
          if (!Ctx) return;
          this.audioCtx = new Ctx();
        }
        const ctx = this.audioCtx as AudioContext;
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
        if (this.silentNode) return;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        source.connect(gain).connect(ctx.destination);
        source.start(0);
        this.silentNode = source;
      } catch (e) {
        console.error("Error starting silent audio:", e);
      }
    },
    stopSilentAudio() {
      try {
        if (this.silentNode) {
          this.silentNode.stop();
          this.silentNode.disconnect();
          this.silentNode = null;
        }
        if (this.audioCtx) {
          this.audioCtx.close().catch(() => {});
          this.audioCtx = null;
        }
      } catch (e) {
        console.error("Error stopping silent audio:", e);
      }
    },
    async enableBackgroundMode() {
      this.startSilentAudio();
      if (isPlatform("hybrid")) {
        try {
          await KeepAwake.keepAwake();
          if (isPlatform("android")) {
            await this.startForegroundService();
          }
        } catch (e) {
          console.error("Error enabling background/keep awake:", e);
        }
      }
    },
    async disableBackgroundMode() {
      this.stopSilentAudio();
      if (isPlatform("hybrid")) {
        try {
          await KeepAwake.allowSleep();
          if (isPlatform("android")) {
            await this.stopForegroundService();
          }
        } catch (e) {
          console.error("Error disabling background/keep awake:", e);
        }
      }
    },
    async startForegroundService() {
      try {
        try {
          const status = await ForegroundService.checkPermissions();
          if (status.display !== "granted") {
            await ForegroundService.requestPermissions();
          }
        } catch (permErr) {
          console.warn("Notification permission check failed:", permErr);
        }
        await ForegroundService.startForegroundService({
          id: 12345,
          title: "Tasbih Digital",
          body: `${this.selectedType.name}: ${this.count}`,
          smallIcon: "ic_stat_icon_config_sample",
        });
      } catch (error) {
        console.error("Error starting foreground service:", error);
      }
    },
    async stopForegroundService() {
      try {
        await ForegroundService.stopForegroundService();
      } catch (error) {
        console.error("Error stopping foreground service:", error);
      }
    },
    async updateForegroundServiceNotification() {
      try {
        await ForegroundService.updateForegroundService({
          id: 12345,
          title: "Tasbih Digital",
          body: `${this.selectedType.name}: ${this.count}`,
          smallIcon: "ic_stat_icon_config_sample",
        });
      } catch (error) {
        console.error("Error updating notification:", error);
      }
    },
  },
});
</script>

<style scoped>
/* Modern header */
.modern-header ion-toolbar.modern-toolbar {
  --background: transparent;
  --border-width: 0;
  --min-height: 72px;
  --padding-top: 8px;
  --padding-bottom: 8px;
  --padding-start: 0;
  --padding-end: 0;
}
.modern-header::after { display: none !important; }
.modern-header {
  background: linear-gradient(135deg, #16805a 0%, #2bb673 60%, #5fd498 100%);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: white;
}
.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.brand-text { line-height: 1.15; }
.greeting {
  font-size: 11px;
  opacity: 0.85;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.app-name {
  font-size: 18px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 8px;
}
.icon-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}
.icon-btn ion-icon { font-size: 20px; }
.icon-btn:active {
  transform: scale(0.92);
  background: rgba(255, 255, 255, 0.28);
}

.page-bg {
  --background: linear-gradient(180deg, #f6fbf7 0%, #eaf5ee 100%);
}
@media (prefers-color-scheme: dark) {
  .page-bg {
    --background: linear-gradient(180deg, #0f1c17 0%, #0a1410 100%);
  }
}

.page-wrap {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
  padding: 16px;
  max-width: 480px;
  margin: 0 auto;
}

/* Stats pills */
.stats-row {
  display: flex;
  gap: 10px;
}
.pill {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  user-select: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.streak-pill {
  background: linear-gradient(135deg, #ff8a4c, #e8442a);
}
.today-pill {
  background: linear-gradient(135deg, #2bb673, #16805a);
  cursor: default;
}
.pill-icon { font-size: 18px; }

/* Dzikir chips */
.chip-row {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.chip-row::-webkit-scrollbar { display: none; }
.dz-chip {
  flex: 0 0 auto;
  background: rgba(43, 182, 115, 0.12);
  color: #16805a;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}
.dz-chip.active {
  background: linear-gradient(135deg, #2bb673, #16805a);
  color: white;
  box-shadow: 0 2px 8px rgba(22, 128, 90, 0.3);
}
@media (prefers-color-scheme: dark) {
  .dz-chip {
    background: rgba(43, 182, 115, 0.18);
    color: #6ddca7;
  }
}

/* Arabic */
.arabic {
  text-align: center;
  font-size: 36px;
  padding: 8px 0 4px;
  color: #16805a;
  line-height: 1.4;
  font-family: "Traditional Arabic", "Scheherazade", serif;
}
@media (prefers-color-scheme: dark) {
  .arabic { color: #6ddca7; }
}

/* Tap area / progress ring */
.tap-area {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 8px auto 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.08s ease;
}
.tap-area:active { transform: scale(0.97); }
.tap-area.tapped .ring-fg { filter: drop-shadow(0 0 6px #2bb673); }
.tap-area.complete .count-num { color: #e8442a; }

.ring {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ring-bg {
  stroke: rgba(43, 182, 115, 0.15);
}
.ring-fg {
  stroke: url(#none);
  stroke: #2bb673;
  transition: stroke-dashoffset 0.25s ease;
}

.tap-inner {
  position: relative;
  text-align: center;
  z-index: 1;
  padding: 24px;
  border-radius: 50%;
  background: white;
  width: 78%;
  height: 78%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(22, 128, 90, 0.12);
}
@media (prefers-color-scheme: dark) {
  .tap-inner {
    background: #142822;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
}
.count-num {
  font-size: 76px;
  font-weight: 800;
  line-height: 1;
  color: #16805a;
  font-variant-numeric: tabular-nums;
}
@media (prefers-color-scheme: dark) {
  .count-num { color: #6ddca7; }
}
.count-sub {
  margin-top: 6px;
  font-size: 14px;
  color: var(--ion-color-medium);
}
.tap-hint {
  margin-top: 10px;
  font-size: 12px;
  color: var(--ion-color-medium);
  opacity: 0.8;
}

/* Action row */
.action-row {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.action-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px;
  border-radius: 14px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: var(--ion-color-dark);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.action-btn ion-icon { font-size: 22px; }
.action-btn:active { transform: scale(0.97); }
.action-btn.on {
  background: linear-gradient(135deg, #2bb673, #16805a);
  color: white;
  border-color: transparent;
}
@media (prefers-color-scheme: dark) {
  .action-btn {
    background: #142822;
    color: #e0eee8;
    border-color: rgba(255, 255, 255, 0.06);
  }
}

/* Hints */
.hint-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--ion-color-medium);
  margin-top: 4px;
  text-align: center;
}
.hint-row ion-icon { font-size: 14px; }
.status-note {
  text-align: center;
  font-size: 11px;
  color: var(--ion-color-medium);
  opacity: 0.75;
}

/* Settings modal helpers */
.quick-targets {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  flex-wrap: wrap;
}
.qt-btn {
  flex: 1;
  min-width: 60px;
  padding: 10px;
  border-radius: 10px;
  background: rgba(43, 182, 115, 0.1);
  color: #16805a;
  border: 1px solid transparent;
  font-weight: 600;
  cursor: pointer;
}
.qt-btn.active {
  background: #2bb673;
  color: white;
}
.sub-note {
  font-size: 12px;
  color: var(--ion-color-medium);
  white-space: normal;
}
</style>
