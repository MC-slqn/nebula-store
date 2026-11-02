<template>
  <main class="profile-page">
    <header class="page-heading"><span class="eyebrow">MY ACCOUNT</span><h1>个人中心</h1><p>管理个人资料，守护你的星云账号。</p></header>
    <div v-if="loadError" class="error-card"><p>{{ loadError }}</p><el-button @click="loadProfile">重新加载</el-button></div>
    <div v-else class="profile-layout" v-loading="loading">
      <aside>
        <section class="identity-card">
          <div class="avatar">{{ (profile.username || userStore.username || 'N').slice(0, 1).toUpperCase() }}</div>
          <h2>{{ profile.username || userStore.username }}</h2>
          <span class="role-badge">{{ String(profile.role) === '1' ? '管理员' : '星云用户' }}</span>
          <div class="account-meta"><span>账号 ID</span><strong>#{{ profile.u_id || '—' }}</strong></div>
          <div class="account-meta"><span>账号状态</span><strong class="active-state">正常使用中</strong></div>
        </section>
        <section class="shortcut-card"><h3>我的空间</h3><router-link to="/orders"><span>我的订单</span><span>↗</span></router-link><router-link to="/library"><span>我的游戏库</span><span>↗</span></router-link></section>
      </aside>
      <div class="settings-stack">
        <section class="settings-card">
          <div class="section-heading"><span class="section-icon"><el-icon><User /></el-icon></span><div><h2>基本资料</h2><p>让我们更好地认识你</p></div></div>
          <el-form ref="infoRef" :model="info" :rules="infoRules" label-position="top" :disabled="loading || saving">
            <div class="form-grid"><el-form-item label="用户名" prop="username"><el-input v-model="info.username" maxlength="20" autocomplete="username" placeholder="输入用户名" /></el-form-item><el-form-item label="手机号码" prop="phone"><el-input v-model="info.phone" maxlength="11" autocomplete="tel" inputmode="tel" placeholder="输入手机号码" /></el-form-item></div>
            <p class="field-note">用户名将用于登录，也会显示在页面右上角。</p>
            <div class="form-footer"><el-button :disabled="!infoChanged" @click="resetInfo">重置</el-button><el-button class="primary-action" :loading="saving" :disabled="!infoChanged" @click="saveInfo">保存修改</el-button></div>
          </el-form>
        </section>
        <section class="settings-card">
          <div class="section-heading"><span class="section-icon"><el-icon><Lock /></el-icon></span><div><h2>账号安全</h2><p>定期更新密码，让账号更安心</p></div></div>
          <el-form ref="passwordRef" :model="password" :rules="passwordRules" label-position="top" :disabled="loading || changingPassword">
            <el-form-item label="当前密码" prop="currentPassword"><el-input v-model="password.currentPassword" type="password" show-password autocomplete="current-password" placeholder="请输入当前密码" /></el-form-item>
            <div class="form-grid"><el-form-item label="新密码" prop="newPassword"><el-input v-model="password.newPassword" type="password" show-password maxlength="20" autocomplete="new-password" placeholder="设置 6–20 位新密码" /></el-form-item><el-form-item label="确认新密码" prop="confirmPassword"><el-input v-model="password.confirmPassword" type="password" show-password maxlength="20" autocomplete="new-password" placeholder="再次输入新密码" /></el-form-item></div>
            <div class="security-note"><el-icon><Lock /></el-icon><span>密码修改成功后，所有设备都需要重新登录。</span></div>
            <div class="form-footer"><el-button class="primary-action" :loading="changingPassword" @click="changePassword">更新密码</el-button></div>
          </el-form>
        </section>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import request from '../utils/request'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'
const userStore = useUserStore(), cartStore = useCartStore(), router = useRouter()
const profile = reactive({}), info = reactive({ username: '', phone: '' })
const password = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(true), saving = ref(false), changingPassword = ref(false), loadError = ref('')
const infoRef = ref(), passwordRef = ref()
const infoChanged = computed(() => info.username.trim() !== profile.username || info.phone.trim() !== profile.phone)
const infoRules = {
  username: [{ validator: (_, value, done) => done(/^\S{2,20}$/u.test(value.trim()) ? undefined : new Error('用户名需为 2–20 个非空白字符')), trigger: 'blur' }],
  phone: [{ validator: (_, value, done) => done(/^1[3-9]\d{9}$/.test(value.trim()) ? undefined : new Error('请输入正确的手机号码')), trigger: 'blur' }]
}
const passwordRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ validator: (_, value, done) => done(value.length < 6 || value.length > 20 ? new Error('新密码需要 6–20 个字符') : value === password.currentPassword ? new Error('新密码不能与当前密码相同') : undefined), trigger: 'blur' }],
  confirmPassword: [{ validator: (_, value, done) => done(!value || value !== password.newPassword ? new Error('两次新密码不一致') : undefined), trigger: 'blur' }]
}
function resetInfo() { Object.assign(info, { username: profile.username || '', phone: profile.phone || '' }); infoRef.value?.clearValidate() }
async function loadProfile() {
  loading.value = true; loadError.value = ''
  try {
    const result = await request.get('/profile')
    if (result.code !== 200) throw new Error(result.message)
    Object.assign(profile, result.data); resetInfo(); userStore.updateProfile(result.data)
  } catch (error) { loadError.value = error.message || '个人资料加载失败，请重试' }
  finally { loading.value = false }
}
async function saveInfo() {
  if (saving.value || loading.value || !infoChanged.value) return
  if (!await infoRef.value.validate().catch(() => false)) return
  saving.value = true
  try {
    const result = await request.post('/profile', { username: info.username.trim(), phone: info.phone.trim() })
    if (result.code !== 200) throw new Error(result.message)
    Object.assign(profile, result.data); resetInfo(); userStore.updateProfile(result.data); ElMessage.success('个人资料已保存')
  } catch (error) { ElMessage.error(error.message || '保存失败，请重试') }
  finally { saving.value = false }
}
async function changePassword() {
  if (changingPassword.value || loading.value) return
  if (!await passwordRef.value.validate().catch(() => false)) return
  changingPassword.value = true
  try {
    const result = await request.post('/changePassword', { ...password })
    if (result.code !== 200) throw new Error(result.message)
    Object.assign(password, { currentPassword: '', newPassword: '', confirmPassword: '' })
    userStore.logout(); cartStore.clear(); ElMessage.success('密码已更新，请重新登录'); router.replace('/login')
  } catch (error) { ElMessage.error(error.message || '密码修改失败') }
  finally { changingPassword.value = false }
}
onMounted(loadProfile)
</script>

<style scoped>
.profile-page { max-width: 1120px; margin: 0 auto; padding: 42px 28px 64px; color: #172033; }
.profile-page h1, .profile-page h2 { color: #172033; font-weight: 700; }
.page-heading { margin-bottom: 30px; }.eyebrow { font-size: 11px; letter-spacing: 2.4px; color: #8670c5; font-weight: 700; }
.page-heading h1 { font-size: 30px; margin: 8px 0 9px; letter-spacing: -1px; }.page-heading p { color: #8992a4; font-size: 14px; margin: 0; }
.profile-layout { display: grid; grid-template-columns: 270px minmax(0,1fr); gap: 26px; }.identity-card,.shortcut-card,.settings-card,.error-card { background: white; border: 1px solid #edf0f6; border-radius: 18px; box-shadow: 0 8px 30px rgba(32,42,72,.035); }
.identity-card { padding: 32px 24px 22px; text-align: center; background: linear-gradient(155deg,#f2efff 0%,#fff 48%); }.avatar { display: grid; place-items: center; width: 76px; height: 76px; margin: 0 auto 16px; border-radius: 24px; background: linear-gradient(135deg,#7c88eb,#9362b7); box-shadow: 0 10px 24px #8070bb30; color: white; font-size: 32px; font-weight: 700; }
.identity-card h2 { margin: 0 0 10px; font-size: 21px; overflow-wrap: anywhere; }.role-badge { display: inline-block; color: #8870b7; background: #f1edf9; font-size: 12px; padding: 5px 12px; border-radius: 20px; margin-bottom: 26px; }.account-meta { display: flex; justify-content: space-between; padding: 14px 0; border-top: 1px solid #f2f3f7; font-size: 12px; }.account-meta span { color: #8c95a5; }.account-meta strong { font-weight: 500; }.active-state { color: #299979; }
.shortcut-card { padding: 22px 24px; margin-top: 20px; }.shortcut-card h3 { font-size: 14px; margin: 0 0 12px; }.shortcut-card a { display: flex; justify-content: space-between; text-decoration: none; color: #6b7385; font-size: 13px; padding: 12px 0; }.shortcut-card a:hover { color: #8065c0; }
.settings-stack { display: grid; gap: 22px; }.settings-card { padding: 26px 30px 24px; }.section-heading { display: flex; gap: 13px; align-items: center; margin-bottom: 25px; }.section-icon { width: 42px; height: 42px; display: grid; place-items: center; color: #8a70c3; background: #f3effb; border-radius: 13px; font-size: 20px; }.section-heading h2 { margin: 0 0 5px; font-size: 17px; }.section-heading p { margin: 0; font-size: 12px; color: #9199aa; }.form-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px; }
.field-note { margin: -5px 0 19px; color: #99a1af; font-size: 12px; }.form-footer { display: flex; justify-content: flex-end; gap: 10px; padding-top: 17px; border-top: 1px solid #f1f3f7; }.form-footer .el-button { margin-left: 0; border-radius: 10px; height: 39px; padding: 0 22px; }.primary-action { background: #182131; color: #fff; border-color: #182131; }.primary-action:hover { background: #303c50; border-color: #303c50; color: #fff; }.primary-action.is-disabled { background: #d0d4dd; border-color: #d0d4dd; color: white; }.security-note { display: flex; align-items: center; gap: 8px; background: #f7f5fc; padding: 11px 13px; border-radius: 9px; color: #8c80a5; font-size: 12px; margin-bottom: 18px; }
:deep(.el-input__wrapper) { min-height: 40px; border-radius: 9px; background: #fcfcfe; box-shadow: 0 0 0 1px #e9ecf3 inset; }:deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px #9380d1 inset; }:deep(.el-form-item__label) { font-size: 13px; color: #5c6475; }.error-card { padding: 32px; }
@media(max-width:760px) { .profile-page { padding: 28px 16px; }.profile-layout { grid-template-columns: 1fr; }.identity-card { padding-top: 24px; }.shortcut-card { display: none; }.settings-card { padding: 22px 20px; }.form-grid { grid-template-columns: 1fr; gap: 0; } }
</style>
