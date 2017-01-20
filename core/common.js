var viewError = false

exports.createPage = function (url, callback, page) {
	if (page == null) {
		page = new WebPage();
		page.clipRect = { top: 0, left: 0, width: 1024, height: 768 };
		page.viewportSize = { width: 1024, height: 768 };
		page.settings.resourceTimeout = 8000;
		page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36';
		page.settings.loadImages = false

		page.onError = function(msg, trace) {
			if (!viewError)
				return
			var msgStack = ['ERROR: ' + msg];

			if (trace && trace.length) {
				msgStack.push('TRACE:');
				trace.forEach(function(t) {
					msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
				});
			}

			console.error(msgStack.join('\n'));
		};
	}

	page.open(url, callback);
	page.clearCookies()

	return page
}

exports.ViewError = function (b) {
	viewError = b
}

var requestCount = 0
var logVisible = true

exports.createLog = function (source, id) {
	requestCount += 1
	var count = requestCount
	return function(message) { 
        if (logVisible)
            console.log("#" + requestCount +  " [" + source + " - " + id + "] " + message) 
    }
}

exports.setLogVisible = function (b) {
	logVisible = b
}

exports.errorExit = function(text, code) {
    console.log(text)
    phantom.exit(code || 2)
}

exports.sourceList = [ "nets", "qq" ]

exports.makeFailedData = function(text) {
	return { 'code': 400, 'err': text || "failed to request" }
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
		'version': 1,
		'id': merge['id'],
		'name': merge['name'],
		'tname': merge['tname'] || null,
		'singer': merge['singer'], // { name: "", id: "" }
		'lrc': merge['lrc'] || null,
		'tlrc': merge['tlrc'] || null,
		// 'mv_id': merge['mv_id'] || null,
		'album_name': merge['album_name'] || null,
		'album_id': merge['album_id'] || null,
		'source': merge['source'],
		'code': 200,
	}

	rt['nolyric'] = merge['nolyric'] || (!rt['lrc'] && true || false)

	if (!rt['id'] || !['name'] || !['album_name']) {
		return exports.makeFailedData('missing base data')
	}

	return rt
}

exports.makeSearchResponseData = function(searchResult) {
	if (searchResult['err']) {
		return exports.makeFailedData(searchResult['err'])
	}

	var rt = {
		'search' : searchResult,
		'code': 200,
	}

	return rt
}

var loadersets = {
    'ntes': require(phantom.libraryPath + '/core/downloader/ntes.js'),
    'qq': require(phantom.libraryPath + '/core/downloader/qq.js'),
}

exports.getLoader = function(name) {
    return loadersets[name]
}