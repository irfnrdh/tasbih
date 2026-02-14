// src/views/HomePage.vue
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tasbih Digital</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="counter-container">
        <!-- Target Input -->
        <ion-item>
          <ion-label position="stacked">Target Tasbih</ion-label>
          <ion-input
            type="number"
            v-model="target"
            :min="1"
            class="target-input"
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

        <ion-button expand="block" color="danger" @click="resetCount">
          Reset
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

        <!-- Hidden Audio Element for Background Mode -->
        <audio ref="silentAudio" loop style="display: none">
          <source
            src="data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAATAAZMbGFtZSAzLjk5LjVVQhQAAAAAAAAAQQJGRklEwVEAAACygAAAAAVqyk+pYgA2gAABbAAAAAAAAAAuWloBzA"
            type="audio/mpeg"
          />
        </audio>
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
  IonItem,
  IonLabel,
  IonInput,
  IonNote,
  IonToggle,
  isPlatform,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { VolumeButtons } from "@capacitor-community/volume-buttons";
import type { VolumeButtonsResult } from "@capacitor-community/volume-buttons";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { ForegroundService } from "@capawesome-team/capacitor-android-foreground-service";

export default defineComponent({
  name: "HomePage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonNote,
    IonToggle,
  },
  data() {
    return {
      count: 0,
      target: 100,
      isBackgroundMode: false,
    };
  },
  async mounted() {
    // Setup volume button listener
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
    // Cleanup listener
    VolumeButtons.clearWatch();
    this.disableBackgroundMode();
  },
  methods: {
    async incrementCount() {
      this.count++;

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
      this.count = 0;
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
    async enableBackgroundMode() {
      const audio = this.$refs.silentAudio as HTMLAudioElement;
      if (audio) {
        audio
          .play()
          .catch((e) => console.error("Error playing silent audio:", e));
      }

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
      const audio = this.$refs.silentAudio as HTMLAudioElement;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }

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
        // Request notification permission if needed (Android 13+)
        // Note: In real app, check permission status first
        // await ForegroundService.checkPermissions();
        await ForegroundService.startForegroundService({
          id: 12345,
          title: "Tasbih Digital",
          body: `Jumlah Dzikir: ${this.count}`,
          smallIcon: "ic_stat_icon_config_sample", // Default fallback icon
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
          body: `Jumlah Dzikir: ${this.count}`,
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
  gap: 20px;
  padding: 20px;
}

.counter-display {
  text-align: center;
  padding: 30px 0;
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
  margin-top: 20px;
}

.toggle-item {
  margin-top: 20px;
  --background: transparent;
}
</style>
