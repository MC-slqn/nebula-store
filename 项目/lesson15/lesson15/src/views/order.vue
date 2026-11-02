<template>
  <div class="order-detail-container">
    <div class="page-header">
      <h2 class="title">凭证详情</h2>
      <p class="subtitle">订单号: {{ route.params.orderId }}</p>
    </div>

    <div class="detail-card">
      <div class="info-section">
        <h3 class="section-title">收件信息</h3>
        <el-descriptions :column="3" class="custom-descriptions">
          <el-descriptions-item label="收货人">{{ order.recipient }}</el-descriptions-item>
          <el-descriptions-item label="联系电话">{{ order.phone }}</el-descriptions-item>
          <el-descriptions-item label="配送地址">{{ order.address }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <div class="goods-section">
        <h3 class="section-title">数字内容</h3>
        <el-table
          :data="order.goods"
          class="clean-table"
          header-cell-class-name="clean-table-header"
          style="width: 100%"
        >
          <el-table-column label="作品" min-width="240">
            <template #default="{ row }">
              <div class="goods-meta">
                <img :src="'/public/images/' + row.img" class="order-img" />
                <span class="goods-name">{{ row.goodsname }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120" align="center">
            <template #default="{ row }">
              <span class="price-text">{{ row.price == null ? '历史单价未记录' : '¥' + row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="num" label="数量" width="100" align="center" />
          
          <el-table-column label="小计" width="180" align="right" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="subtotal-text">{{ row.price == null ? '—' : '¥' + (row.price * row.num).toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="order-footer">
        <el-button class="back-btn" @click="$router.push('/cart')">返回购物车</el-button>
        <div class="footer-right-group">
          <div class="total-price-box">
            <span class="label">订单金额</span>
            <span class="amount"><strong>¥</strong>{{ totalPrice }}</span>
          </div>
          <el-button class="pay-btn" size="large" @click="openPay">立即支付</el-button>
        </div>
      </div>
    </div>

    <!-- 微信支付弹窗（演示用，组件复用） -->
    <PayDialog v-model="payDialogVisible" :order-id="route.params.orderId" :amount="totalPrice" @paid="handlePaid" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import PayDialog from '../components/PayDialog.vue';
// 支付弹窗样式：必须用独立 css 文件引入（写在 SFC 的 <style> 块里会因 Vite 前置 @charset 而失效）
import '../styles/cart-delete-popper.css';
import request from '../utils/request';

const route = useRoute();
const order = ref({});

// 支付弹窗状态
const payDialogVisible = ref(false);

const openPay = () => {
  payDialogVisible.value = true;
};

// 支付完成（演示：仅给出反馈，未接入真实支付接口）
const handlePaid = ({ orderId, amount }) => {
  ElMessage.info(`订单 ${orderId} 已确认付款（¥${amount}），到账情况请以收款记录为准`);
};

const totalPrice = computed(() => Number(order.value.totalprice || 0).toFixed(2));

const loadOrder = async () => {
  try {
    const orderId = route.params.orderId;
    const result = await request.get('/orderDetail/' + orderId);
    if (result.code === 200) {
      order.value = result.data;
    } else {
      ElMessage.error(result.message || '获取订单失败');
    }
  } catch (err) {
    console.log('请求失败', err);
    ElMessage.error('获取订单失败');
  }
};

onMounted(() => {
  loadOrder();
});
</script>

<style lang="scss" scoped>
.order-detail-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #fcfcfd;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
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
    font-family: monospace; /* 订单号使用等宽字体更专业 */
  }
}

.detail-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(243, 244, 246, 0.8);
}

.section-title {
  font-size: 16px;
  color: #111827;
  font-weight: 700;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #f3f4f6;
}

.info-section {
  margin-bottom: 40px;
}

/* 覆盖 Descriptions 默认样式，去边框化 */
:deep(.custom-descriptions .el-descriptions__label) {
  color: #6b7280;
  font-weight: 500;
}
:deep(.custom-descriptions .el-descriptions__content) {
  color: #111827;
  font-weight: 600;
}

.goods-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}

.order-img {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 8px;
  background-color: #f3f4f6;
}

.goods-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.price-text {
  color: #6b7280;
  font-weight: 500;
}

.subtotal-text {
  color: #111827;
  font-weight: 600;
  font-size: 15px;
  padding-right: 16px; /* 防止数字贴近最右侧边缘 */
  display: inline-block;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px dashed #e5e7eb; /* 底部使用虚线更有票据感 */

  .back-btn {
    border-radius: 10px;
    height: 40px;
    padding: 0 24px;
    font-weight: 500;
    color: #4b5563;
    border-color: #d1d5db;
    transition: all 0.2s;

    &:hover {
      background-color: #f9fafb;
      color: #111827;
      border-color: #9ca3af;
    }
  }

  /* 金额 + 支付按钮 成组靠右 */
  .footer-right-group {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  /* 支付按钮：微信绿，与支付弹窗呼应 */
  .pay-btn {
    height: 44px;
    padding: 0 30px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #2fd07a 0%, #07c160 100%);
    color: #ffffff;
    font-weight: 600;
    font-size: 15px;
    box-shadow: 0 4px 12px rgba(7, 193, 96, 0.25);
    transition: all 0.2s ease;

    &:hover {
      color: #ffffff;
      opacity: 0.95;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(7, 193, 96, 0.34);
    }
  }

  .total-price-box {
    text-align: right;

    .label {
      font-size: 14px;
      color: #6b7280;
      margin-right: 12px;
    }

    .amount {
      font-size: 32px;
      font-weight: 800;
      color: #111827;
      letter-spacing: -1px;

      strong {
        font-size: 18px;
        margin-right: 4px;
      }
    }
  }
}

/* ==================== 穿透与全局修复 ==================== */
:global(html) {
  scrollbar-gutter: stable;
}

:deep(.clean-table) {
  --el-table-border-color: #f3f4f6;
  --el-table-header-bg-color: #ffffff;
}

:deep(.clean-table-header) {
  color: #9ca3af !important;
  font-weight: 500 !important;
  border-bottom: 1px solid #f3f4f6 !important;
}

:deep(.el-table::before) {
  display: none;
}

@media (max-width: 768px) {
  .detail-card {
    padding: 24px;
  }
  .order-footer {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 24px;

    .total-price-box {
      text-align: center;
    }
  }
}



/* ==================== 强制修复最后一列表头截断 ==================== */
:deep(.el-table__header-wrapper th.el-table__cell:last-child .cell) {
  padding-right: 20px !important; /* 给右侧强行留出安全距离 */
  overflow: visible !important;   /* 防止文字被隐藏 */
  text-align: center !important;  /* 强行居中显示 */
}

/* 同时稍微调整一下数据行的右侧边距，防止数字也贴边 */
:deep(.el-table__body-wrapper td.el-table__cell:last-child .cell) {
  padding-right: 20px !important;
}
</style>
