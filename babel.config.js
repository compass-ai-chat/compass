module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", {
        unstable_transformImportMeta: true
      }]
    ],
    plugins:[
      '@babel/plugin-transform-class-static-block',
      ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
      ['@babel/plugin-syntax-import-meta']
    ]
  };
};
