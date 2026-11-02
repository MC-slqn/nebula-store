<template>
  <div class="orders-container">
    <div class="page-header">
      <h2 class="title">我的订单</h2>
      <p class="subtitle">实时查看和管理您的每一笔购物清单</p>
    </div>

    <div v-if="loading" class="empty-block">
      <el-empty description="正在加载订单…" />
    </div>

    <div v-else-if="orders.length === 0" class="empty-block">
      <el-empty description="当前账号下没有可查看的订单" />
      <div class="empty-actions">
        <el-button class="refresh-btn" @click="loadOrders">刷新试试</el-button>
        <el-button class="go-shop-btn" @click="$router.push('/')">去逛逛</el-button>
      </div>
    </div>

    <div v-else class="order-list">
      <div v-for="order in orders" :key="order.order_id" class="order-card">
        <div class="order-header">
          <div class="header-left">
            <span class="order-id-label">订单编号</span>
            <span class="order-id-value">{{ order.order_id }}</span>
          </div>
          <div class="header-right">
            <span class="status-tag">处理中</span>
          </div>
        </div>

        <el-table 
          :data="order.goods" 
          header-cell-class-name="custom-table-header"
          cell-class-name="custom-table-cell"
          style="width: 100%"
        >
          <el-table-column label="作品信息" min-width="280">
            <template #default="{ row }">
              <div class="goods-meta">
                <div class="img-wrapper">
                  <img :src="'/public/images/' + row.img" class="goods-img" :alt="row.goodsname" />
                </div>
                <span class="goods-name-text">{{ row.goodsname }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="单价" width="120" align="center">
            <template #default="{ row }">
              <span class="price-text">{{ row.price == null ? '历史单价未记录' : '¥' + row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="num" label="数量" width="100" align="center">
            <template #default="{ row }">
              <span class="num-text">x{{ row.num }}</span>
            </template>
          </el-table-column>
          <el-table-column label="小计" width="180" align="right" show-overflow-tooltip>
            <template #default="{ row }">
              <span class="subtotal-text">{{ row.price == null ? '—' : '¥' + (row.price * row.num).toFixed(2) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="order-footer">
          <div class="footer-left">
            <!-- 删除入口：点击打开居中确认弹窗（与购物车、后台保持同一套交互） -->
            <button class="delete-order-btn" title="删除该订单" @click="openDeleteConfirm(order)">
              <el-icon><Delete /></el-icon>
              <span>删除订单</span>
            </button>
          </div>
          
          <div class="footer-right">
            <span class="order-total">
              应付总计：<strong><span>¥</span>{{ order.totalprice }}</strong>
            </span>
            <el-button class="checkout-btn" size="large" @click="openPay(order)">立即支付</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除订单确认弹窗：位于卡片之外，不会遮挡订单数据 -->
    <el-dialog v-model="deleteDialogVisible" width="380px" align-center append-to-body
      class="danger-confirm-dialog" :show-close="false">
      <div class="del-dialog-body">
        <div class="del-dialog-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <p class="del-dialog-title">删除订单记录</p>
        <p class="del-dialog-name">订单编号 {{ deleteTarget.order_id }}</p>
        <p class="del-dialog-tip">
          共 {{ deleteTarget.goods ? deleteTarget.goods.length : 0 }} 件作品，合计 ¥{{ deleteTarget.totalprice }}
        </p>
      </div>
      <template #footer>
        <div class="del-dialog-actions">
          <el-button class="del-cancel-btn" @click="deleteDialogVisible = false">再想想</el-button>
          <el-button class="del-confirm-btn" :loading="deleteLoading" @click="confirmDelete">
            确认删除
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 微信支付弹窗（演示用，组件复用） -->
    <PayDialog v-model="payDialogVisible" :order-id="payTarget.order_id || ''" :amount="payTarget.totalprice || '0.00'"
      @paid="handlePaid" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import request from '../utils/request';
import { ElMessage } from 'element-plus';
import { Delete, WarningFilled } from '@element-plus/icons-vue';
import PayDialog from '../components/PayDialog.vue';
// 危险操作确认弹窗 / 支付弹窗样式：必须用独立 css 文件引入（写在 SFC 的 <style> 块里会因 Vite 前置 @charset 而失效）
import '../styles/cart-delete-popper.css';

const orders = ref([]);
// 加载态：区分「还在请求」和「确实没有订单」，避免接口慢时误显示空状态
const loading = ref(true);

// 删除确认弹窗状态
const deleteDialogVisible = ref(false);
const deleteTarget = ref({});
const deleteLoading = ref(false);

// 支付弹窗状态
const payDialogVisible = ref(false);
const payTarget = ref({});

// 打开支付弹窗
const openPay = (order) => {
  payTarget.value = order;
  payDialogVisible.value = true;
};

// 支付完成（演示：仅给出反馈，未接入真实支付接口）
const handlePaid = ({ orderId, amount }) => {
  ElMessage.info(`订单 ${orderId} 已确认付款（¥${amount}），到账情况请以收款记录为准`);
};

const loadOrders = async () => {
  loading.value = true;
  try {
    const result = await request.get('/orderList');
    if (result.code === 200) {
      orders.value = Array.isArray(result.data) ? result.data : [];
    } else {
      orders.value = [];
      ElMessage.error(result.message || '获取订单失败');
    }
  } catch (err) {
    console.log('请求失败', err);
    orders.value = [];
    ElMessage.error(err.message || '获取订单失败');
  } finally {
    loading.value = false;
  }
};

const openDeleteConfirm = (order) => {
  deleteTarget.value = order;
  deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
  deleteLoading.value = true;
  try {
    const result = await request.post('/delOrder', { id: deleteTarget.value.order_id });
    if (result.code === 200) {
      ElMessage.success('订单已删除');
      deleteDialogVisible.value = false;
      loadOrders();
    } else {
      ElMessage.error(result.message || '删除失败');
    }
  } catch (err) {
    console.log('请求失败', err);
    ElMessage.error(err.message || '删除失败');
  } finally {
    deleteLoading.value = false;
  }
};

onMounted(() => {
  loadOrders();
});
</script>

<style lang="scss" scoped>
.orders-container {
  max-width: 1000px; /* 订单列表不需要太宽，收拢视线更精致 */
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #fcfcfd;
  min-height: 100vh;
}

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

.empty-block {
  background: #ffffff;
  border-radius: 16px;
  padding: 80px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);

  /* 空状态下的操作按钮：让用户知道可以刷新，而不是干等 */
  .empty-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: -10px;
  }

  .empty-actions .el-button {
    height: 38px;
    min-width: 104px;
    margin: 0;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
  }

  .refresh-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    color: #4a5568;

    &:hover {
      background: #f1f5f9;
      border-color: #cbd5e0;
      color: #2d3748;
    }
  }

  .go-shop-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(118, 75, 162, 0.25);

    &:hover {
      color: #ffffff;
      opacity: 0.94;
      transform: translateY(-1px);
    }
  }
}

/* 订单卡片全新升级 */
.order-card {
  background: #ffffff;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  border: 1px solid transparent;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 32px -8px rgba(102, 126, 234, 0.1);
    border-color: rgba(237, 242, 247, 0.8);
  }
}

/* 订单卡片头部 */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background-color: #f9fafb;
  border-bottom: 1px solid #f3f4f6;

  .header-left {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .order-id-label {
    color: #6b7280;
    font-size: 13px;
  }

  .order-id-value {
    color: #111827;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.5px;
  }

  .status-tag {
    font-size: 12px;
    color: #4f46e5;
    background: #e0e7ff;
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 600;
  }
}

/* 表格内元素重构 */
.goods-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.img-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f3f4f6;
  flex-shrink: 0;

  .goods-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.goods-name-text {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.price-text, .num-text {
  color: #6b7280;
  font-weight: 500;
}

.subtotal-text {
  color: #111827;
  font-weight: 600;
  font-size: 15px;
}

/* 订单底部 */
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #ffffff;
  border-top: 1px solid #f3f4f6;

  .footer-right {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  /* 删除订单按钮：与购物车/后台的删除入口保持一致的交互语言 */
  .delete-order-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #ffffff;
    color: #9ca3af;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.22s ease;

    &:hover {
      color: #e53e3e;
      border-color: rgba(229, 62, 62, 0.35);
      background: rgba(229, 62, 62, 0.05);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
    }
  }

  .order-total {
    font-size: 14px;
    color: #6b7280;
    strong {
      color: #111827;
      font-size: 24px;
      font-weight: 800;
      margin-left: 6px;
      letter-spacing: -0.5px;
      
      span {
        font-size: 16px;
        margin-right: 2px;
      }
    }
  }

  .checkout-btn {
    padding: 0 32px;
    height: 44px;
    border-radius: 10px;
    background: #111827 !important; /* 极简高级黑 */
    border: none !important;
    color: white !important;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s ease;

    &:hover {
      background: #374151 !important;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(17, 24, 39, 0.2);
    }
  }
}

/* ==================== 穿透与全局修复 ==================== */
:global(html) {
  scrollbar-gutter: stable;
}

/* 定制 Element Plus 表格去线化 */
:deep(.el-table) {
  --el-table-border-color: #f3f4f6;
  --el-table-header-bg-color: #ffffff;
  padding: 0 10px;
}

:deep(.custom-table-header) {
  background-color: #ffffff !important;
  color: #9ca3af !important;
  font-weight: 500 !important;
  border-bottom: 1px solid #f3f4f6 !important;
  padding: 12px 16px !important;
}

:deep(.custom-table-cell) {
  padding: 16px 0;
}

:deep(.el-table::before) {
  display: none; /* 移除表格底部的默认边框线 */
}
</style>
