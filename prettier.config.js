/** @type {import('prettier').Config} */
module.exports = {
    semi: false,
    singleQuote: false,
    tabWidth: 2,
    useTabs: false,
    trailingComma: "es5",
    printWidth: 120,
    bracketSpacing: true,
    arrowParens: "always",
    endOfLine: "lf",
    plugins: ["prettier-plugin-tailwindcss"],
    tailwindFunctions: ["cn", "cva"],
}
