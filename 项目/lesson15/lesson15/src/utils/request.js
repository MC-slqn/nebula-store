import axios from 'axios'

// 创建实例
const request = axios.create({
    baseURL: '/api', // 所有请求自动加上api前缀
    timeout: 10000
})

// 请求拦截器（发送请求自动携带token）
request.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    const publicURL = /^\/(login|register|goodsList|category|bannerList|goodsDetails)(\/|$|\?)/.test(config.url || '')
    if (publicURL) delete config.headers.Authorization
    if (token && !publicURL) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 响应拦截器（统一处理错误）
request.interceptors.response.use(
    response => response.data,
    error => {
        const status = error.response && error.response.status
        const body = (error.response && error.response.data) || {}

        // 401：登录态失效（后端已改为返回真正的 HTTP 401）。清理本地登录信息并回到登录页，
        // 避免用户停留在页面上看到"空白/无数据"却不知道原因。
        if (status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('username')
            localStorage.removeItem('role')
            localStorage.removeItem('exp')
            if (!window.location.pathname.startsWith('/login')) {
                window.location.href = '/login'
            }
        }

        // 把后端返回的业务提示透出给调用方，页面 catch 里能直接显示
        const message = body.message || error.message || '请求失败'
        const wrapped = new Error(message)
        wrapped.code = body.code || status
        wrapped.status = status
        return Promise.reject(wrapped)
    }
)

export default request