var loader = require('../core/loader')
var common = require('../core/common')
var writer = require('../core/writer')
var async = require('async')

exports.alias = ['dl']
exports.help = "\
usage:  download <url1 [url2 [...]]>\n\
        download - (form stdin)  \n\
\n\
    download lyric\n\
\n\
SUPPORT URL FORMAT: \n\
    * ntes (cloudmusic) : http://music.163.com/#/m/song?id=<ID> \n\
    * qq (qqmusic) : https://y.qq.com/portal/song/<ID>.html \n\
\n\
OPTIONS: \n\
    -o --output=<file|->        name of output file, if translate lyric exists, named: <file>.tr, or use \"-\" write to stdout\n\
    -d --dir=<directory>        name of output directory\n\
    -O --out-format=<format>    output file in given format: <format>=[lrc, json]\n\
    --extract                   extract lyrics lines, match time and content\n\
"

function parseUrl(url) {
    var loaderInst = null
    var song_id = null

    if (url.indexOf('http://music.163.com/#/m/song?id=') != -1 || 
        url.indexOf('http://music.163.com/song?id=') != -1 ||
        url.indexOf('http://music.163.com/#/song?id=') != -1) {

        var m = url.match(/id=(\d+)/)

        if (!m || m.length != 2) {
            throw `can not read id'`
        } else {
            loaderInst = loader['ntes']
            song_id = m[1]
        }
    } else if (url.indexOf('https://y.qq.com/portal/song/') != -1 ||
            url.indexOf('https://y.qq.com/n/yqq/song/') != -1) {
        var m = url.match(/song\/(\w+)\.html/)

        if (!m || m.length != 2) {
            return false
        } else {
            loaderInst = loader['qq']
            song_id = m[1]
        }
    }

    if (!loaderInst) {
        throw `can't found lyric loader, url may invalid or not support`
    }

    return { 'loader': loaderInst, 'id': song_id }
}

exports.parseUrl = parseUrl

function tryExtractLyricToStr(lrc) {
    if (Array.isArray(lrc)) {
        var lines = []
        lrc.forEach((e) => {
            lines.push(`[${e[0]}]${e[1]}`)
        })
        return lines.join('\n')
    }
    return lrc
}

function createDownloadTask(opt, url, downloaded) {
    return function (cb) {
        var rt
        
        try {
            rt = parseUrl(url)
        } catch (e) {
            return cb(`parse url error: ${url}, ${e}`)
        }

        if (!rt) {
            return cb(`invalid url ${url}`)
        }

        if (downloaded[rt.id]) {
            return cb(null, true) // skip current url
        }

        rt.loader.download({ 
            id: rt.id, 
            extract: opt['extract'] && true || false 
        }, function (result) {
            downloaded[rt.id] = true

            if (result['err']) {
                console.error(result['err'])
                process.exit(2)
            }

            var outformat = opt['O'] || opt['out-format'] || 'lrc'
            var outdir = opt['d'] || opt['directory'] || ''

            if ((outdir.length > 0) && (outdir.charAt(outdir.length - 1) != '/')) {
                outdir = outdir + '/'
            }

            var writerInst

            if (opt['o'] == '-') {
                writerInst = new writer.StdoutWriter
            } else {
                writerInst = new writer.FileWriter
            }

            switch (outformat)
            {
                case 'lrc':
                    var outfile = outdir + (opt['o'] || opt['output'] || `${result['name']} (${rt.id})`)

                    if (result['lrc']) {
                        writerInst.addTask({ 
                            'filename': outfile,
                            'info': `----- START LYRIC '${result['name']}' ${rt.id} -----`,
                            'content': tryExtractLyricToStr(result['lrc']),
                         })
                    }

                    if (result['tlrc']) {
                        writerInst.addTask({ 
                            'filename': outfile + '.tr', 
                            'info': `----- START TRANSLATE -----`,
                            'content': tryExtractLyricToStr(result['tlrc']),
                        })
                    }

                    break
                case 'json':
                    var outfile = outdir + (opt['o'] || opt['output'] || `${result['name']} (${rt.id}).json`)

                    writerInst.addTask({'filename': outfile, 'content': common.JSON_stringify(result, false)})
                    break
                default:
                    console.error(`invalid out format: ${outformat}`)
                    break
            }

            writerInst.execute((err) => {
                cb(err)
            })
        })
    }
}

function downloadList(opt, urlList) {
    if (urlList.length == 0) {
        console.error("nothing to do")
        return process.exit(2)
    }

    // write to stdout
    if (opt['o'] == '-') {
        if (opt['d']) {
            console.error("can't setup output directory when write to stdout")
            return process.exit(2)
        }
    }
    
    var downloadTasks = []
    var downloaded = {}
    
    for (var i in urlList) {
        downloadTasks.push(createDownloadTask(opt, urlList[i], downloaded))
    }

    async.series(downloadTasks, function (err, results) {
        if (!err) {
            process.exit(0)
        } else {
            console.error(`download abort: ${err}`)
            process.exit(2)
        }
    })
}

function readStdin(callback) {
    var data = ''
    
    process.stdin.on('data', function(chunk) {
        data += chunk;
    })

    process.stdin.on('end', function() {
        callback(data)
    })
}

exports.handler = function (opt) {
    var urlList = []
    
    for (var i in opt['_']) {
        if (i <= 2)
            continue
        urlList.push(opt['_'][i])
    }

    // url list from stdin
    if (urlList.length == 1 && urlList[0] == '-') {
        readStdin((data) => { 
            data = data.split('\n')

            urlList = []
            
            for (var i in data) {
                var url = data[i].trim()
                if (url.length > 0)
                    urlList.push(url)
            }

            downloadList(opt, urlList)
        }) 
    } else {
        downloadList(opt, urlList)
    }
}
