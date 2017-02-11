exports.assert = function(c, text) {
    if (!c) {
        console.error(text)
        process.exit(2)
    }
}