module.exports = {
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
  ],
  rules: {
    'semi': ['error', 'always'],
    'vue/multi-word-component-names': 'off'
  }
};
