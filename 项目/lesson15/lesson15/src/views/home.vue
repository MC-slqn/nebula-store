<template>
    <div class="home-container">
        <div class="carousel-wrapper" v-if="bannerList.length > 0">
            <el-carousel height="360px" class="custom-carousel" :interval="5000" trigger="click">
                <el-carousel-item v-for="item in bannerList" :key="item.b_id || item.id">
                    <router-link :to="item.g_id ? '/detail/' + item.g_id : '#'" class="banner-link">
                        <div class="banner-inner">
                            <div class="banner-bg" :style="{ backgroundImage: 'url(/public/images/' + item.img + ')' }"></div>
                            
                            <img :src="'/public/images/' + item.img" :alt="item.title" class="carousel-img" />
                            
                            <div class="glass-title-card" v-if="item.title">
                                <span class="glass-title-text">{{ item.title }}</span>
                                <span class="glass-subtitle">了解详情 &rarr;</span>
                            </div>
                        </div>
                    </router-link>
                </el-carousel-item>
            </el-carousel>
        </div>

        <div class="page-header">
            <h2 class="title">游戏大厅</h2>
            <p class="subtitle">发现属于你的精选数字作品</p>
        </div>

        <div class="goods-grid">
            <router-link class="goods-card" v-for="item in goodsList" :key="item.g_id" :to="'/detail/' + item.g_id">
                <div class="img-wrapper">
                    <img :src="'/public/images/' + item.img" :alt="item.goodsname" />
                    <div class="img-overlay"></div>
                </div>

                <div class="goods-info">
                    <div class="info-top">
                        <p class="goods-name">{{ item.goodsname }}</p>
                        
                        <div class="price-box">
                            <p v-if="Number(item.price) === 0" class="price-text free-text">
                                <span class="free-badge">FREE</span> 免费开玩
                            </p>
                            <p v-else class="price-text">
                                <span class="currency">¥</span>{{ item.price }}
                            </p>
                        </div>
                    </div>

                    <div class="action-area">
                        <el-button v-if="Number(item.price) === 0" type="success" class="action-btn play-btn" round>
                            <el-icon class="el-icon--left"><VideoPlay /></el-icon>立即开玩
                        </el-button>

                        <AddCartBtn v-else :g-id="item.g_id" @click.prevent.stop>
                            <el-button type="primary" class="action-btn cart-btn" round>
                                <el-icon class="el-icon--left"><ShoppingCart /></el-icon>加入购物车
                            </el-button>
                        </AddCartBtn>
                    </div>
                </div>
            </router-link>
        </div>

        <div class="pagination-wrapper">
            <el-pagination v-model:current-page="currentPage" :page-size="pageSize" :total="total" background
                layout="prev, pager, next" @current-change="handlePageChange" />
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../utils/request';
import { ElMessage } from 'element-plus';
import AddCartBtn from '../components/AddCartBtn.vue';
import { ShoppingCart, VideoPlay } from '@element-plus/icons-vue';

// ========== 状态定义 (未作修改) ==========
const goodsList = ref([]);
const currentPage = ref(1);
const pageSize = ref(8);
const total = ref(0);
const bannerList = ref([]);

// ========== 数据请求 (未作修改) ==========
const getBannerList = async () => {
    try {
        const result = await request.get('/bannerList');
        if (result.code === 200) {
            bannerList.value = result.data; 
        } else {
            ElMessage.error('轮播图数据请求失败');
        }
    } catch (err) {
        console.log('轮播图请求失败', err);
    }
};

const getGoodsList = async () => {
    try {
        const result = await request.get('/goodsList', {
            params: { page: currentPage.value, pageSize: pageSize.value }
        });
        if (result.code === 200) {
            goodsList.value = result.data.list;
            total.value = result.data.total;
        } else {
            ElMessage.error('商品数据请求失败');
        }
    } catch (err) {
        console.log('请求失败', err);
        ElMessage.error('网络请求失败，请稍后再试');
    }
};

// ========== 事件处理 (未作修改) ==========
const handlePageChange = (page) => {
    currentPage.value = page;
    getGoodsList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ========== 生命周期 (未作修改) ==========
onMounted(() => {
    getBannerList();
    getGoodsList();
});
</script>

<style lang="scss" scoped>
.home-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #fcfcfd; /* 极浅的灰底，让白色的卡片浮出来 */
    min-height: 100vh;
}

/* ==================== 轮播图模块 ==================== */
.carousel-wrapper {
    margin-bottom: 50px;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08); /* 现代弥散阴影 */
    transform: translateZ(0); 
    
    .custom-carousel {
        border-radius: 20px;
    }
}

.banner-link {
    display: block;
    width: 100%;
    height: 100%;
}

.banner-inner {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-color: #000;
}

.banner-bg {
    position: absolute;
    top: -10%;
    left: -10%;
    width: 120%;
    height: 120%;
    background-size: cover;
    background-position: center;
    filter: blur(30px) brightness(0.6); /* 加深虚化背景，突出主体 */
    z-index: 1;
}

.carousel-img {
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    object-fit: cover; /* 改为 cover 铺满，更有电影感 */
    transition: transform 6s ease-out; /* 极其缓慢的拉伸动画 */

    &:hover {
        transform: scale(1.04);
    }
}

/* 毛玻璃标题卡片 */
.glass-title-card {
    position: absolute;
    bottom: 30px;
    left: 40px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 16px 28px;
    border-radius: 14px;
    z-index: 3;
    display: flex;
    flex-direction: column;
    gap: 6px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, background 0.3s ease;

    .banner-inner:hover & {
        transform: translateY(-4px);
        background: rgba(255, 255, 255, 0.25);
    }
}

.glass-title-text {
    color: #ffffff;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.glass-subtitle {
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
    font-weight: 500;
}

/* ==================== 极简风区块标题 ==================== */
.page-header {
    margin-bottom: 32px;
    text-align: center; /* 改为居中对齐，更显大气 */

    .title {
        font-size: 28px;
        color: #111827;
        margin: 0;
        font-weight: 800;
        letter-spacing: -0.5px;
    }

    .subtitle {
        font-size: 14px;
        color: #6b7280;
        margin: 8px 0 0 0;
        font-weight: 500;
    }
}

/* ==================== 商品列表与卡片样式 ==================== */
.goods-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 28px;
}

.goods-card {
    display: flex;
    flex-direction: column;
    background: #ffffff;
    border-radius: 16px;
    overflow: hidden;
    text-decoration: none;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); /* 极其细微的初始阴影 */
    border: 1px solid transparent;

    &:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px -8px rgba(102, 126, 234, 0.15); /* 悬浮时呈现带紫调的弥散影 */
        border-color: rgba(237, 242, 247, 0.8);

        .img-wrapper img {
            transform: scale(1.05);
        }
        
        .img-overlay {
            opacity: 1;
        }
    }

    .img-wrapper {
        width: 100%;
        height: 220px;
        position: relative;
        overflow: hidden;
        background-color: #f3f4f6;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .img-overlay {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 40%);
            opacity: 0;
            transition: opacity 0.4s ease;
        }
    }

    .goods-info {
        padding: 20px;
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        justify-content: space-between;
        gap: 20px;
    }

    .info-top {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .goods-name {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #1f2937;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
        min-height: 44px; /* 保证高度一致 */
    }

    .price-box {
        display: flex;
        align-items: baseline;
    }

    .price-text {
        font-size: 22px;
        font-weight: 800;
        color: #111827; /* 改为深邃黑，显得更高级 */
        margin: 0;
        letter-spacing: -0.5px;

        .currency {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            margin-right: 2px;
        }

        &.free-text {
            color: #059669; /* 更沉稳的绿色 */
            font-size: 16px;
            display: flex;
            align-items: center;
            gap: 6px;

            .free-badge {
                font-size: 11px;
                background-color: #d1fae5;
                padding: 3px 8px;
                border-radius: 6px;
                color: #059669;
                letter-spacing: 0.5px;
            }
        }
    }

    /* 统一按钮基础样式 */
    .action-btn {
        width: 100%;
        height: 44px;
        border: none !important;
        font-weight: 600;
        font-size: 14px;
        border-radius: 10px !important; /* 放弃大圆角，改用 Apple 风格的方圆角 */
        transition: all 0.3s ease;
    }

    .cart-btn {
        background: #f3f4f6 !important; /* 默认浅灰，弱化视觉 */
        color: #4b5563 !important;
        
        .goods-card:hover & {
            /* 悬浮卡片时，按钮才亮起渐变色 */
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            color: white !important;
            box-shadow: 0 6px 16px rgba(118, 75, 162, 0.25);
        }
    }

    .play-btn {
        background: #ecfdf5 !important;
        color: #059669 !important;

        .goods-card:hover & {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
            color: white !important;
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.25);
        }
    }
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 50px;
}

/* ==================== 全局修复与穿透 ==================== */
:global(html) {
    scrollbar-gutter: stable;
}

:deep(.el-pagination.is-background .el-pager li) {
    border-radius: 8px;
    background-color: #ffffff;
    border: 1px solid #e5e7eb;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
    background-color: #111827 !important; /* 极致的黑色激活态 */
    color: #fff !important;
    border-color: #111827;
}

:deep(.el-carousel__indicator.is-active button) {
    background-color: #ffffff !important;
    width: 30px;
    border-radius: 4px;
}

:deep(.el-carousel__indicators) {
    z-index: 4;
    bottom: 20px;
}

/* 响应式调整 */
@media (max-width: 1024px) {
    .goods-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
}

@media (max-width: 768px) {
    .home-container { padding: 20px 16px; }
    .carousel-wrapper {
        margin-bottom: 30px;
        border-radius: 16px;
        :deep(.el-carousel) { height: 220px; }
    }
    .glass-title-card {
        bottom: 15px; left: 15px; right: 15px;
        padding: 12px 16px;
    }
    .glass-title-text { font-size: 16px; }
    .page-header .title { font-size: 24px; }
    .goods-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .goods-card .img-wrapper { height: 160px; }
    .goods-info { padding: 12px; gap: 12px; }
}
</style>