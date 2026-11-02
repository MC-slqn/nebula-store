<template>
  <div class="about-container">
    <div class="page-header">
      <h2 class="title">关于平台</h2>
      <p class="subtitle">Nebula Store：连接想象力与玩家的星际数字引力场</p>
    </div>

    <div class="about-section brand-hero">
      <div class="hero-content">
        <div class="brand-logo-preview">🎮</div>
        <h1 class="brand-title">NEBULA STORE</h1>
        <p class="brand-tagline">引爆第九艺术，探索无尽的虚拟宇宙。</p>
        <div class="brand-desc">
          Nebula Store 诞生于一个纯粹的极客狂想：我们不愿做庸俗平庸的货架，而是立志打造一个属于次世代玩家的数字精神家园。从划时代的3A史诗巨作，到充满灵魂的独立游戏神作，Nebula Store 依托于强大的云端分发轨道，打破地域与终端隔阂，将最纯粹的代码艺术，精准交付给每一位热爱冒险的玩家。
        </div>
      </div>
    </div>

    <div class="cards-grid">
      <div class="concept-card">
        <div class="card-icon"><el-icon><Cpu /></el-icon></div>
        <h3 class="card-title">星云引擎 (Nebula Cloud)</h3>
        <p class="card-text">自研高速数字分发网络，全面支持多线程高并发下载。无论首发大作体积多么庞大，星云轨道都能助你瞬间拉满宽带，无需等待，即刻开服。</p>
      </div>

      <div class="concept-card">
        <div class="card-icon"><el-icon><GobletFull /></el-icon></div>
        <h3 class="card-title">第九艺术尊崇</h3>
        <p class="card-text">拒绝垃圾换皮与恶意内购。我们设立了严苛的“星民评审委员会”，只为玩家挑选有深度、有艺术表达的尖端佳作，捍卫玩家的钱包与时间。</p>
      </div>

      <div class="concept-card">
        <div class="card-icon"><el-icon><Connection /></el-icon></div>
        <h3 class="card-title">开发者引力计划</h3>
        <p class="card-text">推出全行业最具诚意的分成协议与免费游戏引擎技术支持。我们愿意成为独立制作人的坚实港湾，让每一个闪光的创意都能在星海中璀璨绽放。</p>
      </div>
    </div>

    <div class="about-section timeline-block">
      <div class="section-title">
        <el-icon><DataLine /></el-icon>
        <span>星轨进程</span>
      </div>
      
      <el-timeline class="custom-timeline">
        <el-timeline-item timestamp="2024.08" placement="top">
          <el-card class="timeline-card">
            <h4>🛸 在极客狂想中敲下第一行代码</h4>
            <p>面对行业垄断，几位硬核玩家在车库决定创造一个更自由、更开放的数字游戏分发平台。Nebula Store 项目正式立项。</p>
          </el-card>
        </el-timeline-item>
        
        <el-timeline-item timestamp="2025.11" placement="top">
          <el-card class="timeline-card">
            <h4>🔥 举办首届“星云独立游戏狂欢节”</h4>
            <p>联合全球上千家独立游戏工作室举办线上新品节。首发Demo试玩突破千万次下载，Nebula Store 正式跻身全球主流PC数字分发阵营。</p>
          </el-card>
        </el-timeline-item>

        <el-timeline-item timestamp="2026.06" placement="top" :hollow="true">
          <el-card class="timeline-card">
            <h4>🌌 Nebula 2.0 客户端全球首发</h4>
            <p>UI全面重构为暗黑拟物紫色渐变视觉体系。全新升级底层购物车，引入秒级数字激活码（CDK）分发链路，打造极致流畅的购游体验。</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<script setup>
// 引入更能体现科技、硬件、连接和成就感的游戏主题图标
import { Cpu, GobletFull, Connection, DataLine } from '@element-plus/icons-vue';
</script>

<style lang="scss" scoped>
/* 容器最大宽度限制与居中，保持全站一致的呼吸感 */
.about-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  /* 显式设浅色底，避免深色模式的 html 底色从透明容器透出来 */
  background-color: #fcfcfd;
  min-height: 100vh;
}

/* 页面顶部标题美化 */
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

/* 白底通用卡片外壳 */
.about-section {
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 30px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01);
}

/* 品牌巨幕特制样式 */
.brand-hero {
  text-align: center;
  position: relative;
  overflow: hidden;
  background: #ffffff;
  
  &::after {
    content: '';
    position: absolute;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(102,126,234,0.04) 0%, rgba(118,75,162,0.01) 70%);
    top: -50px;
    right: -50px;
    border-radius: 50%;
  }

  .brand-logo-preview {
    font-size: 52px;
    margin-bottom: 12px;
    animation: float 4s ease-in-out infinite; /* 改为呼吸感手柄悬浮动画 */
  }

  .brand-title {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: 5px;
    /* 标志性的硬核航天紫渐变 */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0 0 12px 0;
  }

  .brand-tagline {
    font-size: 16px;
    font-weight: 600;
    color: #4a5568;
    margin: 0 0 24px 0;
    letter-spacing: 1px;
  }

  .brand-desc {
    font-size: 14px;
    color: #718096;
    line-height: 1.8;
    max-width: 850px;
    margin: 0 auto;
    text-align: justify;
  }
}

/* 核心理念网格 */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 35px;
}

/* 扁平拟物化概念小卡片 */
.concept-card {
  background: #ffffff;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  padding: 34px 24px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.01);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(118, 75, 162, 0.1);
    border-color: rgba(102, 126, 234, 0.2);

    .card-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      transform: scale(1.05);
    }
  }

  .card-icon {
    width: 56px;
    height: 56px;
    border-radius: 14px; /* 改为偏硬朗的小圆角，更符合电子竞技/客户端的极客审美 */
    background: #f8fafc;
    color: #667eea;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 24px;
    transition: all 0.4s ease;
    border: 1px solid #edf2f7;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    color: #2d3748;
    margin: 0 0 12px 0;
  }

  .card-text {
    font-size: 13px;
    color: #718096;
    line-height: 1.6;
    margin: 0;
    text-align: justify;
  }
}

/* 里程碑板块样式 */
.timeline-block {
  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 17px;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 30px;
    
    .el-icon {
      color: #667eea;
      font-size: 20px;
    }
  }

  .timeline-card {
    border-radius: 10px !important;
    border: 1px solid #edf2f7 !important;
    box-shadow: none !important;

    h4 {
      margin: 0 0 8px 0;
      color: #2d3748;
      font-size: 14px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: #718096;
      font-size: 13px;
      line-height: 1.6;
    }
  }
}

/* ==================== 全局及第三方组件穿透样式 ==================== */

/* 1. 穿透至全局：强制锁定滚动条可用宽度，保持跨页面无任何异位抖动 */
:global(html) {
  scrollbar-gutter: stable;
}

/* 2. 时间轴独立左对齐，圆点中心与日期行中心保持一致 */
.custom-timeline {
  padding: 0 0 0 6px;
  text-align: left;
}
:deep(.custom-timeline .el-timeline-item__wrapper) {
  top: 0;
}
:deep(.custom-timeline .el-timeline-item__node) {
  top: 4px;
}
:deep(.custom-timeline .el-timeline-item__tail) {
  top: 10px;
}

/* 深度定制时间线的主题色为 Nebula 标志紫 */
:deep(.el-timeline-item__node) {
  background-color: #667eea !important;
}
:deep(.el-timeline-item__timestamp) {
  color: #764ba2 !important;
  font-weight: 700;
  font-size: 14px;
  line-height: 20px;
  padding-top: 0;
  margin-bottom: 8px;
}

/* 经典的手柄微悬浮呼吸特效 */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
  100% { transform: translateY(0px); }
}

/* 响应式断点适配 */
@media (max-width: 768px) {
  .cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .about-section {
    padding: 24px;
  }
}
</style>
