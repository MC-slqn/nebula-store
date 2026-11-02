<template>
  <div class="auth-container">
    <div class="auth-card">
      <div class="auth-header">
        <h1 class="auth-title">加入我们</h1>
        <p class="auth-subtitle">开启您的数字游戏之旅</p>
      </div>

      <!-- 移除了生硬的 label，采用统一 placeholder 风格 -->
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleRegister" class="auth-form">
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名" 
            clearable 
            :prefix-icon="User"
            class="custom-input"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请设置密码" 
            show-password 
            :prefix-icon="Lock"
            class="custom-input"
          />
        </el-form-item>

        <el-form-item prop="confirmPassword">
          <el-input 
            v-model="form.confirmPassword" 
            type="password" 
            placeholder="请确认密码" 
            show-password 
            :prefix-icon="Lock"
            class="custom-input"
          />
        </el-form-item>

        <el-form-item prop="phone">
          <el-input 
            v-model="form.phone" 
            placeholder="请输入手机号码" 
            clearable 
            :prefix-icon="Iphone"
            class="custom-input"
          />
        </el-form-item>

        <el-form-item>
          <el-button native-type="submit" class="submit-btn" :loading="loading">
            立即注册
          </el-button>
        </el-form-item>

        <div class="switch-link">
          已有账号？
          <el-link class="highlight-link" :underline="false" @click="router.push('/login')">
            返回登录 &rarr;
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
import request from '../utils/request'
import { User, Lock, Iphone } from '@element-plus/icons-vue' // 引入精美图标

const router = useRouter();
const formRef = ref(null);
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: ''
})

// 表单校验规则：此前完全没有校验（两次密码不一致、手机号格式错都能注册成功）
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度需在 2~20 个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度需在 6~20 个字符之间', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [
    { required: true, message: '请输入手机号码', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  // 先做前端校验，不通过就不发请求
  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  loading.value = true;
  try {
    const result = await request.post('/register', {
      username: form.username,
      password: form.password,
      confirmPassword: form.confirmPassword,
      phone: form.phone
    }, {
      headers: { Authorization: null } 
    });
    if(result.code == 200) {
      ElMessage.success('注册成功！');
      router.push('/login');
    } else {
      ElMessage.error(result.message || '注册失败');
    }
  } catch (error) {
    console.error('注册失败:', error)
    ElMessage.error('注册失败，请稍后再试')
  } finally {
    loading.value = false;
  }
}
</script>

<style lang="scss" scoped>
/* 样式与 Login 页保持绝对的视觉统一 */
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
  margin-bottom: 36px;

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

.auth-form {
  .el-form-item {
    margin-bottom: 20px;
  }
}

/* ==================== 极简组件穿透样式 ==================== */
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

/* 高级黑按钮 */
.submit-btn {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  background-color: #111827 !important;
  border: none !important;
  color: #ffffff !important;
  font-size: 16px;
  font-weight: 600;
  margin-top: 12px;
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