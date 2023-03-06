module.exports = {
  // ts related rules
  indent: 0,
  '@typescript-eslint/indent': 0,
  '@typescript-eslint/explicit-member-accessibility': 0,
  '@typescript-eslint/camelcase': 0,
  'import/no-webpack-loader-syntax': 0,
  '@typescript-eslint/prefer-interface': 0,
  'import/no-cycle': 1,
  'react/prop-types': 0,
  '@typescript-eslint/ban-ts-ignore': 1, // Remove after ts adoption increases
  '@typescript-eslint/explicit-function-return-type': [
    1,
    {
      allowTypedFunctionExpressions: true,
    },
  ],
  '@typescript-eslint/no-this-alias': 0,
  'sprinklr/no-logic-i18n-template-literal': 2,
}
