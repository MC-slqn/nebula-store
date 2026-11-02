# Nebula Store 游戏商城

> **项目性质：个人学习与课程实训练手项目，非成熟商业商城。**

## 项目说明与使用边界

本项目用于练习 Vue 3、Node.js 与 MySQL 的全栈开发，展示页面交互、接口设计、权限控制和订单数据处理等学习成果。目前仍属于学习与功能演示阶段，尚不具备成熟商城所需的完整业务流程、生产级安全保障与持续运维能力，不宜直接用于真实交易或商业运营。

- **内容说明：**项目中的平台背景、发展历程、宣传文案、服务能力描述及大部分业务数据为虚构或模拟内容，仅用于页面展示与功能测试，不代表真实经营情况、实际服务承诺或已经实现的技术能力。实际功能以代码实现和下文说明为准。
- **交易说明：**商品价格、库存、订单和领取记录用于模拟业务流程；支付界面仅为交互演示，未接入真实支付、发货、退款或游戏下载、启动服务，不提供实际商品或数字内容交付。
- **素材说明：**展示中可能包含第三方游戏名称、图片或品牌标识，用作学习演示，不代表本项目与相关权利方存在官方合作、授权销售或背书关系；相关素材的权利归其各自权利人所有。
- **使用建议：**请在本地或隔离测试环境中使用演示账号及测试数据，不要填写真实个人信息或支付信息。若将代码用于其他项目，应另行完善业务、安全、测试与部署方案，并核实素材使用权限。

---

> Web 应用开发实训项目 —— Vue 3 + Express + MySQL 全栈实现，附带一套可跑的自动化测试与数据一致性校验。

> 2026-10-22 更新：订单快照、下单幂等、库存并发保护、统一账号鉴权和免费游戏库已实现。已有数据库的迁移步骤及接口变化见 [优化说明](优化说明.md)。

一个模拟游戏商城：前台支持浏览、筛选、加购、下单、查订单，后台支持商品增删改与上下架。

![前台](imgs/前台.png)
![后台](imgs/后台.png)

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 · Vite · Vue Router · Pinia · Element Plus · Axios |
| 后端 | Node.js · Express 4 · express-jwt · jsonwebtoken · bcrypt |
| 数据库 | MySQL 8.0（8 张表，连接池 + 事务） |
| 测试 | Jest（单元） · 自建回归脚本（接口 + 数据库断言） |

---

## 功能

**前台**

- 首页轮播图 + 商品分页列表，支持分类筛选与价格上限筛选
- 免费开玩专区（`maxPrice=0` 复用同一套列表接口）
- 商品详情、加入购物车、购物车数量调整与删除
- 下单结算（服务端计价）、订单列表、订单详情、订单软删除

**后台**（需管理员）

- 商品列表（含已下架）、新增、局部更新、软删除、上下架

**账号体系**

- 注册（前后端双重校验）、登录（bcrypt 校验）、JWT 鉴权
- 角色区分：`role=1` 管理员 / `role=0` 普通用户
- 账号冻结（`status=0`）

---

## 架构

```
浏览器
  │  /api/*  (Vite dev proxy: 去掉 /api 前缀)
  ▼
Express (:3000)
  ├─ app.js              中间件装配 · JWT 白名单 · 404/500 JSON 兜底
  ├─ routes/             路由层（只声明 URL 与中间件）
  ├─ middleware/isAdmin  管理员鉴权（回库核对 role，不信任 token 里的角色）
  ├─ controls/           控制层（业务逻辑）
  ├─ model/index.js      数据层（连接池 · dbsql · transaction 事务封装）
  └─ util/token.js       JWT 签发与解析
  ▼
MySQL (vue-demo12)
```

分层原则：路由层不写业务，控制层不写 SQL，数据层只做数据访问。

---

## 快速开始

### 1. 数据库

需要 MySQL 8.0。仓库内已带一份可直接导入的初始化脚本（含表结构与演示数据）：

```bash
mysql -u root -p < 项目/lesson15/shopDemoBackend/db/vue-demo12.sql
```

### 2. 后端

```bash
cd 项目/lesson15/shopDemoBackend
npm install
npm start          # http://localhost:3000
```

### 3. 前端

```bash
cd 项目/lesson15/lesson15
npm install
npm run dev        # http://localhost:5173
```

### 演示账号

| 用户名 | 密码 | 角色 |
|---|---|---|
| `admin` | `123456` | 管理员 |
| `Twistzz` | `123456` | 普通用户 |
| `7878` | `123456` | 普通用户 |

> 演示账号密码仅用于本地运行。若部署到公网请先改掉，并设置下面这些环境变量。

### 配置

后端所有敏感配置都通过环境变量覆盖，默认值只面向本地开发（见 `shopDemoBackend/config.js`）：

| 变量 | 说明 |
|---|---|
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | 数据库连接 |
| `JWT_SECRET` | 生产环境必填，至少 32 字节；开发未配置时每次启动随机生成 |
| `JWT_EXPIRES_IN` / `JWT_EXPIRES_IN_REMEMBER` | token 有效期（默认 1h / 7d） |

---

## 接口

返回约定 `{ code, message, data }`：`200` 成功，`101/102` 系统/业务错误；鉴权失败返回真实 HTTP `401`，越权返回 `403`。

**公开**：`GET /goodsList`、`GET /category`、`GET /goodsDetails/:id`、`GET /bannerList`、`POST /login`、`POST /register`

**需登录**：`POST /addCart`、`GET /shopcartList`、`POST /updateCartNum`、`GET /delCart`、`POST /addOrder`、`GET /orderList`、`GET /orderDetail/:id`、`POST /delOrder`

**管理员**：`GET /admin/goodsList`、`POST /admin/addGoods`、`POST /admin/updateGoods`、`POST /admin/deleteGoods`

---

## 测试

### 后端单元测试（Jest，49 个用例）

```bash
cd 项目/lesson15/shopDemoBackend
npx jest --runInBand
```

> 加 `--runInBand` 是为了避免 worker 进程在某些受限环境下无法启动。

### 回归脚本（9 支，159 条断言）

位于 `测试脚本/`，走真实 HTTP 接口 + 直连数据库断言，覆盖订单事务、库存并发、鉴权越权、参数校验、后台权限等。这些是旧版手工回归脚本，本次未重跑；异常退出时可能遗留测试数据，请仅在测试环境使用。当前优先使用下面的隔离数据库集成测试。

```bash
# 数据完整性哨兵：先记录基准，跑完回归后再比对
node 测试脚本/00-数据快照.js save
node 测试脚本/00-数据快照.js check

# 各专项回归（需要后端与前端在运行）
node 测试脚本/01-订单事务与计价.js
node 测试脚本/04-401与公开路由.js
node 测试脚本/05-管理员权限.js
node 测试脚本/07-全链路端到端.js
```

`00-数据快照.js` 会把购物车、订单、订单明细、库存、用户角色等关键状态存成基准快照，回归后逐行比对，用来抓出测试造成的数据漂移——这也是本项目回归验证的核心思路。

### 当前版本验证（2026-11-02）

- 后端：`npm test -- --runInBand`，49 项单元测试通过。
- 前端：`npm test`，4 项测试通过；`npm run build` 构建通过，仍有包体积及第三方注释警告。
- 后端：`npm run test:integration`，43 项真实 HTTP/MySQL 检查通过，覆盖重复提交、订单快照、事务回滚、库存版本、账号权限、免费领取与个人资料修改。

集成测试自动创建并清理独立的 `nebula_test_*` 临时数据库，需要测试数据库账号具有建库权限，不写入现有业务库。测试通过仅反映已覆盖场景，不代表项目已达到商业上线标准。

---

## 安全设计

| 措施 | 说明 |
|---|---|
| 密码哈希存储 | 使用 bcrypt（cost=10），数据库不存明文；历史明文数据由 `scripts/migrate-passwords.js` 一次性迁移 |
| 越权校验 | 后台接口的 `isAdmin` 中间件回库核对 `role`，不信任 token 中携带的角色字段 |
| 真实 401 语义 | token 失效返回 HTTP 401 而非 200+业务码，前端拦截器才能正确清理登录态 |
| 数据归属校验 | 购物车与订单的改删操作校验记录属于当前用户 |
| 服务端计价 | 订单金额完全由服务端按库中价格计算，不信任前端传入 |
| 事务与行锁 | 下单流程用事务包裹，`SELECT ... FOR UPDATE` 锁行防止并发超卖 |
| SQL 参数化 | 全部使用占位符传值，动态筛选只拼接结构不拼接值 |

---

## 目录结构

```
大二下实训/
├── 项目/lesson15/
│   ├── lesson15/                  前端工程（Vue 3 + Vite）
│   └── shopDemoBackend/           后端工程（Express）
│       ├── app.js                 应用入口
│       ├── config.js              配置收口（支持环境变量覆盖）
│       ├── routes/ controls/      路由层 / 控制层
│       ├── model/index.js         数据层（连接池 · 事务）
│       ├── middleware/isAdmin.js  管理员鉴权
│       ├── scripts/               运维脚本（密码迁移等）
│       ├── db/vue-demo12.sql      数据库初始化脚本
│       └── public/images/         商品与轮播图（82 张）
├── 测试脚本/                       回归验证脚本（9 支）+ 共用数据库配置
└── .gitignore
```

---

## 已知限制

- 前端已按路由拆分并注册实际使用的组件，主 JS 约 503 kB，仍有体积优化空间
- 未接入 CI/CD，回归脚本目前需手动执行
- 未做接口限流与登录失败锁定
- 支付仅为界面演示，游戏库暂不提供下载/启动服务
