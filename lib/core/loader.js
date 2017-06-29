var url = require('url');
var loader = {};

var loaderList = [ 
    'ntes', 
    'qq', 
    'xiami' 
];

for (var i = 0; i != loaderList.length; i++) {
    loader[loaderList[i]] = require('./loader/' + loaderList[i]);
}

exports.all = loader;

exports.parseUrl = function (urlAddress) {
    var songUrl = url.parse(urlAddress);
    for (var k in loader) {
        var inst = loader[k];

        if (!inst.config.regHost.test(songUrl.hostname))
            continue;

        var m = songUrl[inst.config.regID[0]].match(inst.config.regID[1]);

        if (!m || (m.length != 2)) {
            throw 'parse song id failed';
        }

        return [inst, m[1]]; // OK: return [ loader, songid ]
    }

    throw 'can\'t found loader, url may invalid or not support';
}