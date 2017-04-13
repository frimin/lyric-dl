## Lyrics Download Tools

**lyric-dl** 是一个下载在线音乐歌词的命令行工具，它是一个 Node.js 程序，在使用它之前你必须安装 [Node.js](https://nodejs.org/en/)

目前支持的网站：

* **网易云音乐 (ntes)** :
* **QQ音乐 (qq)**

安装

	npm install lyric-dl -g

更新

	npm update lyric-dl -g

OR

	git clone https://github.com/frimin/lyric-dl
	cd lyric-dl
	npm install
	ln -s bin/lyric-dl lyric-dl
	./lyric-dl dl <URL>

### 使用

命令格式

	lyric-dl [命令 [参数 [参数 ...]]] [选项]

拥有一个歌曲地址，可以通过 URL 来下载歌词，以 JSON 格式输出到标准输出以获取歌曲信息

	lyric-dl download <url> --output - --out-format json

通过歌曲名来获取搜索结果

	lyric-dl search <name>

使用管道批量下载搜索结果的歌词到当前目录

	lyric-dl search <name> --url | lyric-dl dl -
	
在下载命令中可以指定 **--extract** 选项，该选项会提取歌词的正文内容，剔除标题等其他信息

### WebAPI

工具内建了一个简易的 WebServer 提供了 WebAPI 以 JSON 格式返回数据。启动 WebServer:

	lyric-dl server

### 获得其它帮助内容
	lyric-dl --help
