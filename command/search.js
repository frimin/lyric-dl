var common = require(phantom.libraryPath + '/core/common.js')

exports.handler = function (opt) {
    if (opt['_'].length < 3) {
        console.log("nothing to do")
        phantom.exit(2)
    }

    var name = opt['_'][2]
    var loader = common.getLoader('ntes')

    loader.search(name, function(result) {
        if (result['code'] != 200) {
            console.error(result['err'])
            phantom.exit(1)
        } else {
            var list = result['search']
            var separator = opt['separator'] || ' '

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
                    line.push(names.join(item.album_title))
                }

                if (line.length > 0)
                    console.log(line.join(separator))
            }

            phantom.exit(0)
        }
    })
} 