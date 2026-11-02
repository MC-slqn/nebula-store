<template>
  <span @click.prevent="handleAddCart">
    <slot />
  </span>
</template>

<script setup>
import { ElMessage } from 'element-plus';
import request from '../utils/request';
import { useCartStore } from '../stores/cart';

const props = defineProps({
  gId: {
    type: Number,
    required: true,
  },
});

const emit = defineEmits(['success']);
const cartStore = useCartStore();

const handleAddCart = async () => {
  try {
    const result = await request.post('/addCart', {
      g_id: props.gId,
      num: 1,
    });
    if (result.code === 200) {
      ElMessage.success('已加入购物车');
      // 通知父组件并刷新购物车件数，避免页面数据不更新
      await cartStore.refreshCount();
      emit('success', props.gId);
    } else {
      // 透出后端的具体原因（库存不足、已下架、请先登录等）
      ElMessage.error(result.message || '加入购物车失败');
    }
  } catch (err) {
    console.log('请求失败', err);
    ElMessage.error(err.message || '加入购物车失败');
  }
};
</script>
