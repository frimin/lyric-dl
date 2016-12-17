# lyric-dl

命令行中下载在线歌词的工具

## INSTALLATION

对于 UNIX 用户 (Linux, OS X, 其他):

需要安装 [Node.js] (https://nodejs.org)，建议同时安装 npm

以及 [PhantomJS](http://phantomjs.org):

	$ npm install phantomjs -g
	
## USAGE

在使用脚本之前先为其添加可执行权限

	chmod u+x lyric-dl

### 命令格式
	lyric-dl [命令 [参数 [参数 ...]]] [选项]

#### 下载歌词

命令: __url__

	./lyric-dl url <url>
	
这种形式将会默认保存 <歌曲名> 到文件，如果歌词有翻译，则会额外保存一个 <歌曲名.tr> 文件

如果需要指定输出名称，请用下列形式的命令:

	./lyric-dl url <url> -o <output>
	
如果需要更多的数据，例如演唱者，专辑名称等，请指定输出格式为 json:

	./lyric-dl url <url> -O json

支持的链接格式：

* **网易云音乐 (ntes)** : http://music.163.com/#/m/song?id=XXXXXX
* **qq音乐 (qq)** : https://y.qq.com/portal/song/XXXXXX.html
