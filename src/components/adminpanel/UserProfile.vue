<template>
  <div class="user-profile">
    <!-- 个人信息展示卡片 -->
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-section">
          <el-avatar :size="120" :src="userInfo.avatar" class="profile-avatar">
            <img src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png" />
          </el-avatar>
          <div class="permission-badge" :class="permissionClass">
            {{ permissionText }}
          </div>
        </div>
        <div class="user-details">
          <h2 class="username">{{ userInfo.username }}</h2>
          <div class="info-item">
            <el-icon><Phone /></el-icon>
            <span>{{ userInfo.phone }}</span>
          </div>
          <div class="info-item">
            <el-icon><Key /></el-icon>
            <span>权限等级: {{ userInfo.permission_level }}</span>
          </div>
        </div>
      </div>
      <div class="profile-actions">
        <el-button type="primary" @click="showEditDialog">
          <el-icon><Edit /></el-icon>
          修改个人信息
        </el-button>
      </div>
    </div>

    <!-- 编辑个人信息对话框 -->
    <el-dialog v-model="dialogVisible" title="修改个人信息" width="600px" lock-scroll>
      <el-form :model="editForm" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>

        <el-form-item label="新密码" prop="password">
          <el-input
            v-model="editForm.password"
            type="password"
            placeholder="不修改密码请留空"
            show-password
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="editForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>

        <el-form-item label="头像">
          <div class="avatar-upload">
            <el-upload
              class="avatar-uploader"
              :auto-upload="false"
              :show-file-list="false"
              :on-change="handleAvatarChange"
              accept="image/*"
            >
              <img v-if="editForm.avatar" :src="editForm.avatar" class="uploaded-avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="upload-tip">点击上传新头像 (支持 JPG、PNG、WEBP 格式，不超过 5MB)</div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveProfile" :loading="loading"> 保存修改 </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Phone, Key, Edit, Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import request from '../../logic/register.js'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)
const dialogVisible = ref(false)

const userInfo = ref({
  id: null,
  openid: '',
  username: '',
  phone: '',
  avatar: '',
  permission_level: 1,
})

const editForm = ref({
  username: '',
  phone: '',
  password: '',
  confirmPassword: '',
  avatar: '',
})

// 权限等级显示
const permissionText = computed(() => {
  return userInfo.value.permission_level === 2 ? '超级管理员' : '管理员'
})

const permissionClass = computed(() => {
  return userInfo.value.permission_level === 2 ? 'super-admin' : 'admin'
})

// 表单验证规则
const validatePassword = (rule, value, callback) => {
  if (value && value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (editForm.value.password && value !== editForm.value.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' },
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ validator: validatePassword, trigger: 'blur' }],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }],
}

// 获取用户信息
const getUserInfo = async () => {
  try {
    loading.value = true
    const response = await request.get('/user/UserInfo')

    if (response.code === 200 && response.data && response.data.length > 0) {
      userInfo.value = response.data[0]
    }
  } catch (error) {
    ElMessage.error('获取用户信息失败')
    console.error('获取用户信息失败:', error)
    if (error.response && error.response.status === 401) {
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

// 显示编辑对话框
const showEditDialog = () => {
  editForm.value = {
    username: userInfo.value.username,
    phone: userInfo.value.phone,
    password: '',
    confirmPassword: '',
    avatar: userInfo.value.avatar,
  }
  dialogVisible.value = true
}

// 头像选择处理
const handleAvatarChange = async (file) => {
  const rawFile = file.raw

  // 验证文件
  const isImage = rawFile.type.startsWith('image/')
  const isLt2M = rawFile.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 5MB!')
    return
  }

  // 上传文件
  try {
    const formData = new FormData()
    formData.append('file', rawFile)

    const response = await request.post('/user/upload_image', formData)

    if (response.code === 200 && response.data.path) {
      // 构建完整的图片URL，移除末尾的 /api
      let baseURL = import.meta.env.VITE_API_BASE_URL || ''
      baseURL = baseURL.replace(/\/api$/, '')
      editForm.value.avatar = baseURL + response.data.path
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error('头像上传失败')
    }
  } catch (error) {
    ElMessage.error('头像上传失败')
    console.error('头像上传失败:', error)
  }
}

// 保存个人信息
const saveProfile = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      const updateData = {
        username: editForm.value.username,
        phone: editForm.value.phone,
        avatar: editForm.value.avatar,
      }

      // 如果有输入密码，则包含密码字段
      if (editForm.value.password) {
        updateData.password = editForm.value.password
      }

      await request.put('/user/Adminlist', updateData)

      ElMessage.success('个人信息修改成功')
      dialogVisible.value = false
      await getUserInfo() // 刷新用户信息
    } catch (error) {
      ElMessage.error('修改失败')
      console.error('修改失败:', error)
    } finally {
      loading.value = false
    }
  })
}

// 组件挂载时获取用户信息
onMounted(() => {
  getUserInfo()
})
</script>

<style scoped>
.user-profile {
  padding: 25px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.05);
  animation: fadeIn 0.5s ease-out;
  height: 80vh;
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

.profile-card {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.profile-card:hover {
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 40px;
  margin-bottom: 30px;
}

.avatar-section {
  position: relative;
}

.profile-avatar {
  border: 4px solid #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.permission-badge {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.permission-badge.admin {
  background: linear-gradient(45deg, #409eff, #60acff);
}

.permission-badge.super-admin {
  background: linear-gradient(45deg, #f56c6c, #ff7875);
}

.user-details {
  flex: 1;
}

.username {
  font-size: 28px;
  font-weight: 700;
  color: #333;
  margin: 0 0 20px 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #666;
  font-size: 15px;
  margin-bottom: 12px;
}

.info-item .el-icon {
  color: #409eff;
  font-size: 18px;
}

.profile-actions {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

:deep(.el-button) {
  border-radius: 8px;
  padding: 12px 32px;
  font-weight: 500;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

:deep(.el-button--primary) {
  background: linear-gradient(45deg, #409eff, #60acff);
  border: none;
}

:deep(.el-button--primary:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 弹窗样式 */
:deep(.el-dialog) {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid #eee;
  margin-top: 10vh !important;
}

:deep(.el-dialog__title) {
  color: #333333;
  font-size: 18px;
  font-weight: 600;
}

:deep(.el-dialog__header) {
  border-bottom: 1px solid #eee;
  padding: 20px 24px;
  margin: 0;
}

:deep(.el-dialog__body) {
  padding: 24px;
  color: #333333;
}

:deep(.el-form-item__label) {
  color: #333333;
  font-weight: 500;
}

:deep(.el-input__inner) {
  color: #333333 !important;
  background-color: #ffffff !important;
  border-color: #dcdfe6 !important;
  border-radius: 6px;
}

:deep(.el-input__inner:focus) {
  border-color: #409eff !important;
}

:deep(.el-input__inner::placeholder) {
  color: #909399;
}

/* 头像上传 */
.avatar-upload {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.avatar-uploader {
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  width: 150px;
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader:hover {
  border-color: #409eff;
}

.uploaded-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #eee;
  padding-top: 20px;
}
</style>
