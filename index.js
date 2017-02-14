var loader = require('./lib/core/loader')
var command_download = require('./lib/command/download')

module.exports.getLoader = function (name) {
    return loader[name]
}

module.exports.getLoaderFromUrl = function (url) {
    return command_download.parseUrl(url)
}
