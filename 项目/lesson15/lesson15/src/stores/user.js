
// stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

//注意：这里的user是唯一的
export const useUserStore = defineStore('user', () => {
    // 1.State - 状态
    const token = ref(localStorage.getItem('token') || '')
    const username = ref(localStorage.getItem('username') || '')
    // 角色：'1' 表示管理员，'0' 表示普通用户（由登录接口返回）
    const role = ref(localStorage.getItem('role') || '0')
    // token 过期时间（秒级时间戳，由登录接口返回）
    const exp = ref(Number(localStorage.getItem('exp')) || 0)

    // 2.Getters - 计算属性
    // token 是否已过期（没有 exp 信息时视为未过期，交给后端 401 兜底）
    const isExpired = computed(() => {
        if (!exp.value) return false
        return Date.now() / 1000 >= exp.value
    })
    // !!token.value 将token转换为布尔值，如果token存在，则返回true，否则返回false
    const isLoggedIn = computed(() => !!token.value && !isExpired.value)
    // 是否管理员：改由后端返回的 role 决定，不再硬编码判断用户名
    const isAdmin = computed(() => String(role.value) === '1')

    // 3.Actions - 方法
    // 登录
    const login = (newToken, newUsername, newRole = '0', newExp = 0) => {
        token.value = newToken
        username.value = newUsername
        role.value = String(newRole)
        exp.value = Number(newExp) || 0

        // 同步到 localStorage
        localStorage.setItem('token', newToken)
        localStorage.setItem('username', newUsername)
        localStorage.setItem('role', String(newRole))
        localStorage.setItem('exp', String(exp.value))
    }

    // 同步个人资料，不重新签发或延长当前登录状态。
    const updateProfile = (profile) => {
        if (typeof profile.username === 'string') {
            username.value = profile.username
            localStorage.setItem('username', profile.username)
        }
        if (profile.role != null) {
            role.value = String(profile.role)
            localStorage.setItem('role', role.value)
        }
    }

    // 退出
    const logout = () => {
        token.value = ''
        username.value = ''
        role.value = '0'
        exp.value = 0

        localStorage.removeItem('token')
        localStorage.removeItem('username')
        localStorage.removeItem('role')
        localStorage.removeItem('exp')
    }

    //所有的状态、计算属性、方法都返回出去
    return {
        token,
        username,
        role,
        exp,
        isLoggedIn,
        isAdmin,
        isExpired,
        login,
        updateProfile,
        logout,
    }
})
