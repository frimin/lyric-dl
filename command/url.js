var common = require(phantom.libraryPath + '/core/common.js')

function download(opt, url, response) {
    var loader = null
    var song_id = null

    if (url.indexOf('http://music.163.com/#/m/song?id=') != -1 || url.indexOf('http://music.163.com/song?id=') != -1) {
        var m = url.match(/id=(\d+)/)

        if (!m || m.length != 2) {
            console.log("invalid url")
            phantom.exit(2)
        } else {
            loader = common.getLoader('ntes')
            song_id = m[1]
        }
    } else if (url.indexOf('https://y.qq.com/portal/song/') != -1) {
        var m = url.match(/song\/(\w+)\.html/)

        if (!m || m.length != 2) {
            console.log("invalid url")
            phantom.exit(2)
        } else {
            loader = common.getLoader('qq')
            song_id = m[1]
        }
    }

    if (loader == null || song_id == null) {
        console.log("invalid url")
        phantom.exit(2)
    } else {
        loader.downloadLyric(song_id, response)
    }
}

exports.handler = function (opt) {
    if (opt['_'].length < 3) {
        console.log("nothing to do")
        phantom.exit(2)
    }

    download(opt, opt['_'][2], function(result) {
        var outformat = opt['O'] || opt['out-format'] || 'lrc'

        switch (outformat)
        {
            case 'lrc':
                var outfile = opt['o'] || opt['output'] || result['name']

                if (result['lrc'])
                    fs.write(outfile, result['lrc'], 'w')

                if (result['tlrc'])
                    fs.write(outfile + '.tr', result['tlrc'], 'w')
                break
            case 'json':
                var outfile = opt['o'] || opt['output'] || (result['name'] + '.json')
                
                fs.write(outfile, JSON.stringify(result), 'w')
                break
            default:
                console.log("invalid out format: " + outformat)
                phantom.exit(2)
                break
        }
        
        phantom.exit(0)
    })
}