
var express = require('express');
var path = require('path');
var cors = require('cors')
const { randomUUID } = require('crypto')
const auth = require('./middleware/auth')
const { sendError } = require('./util/errors')

var goodsRouter = require('./routes/goods');
var bannerRouter = require('./routes/banner');
var adminRouter = require('./routes/admin');
var cartRouter = require('./routes/cart');
var orderRouter = require('./routes/order');
var userRouter = require('./routes/user');

var app = express();


//配置跨域
app.use(cors())  //允许所有来源

//允许特定来源
// app.use(cors({
//   origin:'http://localhost:5173'
// }))


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/public', express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.locals.requestId = randomUUID()
    res.setHeader('X-Request-Id', res.locals.requestId)
    next()
})
app.use(auth)

app.use(goodsRouter);
app.use(bannerRouter);
app.use(adminRouter);
app.use(cartRouter);
app.use(orderRouter);
app.use(userRouter);
app.use(require('./routes/library'));

//兜底 404：未匹配到任何路由时返回 JSON，避免吐出 Express 默认的 HTML 页面
app.use((req, res) => {
    res.status(404).send({ code: 404, message: `接口不存在: ${req.method} ${req.originalUrl}`, data: null })
})

//兜底错误处理：任何未捕获的错误都返回 JSON，而不是 HTML 500 页面
app.use((err, req, res, next) => {
    console.log('未处理的错误:', err && err.message)
    if (res.headersSent) {
        return next(err)
    }
    if (err.status === 401) return res.status(401).send({ code: 401, message: '登录已过期，请重新登录', data: null })
    if (err.type === 'entity.parse.failed') return res.status(400).send({ code: 102, message: '请求格式不正确', data: null })
    sendError(res, err)
})


module.exports = app;
