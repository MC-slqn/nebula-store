import { createRouter, createWebHistory } from 'vue-router'

// 1. 定义路由表：URL 与组件的映射关系
const routes = [{ path: '/library', component: () => import('../views/library.vue') },{
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/profile.vue'),
}, {
    //首页
    path: '/',
    alias: '/home',
    name: 'Home',
    component: () =>
        import('../views/home.vue'),
},
{
    //关于我们
    path: '/about',
    name: 'About',
    component: () =>
        import('../views/about.vue'),
},
{
    //免费开玩
    path: '/freeGames',
    name: 'freegames',
    component: () =>
        import('../views/freeGames.vue'),
},
{
    //登录
    path: '/login',
    name: 'Login',
    component: () =>
        import('../views/login.vue'),
},
{
    //注册
    path: '/register',
    name: 'Regitser',
    component: () =>
        import('../views/register.vue'),
},
{
    //详情
    path: '/detail/:goodId',
    name: 'Detail',
    component: () =>
        import('../views/detail.vue'),
},
{
    //购物车
    path: '/cart',
    name: 'Cart',
    component: () =>
        import('../views/cart.vue'),
},
{
    //订单列表
    path: '/orders',
    name: 'Orders',
    component: () =>
        import('../views/orders.vue'),
},
{
    //订单详情
    path: '/order/:orderId',
    name: 'Order',
    component: () =>
        import('../views/order.vue'),
},
{
    // 后台管理面板
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/admin.vue'),
},




]
// 2. 创建路由实例
const router = createRouter({
    history: createWebHistory(),
    routes
})

// 3. 导出路由实例
export default router

// 导航守卫
router.beforeEach((to, from) => {
    const token = localStorage.getItem('token')
    const exp = Number(localStorage.getItem('exp')) || 0
    // token 存在且未过期才算已登录（以前只判断 token 是否存在，过期了也放行）
    const expired = exp > 0 && Date.now() / 1000 >= exp
    const isLogin = !!token && token !== '' && !expired

    // 商品浏览接口是公开的；购物车、订单、个人中心和后台需要登录。
    // 之前把首页/详情页也拦截，会导致游客根本无法浏览商品。
    const needsLogin = ['/cart', '/orders', '/admin', '/library', '/profile'].includes(to.path) || to.path.startsWith('/order/')
    if (!needsLogin) {
        return true
    }
    if (!isLogin) {
        // 过期/无 token 时清理本地登录信息，避免 401 反复触发
        if (expired) {
            localStorage.removeItem('token')
            localStorage.removeItem('username')
            localStorage.removeItem('role')
            localStorage.removeItem('exp')
        }
        alert(expired ? '登录已过期，请重新登录' : '请先登录后再访问')
        return '/login'
    }

    // 后台页面只允许管理员进入（后端也会校验，这里避免普通用户白跑一趟看到报错）
    if (to.path === '/admin' && String(localStorage.getItem('role') || '0') !== '1') {
        alert('无权限：仅管理员可访问后台管理')
        return '/'
    }
    return true
})
