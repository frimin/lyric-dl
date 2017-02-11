var fs = require('fs')
var loader = require('../core/loader')
var common = require('../core/common')

exports.alias = ['s']
exports.help = "\
usage:  search <name> \n\
\n\
SUPPORT SROUCE: \n\
    * ntes \n\
    * qq\n\
\n\
OPTIONS: \n\
    -u --url                    print url\n\
    -n --name                   print name\n\
    -s --singler                print singler\n\
    -b --album                  print album\n\
    -f --from=<srouce>          search from source (default: ntes) \n\
    -o --output=<file>          name of results output file, default output to stdout \n\
    --separator=<string>        set separator string (default: <space>)\n\
    -r --range=<index>,<length> set results range (default: 0,30)\n\
"

var nonAllPrintOpt = [ 'u', 'url', 'n', 'name', 's', 'singler', 'b', 'album' ]

exports.handler = function (opt) {
    if (opt['_'].length < 4) {
        console.error("nothing to do")
        process.exit(2)
    }

    var name = opt['_'][3]
    var fromSource = opt['f'] || opt['from'] || 'ntes'
    var loaderInst = loader[fromSource]

    if (!loaderInst) {
        console.error('failed: search source "' + fromSource + '" not exists')
        process.exit(2)
    }

    var index = null, length = null

    if (opt['r'] || opt['range']) {
        var m = (opt['r'] || opt['range']).match(/^(\d+),(\d+)$/)

        if (!m && m.length != 3) {
            console.error('invalid results range format')
            process.exit(2)
        }

        index = parseInt(m[1])
        length = parseInt(m[2])
    }

    loaderInst.search({ name: name, index: index, length: length  }, function(result) {
        if (result['err']) {
            console.log(result['err'])
            process.exit(2)
        } else {
            var list = result['search']
            var separator = opt['separator'] || ' '
            var lines = []

            var printAll = true

            nonAllPrintOpt.forEach((e) => {
                printAll = !opt[e] && printAll
            })

            for (var i = 0; i != list.length; i++) {
                var item = list[i]
                var line = []

                if (printAll || opt['u'] || opt['url']) {
                    line.push(item.href)
                }

                if (printAll || opt['n'] || opt['name']) {
                    line.push(item.name)
                }

                if (printAll || opt['s'] || opt['singler']) {
                    var names = []
                    
                    for (var j = 0; j != item.singler.length; ++j) {
                        names.push(item.singler[j].name)
                    }

                    line.push(names.join('/'))
                }

                if (printAll || opt['b'] || opt['album']) {
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
