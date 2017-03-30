var reg = /^([\d,:-]+)([^\d])(.*)/

function parseExtendargs(extendargs) {
    if (!extendargs) {
        return []
    }
    return extendargs.split(',')
}

function parseTarget(target) {
    if (target.indexOf(':') != -1) {
        var content = target.split(':')

        if (content.length != 2) {
            throw `invalid index range: ${target}`
        }

        return { type: 'range', content: content }
    } else {
        var content = target.split(',')

        if (content.length == 0) {
            throw `invalid index list: ${target}`
        }

        return { type: 'index', content: content }
    }
}

function parseCode(code) {
    var cmds = []

    var lines = code.split(';')
    
    lines.forEach((line) => {
        var m = line.slice().match(reg)

        if (!m) {
            throw `invalid code "${line}"`
        }
        
        cmds.push({
            target: parseTarget(m[1]),
            command: m[2],
            args: parseExtendargs(m[3]),
            raw: line,
        })
    })

    return cmds
}

exports.parseCode = parseCode