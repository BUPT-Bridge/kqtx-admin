<template>
  <div class="otp-wrapper">
    <!-- 管理员验证码 -->
    <div class="otp-code">
      <div class="code-container">
        <h3>管理员验证码</h3>
        <div class="code-display">
          <span class="code">{{ adminOtpCode || '获取中...' }}</span>
          <el-button
            v-if="adminOtpCode"
            type="text"
            class="copy-button"
            @click="copyCode(adminOtpCode)"
          >
            <el-icon><Document /></el-icon>
            复制
          </el-button>
        </div>

        <div class="timer-container">
          <div class="timer-text">有效期: {{ adminFormattedTime }}</div>
          <el-progress
            :percentage="adminTimePercentage"
            :color="adminProgressColor"
            :stroke-width="8"
          />
        </div>

        <div class="button-group">
          <el-button
            type="primary"
            @click="getAdminOTPCode"
            :loading="adminLoading"
            :disabled="adminIsCountingDown"
          >
            {{ adminIsCountingDown ? '刷新倒计时中' : '刷新验证码' }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- 网格员验证码 -->
    <div class="otp-code">
      <div class="code-container">
        <h3>网格员验证码</h3>
        <div class="code-display">
          <span class="code">{{ gridOtpCode || '获取中...' }}</span>
          <el-button
            v-if="gridOtpCode"
            type="text"
            class="copy-button"
            @click="copyCode(gridOtpCode)"
          >
            <el-icon><Document /></el-icon>
            复制
          </el-button>
        </div>

        <div class="timer-container">
          <div class="timer-text">有效期: {{ gridFormattedTime }}</div>
          <el-progress
            :percentage="gridTimePercentage"
            :color="gridProgressColor"
            :stroke-width="8"
          />
        </div>

        <div class="button-group">
          <el-button
            type="primary"
            @click="getGridOTPCode"
            :loading="gridLoading"
            :disabled="gridIsCountingDown"
          >
            {{ gridIsCountingDown ? '刷新倒计时中' : '刷新验证码' }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Document } from '@element-plus/icons-vue'
import { request } from '../../logic/register.js'

const totalTime = 30 // 单位s

// 管理员状态
const adminOtpCode = ref('')
const adminLoading = ref(false)
const adminRemainingTime = ref(0)
let adminCountdownTimer = null

// 网格员状态
const gridOtpCode = ref('')
const gridLoading = ref(false)
const gridRemainingTime = ref(0)
let gridCountdownTimer = null

// 管理员计算属性
const adminFormattedTime = computed(() => {
  const minutes = Math.floor(adminRemainingTime.value / 60)
  const seconds = adminRemainingTime.value % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
})

const adminTimePercentage = computed(() => {
  return ((adminRemainingTime.value / totalTime) * 100).toFixed(2)
})

const adminProgressColor = computed(() => {
  if (adminTimePercentage.value > 50) {
    return '#67C23A' // 绿色
  } else if (adminTimePercentage.value > 20) {
    return '#E6A23C' // 黄色
  } else {
    return '#F56C6C' // 红色
  }
})

const adminIsCountingDown = computed(() => {
  return adminRemainingTime.value > 0
})

// 网格员计算属性
const gridFormattedTime = computed(() => {
  const minutes = Math.floor(gridRemainingTime.value / 60)
  const seconds = gridRemainingTime.value % 60
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
})

const gridTimePercentage = computed(() => {
  return ((gridRemainingTime.value / totalTime) * 100).toFixed(2)
})

const gridProgressColor = computed(() => {
  if (gridTimePercentage.value > 50) {
    return '#67C23A' // 绿色
  } else if (gridTimePercentage.value > 20) {
    return '#E6A23C' // 黄色
  } else {
    return '#F56C6C' // 红色
  }
})

const gridIsCountingDown = computed(() => {
  return gridRemainingTime.value > 0
})

// 获取管理员OTP验证码
const getAdminOTPCode = async () => {
  try {
    adminLoading.value = true
    const response = await request.get('/user/Changepermission')
    if (response.code === 200 && response.data) {
      adminOtpCode.value = response.data.code || response.data
      startAdminCountdown()
    } else {
      throw new Error('获取验证码失败')
    }
  } catch (error) {
    ElMessage.error('获取管理员验证码失败')
    console.error('获取管理员验证码失败:', error)
  } finally {
    adminLoading.value = false
  }
}

// 获取网格员OTP验证码（假设使用不同的API端点，如果相同请修改）
const getGridOTPCode = async () => {
  try {
    gridLoading.value = true
    // TODO: 修改为网格员的实际API端点
    const response = await request.get('/user/GridChangepermission')
    if (response.code === 200 && response.data) {
      gridOtpCode.value = response.data.code || response.data
      startGridCountdown()
    } else {
      throw new Error('获取验证码失败')
    }
  } catch (error) {
    ElMessage.error('获取网格员验证码失败')
    console.error('获取网格员验证码失败:', error)
  } finally {
    gridLoading.value = false
  }
}

// 复制验证码到剪贴板
const copyCode = (code) => {
  if (!code) return

  navigator.clipboard
    .writeText(code)
    .then(() => {
      ElMessage.success('验证码已复制到剪贴板')
    })
    .catch((err) => {
      ElMessage.error('复制失败')
      console.error('复制失败:', err)
    })
}

// 开始管理员倒计时
const startAdminCountdown = () => {
  if (adminCountdownTimer) {
    clearInterval(adminCountdownTimer)
  }

  adminRemainingTime.value = totalTime

  adminCountdownTimer = setInterval(() => {
    if (adminRemainingTime.value > 0) {
      adminRemainingTime.value--
    } else {
      adminOtpCode.value = '已过期'
      clearInterval(adminCountdownTimer)
    }
  }, 1000)
}

// 开始网格员倒计时
const startGridCountdown = () => {
  if (gridCountdownTimer) {
    clearInterval(gridCountdownTimer)
  }

  gridRemainingTime.value = totalTime

  gridCountdownTimer = setInterval(() => {
    if (gridRemainingTime.value > 0) {
      gridRemainingTime.value--
    } else {
      gridOtpCode.value = '已过期'
      clearInterval(gridCountdownTimer)
    }
  }, 1000)
}

// 组件加载时获取验证码
onMounted(() => {
  getAdminOTPCode()
  getGridOTPCode()
})

// 组件卸载时清除计时器
onUnmounted(() => {
  if (adminCountdownTimer) {
    clearInterval(adminCountdownTimer)
  }
  if (gridCountdownTimer) {
    clearInterval(gridCountdownTimer)
  }
})
</script>

<style scoped>
.otp-wrapper {
  display: flex;
  gap: 30px;
  flex-wrap: wrap;
}

.otp-code {
  padding: 25px;
  flex: 1;
  min-width: 400px;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.otp-code:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px 0 rgba(0, 0, 0, 0.15);
}

.code-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.code-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0, 0, 0, 0.03);
  padding: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.code {
  font-family: 'Courier New', monospace;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
  color: #409eff;
  word-break: break-all;
  max-width: 100%;
  overflow-wrap: break-word;
  flex: 1;
  min-width: 0;
}

.timer-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.timer-text {
  font-size: 14px;
  color: #606266;
  display: flex;
  justify-content: flex-end;
}

.button-group {
  margin-top: 10px;
  display: flex;
  justify-content: center;
}

:deep(.el-button) {
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: linear-gradient(45deg, #409eff, #60acff);
  border: none;
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(45deg, #60acff, #409eff);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

:deep(.el-button--primary:disabled) {
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

.copy-button {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #409eff;
}

.copy-button:hover {
  color: #66b1ff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.otp-code {
  animation: fadeIn 0.5s ease-out;
}

@media (max-width: 900px) {
  .otp-wrapper {
    flex-direction: column;
  }

  .otp-code {
    max-width: 100%;
  }
}
</style>
