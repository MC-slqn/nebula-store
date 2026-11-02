<template>
  <main class="library" v-loading="loading">
    <h1>我的游戏库</h1>
    <p>已领取的免费游戏将保存在这里。本实训项目不提供游戏下载或启动服务。</p>
    <el-button @click="loadGames">刷新游戏库</el-button>
    <el-empty v-if="!loading && !games.length" description="还没有领取游戏" />
    <div class="games">
      <article v-for="game in games" :key="game.g_id">
        <img v-if="game.img" :src="'/public/images/' + game.img" :alt="game.goodsname" />
        <h2>{{ game.goodsname }}</h2>
        <span>已领取</span>
      </article>
    </div>
  </main>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import request from '../utils/request'
const games = ref([])
const loading = ref(false)
const loadGames = async () => {
  loading.value = true
  try {
    const result = await request.get('/myGames')
    if (result.code !== 200) throw new Error(result.message)
    games.value = result.data
  } catch (err) { ElMessage.error(err.message || '游戏库加载失败') }
  finally { loading.value = false }
}
onMounted(loadGames)
</script>
<style scoped>
.library { max-width: 1100px; margin: 40px auto; padding: 0 24px; }
.library > p { color: #64748b; line-height: 1.7; }
.games { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 24px; margin-top: 24px; }
article { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
article img { width: 100%; height: 150px; object-fit: cover; border-radius: 8px; }
h2 { font-size: 18px; }
article span { color: #15803d; }
</style>
