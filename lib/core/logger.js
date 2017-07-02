var createDebug = require('debug');

function fakeLog() { }

exports.createLog = function(level, namespace) {
    var logLevel = level;
    
    if (logLevel == 'error') {
        return function(content) {
            console.error(content);
        }
    } 

    if (logLevel == 'debug') {
        return createDebug(namespace || 'LYRIC-DL');
    }

    if (logLevel == 'fake') {
        return fakeLog;
    }

    throw 'invalid logger type: ' + level;
}