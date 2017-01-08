# lyric-dl

命令行中下载 网易云音乐 / qq音乐的歌词工具

# 安装

对于 UNIX 用户 (Linux, OS X, 其他):

需要安装 [Node.js] (https://nodejs.org)，建议同时安装 npm

以及 [PhantomJS](http://phantomjs.org):

	$ npm install phantomjs -g
	
# 使用

在使用脚本之前先为其添加可执行权限

	chmod u+x lyric-dl

## 命令格式
	lyric-dl [命令 [参数 [参数 ...]]] [选项]

### 下载歌词

直接在命令行中下载歌词:

	./lyric-dl url <url>
	
这种形式将会默认保存 <歌曲名> 到文件，如果歌词有翻译，则会额外保存一个 <歌曲名.tr> 文件

如果需要指定输出名称，请用下列形式的命令:

	./lyric-dl url <url> -o <output>
	
如果需要更多的数据，例如演唱者，专辑名称等，请指定输出格式为 json:

	./lyric-dl url <url> -O json

支持的链接格式：

* **网易云音乐 (ntes)** : http://music.163.com/#/m/song?id=XXXXXX
* **qq音乐 (qq)** : https://y.qq.com/portal/song/XXXXXX.html

### 启动 Web 服务器

支持启动一个 web 服务器以提供 webapi 接口:

	./lyric-dl server -h 127.0.0.1 -p 8080
	
可以用下列命令测试:
	
	curl "http://localhost:8080/?act=id&id=<song_id>&s=<source_type>"
	
### 获得其他帮助内容
	./lyric-dl --help
