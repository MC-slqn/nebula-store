<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">欢迎回来</h1>
        <p class="auth-subtitle">登录您的账号，发现更多精选游戏</p>
      </div>

      <el-form :model="form" @submit.prevent="handleLogin" class="auth-form">
        <el-form-item>
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名" 
            clearable 
            :prefix-icon="User"
            class="custom-input"
          />
        </el-form-item>

        <el-form-item>
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password 
            :prefix-icon="Lock"
            class="custom-input"
          />
        </el-form-item>

        <div class="form-actions-row">
          <el-checkbox v-model="form.remember" class="custom-checkbox">保持登录状态</el-checkbox>
          </div>

        <el-form-item>
          <el-button native-type="submit" class="submit-btn" :loading="loading">
            立即登录
          </el-button>
        </el-form-item>

        <div class="switch-link">
          还没有账号？
          <el-link class="highlight-link" :underline="false" @click="router.push('/register')">
            立即注册 &rarr;
          </el-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'
import request from '../utils/request'
import { User, Lock } from '@element-plus/icons-vue' 

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false) 

const form = reactive({
  username: '',
  password: '',
  remember: false,
})

const handleLogin = async () => {
  if (!form.username || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  loading.value = true
  try {
    // request.js 已经做了 response => response.data 处理，这里拿到的就是后端返回的真实数据体
    const resData = await request.post('/login', {
      username: form.username,
      password: form.password,
      remember: form.remember,
    })

    // 后端返回结构固定为 { code, message, data: { token, username, role } }
    const payload = resData?.data || resData
    const token = payload?.token

    // 必须真正拿到 token 才算登录成功，避免写入无效 token 后所有请求都失败却查不出原因
    if (resData?.code === 200 && token) {
      ElMessage.success('登录成功')

      // 提取用户名/角色/过期时间（后端统一返回 { token, username, role, exp }）
      const username = payload.username || form.username
      const role = payload.role || '0'
      const exp = payload.exp || 0

      // 调用 user.js 中的 login 方法
      userStore.login(token, username, role, exp)
      // 同步购物车件数（导航栏角标）
      const cartStore = useCartStore()
      cartStore.refreshCount()
      router.push('/home')
    } else {
      // 业务报错（比如密码错误），抛出后端的错误提示信息
      throw new Error(resData?.message || '账号或密码错误')
    }
  } catch (error) {
    // 统一捕获网络异常和手动抛出的密码错误
    ElMessage.error(error?.message || '登录失败，请检查网络或账号密码')
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #fcfcfd;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  padding: 20px;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  background: #ffffff;
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(243, 244, 246, 0.8);
}

.auth-header {
  text-align: center;
  margin-bottom: 40px;

  .auth-title {
    font-size: 32px;
    font-weight: 800;
    color: #111827;
    margin: 0 0 12px 0;
    letter-spacing: -0.5px;
  }

  .auth-subtitle {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
    font-weight: 500;
  }
}

.form-actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  margin-top: -8px;
}

:deep(.custom-input .el-input__wrapper) {
  background-color: #f9fafb;
  box-shadow: none !important;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0 16px;
  height: 52px;
  transition: all 0.2s ease;
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  background-color: #ffffff;
  border-color: #111827;
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.05) !important;
}

:deep(.custom-input .el-input__inner) {
  font-size: 15px;
  color: #111827;
  &::placeholder {
    color: #9ca3af;
  }
}

:deep(.custom-input .el-input__prefix-inner) {
  font-size: 18px;
  color: #9ca3af;
}

:deep(.custom-checkbox .el-checkbox__label) {
  color: #4b5563;
  font-weight: 500;
}

:deep(.custom-checkbox.is-checked .el-checkbox__label) {
  color: #111827;
}

:deep(.custom-checkbox .el-checkbox__inner) {
  border-radius: 4px;
  border-color: #d1d5db;
}

:deep(.custom-checkbox.is-checked .el-checkbox__inner) {
  background-color: #111827;
  border-color: #111827;
}

.submit-btn {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  background-color: #111827 !important;
  border: none !important;
  color: #ffffff !important;
  font-size: 16px;
  font-weight: 600;
  margin-top: 8px;
  transition: all 0.3s ease;

  &:hover {
    background-color: #374151 !important;
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(17, 24, 39, 0.2);
  }
}

.switch-link {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;

  .highlight-link {
    color: #111827 !important;
    font-weight: 700;
    margin-left: 4px;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }
}
</style>