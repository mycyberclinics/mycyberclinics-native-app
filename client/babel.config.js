// module.exports = function (api) {
//   api.cache(true);
//   return {
//     presets: [
//       ["babel-preset-expo", { jsxImportSource: "nativewind" }],
//       "nativewind/babel",
//     ],
//   };
// };

// module.exports = function (api) {
//   api.cache(true);
//   return {
//     presets: ["babel-preset-expo"],
//     plugins: ["nativewind/babel"],
//   };
// };

// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }, 'nativewind/babel']],
    plugins: ['react-native-reanimated/plugin'],
  };
};
