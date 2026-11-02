<template>
  <div class="cart-container">
    <div class="page-header">
      <h2 class="title">我的购物车</h2>
      <p class="subtitle">管理您的心仪商品，确认后一键结算</p>
    </div>

    <div class="cart-section table-block">
      <div class="cart-toolbar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索购物车内的商品名称"
          clearable
          class="search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-table
        :data="pagedList"
        style="width: 100%; margin-top: 16px"
        header-cell-class-name="custom-table-header"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="商品图片" width="90" align="center">
          <template #default="{ row }">
            <div class="img-wrapper">
              <img :src="'/public/images/' + row.img" class="cart-img" :alt="row.goodsname" />
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="goodsname" label="商品名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="单价" width="100" align="center">
          <template #default="{ row }">
            <span class="price-text">¥{{ row.price }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" width="140" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.num"
              :min="1"
              :max="99"
              size="default"
              class="custom-number-input"
              @change="handleNumChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="110" align="center" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="subtotal-text">¥{{ (row.price * row.num).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="90" align="center">
          <template #default="{ row }">
            <!--
              删除入口：点击打开居中确认弹窗。
              说明：原先用 el-popconfirm 气泡，但气泡宽 280px 而「操作」列在最右侧、
              右侧只剩 ~90px 空间，必然横跨整行压住「数量/小计」，因此改为表格外的居中弹窗。
            -->
            <button
              class="delete-icon-btn"
              title="从购物车移除"
              :aria-label="`删除 ${row.goodsname}`"
              @click="openDeleteConfirm(row)"
            >
              <el-icon><Delete /></el-icon>
            </button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 删除确认弹窗：位于表格之外，不会遮挡任何商品数据 -->
      <el-dialog
        v-model="deleteDialogVisible"
        width="380px"
        align-center
        append-to-body
        class="cart-delete-dialog"
        :show-close="false"
      >
        <div class="del-dialog-body">
          <div class="del-dialog-icon">
            <el-icon><WarningFilled /></el-icon>
          </div>
          <p class="del-dialog-title">移出购物车</p>
          <p class="del-dialog-name">{{ deleteTarget.goodsname }}</p>
          <p class="del-dialog-tip">删除后需要重新加入购物车</p>
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

      <div class="cart-footer">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredList.length"
          background
          layout="prev, pager, next"
        />
      </div>
    </div>

    <div class="cart-section info-block">
      <div class="section-head">
        <span class="section-icon"><el-icon><Postcard /></el-icon></span>
        <div class="section-text">
          <p class="section-title">填写收货信息</p>
          <p class="section-sub">请确保信息准确，以便我们及时为您送达</p>
        </div>
      </div>

      <el-form :model="orderForm" class="order-form" @submit.prevent>
        <div class="field-grid">
          <div class="field">
            <label class="field-label">收货人 <em>*</em></label>
            <el-input v-model="orderForm.recipient" placeholder="请输入收货人姓名" maxlength="20" clearable />
          </div>
          <div class="field">
            <label class="field-label">联系电话 <em>*</em></label>
            <el-input v-model="orderForm.phone" placeholder="请输入 11 位手机号码" maxlength="11" clearable />
          </div>
        </div>
        <div class="field">
          <label class="field-label">详细地址 <em>*</em></label>
          <el-input v-model="orderForm.address" type="textarea" :rows="2" resize="none"
            placeholder="请输入省 / 市 / 区及详细门牌号" maxlength="120" show-word-limit />
        </div>
      </el-form>
    </div>

    <div class="cart-section checkout-bar">
      <div class="checkout-left">
        <el-checkbox v-model="agreed" class="custom-checkbox">
          已阅读并同意 <span class="protocol-link">《用户协议》</span> 和 <span class="protocol-link">《privacy政策》</span>
        </el-checkbox>
      </div>
      <div class="checkout-right">
        <span class="selected-count">已选商品 <strong>{{ selectedRows.length }}</strong> 件</span>
        <span class="total-price">
          合计：<strong><span>¥</span>{{ totalPrice }}</strong>
        </span>
        <el-button
          class="checkout-btn"
          size="large"
          round
          :disabled="submitting || !agreed || selectedRows.length === 0"
          :loading="submitting"
          @click="handleCheckout"
        >
          立即结算
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import request from '../utils/request';
import { ElMessage } from 'element-plus';
import { Search, Postcard, Delete, WarningFilled } from '@element-plus/icons-vue';
import { useCartStore } from '../stores/cart';
// 删除确认弹窗的样式：必须用独立 css 文件引入（写在 SFC 的 <style> 块里会因 Vite 前置 @charset 而失效）
import '../styles/cart-delete-popper.css';

const router = useRouter();
const cartStore = useCartStore();
const cartData = ref([]);
const selectedRows = ref([]);
const agreed = ref(false);
const submitting = ref(false);
// 同一内容在超时/网络重试时复用编号；成功或修改内容后生成新编号。
let checkoutAttempt = null;
const requestKey = () => Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2, '0')).join('');

// 删除确认弹窗状态
const deleteDialogVisible = ref(false);
const deleteTarget = ref({});
const deleteLoading = ref(false);

const orderForm = reactive({
  recipient: '',
  phone: '',
  address: '',
});
const searchKeyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const filteredList = computed(() => {
  if (!searchKeyword.value) return cartData.value;
  return cartData.value.filter((item) =>
    item.goodsname.includes(searchKeyword.value)
  );
});

const pagedList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

const totalPrice = computed(() =>
  selectedRows.value
    .reduce((sum, item) => sum + item.price * item.num, 0)
    .toFixed(2)
);

const handleSelectionChange = (rows) => {
  selectedRows.value = rows;
};

const loadCart = async () => {
  try {
    const result = await request.get('/shopcartList');
    if (result.code === 200) {
      cartData.value = result.data;
      cartStore.refreshCount();   // 同步导航栏角标
    } else {
      ElMessage.error(result.message || '获取购物车失败');
    }
  } catch (err) {
    console.log('请求失败', err);
    ElMessage.error(err.message || '获取购物车失败');
  }
};

watch(searchKeyword, () => {
  currentPage.value = 1;
});

const handleNumChange = async (row) => {
  try {
    const result = await request.post('/updateCartNum', {
      id: row.cart_id,
      num: row.num,
    });
    if (result.code !== 200) {
      ElMessage.error(result.message || '修改数量失败');
      loadCart();   // 失败时回滚显示，避免界面与后端不一致
    } else {
      cartStore.refreshCount();
    }
  } catch (err) {
    console.log('请求失败', err);
    ElMessage.error(err.message || '修改数量失败');
    loadCart();
  }
};

// 打开删除确认弹窗
const openDeleteConfirm = (row) => {
  deleteTarget.value = row;
  deleteDialogVisible.value = true;
};

// 确认删除
const confirmDelete = async () => {
  deleteLoading.value = true;
  try {
    const result = await request.get('/delCart', {
      params: { id: deleteTarget.value.cart_id },
    });
    if (result.code === 200) {
      ElMessage.success('已移出购物车');
      deleteDialogVisible.value = false;
      await loadCart();
      cartStore.refreshCount();
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

const handleCheckout = async () => {
  if (submitting.value || !agreed.value || !selectedRows.value.length) return;
  if (!orderForm.recipient || !orderForm.phone || !orderForm.address) {
    ElMessage.warning('请填写完整收货信息');
    return;
  }
  const goods = selectedRows.value.map((item) => ({
    g_id: Number(item.g_id),
    num: Number(item.num),
    cart_id: Number(item.cart_id),
  }));
  const payload = { ...orderForm, goods };
  const signature = JSON.stringify(payload);
  if (!checkoutAttempt || checkoutAttempt.signature !== signature) checkoutAttempt = { signature, key: requestKey() };
  submitting.value = true;
  try {
    const result = await request.post('/addOrder', { ...payload, request_key: checkoutAttempt.key });
    if (result.code === 200) {
      checkoutAttempt = null;
      // 若后端算出的金额与页面显示不一致（例如期间价格有变动），如实告知用户
      const serverTotal = Number(result.data && result.data.totalprice);
      if (Number.isFinite(serverTotal) && serverTotal !== Number(totalPrice.value)) {
        ElMessage.warning(`订单金额已按最新价格更新为 ¥${serverTotal.toFixed(2)}`);
      } else {
        ElMessage.success('下单成功');
      }
      cartStore.refreshCount();
      router.push('/order/' + result.data.order_id);
    } else {
      ElMessage.error(result.message || '下单失败');
    }
  } catch (err) {
    console.log('请求失败', err);
    ElMessage.error(err.message || '下单失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadCart();
});
</script>

<style lang="scss" scoped>
/* 容器最大宽度限制与居中，保持呼吸感 */
.cart-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  /* 显式设浅色底，避免深色模式的 html 底色从透明容器透出来 */
  background-color: #fcfcfd;
  min-height: 100vh;
}

/* 页面标题美化：沿用首页渐变条设计 */
.page-header {
  margin-bottom: 30px;
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

/* 通用区块白底卡片化设计 */
.cart-section {
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01);
}

/* 工具栏 */
.cart-toolbar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 8px;
}

/* 购物车搜索框：与收货信息表单用同一套输入框语言（浅底 + 圆角 + 紫色聚焦） */
:deep(.search-input) {
  width: 300px;
}

:deep(.search-input .el-input__wrapper) {
  /* box-sizing 用 border-box，让声明的 height 等于实际外高（默认 content-box 会多出 2px 边框） */
  box-sizing: border-box;
  height: 46px !important;
  padding: 0 14px;
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 11px;
  box-shadow: none !important;
  transition: all 0.2s ease;
}

:deep(.search-input .el-input__wrapper:hover) {
  border-color: #cbd5e0;
}

:deep(.search-input .el-input__wrapper.is-focus) {
  background-color: #ffffff;
  border-color: #764ba2;
  box-shadow: 0 0 0 3px rgba(118, 75, 162, 0.1) !important;
}

:deep(.search-input .el-input__inner) {
  font-size: 14px;
  color: #2d3748;
}

:deep(.search-input .el-input__inner::placeholder) {
  color: #a0aec0;
}

/* 放大镜图标：默认偏灰，聚焦时转主题紫 */
:deep(.search-input .el-input__prefix-inner) {
  font-size: 16px;
  color: #a0aec0;
  transition: color 0.2s ease;
}

:deep(.search-input .el-input__wrapper.is-focus .el-input__prefix-inner) {
  color: #764ba2;
}

:deep(.search-input .el-input__suffix-inner) {
  color: #cbd5e0;
}

/* 表格内部图片美化 */
.img-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  background: #f7fafc;
  border: 1px solid #edf2f7;
  display: flex;
  align-items: center;
  justify-content: center;

  .cart-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

/* 价格字体 */
.price-text {
  color: #4a5568;
  font-weight: 500;
}

.subtotal-text {
  color: #764ba2; /* 呼应主题外壳紫 */
  font-weight: 600;
  font-size: 15px;
}

/* 删除图标按钮：与表格内其他圆角控件保持一致的交互语言 */
.delete-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #a0aec0;
  font-size: 15px;
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
    box-shadow: 0 0 0 3px rgba(118, 75, 162, 0.15);
  }
}

.cart-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* ==================== 填写收货信息 ==================== */
.info-block {
  /* 全局 #app 设了 text-align:center，表单区域需要显式改回左对齐 */
  text-align: left;

  /* 区块标题：图标 + 主标题 + 说明 */
  .section-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 22px;
    padding-bottom: 18px;
    border-bottom: 1px solid #f1f5f9;
    text-align: left;
  }

  .section-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex: 0 0 auto;
    border-radius: 11px;
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.14), rgba(118, 75, 162, 0.14));
    color: #667eea;
    font-size: 19px;
  }

  .section-text {
    min-width: 0;
  }

  .section-title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #2d3748;
    letter-spacing: 0.2px;
  }

  .section-sub {
    margin: 3px 0 0 0;
    font-size: 12px;
    color: #a0aec0;
  }

  /* 字段栅格：两列 + 地址独占一行 */
  .field-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px 24px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  .field-label {
    font-size: 13px;
    font-weight: 600;
    color: #4a5568;
    /* 固定行高，保证同一行的两个标签基线一致 */
    line-height: 18px;
    height: 18px;

    em {
      color: #e53e3e;
      font-style: normal;
      margin-left: 2px;
    }
  }

  /* 地址字段与上方网格的间距由 .field-grid 的 margin-bottom 控制，
     这里不要再给 .field + .field 加 margin —— 那会同时命中网格里的第二列，
     导致「联系电话」比「收货人」低 18px，两列不对齐。 */
  .field-grid {
    margin-bottom: 18px;
  }
}

/* 输入框统一成圆角浅底，聚焦时描边转主题紫 */
:deep(.info-block .el-input__wrapper),
:deep(.info-block .el-textarea__inner) {
  background-color: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 11px;
  box-shadow: none !important;
  padding: 0 14px;
  transition: all 0.2s ease;
}

:deep(.info-block .el-input__wrapper) {
  /* 与搜索框统一：border-box + 46px（Element 默认 min-height:48px 需一并覆盖） */
  box-sizing: border-box;
  height: 46px !important;
  min-height: 46px !important;
}

:deep(.info-block .el-textarea__inner) {
  padding: 12px 14px;
  line-height: 1.6;
  font-family: inherit;
}

:deep(.info-block .el-input__wrapper:hover),
:deep(.info-block .el-textarea__inner:hover) {
  border-color: #cbd5e0;
}

:deep(.info-block .el-input__wrapper.is-focus),
:deep(.info-block .el-textarea__inner:focus) {
  background-color: #ffffff;
  border-color: #764ba2;
  box-shadow: 0 0 0 3px rgba(118, 75, 162, 0.1) !important;
}

:deep(.info-block .el-input__inner) {
  font-size: 14px;
  color: #2d3748;
}

/* 字数统计挪到右下、颜色调淡 */
:deep(.info-block .el-input__count) {
  background: transparent;
  color: #a0aec0;
  font-size: 11px;
}

/* 窄屏时栅格降为单列 */
@media (max-width: 768px) {
  .info-block .field-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* 结算动作条优化 */
.checkout-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 12px;

  .protocol-link {
    color: #667eea;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
}

.checkout-right {
  display: flex;
  align-items: center;
  gap: 24px;

  .selected-count {
    font-size: 14px;
    color: #718096;
    strong {
      color: #764ba2;
      font-size: 16px;
    }
  }

  .total-price {
    font-size: 15px;
    color: #2d3748;
    margin-right: 4px;
    strong {
      color: #764ba2;
      font-size: 24px;
      font-weight: 700;
      
      span {
        font-size: 16px;
        margin-right: 2px;
      }
    }
  }

  /* 结算按钮全新定制：使用主题紫色渐变 */
  .checkout-btn {
    padding: 0 32px;
    height: 46px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    border: none !important;
    color: white !important;
    font-weight: 600;
    font-size: 15px;
    box-shadow: 0 4px 12px rgba(118, 75, 162, 0.25);
    transition: all 0.2s ease;

    &:hover:not(:disabled) {
      opacity: 0.93;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(118, 75, 162, 0.35);
    }

    &:disabled {
      background: #e2e8f0 !important;
      color: #a0aec0 !important;
      box-shadow: none !important;
      cursor: not-allowed;
    }
  }
}

/* ==================== 修复后的标准 Vue 3 深度作用选择器写法 ==================== */

/* 1. 重置表格头部底色 */
:deep(.custom-table-header) {
  background-color: #f8fafc !important;
  color: #4a5568 !important;
  font-weight: 600 !important;
}

/* 1.1 表格兜底：列宽合计超出容器时允许横向滚动，避免「操作」列被裁掉 */
:deep(.el-table__body-wrapper),
:deep(.el-table__header-wrapper) {
  overflow-x: auto !important;
}

/* 2. 重置复选框（勾选后）为主题紫色 */
:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: #764ba2 !important;
  border-color: #764ba2 !important;
}
:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: #764ba2 !important;
}
:deep(.el-checkbox__input.is-indeterminate .el-checkbox__inner) {
  background-color: #764ba2 !important;
  border-color: #764ba2 !important;
}

/* 3. 分页组件高亮呼应 */
:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #764ba2 !important;
  color: #fff !important;
}

/* 4. 数字加减框获得焦点时的边框颜色 */
:deep(.el-input-number .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #667eea inset !important;
}

/* 5. 收窄数量输入框：Element 默认整体宽 150px，比单元格内容区（140px 列 - 左右内边距）还宽，
      会被挤到列外导致「+」按钮看起来被裁掉。把控件宽度和按钮宽度一起收窄，让它正好落在列内。 */
:deep(.custom-number-input) {
  --el-input-number-controls-width: 30px;
  width: 128px !important;
}

:deep(.custom-number-input .el-input-number__decrease),
:deep(.custom-number-input .el-input-number__increase) {
  width: 30px;
}
</style>