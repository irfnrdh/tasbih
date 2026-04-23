<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Riwayat & Streak</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="streak-card">
        <div class="streak-number">{{ streak }}</div>
        <div class="streak-label">Hari Beruntun 🔥</div>
      </div>

      <h2 class="section-title">Riwayat Harian</h2>

      <div v-if="history.length === 0" class="empty-state">
        Belum ada riwayat. Mulai berdzikir hari ini!
      </div>

      <ion-list v-else>
        <ion-item v-for="entry in history" :key="entry.date" lines="full">
          <ion-label>
            <h3>{{ formatDate(entry.date) }}</h3>
            <p class="day-total">Total: {{ entry.total }} dzikir</p>
            <div class="breakdown">
              <span
                v-for="(c, id) in entry.counts"
                :key="id"
                class="chip"
              >
                {{ nameFor(id) }}: {{ c }}
              </span>
            </div>
          </ion-label>
        </ion-item>
      </ion-list>

      <ion-button
        v-if="history.length > 0"
        expand="block"
        color="medium"
        fill="outline"
        class="clear-btn"
        @click="confirmClear"
      >
        Hapus Semua Riwayat
      </ion-button>
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
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  alertController,
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useTasbihStore, DZIKIR_TYPES } from "@/composables/useTasbihStore";

export default defineComponent({
  name: "HistoryPage",
  components: {
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
  },
  setup() {
    const { history, streak, clearHistory } = useTasbihStore();
    return { history, streak, clearHistory };
  },
  methods: {
    nameFor(id: string) {
      return DZIKIR_TYPES.find((d) => d.id === id)?.name ?? id;
    },
    formatDate(dateStr: string) {
      const d = new Date(dateStr + "T00:00:00");
      return d.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },
    async confirmClear() {
      const alert = await alertController.create({
        header: "Hapus Riwayat?",
        message: "Semua data riwayat dan streak akan hilang.",
        buttons: [
          { text: "Batal", role: "cancel" },
          {
            text: "Hapus",
            role: "destructive",
            handler: () => this.clearHistory(),
          },
        ],
      });
      await alert.present();
    },
  },
});
</script>

<style scoped>
.streak-card {
  text-align: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #ff9966, #ff5e62);
  color: white;
  border-radius: 16px;
  margin-bottom: 24px;
}
.streak-number {
  font-size: 64px;
  font-weight: bold;
  line-height: 1;
}
.streak-label {
  font-size: 16px;
  margin-top: 8px;
  opacity: 0.95;
}
.section-title {
  font-size: 18px;
  margin: 16px 0 8px;
}
.empty-state {
  text-align: center;
  color: var(--ion-color-medium);
  padding: 40px 20px;
}
.day-total {
  color: var(--ion-color-medium);
  font-size: 13px;
  margin: 4px 0;
}
.breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}
.chip {
  background: var(--ion-color-light);
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: var(--ion-color-dark);
}
.clear-btn {
  margin-top: 24px;
}
</style>
