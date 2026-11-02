<template>
    <div class="detail-container">
        <div class="page-header">
            <h2 class="title">游戏详情</h2>
            <p class="subtitle">Nebula Store 数字正版特惠发行</p>
        </div>

        <div class="back-bar">
            <el-button @click="$router.back()" link class="back-link-btn">
                <el-icon><ArrowLeft /></el-icon>返回游戏大厅
            </el-button>
        </div>

        <div class="detail-card-wrapper" v-loading="loading">
            <div class="detail-body">
                <div class="detail-image">
                    <div class="img-inner-shadow">
                        <img
                            :src="goods.img ? '/public/images/' + goods.img : ''"
                            :alt="goods.goodsname"
                        />
                    </div>
                </div>

                <div class="detail-info">
                    <div class="info-top">
                        <h1 class="goods-title">{{ goods.goodsname }}</h1>
                        
                        <div class="meta-row">
                            <span class="status-badge" v-if="Number(goods.price) === 0">Free to Play (永久入库)</span>
                            <span class="status-badge" v-else>数字版 (DRM-Free)</span>
                            
                            <span class="goods-stock" :class="{ 'no-stock': !goods.stock }">
                                <span class="stock-dot"></span>
                                {{ goods.stock > 0 ? '激活密钥现货（库存 ' + goods.stock + ')' : '暂时断供' }}
                            </span>
                        </div>

                        <div class="price-box" v-if="Number(goods.price) === 0">
                            <span class="free-text">永久免费</span>
                        </div>
                        
                        <div class="price-box" v-else>
                            <span class="currency">¥</span>
                            <span class="price-num">{{ goods.price }}</span>
                        </div>

                        <div class="goods-desc">
                            <h3 class="desc-title">作品概述</h3>
                            <p class="desc-content">{{ goods.introduce || '该作品暂无具体的引力场描述信息。' }}</p>
                        </div>
                    </div>

                    <div class="action-buttons" v-if="Number(goods.price) === 0">
                        <el-button size="large" class="play-btn" @click="claimFreeGame">
                            <el-icon class="el-icon--left"><VideoPlay /></el-icon>立即领取
                        </el-button>
                    </div>

                    <div class="action-buttons" v-else>
                        <el-button size="large" class="buy-btn" plain @click="buyNow">
                            立即购买
                        </el-button>
                        
                        <AddCartBtn v-if="goods.g_id" :g-id="goods.g_id">
                            <el-button size="large" class="cart-btn">
                                <el-icon class="el-icon--left"><ShoppingCart /></el-icon>加至购物车
                            </el-button>
                        </AddCartBtn>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../utils/request';
import { ElMessage } from 'element-plus';
import AddCartBtn from '../components/AddCartBtn.vue';
// 引入图标：新增了 VideoPlay 图标用于免费游戏的“立即开玩”按钮
import { ArrowLeft, ShoppingCart, VideoPlay } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const goods = ref({});
const loading = ref(false);

const getGoodsDetail = async () => {
    const goodId = route.params.goodId;
    loading.value = true;
    try {
        const result = await request.get('/goodsDetails/' + goodId);
        if (result.code === 200 && result.data.length > 0) {
            goods.value = result.data[0];
        } else {
            ElMessage.error('该游戏资源未上架或已下架'); // 修正了错别字
        }
    } catch (err) {
        console.log('请求失败', err);
        ElMessage.error('获取游戏详情失败');
    } finally {
        loading.value = false;
    }
};

const addCurrentGoodsToCart = async () => {
    if (!goods.value.g_id) return;
    const result = await request.post('/addCart', { g_id: goods.value.g_id, num: 1 });
    if (result.code !== 200) throw new Error(result.message || '加入购物车失败');
    return result;
};

const buyNow = async () => {
    try {
        await addCurrentGoodsToCart();
        ElMessage.success('已加入购物车，请填写收货信息后提交订单');
        router.push('/cart');
    } catch (err) {
        ElMessage.error(err.message || '操作失败');
    }
};

const claiming = ref(false);
const claimFreeGame = async () => {
    if (claiming.value || !goods.value.g_id || Number(goods.value.price) !== 0) return;
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    claiming.value = true;
    try {
        const result = await request.post('/claimGame', { g_id: goods.value.g_id });
        if (result.code !== 200) throw new Error(result.message || '领取失败');
        ElMessage.success(result.message);
        router.push('/library');
    } catch (err) {
        ElMessage.error(err.message || '领取失败');
    } finally { claiming.value = false; }
};

onMounted(() => {
    getGoodsDetail();
});
</script>

<style lang="scss" scoped>
/* 容器最大宽度限制与居中，保持全站一致的呼吸感 */
.detail-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    /* 显式设浅色底，避免深色模式的 html 底色从透明容器透出来 */
    background-color: #fcfcfd;
    min-height: 100vh;
}

/* 页面顶部标题美化：沿用全站统一的左侧紫色渐变条设计 */
.page-header {
    margin-bottom: 24px;
    position: relative;
    padding-left: 15px;

    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 4px;
        bottom: 4px;
        width: 5px;
        background: linear-gradient(to bottom, #667eea, #764ba2);
        border-radius: 4px;
    }

    .title {
        font-size: 28px;
        color: #2d3748;
        margin: 0;
        font-weight: 600;
    }

    .subtitle {
        font-size: 14px;
        color: #a0aec0;
        margin: 4px 0 0 0;
    }
}

/* 返回按钮美化 */
.back-bar {
    margin-bottom: 24px;
    
    .back-link-btn {
        color: #718096 !important;
        font-size: 14px;
        font-weight: 500;
        transition: color 0.2s;
        display: flex;
        align-items: center;
        gap: 4px;

        &:hover {
            color: #667eea !important;
        }
    }
}

/* 商品详情主体包装盒：扁平现代白底立体视感 */
.detail-card-wrapper {
    background: #ffffff;
    border: 1px solid #edf2f7;
    border-radius: 16px;
    padding: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.01);
}

.detail-body {
    display: flex;
    gap: 50px;

    /* 响应式断点：中屏及小屏下改为利落的垂直单列排列 */
    @media (max-width: 900px) {
        flex-direction: column;
        gap: 30px;
    }
}

/* 左侧：海报展示区 */
.detail-image {
    flex: 0 0 420px;
    
    .img-inner-shadow {
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #edf2f7;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.04);
        background-color: #f7fafc;
        /* 固定游戏海报黄金比例高度 */
        height: 480px; 

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
    }

    &:hover .img-inner-shadow img {
        transform: scale(1.02); /* 悬停微互动 */
    }

    @media (max-width: 900px) {
        flex: none;
        .img-inner-shadow {
            height: 340px;
        }
    }
}

/* 右侧：信息与动作面板区 */
.detail-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between; /* 强行拉开间距，防止按钮与内容挤在一起 */

    .goods-title {
        font-size: 28px;
        font-weight: 700;
        color: #1a202c;
        margin: 0 0 16px 0;
        letter-spacing: -0.5px;
    }

    /* 标签状态栏 */
    .meta-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;

        .status-badge {
            font-size: 12px;
            color: #764ba2;
            background: rgba(118, 75, 162, 0.08);
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 600;
        }
    }

    .goods-stock {
        font-size: 13px;
        color: #38a169; /* 活力的森林绿 */
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 500;

        .stock-dot {
            width: 7px;
            height: 7px;
            background-color: #38a169;
            border-radius: 50%;
            display: inline-block;
        }

        &.no-stock {
            color: #e53e3e;
            .stock-dot {
                background-color: #e53e3e;
            }
        }
    }

    /* 价格大字美化 */
    .price-box {
        margin-bottom: 28px;
        color: #2d3748;
        display: flex;
        align-items: baseline;

        .currency {
            font-size: 18px;
            font-weight: 600;
            margin-right: 4px;
        }

        .price-num {
            font-size: 38px;
            font-weight: 800;
            letter-spacing: -1px;
        }

        /* 免费游戏专属绿色大字 */
        .free-text {
            font-size: 32px;
            font-weight: 800;
            color: #2ecc71;
            letter-spacing: 1px;
        }
    }

    /* 描述区区块化底色设计，极具 Steam 商店既视感 */
    .goods-desc {
        background-color: #f8fafc;
        border-radius: 10px;
        padding: 20px 24px;
        margin-bottom: 30px;
        border: 1px solid #edf2f7;

        .desc-title {
            font-size: 15px;
            color: #2d3748;
            font-weight: 600;
            margin: 0 0 10px 0;
        }
        
        .desc-content {
            font-size: 14px;
            color: #4a5568;
            line-height: 1.7;
            margin: 0;
            text-align: justify;
        }
    }

    /* 按钮决策区：宽度分配及渐变注入 */
    .action-buttons {
        display: flex;
        gap: 16px;
        margin-top: 20px;

        /* “立即购买”：使用沉稳清爽的高级浅色调 */
        .buy-btn {
            flex: 1;
            height: 50px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            border: 2px solid #edf2f7 !important;
            color: #4a5568 !important;
            background-color: #ffffff !important;
            transition: all 0.2s;

            &:hover {
                background-color: #f7fafc !important;
                border-color: #cbd5e0 !important;
                color: #2d3748 !important;
            }
        }

        /* 统一使用全局组件传递 */
        :deep(span), AddCartBtn {
            flex: 1;
        }

        /* “加入购物车”：全站统一的硬核紫色双渐变 */
        .cart-btn {
            width: 100%;
            height: 50px;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
            border: none !important;
            color: white !important;
            box-shadow: 0 4px 12px rgba(118, 75, 162, 0.2);
            transition: all 0.2s ease;

            &:hover {
                opacity: 0.92;
                transform: translateY(-0.5px);
                box-shadow: 0 6px 16px rgba(118, 75, 162, 0.3);
            }
        }

        /* 免费游戏专属：“立即开玩”绿色渐变 */
        .play-btn {
            width: 100%;
            height: 50px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important;
            border: none !important;
            color: white !important;
            box-shadow: 0 4px 12px rgba(56, 239, 125, 0.25);
            transition: all 0.2s ease;

            &:hover {
                opacity: 0.95;
                transform: translateY(-0.5px);
                box-shadow: 0 6px 16px rgba(56, 239, 125, 0.35);
            }
        }
    }
}
</style>

<style lang="scss">
/* ==================== 穿透与全局修复选择器 ==================== */

/* 1. 穿透至全局：强制锁定滚动条可用宽度，保持跨页面无任何异位抖动 */
html {
    scrollbar-gutter: stable;
}
</style>
