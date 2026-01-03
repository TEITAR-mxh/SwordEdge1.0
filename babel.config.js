module.exports = {
  presets: [
    [
      '@vue/app',
      {
        modules: false,
        useBuiltIns: 'entry'
      }
    ]
  ],
  plugins: [
    // 刚才安装的插件（注意：如果你按提示装了 transform 版，就写下面这个名字）
    "@babel/plugin-proposal-unicode-property-regex"
  ]
}