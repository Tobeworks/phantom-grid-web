<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <span class="font-mono text-[0.7rem] tracking-[0.3em] uppercase text-accent">// DASHBOARD</span>
      <h1 class="font-label font-bold uppercase tracking-[0.08em] text-2xl text-fg">Phantom Grid Admin</h1>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="border border-border p-5 flex flex-col gap-2">
        <span class="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-fg-muted">Newsletter</span>
        <span class="font-label font-bold text-3xl text-fg">{{ subscriberCount }}</span>
        <RouterLink to="/newsletter" class="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-accent no-underline">Manage campaigns →</RouterLink>
      </div>
      <div class="border border-border p-5 flex flex-col gap-2">
        <span class="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-fg-muted">Promo List</span>
        <span class="font-label font-bold text-3xl text-fg">{{ promoCount }}</span>
        <RouterLink to="/promo" class="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-accent no-underline">Manage contacts →</RouterLink>
      </div>
      <div class="border border-border p-5 flex flex-col gap-2">
        <span class="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-fg-muted">Campaigns</span>
        <span class="font-label font-bold text-3xl text-fg">{{ campaignCount }}</span>
        <RouterLink to="/newsletter" class="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-accent no-underline">View all →</RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const subscriberCount = ref(0);
const promoCount = ref(0);
const campaignCount = ref(0);

onMounted(async () => {
  try {
    const [subsRes, campsRes] = await Promise.all([
      fetch('/api/admin/newsletter/subscribers/count'),
      fetch('/api/admin/newsletter/campaigns'),
    ]);
    if (subsRes.ok) {
      const d = await subsRes.json();
      subscriberCount.value = d.count ?? 0;
    }
    if (campsRes.ok) {
      const d = await campsRes.json();
      campaignCount.value = (d.campaigns ?? []).length;
    }
  } catch {}

  try {
    const promoRes = await fetch('/api/admin/promo-list/subscribers');
    if (promoRes.ok) {
      const d = await promoRes.json();
      promoCount.value = (d ?? []).length;
    }
  } catch {}
});
</script>
