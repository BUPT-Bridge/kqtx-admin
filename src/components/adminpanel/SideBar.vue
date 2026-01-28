<template>
  <el-menu
    class="sidebar-menu"
    :default-active="activeIndex"
    background-color="#545c64"
    text-color="#fff"
    active-text-color="#ffd04b"
    :router="true"
  >
    <el-menu-item-group index="1">
      <el-menu-item index="/panel/basic">
        <el-icon>
          <UserFilled />
        </el-icon>
        <span>基本信息</span>
      </el-menu-item>
    </el-menu-item-group>

    <el-menu-item-group index="2">
      <el-menu-item index="/panel/show">
        <el-icon>
          <Picture />
        </el-icon>
        <span>社区风采</span>
      </el-menu-item>
    </el-menu-item-group>

    <el-menu-item-group index="3">
      <el-menu-item index="/panel/history">
        <el-icon>
          <Document />
        </el-icon>
        <span>历史记录</span>
      </el-menu-item>
    </el-menu-item-group>

    <el-menu-item-group index="4">
      <el-menu-item index="/panel/table">
        <el-icon>
          <DataBoard />
        </el-icon>
        <span>表单处理</span>
      </el-menu-item>
    </el-menu-item-group>

    <el-menu-item-group index="5">
      <el-menu-item index="/panel/report">
        <el-icon>
          <Setting />
        </el-icon>
        <span>报告生成</span>
      </el-menu-item>
    </el-menu-item-group>

    <!-- 返回Dashboard按钮 -->
    <div class="back-button-container">
      <el-menu-item index="/dashboard">
        <el-icon>
          <Back />
        </el-icon>
        <span>返回数据大屏</span>
      </el-menu-item>
    </div>
  </el-menu>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { UserFilled, Picture, Setting, Document, Back, DataBoard } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

import { request } from '@/logic/register'

const router = useRouter()
const activeIndex = ref('/panel/basic')
let authCheckInterval = null

const checkAuth = async () => {
  try {
    const res = await request.get('/user/UserInfo')
    if (res.code !== 200) {
      throw new Error('权限验证失败')
    }
  } catch (error) {
    console.error('权限验证失败:', error)
    router.push('/')
  }
}

onMounted(() => {
  checkAuth() // 初始检查
  authCheckInterval = setInterval(checkAuth, 5000) // 每5秒检查一次
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (authCheckInterval) {
    clearInterval(authCheckInterval)
  }
})
</script>

<style scoped>
.sidebar-menu {
  height: 100vh;
  width: 200px;
  background: rgba(20, 29, 47, 0.9) !important;
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-menu::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, rgba(0, 150, 255, 0.05) 0%, rgba(0, 0, 0, 0) 100%);
  pointer-events: none;
  z-index: -1;
}

.el-menu {
  border-right: none;
  background-color: transparent !important;
}

.el-menu-item {
  margin: 8px 0;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.el-menu-item:hover {
  background: rgba(255, 255, 255, 0.05) !important;
  transform: translateX(5px);
}

.el-menu-item.is-active {
  background: rgba(255, 255, 255, 0.1) !important;
  border-right: 3px solid #409eff;
}

.el-menu-item .el-icon {
  margin-right: 12px;
  font-size: 18px;
  transition: all 0.3s ease;
}

.el-menu-item:hover .el-icon {
  transform: scale(1.1);
  color: #409eff;
}

.el-menu-item span {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.back-button-container {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  width: calc(100% - 20px);
  margin: 0 10px;
}

.back-button-container .el-menu-item {
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px 0 !important;
  margin: 10px 0 0 0 !important;
  background-color: rgba(0, 0, 0, 0.2);
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
  text-align: center;
  height: auto !important;
  line-height: normal !important;
}

.back-button-container .el-menu-item:hover {
  background: rgba(255, 255, 255, 0.1) !important;
  transform: translateX(0) !important;
}

.back-button-container .el-icon {
  color: #f56c6c;
  margin-right: 8px;
  margin-left: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
}

.back-button-container .el-menu-item span {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin: 0;
}
</style>
