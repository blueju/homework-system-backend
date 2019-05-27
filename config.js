const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'homework',
};

const port = 3001;

const Email = {
  // SMTP邮箱服务提供商
  get host() {
    return 'smtp.qq.com'
  },

  // 发送方邮箱
  get user() {
    return 'lan-ju@qq.com'
  },

  // 邮箱密钥
  get pass() {
    return 'mtmnggnhwcmkbcga'
  },

  // 邮箱验证码
  get code() {
    return () => {
      return Math.random().toString().slice(2, 7).toUpperCase()
    }
  },
  // 过期时间
  get expire() {
    return () => {
      return new Date().getTime() + 1000 * 60
    }
  }
}

module.exports = {
  dbConfig,
  port,
  Email
}