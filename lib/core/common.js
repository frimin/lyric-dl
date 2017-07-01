var requestCount = -1
var logVisible = true

exports.createLog = function (name, id) {
    if (id)
	    requestCount += 1

	var count = requestCount

	return function(message) { 
        if (logVisible) {
            if (id) {
                console.log("#" + requestCount +  " [" + name + " - " + id + "] " + message) 
            } else {
                console.log("## [" + name + "] " + message) 
            }
        }
    }
}

exports.setLogVisible = function (b) {
	logVisible = b
}

exports.errorExit = function(text, code) {
    console.log(text)
    process.exit(code || 2)
}

exports.makeFailedData = function(text) {
	return { 'err': text || "failed to request" }
}

exports.makeLyricResponseData = function(dataList) {
	var merge = {}

	for (var i in dataList) {
		var e = dataList[i]
		if (typeof (e) == 'object') {
			for (var k in e) {
				merge[k] = e[k]
			}
		}
	}

	var rt = {
		'version': 2,
		'id': merge['id'],
        'href': merge['href'] || null,
		'name': merge['name'],
		'tname': merge['tname'] || null,
		'singer': merge['singer'], // [ { name: "", id: "" }, ...]
		'lrc': merge['lrc'] || null,
		'tlrc': merge['tlrc'] || null,
		'album': merge['album'] || null,
		'source': merge['source'],
	}

	if (!rt['id'] || !['name'] || !['album_name']) {
		return exports.makeFailedData('missing base data')
	}

	return rt
}

exports.makeSearchResponseData = function(searchResult, page) {
	if (searchResult['err']) {
		return exports.makeFailedData(searchResult['err'])
	}

	var rt = {
		'search' : searchResult,
        'page': page,
	}

	return rt
}

exports.removeEmptyFromHead = function(list) {
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

exports.errorExit = function() {
    process.exit(1)
}

exports.checkHttpResponseError = function (err, res) {
    if (err) {
        throw 'failed to request';
    }

    if (res.statusCode != 200) {
        throw 'response status code ' + res.statusCode;
    }
}