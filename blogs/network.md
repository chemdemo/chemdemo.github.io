## 网络通讯协议知识汇聚

#### OSI网络七层协议

- 物理层
- 数据链路层
- 网络层
- 传输层
- 会话层
- 表示层
- 应用层
 
![OSI网络七层协议](http://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Rm-osi_parallel-zh.png/438px-Rm-osi_parallel-zh.png)  
*图片来自[维基百科](http://zh.wikipedia.org/wiki/OSI%E6%A8%A1%E5%9E%8B)*

#### TCP/IP协议

**（4层）网络模型**参考[维基百科](http://zh.wikipedia.org/wiki/TCP/IP%E5%8D%8F%E8%AE%AE)

* 网络接口（OSI 1和2层）
* 网络互连层（OSI 3层）
* 传输层（OSI4层）
* 应用层（OSI 5到7层）

参考：[SOCKET， TCP/UDP, HTTP, FTP](http://blog.sina.com.cn/s/blog_6dc41baf01012wzf.html)

* SOCKET
	
	* socket是通信的基石，是支持TCP/IP协议的网络通信的基本操作单元。它是网络通信过程中端点的抽象表示，包含进行网络通信必须的五种信息：连接使用的协议，本地主机的IP地址，本地进程的协议端口，远地主机的IP地址，远地进程的协议端口
	
	* 建立Socket连接至少需要一对套接字，其中一个运行于客户端，称为ClientSocket ，另一个运行于服务器端，称为ServerSocket。socket之间的连接过程分为三个步骤：服务器监听，客户端请求，连接确认
	
	* 创建Socket连接时，可以指定使用的传输层协议，Socket可以支持不同的传输层协议（TCP或UDP），当使用TCP协议进行连接时，该Socket连接就是一个TCP连接  
	
* TCP与UDP

	* TCP：传输控制协议，提供的是面向连接、可靠的字节流服务。当客户和服务器彼此交换数据前，必须先在双方之间建立一个TCP连接，之后才能传输数据。  
	
	* UDP：用户数据报协议，是一个无连接的简单的面向数据报的运输层协议。
	
	* 对比：
	<table>
		<tr>
			<th></th>
			<th>TCP</th>
			<th>UDP</th>
		</tr>
		<tr>
			<td>是否连接</td>
			<td>面向连接</td>
			<td>面向非连接</td>
		</tr>
		<tr>
			<td>传输可靠性</td>
			<td>可靠的</td>
			<td>不可靠的</td>
		</tr>
		<tr>
			<td>应用场合</td>
			<td>传输大量的数据</td>
			<td>少量数据</td>
		</tr>
		<tr>
			<td>速度</td>
			<td>慢</td>
			<td>快</td>
		</tr>
		<tr>
			<td>实现</td>
			<td>`HTTP`，`HTTPS`，`FTP`，`SMTP`，`Telnet`等</td>
			<td>`DNS`，`TFTP`(简单文件传送），`SNMP`（简单网络管理协议），`NFS`（网络文件系统）等</td>
		</tr>
	</table>

* TCP三次握手
	
	1. 客户端发送syn包(syn=j)到服务器，并进入SYN_SEND状态，等待服务器确认
	
	2. 服务器收到syn包，必须确认客户的SYN（ack=j+1），同时自己也发送一个SYN包（syn=k），即SYN+ACK包，此时服务器进入SYN_RECV状态
	
	3. 客户端收到服务器的SYN＋ACK包，向服务器发送确认包ACK(ack=k+1)，此包发送完毕，客户端和服务器进入ESTABLISHED状态，完成三次握手

#### HTTP

**完整的网络请求**

- 域名解析(DNS Lookup)
- 创建连接(connect)：创建一个`TCP`连接到服务器或代理服务器所需要的时间，如使用的是https链接这个时间还包括SSH握手过程。通常在HTTP头中使用`keep-alive`连接以避免重复连接到服务器的开销
- 发送http请求：发送HTTP请求消息到服务器，所需时间取决于发送到服务器数据量的大小，一个请求报文由请求行、请求头部、空行和请求body4部分组成
- 服务器应答：服务器收到这个请求，进行处理，返回数据。一个响应由状态行、响应头部、空行和响应数据4部分组成
- 关闭TCP连接
- 客户端渲染页面

**HTTP1.0是非持久连接，HTTP/1.1的持久连接默认是开启Keep-Alive的**  
**HTTP是无状态的，同一个客户端第二次访问同一个服务器上的页面时，服务器无法知道这个客户端曾经访问过，服务器也无法分辨不同的客户端**  

扩展阅读：[HTTP协议详解](http://www.cnblogs.com/TankXiao/archive/2012/02/13/2342672.html)
