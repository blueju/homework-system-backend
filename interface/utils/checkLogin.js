module.exports = function (ctx) {
  console.log(ctx.session);
  if (ctx.session.userId === null || ctx.session.userId === undefined) {
    return false
  } else {
    return true
  }
}