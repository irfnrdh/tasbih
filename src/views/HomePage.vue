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
  IonItem,
  IonLabel,
  IonInput,
  IonNote,
  isPlatform,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { VolumeButtons } from "@capacitor-community/volume-buttons";
import type { VolumeButtonsResult } from "@capacitor-community/volume-buttons";

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
  },
  data() {
    return {
      count: 0,
      target: 100,
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
  },
  methods: {
    async incrementCount() {
      this.count++;

      if (this.count >= this.target) {
        await this.vibrate();
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
</style>
