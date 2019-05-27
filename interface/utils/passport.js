const passport = require('koa-passport');
const LocalStrategy = require('passport-local');
const Db = require('./db.js');

passport.use(new LocalStrategy(async function (userId, password, done) {
  let sql = `select * from ${type} where user_id = ${userId}`
  console.log(sql);
  
  let result = await Db.find(sql)
  if (result != null) {
    if (result[0].password === password) {
      return done(null, result)
    } else {
      return done(null, false, '密码错误')
    }
  } else {
    return done(null, false, '用户不存在')
  }
}))

passport.serializeUser(function (user, done) {
  done(null, user)
})

passport.deserializeUser(function (user, done) {
  return done(null, user)
})

module.exports = passport;
// export default passport