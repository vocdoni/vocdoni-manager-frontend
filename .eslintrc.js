module.exports = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true,
        },
    },
    settings: {
        react: {
            version: "detect",
        },
    },
    extends: [
        "plugin:react/recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        "indent": ["error", 4, {
            "SwitchCase": 1,
        }],
        "@typescript-eslint/no-this-alias": ["warn", {
            "allowDestructuring": true,
            "allowedNames": ["self", "that"],
        }],
        "react/react-in-jsx-scope": "off",
        "react/no-unescaped-entities": "off",
    },
}
