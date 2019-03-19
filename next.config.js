const withTypescript = require('@zeit/next-typescript')
const withCSS = require('@zeit/next-css')

// fix: prevents error when .css files are required by node
if (typeof require !== 'undefined') {
    require.extensions['.css'] = file => { }
}


const exportOptions = {
    exportPathMap() {
        return {
            "/": { page: "/" },
            // "/main": { page: "/main" }
        };
    }
}

module.exports = withCSS(withTypescript(exportOptions))

