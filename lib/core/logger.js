exports.createrLogger = function(level) {
    var logLevel = level;
    
    if (logLevel == 'error') {
        return function(content) {
            console.log(content);
        }
    } 

    if (logLevel == 'debug') {
        return function(content) {
            console.log(content);
        }
    }

    throw 'invalid logger type: ' + level;
}