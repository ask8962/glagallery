/** @type {import('typedoc').TypeDocOptions} */
module.exports = {
    entryPoints: ["./lib/**/*.ts", "./lib/**/*.tsx"],
    out: "docs",
    plugin: ["typedoc-plugin-markdown"],
    readme: "README.md",
    name: "GLA Gallery API Documentation",
    excludePrivate: true,
    excludeProtected: true,
    skipErrorChecking: true,
    hideGenerator: true,
    theme: "markdown",
    githubPages: false,
}
