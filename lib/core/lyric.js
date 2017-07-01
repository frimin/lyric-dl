function removeEmptyFromHead(list) {
    var i = 0

    for(var j = 0; j != list.length; j++) {
        if (list[j][1] == '') {
            i = j + 1
        } else {
            break
        }
    }

    if (i != 0) {
        list.splice(0, i)
    }
}

function toLines(lyric) {
    if (!lyric) {
        return null;
    }

    if (Array.isArray(lyric)) {
         return lyric.slice();
    } else {
        return lyric.split('\n');
    }
}

function doExtract(lyric, options) {
    var ret = []

    var lines = toLines(lyric);

    var lastContent = null;

    for(var i in lines) {
        if (!options.deleteLineLimit || (i <= options.deleteLineLimit)) {
            if (options.reDeleteLine.test(lines[i]))
                continue;
        }

        var m = lines[i].match(/\[(\d+:\d+\.\d+)\](.*)/)

        if (m && m.length == 3) {
            var content
            if (options.reDeleteWord) {
                ret.push([m[1], m[2].trim().replace(options.reDeleteWord, '')]);
            } else {
                ret.push([m[1], m[2].trim()]);
            }
        }
    }

    return ret
}

exports.extractLyrics = function(lyric, tlyric, options) {
    return [doExtract(lyric, options), doExtract(tlyric, options)];
}