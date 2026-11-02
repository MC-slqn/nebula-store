<template>
    <div class="admin-container">
        <div class="page-header">
            <div class="header-left">
                <h2 class="title">星云数字终端</h2>
                <p class="subtitle">商品库存实时监控与管理系统</p>
            </div>
            <div class="header-right" v-if="!deniedMessage">
                <el-button class="action-btn add-btn" @click="openAddDialog">
                    <el-icon class="el-icon--left">
                        <Plus />
                    </el-icon>入库新作品
                </el-button>
            </div>
        </div>

        <!-- 无权限（后端返回 403）时给出页面级提示，而不是让用户对着空表格发懵 -->
        <div v-if="deniedMessage" class="no-permission">
            <p class="denied-title">无法访问后台管理</p>
            <p class="denied-text">{{ deniedMessage }}</p>
            <el-button class="action-btn" @click="$router.push('/')">返回首页</el-button>
        </div>

        <div class="admin-board" v-else>
            <div class="table-toolbar">
                <el-input v-model="searchKeyword" placeholder="搜索作品名称或完整商品 ID"
                    aria-label="搜索作品名称或完整商品 ID" :prefix-icon="Search" clearable
                    class="search-input custom-input" />
                <span class="search-count" role="status">
                    {{ searchKeyword.trim() ? `找到 ${filteredGoods.length} 件作品，共 ${tableData.length} 件` : `共 ${tableData.length} 件作品` }}
                </span>
            </div>
            <el-table :data="filteredGoods" v-loading="loading" class="clean-table"
                :empty-text="searchKeyword.trim() ? '没有找到匹配的作品，请尝试其他名称或 ID' : '暂无作品'"
                header-cell-class-name="clean-table-header" row-class-name="clean-table-row">
                <el-table-column label="ID" prop="g_id" width="80" align="center" />

                <el-table-column label="数字作品" min-width="260">
                    <template #default="{ row }">
                        <div class="goods-meta">
                            <div class="img-wrapper">
                                <!-- 没有图片时不再指向不存在的 placeholder.jpg（会显示裂图），改用内联占位图 -->
                                <img :src="row.img ? '/public/images/' + row.img : PLACEHOLDER_IMG" alt="无图片" />
                            </div>
                            <div class="goods-info">
                                <span class="goods-name">{{ row.goodsname }}</span>
                                <span class="category-tag">分类 ID: {{ row.c_id }}</span>
                            </div>
                        </div>
                    </template>
                </el-table-column>

                <el-table-column label="当前售价" width="120" align="center">
                    <template #default="{ row }">
                        <span class="price-text">¥{{ Number(row.price).toFixed(2) }}</span>
                    </template>
                </el-table-column>

                <el-table-column label="实时库存" width="140" align="center">
                    <template #default="{ row }">
                        <span class="stock-badge" :class="getStockClass(row.stock)">
                            <span class="dot"></span>
                            {{ row.stock > 0 ? row.stock + ' 份' : '已售罄' }}
                        </span>
                    </template>
                </el-table-column>

                <el-table-column label="上架状态" width="120" align="center">
                    <template #default="{ row }">
                        <el-switch v-model="row.is_sale" :active-value="1" :inactive-value="0"
                            style="--el-switch-on-color: #111827" @change="handleStatusChange(row)" />
                    </template>
                </el-table-column>

                <el-table-column label="管理指令" width="180" align="right">
                    <template #default="{ row }">
                        <el-button link class="ctrl-btn edit-btn" @click="openEditDialog(row)">编辑</el-button>
                        <!-- 销毁入口：点击打开居中确认弹窗（与购物车删除保持同一套交互） -->
                        <el-button link class="ctrl-btn del-btn" @click="openDeleteConfirm(row)">销毁</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 销毁确认弹窗：位于表格之外，不会遮挡数据 -->
        <el-dialog v-model="deleteDialogVisible" width="380px" align-center append-to-body
            class="danger-confirm-dialog" :show-close="false">
            <div class="del-dialog-body">
                <div class="del-dialog-icon">
                    <el-icon><WarningFilled /></el-icon>
                </div>
                <p class="del-dialog-title">销毁数字资产</p>
                <p class="del-dialog-name">{{ deleteTarget.goodsname }}</p>
                <p class="del-dialog-tip">销毁后该作品将从商品列表中移除（软删除，可恢复）</p>
            </div>
            <template #footer>
                <div class="del-dialog-actions">
                    <el-button class="del-cancel-btn" @click="deleteDialogVisible = false">再想想</el-button>
                    <el-button class="del-confirm-btn" :loading="deleteLoading" @click="confirmDelete">
                        确认销毁
                    </el-button>
                </div>
            </template>
        </el-dialog>

        <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑数字作品参数' : '入库全新数字作品'" width="500px" class="custom-dialog"
            destroy-on-close>
            <el-form :model="formData" ref="formRef" label-position="top" class="admin-form">
                <el-form-item label="作品名称" required>
                    <el-input v-model="formData.goodsname" placeholder="输入游戏名称" class="custom-input" />
                </el-form-item>

                <div class="form-row">
                    <el-form-item label="当前售价 (¥)" required style="flex: 1;">
                        <el-input-number v-model="formData.price" :min="0" :precision="2" class="custom-input-num" />
                    </el-form-item>
                    <el-form-item label="初始库存" required style="flex: 1;">
                        <el-input-number v-model="formData.stock" :min="0" :step="1" class="custom-input-num" />
                    </el-form-item>
                </div>

                <div class="form-row">
                    <el-form-item label="海报文件名 (含后缀)" style="flex: 1;">
                        <el-input v-model="formData.img" placeholder="例如: game.jpg" class="custom-input" />
                    </el-form-item>
                    <el-form-item label="分类群组 ID" required style="flex: 1;">
                        <el-input-number v-model="formData.c_id" :min="1" :step="1" class="custom-input-num" />
                    </el-form-item>
                </div>

                <el-form-item label="引力场描述 (简述)">
                    <el-input v-model="formData.introduce" type="textarea" :rows="3" placeholder="输入引人入胜的游戏描述..."
                        class="custom-input" />
                </el-form-item>
            </el-form>

            <template #footer>
                <span class="dialog-footer">
                    <el-button class="dialog-btn cancel-btn" @click="dialogVisible = false">取消上传</el-button>
                    <el-button class="dialog-btn confirm-btn" :loading="submitLoading" @click="handleSubmit">
                        {{ isEdit ? '保存更改' : '确认入库' }}
                    </el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Search, WarningFilled } from '@element-plus/icons-vue';
import request from '../utils/request'; // 引入你的 axios 封装
// 危险操作确认弹窗样式：必须用独立 css 文件引入（写在 SFC 的 <style> 块里会因 Vite 前置 @charset 而失效）
import '../styles/cart-delete-popper.css';

// ========== 状态控制 ==========
// 无图片时的内联占位图（避免依赖不存在的静态文件）
const PLACEHOLDER_IMG = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80">' +
    '<rect width="80" height="80" fill="#f3f4f6"/>' +
    '<text x="40" y="45" font-size="11" fill="#9ca3af" text-anchor="middle">无图片</text>' +
    '</svg>'
);
const tableData = ref([]);
const searchKeyword = ref('');
const filteredGoods = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (!keyword) return tableData.value;
    return tableData.value.filter((item) =>
        String(item.goodsname || '').toLowerCase().includes(keyword) ||
        String(item.g_id) === keyword
    );
});
const loading = ref(false);
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const formRef = ref(null);
let originalForm = {};
import { editableFields, buildGoodsUpdate } from '../utils/goodsPayload';
// 无权限时展示的提示（后端返回 403 时置位）
const deniedMessage = ref('');

// 销毁确认弹窗状态
const deleteDialogVisible = ref(false);
const deleteTarget = ref({});
const deleteLoading = ref(false);

const formData = reactive({
    g_id: null,
    goodsname: '',
    price: 0,
    stock: 0,
    img: '',
    c_id: 1,
    introduce: '',
    is_sale: 1
});

// ========== 真实数据库网络请求 ==========

// 1. 获取所有商品
const loadGoodsList = async () => {
    loading.value = true;
    try {
        const result = await request.get('/admin/goodsList');
        if (result.code === 200) {
            tableData.value = result.data;
            deniedMessage.value = '';
        } else {
            ElMessage.error(result.message || '数据加载失败');
        }
    } catch (err) {
        console.error('抓取异常:', err);
        // 403：已登录但不是管理员，给页面级提示而不是只弹一个错误
        if (err.status === 403 || err.code === 403) {
            deniedMessage.value = err.message || '无权限：仅管理员可访问后台管理';
            tableData.value = [];
        } else {
            ElMessage.error(err.message || '网络请求失败');
        }
    } finally {
        loading.value = false;
    }
};

// 页面加载触发
onMounted(() => {
    loadGoodsList();
});

// ========== UI与交互逻辑 ==========

// 获取库存状态颜色
const getStockClass = (stock) => {
    if (stock > 50) return 'stock-safe';
    if (stock > 0) return 'stock-warning';
    return 'stock-danger';
};

// 改变上架状态 (直接调用修改接口)
const handleStatusChange = async (row) => {
    try {
        // 只提交需要变更的字段，避免把整行数据回写（后端已支持局部更新）
        const result = await request.post('/admin/updateGoods', {
            g_id: row.g_id,
            is_sale: row.is_sale,
        });
        if (result.code === 200) {
            ElMessage.success(`《${row.goodsname}》状态已更新`);
        } else {
            ElMessage.error(result.message || '状态切换失败');
            row.is_sale = row.is_sale === 1 ? 0 : 1; // 失败则回退状态
        }
    } catch (err) {
        row.is_sale = row.is_sale === 1 ? 0 : 1; // 失败则回退状态
        ElMessage.error('状态切换失败');
    }
};

// 打开添加对话框
const openAddDialog = () => {
    isEdit.value = false;
    Object.assign(formData, { g_id: null, goodsname: '', price: 0, stock: 0, img: '', c_id: 1, introduce: '', is_sale: 1 });
    dialogVisible.value = true;
};

// 打开编辑对话框
const openEditDialog = (row) => {
    isEdit.value = true;
    originalForm = JSON.parse(JSON.stringify(row));
    Object.assign(formData, originalForm);
    dialogVisible.value = true;
};

// 2. 提交表单 (新增/修改)
const handleSubmit = async () => {
    if (!formData.goodsname) {
        return ElMessage.warning('作品名称不能为空');
    }

    submitLoading.value = true;
    try {
        const url = isEdit.value ? '/admin/updateGoods' : '/admin/addGoods';
        const payload = isEdit.value ? buildGoodsUpdate(formData, originalForm)
            : Object.fromEntries(editableFields.map(key => [key, formData[key]]));
        if (!payload) { dialogVisible.value = false; return; }
        const result = await request.post(url, payload);

        if (result.code === 200) {
            ElMessage.success(result.message);
            dialogVisible.value = false;
            loadGoodsList(); // 重新拉取最新数据
        } else {
            ElMessage.error(result.message);
        }
    } catch (err) {
        ElMessage.error('提交失败，请检查网络');
    } finally {
        submitLoading.value = false;
    }
};

// 3. 销毁操作（二次确认弹窗）
const openDeleteConfirm = (row) => {
    deleteTarget.value = row;
    deleteDialogVisible.value = true;
};

const confirmDelete = async () => {
    deleteLoading.value = true;
    try {
        // 后端读取的字段名是 g_id（此前传 id 导致"提示成功但实际没删"）
        const result = await request.post('/admin/deleteGoods', { g_id: deleteTarget.value.g_id });
        if (result.code === 200) {
            ElMessage.success('资产销毁指令已执行');
            deleteDialogVisible.value = false;
            loadGoodsList(); // 重新拉取数据
        } else {
            ElMessage.error(result.message || '销毁失败');
        }
    } catch (err) {
        ElMessage.error(err.message || '销毁失败');
    } finally {
        deleteLoading.value = false;
    }
};
</script>

<style lang="scss" scoped>
.admin-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    background-color: #fcfcfd;
    min-height: 100vh;
}

/* ==================== 无权限提示 ==================== */
.no-permission {
    margin-top: 60px;
    padding: 56px 40px;
    text-align: center;
    background: #ffffff;
    border: 1px solid #f3f4f6;
    border-radius: 24px;
    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.05);

    .denied-title {
        font-size: 22px;
        font-weight: 800;
        color: #111827;
        margin: 0 0 12px 0;
    }

    .denied-text {
        font-size: 15px;
        color: #6b7280;
        margin: 0 0 28px 0;
    }
}

/* ==================== 顶部控制台 ==================== */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 32px;

    .title {
        font-size: 28px;
        color: #111827;
        margin: 0 0 8px 0;
        font-weight: 800;
        letter-spacing: -0.5px;
    }

    .subtitle {
        font-size: 14px;
        color: #6b7280;
        margin: 0;
        font-weight: 500;
    }
}

.action-btn {
    height: 44px;
    padding: 0 24px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 14px;
    border: none !important;
    transition: all 0.2s ease;
}

.add-btn {
    background-color: #111827 !important;
    color: white !important;
    box-shadow: 0 4px 12px rgba(17, 24, 39, 0.15);

    &:hover {
        background-color: #374151 !important;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(17, 24, 39, 0.25);
    }
}

/* ==================== 数据白板 ==================== */
.admin-board {
    background: #ffffff;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
    border: 1px solid rgba(243, 244, 246, 0.8);
}

.table-toolbar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px 20px;
    margin-bottom: 20px;
}

.search-input {
    width: 360px;
    max-width: 100%;
    --el-input-height: 42px;
}

.search-count {
    font-size: 13px;
    color: #6b7280;
}

.goods-meta {
    display: flex;
    align-items: center;
    gap: 16px;
}

.img-wrapper {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    overflow: hidden;
    background-color: #f3f4f6;
    flex-shrink: 0;
    border: 1px solid #f3f4f6;

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
}

.goods-info {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .goods-name {
        font-weight: 600;
        color: #111827;
        font-size: 15px;
    }

    .category-tag {
        font-size: 12px;
        color: #6b7280;
        background-color: #f3f4f6;
        padding: 2px 6px;
        border-radius: 4px;
        width: fit-content;
    }
}

.price-text {
    font-weight: 600;
    color: #111827;
    font-size: 15px;
}

/* 库存状态徽章 */
.stock-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;

    .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }

    &.stock-safe {
        background-color: #ecfdf5;
        color: #059669;

        .dot {
            background-color: #10b981;
        }
    }

    &.stock-warning {
        background-color: #fffbeb;
        color: #d97706;

        .dot {
            background-color: #f59e0b;
        }
    }

    &.stock-danger {
        background-color: #fef2f2;
        color: #dc2626;

        .dot {
            background-color: #ef4444;
        }
    }
}

/* 操作按钮 */
.ctrl-btn {
    font-size: 13px !important;
    font-weight: 600 !important;
    padding: 4px 8px !important;

    &.edit-btn {
        color: #6b7280 !important;

        &:hover {
            color: #111827 !important;
        }
    }

    &.del-btn {
        color: #ef4444 !important;
        opacity: 0.8;

        &:hover {
            opacity: 1;
        }
    }
}

/* ==================== 表单与对话框 ==================== */
.form-row {
    display: flex;
    gap: 20px;
}

.dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 10px;
}

.dialog-btn {
    height: 40px;
    padding: 0 20px;
    border-radius: 8px;
    font-weight: 600;
    border: none !important;

    &.cancel-btn {
        background-color: #f3f4f6 !important;
        color: #4b5563 !important;

        &:hover {
            background-color: #e5e7eb !important;
        }
    }

    &.confirm-btn {
        background-color: #111827 !important;
        color: white !important;

        &:hover {
            background-color: #374151 !important;
        }
    }
}

/* ==================== 穿透定制 ==================== */
:global(html) {
    scrollbar-gutter: stable;
}

/* 表格定制 */
:deep(.clean-table) {
    --el-table-border-color: #f3f4f6;
    --el-table-header-bg-color: #ffffff;
}

:deep(.clean-table-header th) {
    color: #9ca3af !important;
    font-weight: 500 !important;
    border-bottom: 1px solid #f3f4f6 !important;
    padding: 12px 0;
}

:deep(.clean-table-row td) {
    padding: 16px 0;
    border-bottom: 1px solid #f9fafb;
}

:deep(.el-table::before) {
    display: none;
}

/* 表单组件定制 */
:deep(.custom-dialog) {
    border-radius: 16px;
    overflow: hidden;
}

:deep(.admin-form .el-form-item__label) {
    font-weight: 600;
    color: #374151;
    padding-bottom: 4px;
}

:deep(.custom-input .el-input__wrapper),
:deep(.custom-input-num .el-input__wrapper) {
    background-color: #f9fafb;
    box-shadow: none !important;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: all 0.2s;
}

:deep(.custom-input .el-input__wrapper.is-focus),
:deep(.custom-input-num .el-input__wrapper.is-focus) {
    background-color: #ffffff;
    border-color: #111827;
    box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.05) !important;
}

:deep(.custom-input-num) {
    width: 100%;
}
</style>
