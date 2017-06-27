var fs = require('fs')
var loader = require('../core/loader')
var common = require('../core/common')

var nonAllPrintOpt = [ 'outputUrl', 'outputName', 'outputSingler', 'outputAlbum' ]

function handler(name, options) {
    var fromSource = options['f'] || options['from'] || 'ntes'
    var loaderInst = loader[fromSource]

    if (!loaderInst) {
        console.error('failed: search source "' + fromSource + '" not exists')
        process.exit(2)
    }

    var index = null, length = null

    if (options['r'] || options['range']) {
        var m = (options['r'] || options['range']).match(/^(\d+),(\d+)$/)

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
            var separator = options['separator'] || ' '
            var lines = []

            var printAll = true

            nonAllPrintOpt.forEach((e) => {
                printAll = !options[e] && printAll
            })

            for (var i = 0; i != list.length; i++) {
                var item = list[i]
                var line = []

                if (printAll || options['outputUrl']) {
                    line.push(item.href)
                }

                if (printAll || options['outputName']) {
                    line.push(item.name)
                }

                if (printAll || options['outputSingler']) {
                    var names = []
                    
                    for (var j = 0; j != item.singler.length; ++j) {
                        names.push(item.singler[j].name)
                    }

                    line.push(names.join('/'))
                }

                if (printAll || options['outputAlbum']) {
                    line.push(item.album.name)
                }

                if (line.length > 0)
                    lines.push(line.join(separator))
            }

            var outfile = options['output']

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

exports.init = function (state, program) {
    program
        .command('search <name>')
        .description('search from song name')
        .option('-f, --from <source>', 'search from source (default: ntes)')
        .option('--separator <separator>', 'set separator string (default: <space>)')
        .option('-r --range <index>,<length>', 'limit results amount and start position (default: 0,30)')
        .option('--output-url', 'output url')
        .option('--output-name', 'output name')
        .option('--output-singler', 'output singler')
        .option('--output-album', 'output album')
        .action(function(args, options){
            state.execCmd = true
            handler(args, options);
        });
}