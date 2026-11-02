<template>
    <div class="free-container">
        <div class="page-header">
            <h2 class="title">免费开玩</h2>
            <p class="subtitle">零门槛畅玩精选 PC 优质大作</p>
        </div>

        <div class="goods-grid">
            <router-link class="goods-card" v-for="item in freeGoodsList" :key="item.g_id" :to="'/detail/' + item.g_id">
                <div class="img-wrapper">
                    <img :src="'/public/images/' + item.img" :alt="item.goodsname" />
                    <div class="img-overlay"></div>
                </div>

                <div class="goods-info">
                    <div class="info-top">
                        <p class="goods-name">{{ item.goodsname }}</p>
                        
                        <div class="price-box">
                            <p class="price-text free-text">
                                <span class="free-badge">FREE</span> 免费开玩
                            </p>
                        </div>
                    </div>

                    <div class="action-area">
                        <el-button type="success" class="action-btn play-btn">
                            <el-icon class="el-icon--left"><VideoPlay /></el-icon>立即开玩
                        </el-button>
                    </div>
                </div>
            </router-link>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../utils/request';
import { ElMessage } from 'element-plus';
import { VideoPlay } from '@element-plus/icons-vue';

const freeGoodsList = ref([]);

const getFreeGames = async () => {
    try {
        // 免费游戏 = 价格 <= 0 的商品；由后端按 maxPrice 筛选（此前是硬编码 page:2 取第 2 页，取到的并不是免费游戏）
        const result = await request.get('/goodsList', {
            params: { maxPrice: 0, page: 1, pageSize: 100 }
        });

        if (result.code === 200) {
            // 再兜一层本地过滤，防止数据不规范（例如价格为空）导致混入付费商品
            freeGoodsList.value = (result.data.list || []).filter(
                (item) => Number(item.price) === 0
            );
        } else {
            ElMessage.error('免费游戏数据请求失败');
        }
    } catch (err) {
        console.error('网络请求失败', err);
        ElMessage.error('网络请求失败，请稍后再试');
    }
};

onMounted(() => {
    getFreeGames();
});
</script>

<style lang="scss" scoped>
.free-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #fcfcfd;
    min-height: 100vh;
}

/* ==================== 极简风区块标题 ==================== */
.page-header {
    margin-bottom: 40px;
    text-align: center;

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
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
    border: 1px solid transparent;

    &:hover {
        transform: translateY(-8px);
        box-shadow: 0 20px 40px -8px rgba(5, 150, 105, 0.12); /* 免费游戏悬浮使用微弱的绿色弥散影 */
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
        min-height: 44px;
    }

    .price-box {
        display: flex;
        align-items: baseline;
    }

    .price-text.free-text {
        color: #059669;
        font-weight: 800;
        font-size: 16px;
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0;

        .free-badge {
            font-size: 11px;
            background-color: #d1fae5;
            padding: 3px 8px;
            border-radius: 6px;
            color: #059669;
            letter-spacing: 0.5px;
        }
    }

    /* 按钮基础样式 */
    .action-btn {
        width: 100%;
        height: 44px;
        border: none !important;
        font-weight: 600;
        font-size: 14px;
        border-radius: 10px !important;
        transition: all 0.3s ease;
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

:global(html) {
    scrollbar-gutter: stable;
}

@media (max-width: 1024px) {
    .goods-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
}

@media (max-width: 768px) {
    .free-container { padding: 20px 16px; }
    .goods-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .goods-card .img-wrapper { height: 160px; }
    .goods-info { padding: 12px; gap: 12px; }
}
</style>