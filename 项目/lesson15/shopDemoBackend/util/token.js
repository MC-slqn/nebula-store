/*
token配置
使用token验证方法，在服务端不需要存储用户登录状态，token实现流程如下：
1.客户端发出登录请求（用户名和密码）
2.服务端收到请求，验证用户名和密码
3.验证成功之后，服务端会生成一个token，然后将token返回给客户端
4.客户端收到token之后，将其存储起来，一般存储在localStorage或者sessionStorage
5.客户端每次发出请求的时候，都要携带token（将token配置到请求体头部）
6.服务端收到请求，验证客户端携带的token，如果验证成功，则返回请求的数据
 */
const jwt = require('jsonwebtoken')
const { jwtSecret, jwtExpiresIn, jwtExpiresInRemember } = require('../config')

//生成token
// remember = true 时使用更长的有效期（对应前端的"保持登录状态"）
exports.setToken = (username, u_id, remember = false, authVersion = 0) => {
    try {
        let token = jwt.sign({ username: username, u_id: u_id, ver: authVersion }, jwtSecret, {
            expiresIn: remember ? jwtExpiresInRemember : jwtExpiresIn
        })
        return token
    } catch (err) {
        throw err
    }
}

exports.getToken=(token)=>{
    return new Promise((resolve,reject)=>{
        if(!token){
            return reject({error:'token为空'})
        }
        //提取token
        let tokenvalue=token.split(' ')[1]  
        if(!tokenvalue){
            return reject({error:'token格式错误'})
        }
        jwt.verify(tokenvalue,jwtSecret,(err,info)=>{
            if(err){
                return reject({error:'token过期或者验证失败'})
            }
            resolve(info)  //返回解析后的值
        })
    })
}
