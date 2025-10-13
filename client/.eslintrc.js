module.exports = {
  root: true,
  extends: ['universe/native', 'plugin:react-hooks/recommended', 'prettier'],
  settings: {
    'import/resolver': {
      typescript: {},
    },
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/jsx-no-literals': ['warn', { noStrings: true }],
  },
};
