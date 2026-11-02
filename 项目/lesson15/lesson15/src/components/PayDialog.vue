<template>
  <!--
    微信支付弹窗（演示用）
    说明：本项目未接入真实支付接口，此弹窗仅展示收款二维码并做「支付完成」的流程模拟。
    如果需要真实对账，应改为后端生成订单号 + 支付回调校验，前端轮询支付状态。
  -->
  <el-dialog
    :model-value="modelValue"
    width="380px"
    align-center
    append-to-body
    class="pay-dialog"
    :show-close="false"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="pay-body">
      <p class="pay-title">微信扫码支付</p>
      <p class="pay-amount"><span>¥</span>{{ amount }}</p>
      <p class="pay-ref">订单编号 {{ orderId }}</p>

      <div class="pay-qr-wrap">
        <img src="/wechat-pay.jpg" alt="微信收款二维码" class="pay-qr" />
      </div>

      <p class="pay-tip">请使用微信扫描二维码完成支付</p>
    </div>

    <template #footer>
      <div class="pay-actions">
        <el-button class="pay-cancel-btn" @click="handleCancel">再想想</el-button>
        <el-button class="pay-done-btn" :loading="paying" @click="handlePaid">支付完成</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 订单号，用于在弹窗里标示是哪一笔
  orderId: { type: [Number, String], default: '' },
  // 应付金额
  amount: { type: [Number, String], default: '0.00' },
});

const emit = defineEmits(['update:modelValue', 'paid']);

const paying = ref(false);

const handleCancel = () => {
  emit('update:modelValue', false);
};

// 「支付完成」：演示环境下模拟一次支付处理，再把结果交给父组件
const handlePaid = () => {
  paying.value = true;
  setTimeout(() => {
    paying.value = false;
    emit('update:modelValue', false);
    emit('paid', { orderId: props.orderId, amount: props.amount });
  }, 1200);
};
</script>

<style lang="scss" scoped>
.pay-title {
  margin: 0 0 6px 0;
  text-align: center;
  font-size: 17px;
  font-weight: 700;
  color: #2d3748;
}

.pay-amount {
  margin: 0 0 4px 0;
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  color: #111827;

  span {
    font-size: 16px;
    margin-right: 2px;
  }
}

.pay-ref {
  margin: 0 0 18px 0;
  text-align: center;
  font-size: 12px;
  color: #a0aec0;
}

.pay-qr-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.pay-qr {
  width: 240px;
  height: auto;
  display: block;
  border-radius: 12px;
}

.pay-tip {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: #a0aec0;
}

.pay-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.pay-actions .el-button {
  height: 38px;
  min-width: 104px;
  margin: 0 !important;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.22s ease;
}

/* 取消：低调描边 */
.pay-cancel-btn {
  background: #f8fafc !important;
  border: 1px solid #e2e8f0 !important;
  color: #4a5568 !important;

  &:hover {
    background: #f1f5f9 !important;
    border-color: #cbd5e0 !important;
    color: #2d3748 !important;
  }
}

/* 支付完成：微信绿，呼应二维码的主色 */
.pay-done-btn {
  background: linear-gradient(135deg, #2fd07a 0%, #07c160 100%) !important;
  border: none !important;
  color: #ffffff !important;
  box-shadow: 0 4px 12px rgba(7, 193, 96, 0.28);

  &:hover {
    box-shadow: 0 6px 16px rgba(7, 193, 96, 0.36) !important;
    transform: translateY(-1px);
    opacity: 0.96;
  }
}
</style>
