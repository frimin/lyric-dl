// search.js
var fs = load('fs')

exports.alias = ['s']
exports.help = "\
usage:  search <name> \n\
\n\
SUPPORT SROUCE: \n\
    * ntes \n\
    * qq \n\
\n\
OPTIONS: \n\
    -a --all                    print all information\n\
    -i --index                  print index\n\
    -u --url                    print url\n\
    -t --title                  print title\n\
    -s --singler                print singler\n\
    -b --album                  print album\n\
    -f --from=<srouce>          search from source (default: ntes) \n\
    -o --output=<file>          name of results output file, default output to stdout \n\
    --separator=<string>        set separator string (default: <space>)\n\
"

exports.handler = function (opt) {
    if (opt['_'].length < 3) {
        console.log("nothing to do")
        phantom.exit(2)
    }

    var name = opt['_'][2]
    var fromSource = opt['f'] || opt['from'] || 'ntes'
    var log = common.createLog('search:' + fromSource, name)
    var loader = common.getLoader(fromSource)

    if (!loader) {
        log('failed: search source "' + fromSource + '" not exists')
        phantom.exit(2)
    }

    var start = Date.now()

    loader.search(log, name, function(result) {
        if (result['code'] != 200) {
            log(result['err'])
            phantom.exit(2)
        } else {
            log('succeed, ' + (Date.now() - start).toString() + ' msec usage')

            var list = result['search']
            var separator = opt['separator'] || ' '
            var outfile = null

            if (opt['o'] || opt['output']) {
                try
                {
                    outfile = fs.open(opt['o'] || opt['output'], { mode: 'w', charset: 'utf8' })
                } catch (e) {
                    log(e)
                    phantom.exit(2)
                }
            }

            for (var i = 0; i != list.length; i++) {
                var item = list[i]
                var line = []

                if (opt['a'] || opt['all'] || opt['i'] || opt['index']) {
                    line.push(i.toString())
                }

                if (opt['a'] || opt['all'] || opt['u'] || opt['url']) {
                    line.push(item.href)
                }

                if (opt['a'] || opt['all'] || opt['t'] || opt['title']) {
                    line.push(item.title)
                }

                if (opt['a'] || opt['all'] || opt['s'] || opt['singler']) {
                    var names = []
                    
                    for (var j = 0; j != item.singler.length; ++j) {
                        names.push(item.singler[j].name)
                    }

                    line.push(names.join('/'))
                }

                if (opt['a'] || opt['all'] || opt['b'] || opt['album']) {
                    line.push(item.album_title)
                }

                if (line.length > 0) {
                    if (outfile)
                        outfile.write(line.join(separator) + '\n')
                    else
                        console.log(line.join(separator))
                }
            }

            if (outfile) {
                outfile.close()
            }

            phantom.exit(0)
        }
    })
} 
