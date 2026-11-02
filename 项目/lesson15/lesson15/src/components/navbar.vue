<template>
  <nav class="navbar">
    <div class="navbar-left">
      <router-link to="/" class="logo-link">
        <div class="logo">
          <div class="logo-icon"></div>
          <span class="logo-text">Nebula<span class="logo-highlight">Store</span></span>
        </div>
      </router-link>

      <div class="nav-links">
        <router-link to="/" class="nav-item">首页</router-link>
        <router-link to="/about" class="nav-item">关于我们</router-link>
        <router-link to="/freeGames" class="nav-item">免费开玩</router-link>
        <router-link to="/cart" class="nav-item">
          购物车
          <span v-if="cartStore.count > 0" class="cart-badge">{{ cartStore.count }}</span>
        </router-link>
        <router-link to="/orders" class="nav-item">订单</router-link>
        <router-link to="/library" class="nav-item">游戏库</router-link>
      </div>
    </div>

    <div class="navbar-right">
      <template v-if="userStore.isLoggedIn">
        <div class="user-profile">
          <router-link
            to="/profile"
            class="welcome-text"
            :aria-label="`${userStore.username} 的个人中心`"
            title="个人中心"
          >Hi, {{ userStore.username }}</router-link>
          
          <button 
            v-if="userStore.isAdmin" 
            class="btn-admin" 
            @click="router.push('/admin')"
          >
            控制台
          </button>
          
          <button class="btn-logout" @click="handleLogout">退出登录</button>
        </div>
      </template>

      <template v-else>
        <button class="btn-login" @click="goLogin">登录</button>
        <button class="btn-register" @click="goRegister">立即注册</button>
      </template>
    </div>
  </nav>
</template>

<script setup>
import { onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../stores/user";
import { useCartStore } from "../stores/cart";

const router = useRouter();
const userStore = useUserStore();
const cartStore = useCartStore();

// 登录后同步购物车件数；退出登录时清零
onMounted(() => {
  if (userStore.isLoggedIn) cartStore.refreshCount();
});
watch(() => userStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    cartStore.refreshCount();
  } else {
    cartStore.clear();
  }
});

const goLogin = () => {
  router.push("/login");
}
const goRegister = () => {
  router.push("/register");
}
const handleLogout = () => {
  userStore.logout();
  cartStore.clear();
  router.push("/login");
}
</script>

<style scoped>
/* ==================== 导航栏基础容器 ==================== */
.navbar {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  padding: 0 2rem;
  height: 68px;
  border-bottom: 1px solid rgba(243, 244, 246, 0.8);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
  position: sticky;
  top: 0;
  z-index: 100;
}

/* ==================== 左侧与 Logo ==================== */
.navbar-left {
  display: flex;
  align-items: center;
  gap: 3rem;
}

.logo-link {
  text-decoration: none;
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s ease;
}

.logo:hover {
  transform: translateY(-1px);
}

.logo-icon {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 0 12px rgba(118, 75, 162, 0.4);
}

.logo-text {
  font-size: 20px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.5px;
}

.logo-highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 800;
  margin-left: 2px;
}

/* ==================== 导航链接 ==================== */
.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-item {
  color: #6b7280;
  text-decoration: none !important;
  font-size: 14px;
  font-weight: 600;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s ease;
}

.nav-item:hover {
  color: #111827;
}

/* 购物车件数角标 */
.cart-badge {
  display: inline-block;
  min-width: 18px;
  height: 18px;
  line-height: 18px;
  padding: 0 5px;
  margin-left: 6px;
  border-radius: 9px;
  background-color: #111827;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  vertical-align: middle;
}

.nav-item.router-link-active {
  color: #111827 !important;
  font-weight: 700;
}

.nav-item.router-link-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background-color: #111827;
  border-radius: 50%;
}

/* ==================== 右侧操作区 ==================== */
.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-login,
.btn-register,
.btn-logout,
.btn-admin {
  padding: 0 1.25rem;
  height: 38px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-login {
  background: transparent;
  color: #4b5563;
}

.btn-login:hover {
  background: #f3f4f6;
  color: #111827;
}

.btn-register {
  background: #111827;
  color: white;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.15);
}

.btn-register:hover {
  background: #374151;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.2);
}

/* 管理员控制台按钮 */
.btn-admin {
  background: #111827;
  color: white;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.15);
}

.btn-admin:hover {
  background: #374151;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.2);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome-text {
  color: #111827;
  font-weight: 700;
  font-size: 14px;
  text-decoration: none;
  padding: 8px 10px;
  margin: 0 -10px;
  border-radius: 8px;
  transition: background-color 0.2s, color 0.2s;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.welcome-text:hover,
.welcome-text.router-link-active {
  color: #764ba2;
  background: #f3effa;
}

.welcome-text:focus-visible {
  outline: 2px solid #764ba2;
  outline-offset: 3px;
}

.btn-logout {
  background: #f3f4f6;
  color: #4b5563;
}

.btn-logout:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* ==================== 响应式适配 ==================== */
@media (max-width: 768px) {
  .navbar {
    padding: 0 1.2rem;
    height: 60px;
  }

  .navbar-left {
    gap: 1.5rem;
  }

  .nav-links {
    display: none;
  }

  .logo-text {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .navbar { padding: 0 12px; }
  .logo-text { font-size: 16px; }
  .user-profile { gap: 10px; }
  .welcome-text { max-width: 92px; font-size: 12px; padding: 7px 5px; margin: 0 -5px; }
  .btn-admin, .btn-logout { padding: 0 8px; height: 34px; font-size: 12px; }
}
</style>
