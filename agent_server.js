var server = require('webserver').create(),
system = require('system'),
fs     = require('fs');

function createPage(url, callback, page) {
	if (page == null) {
		page = new WebPage();
		page.clipRect = { top: 0, left: 0, width: 1920, height: 1080 };
		page.viewportSize = { width: 1920, height: 1080 };
		page.settings.resourceTimeout = 8000;
		page.settings.userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36';
		page.settings.loadImages = false
		page.onError = function(msg, trace) {
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
	//page.clearCookies()
	return page
}

function parseGET(url){
	var query = url.substr(url.indexOf("?")+1);
	var result = {};
	query.split("&").forEach(function(part) {
		var e = part.indexOf("=")
		var key = part.substr(0, e);
		var value = part.substr(e+1);
		result[key] = decodeURIComponent(value);
	});
	return result;
}

var requestCount = 0

function makeFailedData(text) {
	return JSON.stringify({ 'code': 400, 'err': text || "failed to request" })
}

function makeResponseData(dataList) {
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
		'code': 200,
	}

	rt['nolyric'] = merge['nolyric'] || (!rt['lrc'] && true || false)

	if (!rt['id'] || !['name'] || !['album_name']) {
		return makeFailedData('missing base data')
	}

	return JSON.stringify(rt)
}

function makeLog(source, id) {
	requestCount += 1
	var count = requestCount
	return function(message) { console.log("#" + requestCount +  " [" + source + " - " + id + "] " + message) }
}

// 下载网易云音乐的歌词
function download_ntes(id, response) {
	var log = makeLog('ntes', id)
	console.log('open page start, ntes:' + id)
	var url = 'http://music.163.com/#/m/song?id=' + id
	log('open: ' + url)
	var page = createPage(url, function(status) {
		log('ok')
		page.onConsoleMessage = function(msg, lineNum, sourceId) {
			try {
				log('load lyrics finished, try read song info')
				var song_info = page.evaluate(function() {
					var c = window.contentFrame.document.getElementsByTagName('a')
					var name = null
					var tname = null
					var mv_id = null
					var album_name = null
					var album_id = null
					var singer = [ ]

					for (var i=0; i!= c.length; ++i) {
						if (c[i].getAttribute('data-res-name') != null) {
							name = c[i].getAttribute('data-res-name')
						}

						if (!mv_id && (c[i].getAttribute('href') != null) && (c[i].getAttribute('href').indexOf('/mv?id=') != -1)) {
							mv_id = c[i].getAttribute('href').match(/\d+/)
							mv_id = mv_id.length > 0 && mv_id[0] || null
						}

						if (!album_id && (c[i].getAttribute('href') != null) && (c[i].getAttribute('href').indexOf('/album?id=') != -1)) {
							album_name = c[i].text
							album_id = c[i].getAttribute('href').match(/\d+/)
							album_id = album_id.length > 0 && album_id[0] || null
						}

						if ((c[i].getAttribute('href') != null) && (c[i].getAttribute('href').indexOf('/artist?id=') != -1)) {
							var author_name = c[i].text
							var author_id = c[i].getAttribute('href').match(/\d+/)
							if (author_id.length == 1) {
								singer.push({ 'name': author_name, 'id': author_id[0] })
							}
						}
					}

					var c = window.contentFrame.document.getElementsByClassName('tit')

					if (c.length > 0) {
						var c2 = c[0].getElementsByClassName('subtit')
						if (c2.length > 0) {
							tname = c2[0].textContent
						}
					}

					return {
						'name': name,
						'tname': tname,
						'mv_id': mv_id,
						'album_name': album_name,
						'album_id': album_id,
						'singer': singer
					}
				});

				if (song_info == null || song_info == undefined || !song_info['name']) {
					log('failed read song info')
					response(makeFailedData('failed read song info'))
				} else {
					var data = JSON.parse(msg)
					response(makeResponseData([
						song_info,
						{
							'id': id,
							'lrc': data['lrc'] != null && data['lrc']['lyric'] || null,
							'tlrc': data['tlyric'] != null && data['tlyric']['lyric'] || null
						}
					]))
					log('load lyrics succeed')
				}
			}
			catch(e)
			{
				response(makeFailedData(e || 'err'))
			}

			setTimeout(function(){
				page.close();
			}, 100)
		};

		log('load lyrics start')

		page.evaluateJavaScript('(function(){var bd=NEJ.P,bI=bd("nej.ut"),bA=bd("nej.j"),bL=bd("nm.s"),bc,bO;bL.bnA=NEJ.C();bc=bL.bnA.bU(bI.fb);bc.cY=function(){this.df();var bZ="/api/song/lyric",cN={id:#ID#,lv:-1,tv:-1};this.EF=cN.id;bA.cG(bZ,{sync:false,type:"json",query:cN,method:"get",onload:this.bny.bi(this),onerror:this.bny.bi(this)})};bc.bny=function(be){console.log(JSON.stringify(be))};new bL.bnA})'.replace("#ID#", id))
	})
}

// 下载qq音乐的歌词
function download_qq(id, response) {
	var log = makeLog('qq', id)
	var url = "https://y.qq.com/portal/song/" + id + '.html'
	log('open: ' + url)
	var page = createPage(url, function(status) {
		log('ok')

		var g_SongData = page.evaluate(function(){
			return window.g_SongData
		})

		log('info: ' + JSON.stringify(g_SongData))

		if (!g_SongData) {
			response(makeFailedData('no song data'))
			return
		}

		var baseData = {
			'id': g_SongData['singermid'],
			'name': g_SongData['songname'],
			'tname': g_SongData['songtitle'],
			'album_id': g_SongData['albummid'],
			'album_name': g_SongData['albumname'],
			'singer': [],
		}

		for (i in g_SongData['singer']) {
			var s = g_SongData['singer'][i]
			baseData['singer'][i] = { 'id': s['mid'], 'name': s['name'] }
		}

		page.evaluate(function(g_SongData) {
			localStorage.clear()
			localStorage.setItem("y_playlist", JSON.stringify([ g_SongData ]))
		}, g_SongData)

		page.evaluate(function() {
			var e = document.getElementsByClassName("js_all_play")
			e[0].click()
		})

		var url = 'https://y.qq.com/portal/player.html'
		log('open: ' + url)
		var player_page = createPage(url, function(status) {
			if (status != 'success') {
				log('failed')
				response(makeFailedData('failed to open page'))
				return
			} else {
				log('ok')
			}

			/*player_page.evaluate(function(g_SongData) {
				window.require('js/common/player.js').add([g_SongData], 1)
			}, g_SongData);*/
			
			var timeusage = 0

			function try_get_lyrics() {
				player_page.evaluate(function() { 
					var btn = document.getElementById("btnplay")
					if (btn != null) {
						document.getElementById("btnplay").click() 
					} // may loading page
				})

				if (timeusage > 5000) {
					log('load lyrics timeout')
					player_page.render('player_falied_screenshot.png');
					response(makeFailedData('load lyrics timeout'))
					setTimeout(function(){
						player_page.close();
					}, 100)
					return
				}

				var lrc = player_page.evaluate(function(id){
					var data = window.top['qqmusic_lyrics_lrc' + id]
					if (data) {
						data = require("js/common/module/coder.js").Base64.decode(data)
					}
					return data
				}, id)

				var tlrc = player_page.evaluate(function(id){
					var data = window.top['qqmusic_lyrics_trans' + id]
					if (data) {
						data = require("js/common/module/coder.js").Base64.decode(data) 
					}
					return data
				}, id)

				if (lrc) {
					log('load lyrics succeed')

					if (lrc.indexOf('[00:00:00]此歌曲为没有') != -1) {
						lrc = null
					}

					response(makeResponseData([ baseData, { 'lrc': lrc, 'tlrc': tlrc } ]))
					setTimeout(function(){
						player_page.close();
					}, 100)
				} else {
					timeusage += 100
					setTimeout(try_get_lyrics, 100)
				}
			}

			try_get_lyrics()
		})
	}, page)
}

function launch(host) {
	var service = server.listen(host, function(request, response) {
		var query = parseGET(request.url)

		function make_response(content) {
			response.statusCode = 200;
			response.setHeader('Content-Type', 'text/html; charset=utf-8');
			response.write(content);
			response.close();
		}

		if (query["id"] == undefined || query["s"] == null) {
			make_response(JSON.stringify({ 'code': 404 }));
			return
		}

		var source = query["s"]

		if (source == 'ntes') {
			download_ntes(query["id"], make_response)
		} else if (source == 'qq') {
			download_qq(query["id"], make_response)
		} else {
			make_response(JSON.stringify({ 'code': 404 }))
		}
	});

	if (service) {
		console.log('server started - http://' + host)
	} else {
		console.log('error: failed to start server, ' + host)
	}
}

if (system.args.length != 2) {
	console.log('no config file')
} else {
	try {
		var configFile = system.args[1]
		console.log('CONFIG: ' + configFile)
		var config = JSON.parse(fs.read(configFile))
		
		launch((config['host'] || '0.0.0.0') + ':' + config['port'].toString())
	} catch(e) {
		console.log('error: ' + e)
	}
}
