import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        proxy: {
            '/api': { // 匹配所有以 /api 开头的请求
                target: 'http://localhost:3000', // 后端IP地址
                changeOrigin: true, //允许跨域
                rewrite: (path) => {
                    console.log(path)
                    const newPath = path.replace(/^\/api/, '')
                    return newPath
                }
            },
            '/public': { // 匹配所有以 /public 开头的请求（图片等静态资源）
                target: 'http://localhost:3000',
                changeOrigin: true,
            }
        }
    }
})