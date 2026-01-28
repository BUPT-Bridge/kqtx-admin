<template>
  <div class="report-panel">
    <transition name="bounce" mode="out-in">
      <el-empty description="报告生成功能开发中..." :image-size="200">
        <template #image>
          <el-icon class="empty-icon">
            <Setting />
          </el-icon>
        </template>
      </el-empty>
    </transition>
  </div>
</template>

<script setup>
import { Setting } from '@element-plus/icons-vue'
</script>

<style scoped>
.report-panel {
  background: linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  padding: 20px;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.report-panel:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
}

.report-panel::before {
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

/* Empty 组件样式 */
:deep(.el-empty) {
  padding: 40px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

:deep(.empty-icon) {
  font-size: 80px;
  color: #909399;
  animation: rotate 10s linear infinite;
}

:deep(.el-empty__description) {
  font-size: 16px;
  color: #606266;
  margin-top: 20px;
}

/* 过渡动画 */
.bounce-enter-active {
  animation: bounce-in 0.5s;
}

.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
  }

  50% {
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
