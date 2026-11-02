import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// createApp(App).mount('#app')
// 全局注册路由组件
import router from "./router"
import { ElButton, ElCard, ElCarousel, ElCarouselItem, ElCheckbox, ElDescriptions, ElDescriptionsItem, ElDialog, ElEmpty, ElForm, ElFormItem, ElIcon, ElInput, ElInputNumber, ElLink, ElPagination, ElSwitch, ElTable, ElTableColumn, ElTimeline, ElTimelineItem, ElLoading } from 'element-plus'
import 'element-plus/dist/index.css' // 引入Element Plus样式
import { createPinia } from 'pinia' // 引入Pinia

const app = createApp(App);
const pinia = createPinia(); // 创建Pinia实例
app.use(router); // 挂载路由
[ElButton, ElCard, ElCarousel, ElCarouselItem, ElCheckbox, ElDescriptions, ElDescriptionsItem, ElDialog, ElEmpty, ElForm, ElFormItem, ElIcon, ElInput, ElInputNumber, ElLink, ElPagination, ElSwitch, ElTable, ElTableColumn, ElTimeline, ElTimelineItem, ElLoading].forEach(component => app.use(component));
app.use(pinia); // 使用Pinia

app.mount('#app');