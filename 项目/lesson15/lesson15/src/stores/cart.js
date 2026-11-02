
// stores/cart.js
// 购物车数量的单一数据源：加购/删除后刷新它，导航栏角标与页面就能保持同步
import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '../utils/request'

export const useCartStore = defineStore('cart', () => {
    // 购物车内商品总件数
    const count = ref(0)

    // 从后端重新计算件数（未登录或接口异常时静默处理，避免干扰页面）
    const refreshCount = async () => {
        const token = localStorage.getItem('token')
        if (!token) {
            count.value = 0
            return 0
        }
        try {
            const result = await request.get('/shopcartList')
            if (result.code === 200 && Array.isArray(result.data)) {
                count.value = result.data.reduce((sum, item) => sum + Number(item.num || 0), 0)
            } else {
                count.value = 0
            }
        } catch (err) {
            count.value = 0
        }
        return count.value
    }

    const clear = () => {
        count.value = 0
    }

    return { count, refreshCount, clear }
})
