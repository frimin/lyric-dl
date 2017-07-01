var loader = require('./lib/core/loader')

// APIs

module.exports.getLoader = function (name) {
    return loader.all[name];
}

module.exports.getLoaderFromUrl = function (url) {
    return loader.parseUrl(url)
}
