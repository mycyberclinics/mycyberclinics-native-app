module.exports = {
  root: true,
  extends: ["universe/native", "plugin:react-hooks/recommended", "prettier"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
};
