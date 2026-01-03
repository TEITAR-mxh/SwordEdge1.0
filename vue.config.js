module.exports = {
  // 告诉编译器，即使在 node_modules 里的 marked 库也需要经过 Babel 转译
  transpileDependencies: ['marked']
}