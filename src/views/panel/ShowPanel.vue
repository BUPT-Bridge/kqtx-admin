<template>
  <div class="show-panel">
    <transition name="fade-scale" mode="out-in">
      <CommunityShow />
    </transition>
  </div>
</template>

<script setup>
import CommunityShow from '@/components/adminpanel/CommunityShow.vue'
</script>

<style scoped>
.show-panel {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  flex: 1;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.show-panel:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.show-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom right, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
  pointer-events: none;
  border-radius: 8px;
}

/* 过渡动画 */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

:deep(.community-show) {
  animation: slideIn 0.6s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
