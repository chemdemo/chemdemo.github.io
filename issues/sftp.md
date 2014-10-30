# sftp连接失败排查小记

好久没有连ftp，最近想传点文件上去，打开FileZilla却发现怎么都连不上了，一直显示连接超时，无法连接上去，还以为是公司电脑升级各种安全软件导致的，可以在家里mac下试了也是同样的错误。

可是奇怪的是ssh连接正常，于是看了下系统日志，在网上搜索同类问题，大概都是说Subsystem路径配置的问题，于是检查了下发现没错，路径是对的。于是接着查系统日志：

``` bash
cat /var/log/secure | grep sftp
```
显示一堆：

``` bash
subsystem request for sftp
```

这说明系统认为sftp已经连上了，没提供有用的错误信息。

很纳闷，于是决定换client试试，改用sublime 插件连接。

以下是使用sublime text 3的sftp插件连接的过程：

首先安装Package Control，都说打开Console控制台粘贴一段代码后按回车即可安装，但是试了下不成功，遂采取手动安装，直接下载[Package Control.sublime-package](https://sublime.wbond.net/Package%20Control.sublime-package)拷贝到`C:\Users\\[user]\AppData\Roaming\Sublime Text 3\Installed Packages`下面即可。

然后是配置代理，很多公司都做了限制吧。依次点击`Preferences > Package settings > Package Control > Settings User`在里边添加：

``` json
"http_proxy": "[host]:[port]",
"http_proxy": "[host]:[port]"
```

然后就是快捷键`Ctrl + Shift + p`选择`Install Package`项，搜索`sftp`回车即可。

接下来是配置sftp：

点击`File > SFTP/FTP > Setup Server`会弹出一个配置文件的模板，按照需要配置完成保存即可。

点击`File > SFTP/FTP > Browser Server`选择刚才配置好的文件即可开始sftp连接。

最后可惜的是，这种方式也失败，遂联系vps运营商。
