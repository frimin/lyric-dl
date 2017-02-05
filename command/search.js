var fs = require('fs')
var loader = require('../core/loader')
var common = require('../core/common')

exports.alias = ['s']
exports.help = "\
usage:  search <name> \n\
\n\
SUPPORT SROUCE: \n\
    * ntes \n\
\n\
OPTIONS: \n\
    -a --all                    print all information\n\
    -i --index                  print index\n\
    -u --url                    print url\n\
    -n --name                   print name\n\
    -s --singler                print singler\n\
    -b --album                  print album\n\
    -f --from=<srouce>          search from source (default: ntes) \n\
    -o --output=<file>          name of results output file, default output to stdout \n\
    --separator=<string>        set separator string (default: <space>)\n\
"

exports.handler = function (opt) {
    if (opt['_'].length < 4) {
        console.log("nothing to do")
        process.exit(2)
    }

    var name = opt['_'][3]
    var fromSource = opt['f'] || opt['from'] || 'ntes'
    var log = common.createLog('search:' + fromSource, name)
    var loaderInst = loader[fromSource]

    if (!loaderInst) {
        log('failed: search source "' + fromSource + '" not exists')
        process.exit(2)
    }

    var start = Date.now()

    loaderInst.search({ name: name, logger: log }, function(result) {
        if (result['code'] != 200) {
            log(result['err'])
            process.exit(2)
        } else {
            log('succeed, ' + (Date.now() - start).toString() + ' msec usage')

            var list = result['search']
            var separator = opt['separator'] || ' '
            var lines = []

            for (var i = 0; i != list.length; i++) {
                var item = list[i]
                var line = []

                if (opt['a'] || opt['all'] || opt['i'] || opt['index']) {
                    line.push(i.toString())
                }

                if (opt['a'] || opt['all'] || opt['u'] || opt['url']) {
                    line.push(item.href)
                }

                if (opt['a'] || opt['all'] || opt['n'] || opt['name']) {
                    line.push(item.name)
                }

                if (opt['a'] || opt['all'] || opt['s'] || opt['singler']) {
                    var names = []
                    
                    for (var j = 0; j != item.singler.length; ++j) {
                        names.push(item.singler[j].name)
                    }

                    line.push(names.join('/'))
                }

                if (opt['a'] || opt['all'] || opt['b'] || opt['album']) {
                    line.push(item.album.name)
                }

                if (line.length > 0)
                    lines.push(line.join(separator))
            }

            var outfile = opt['o'] || opt['output']

            if (outfile) {
                fs.writeFile(outfile, lines.join('\n'), (err) => { 
                    if (err) {
                        console.error(err)
                        process.exit(2)
                    }
                })
            } else {
                console.log(lines.join('\n'))
                process.exit(0)
            }
        }
    })
} 
