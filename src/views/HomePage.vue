<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tasbih Digital</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goHistory">
            <ion-icon slot="icon-only" :icon="timeOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="counter-container">
        <!-- Streak banner -->
        <div class="streak-banner" @click="goHistory">
          <span>🔥 Streak: <strong>{{ streak }}</strong> hari</span>
          <span class="today-total">Hari ini: {{ totalToday }}</span>
        </div>

        <!-- Dzikir type selector -->
        <ion-item>
          <ion-label position="stacked">Jenis Dzikir</ion-label>
          <ion-select
            :value="selectedId"
            interface="action-sheet"
            @ionChange="onSelectDzikir"
          >
            <ion-select-option
              v-for="d in DZIKIR_TYPES"
              :key="d.id"
              :value="d.id"
            >
              {{ d.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <div class="arabic">{{ selectedType.arabic }}</div>

        <!-- Target Input -->
        <ion-item>
          <ion-label position="stacked">Target</ion-label>
          <ion-input
            type="number"
            :value="target"
            :min="1"
            class="target-input"
            @ionInput="onTargetInput"
          ></ion-input>
        </ion-item>

        <!-- Counter Display -->
        <div class="counter-display">
          <h1>{{ count }}</h1>
          <p>dari {{ target }}</p>
        </div>

        <!-- Buttons -->
        <ion-button expand="block" @click="incrementCount">
          Hitung (+)
        </ion-button>

        <ion-button expand="block" color="danger" fill="outline" @click="resetCount">
          Reset {{ selectedType.name }}
        </ion-button>

        <!-- Background Mode Toggle -->
        <ion-item lines="none" class="toggle-item">
          <ion-label>Mode Layar Mati</ion-label>
          <ion-toggle
            :checked="isBackgroundMode"
            @ionChange="toggleBackgroundMode"
          ></ion-toggle>
        </ion-item>
        <ion-note class="ion-text-center" v-if="isBackgroundMode">
          Audio hening aktif agar tombol volume tetap bekerja saat layar
          mati/terkunci.
        </ion-note>

        <ion-note class="ion-text-center">
          Gunakan Tombol Volume Down Untuk Menghitung
        </ion-note>
      </div>
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
  IonNote,
  IonToggle,
  IonSelect,
  IonSelectOption,
  isPlatform,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { timeOutline } from "ionicons/icons";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { VolumeButtons } from "@capacitor-community/volume-buttons";
import type { VolumeButtonsResult } from "@capacitor-community/volume-buttons";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";
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
    IonNote,
    IonToggle,
    IonSelect,
    IonSelectOption,
  },
  setup() {
    const store = useTasbihStore();
    return { ...store, timeOutline };
  },
  data() {
    return {
      isBackgroundMode: false,
      audioCtx: null as AudioContext | null,
      silentNode: null as AudioBufferSourceNode | null,
    };
  },
  async mounted() {
    const options = {
      disableSystemVolumeHandler: isPlatform("ios"),
      suppressVolumeIndicator: isPlatform("android"),
    };

    if (isPlatform("hybrid")) {
      await VolumeButtons.watchVolume(
        options,
        (result: VolumeButtonsResult) => {
          if (result.direction === "down") {
            this.incrementCount();
          }
        },
      );
    }
  },
  unmounted() {
    if (isPlatform("hybrid")) {
      VolumeButtons.clearWatch();
    }
    this.disableBackgroundMode();
  },
  methods: {
    goHistory() {
      this.$router.push("/history");
    },
    onSelectDzikir(ev: any) {
      this.selectedId = ev.detail.value;
    },
    onTargetInput(ev: any) {
      const v = parseInt(ev.detail.value, 10);
      if (!isNaN(v)) this.target = v;
    },
    async incrementCount() {
      this.increment();

      if (this.count >= this.target) {
        await this.vibrate();
      }

      if (this.isBackgroundMode && isPlatform("android")) {
        this.updateForegroundServiceNotification();
      }
    },
    async vibrate() {
      if (isPlatform("android") || isPlatform("ios")) {
        await Haptics.vibrate();
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
    },
    resetCount() {
      this.reset();
      if (this.isBackgroundMode && isPlatform("android")) {
        this.updateForegroundServiceNotification();
      }
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
.counter-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px;
}

.streak-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #ff9966, #ff5e62);
  color: white;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  cursor: pointer;
}
.streak-banner strong {
  font-size: 18px;
}
.today-total {
  opacity: 0.95;
}

.arabic {
  text-align: center;
  font-size: 32px;
  padding: 12px 0;
  font-family: "Traditional Arabic", "Scheherazade", serif;
  color: var(--ion-color-primary);
}

.counter-display {
  text-align: center;
  padding: 20px 0;
}

.counter-display h1 {
  font-size: 72px;
  font-weight: bold;
  margin: 0;
}

.counter-display p {
  font-size: 18px;
  color: var(--ion-color-medium);
  margin: 10px 0 0;
}

ion-note {
  display: block;
  margin-top: 16px;
}

.toggle-item {
  margin-top: 16px;
  --background: transparent;
}
</style>
