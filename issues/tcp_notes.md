# TCP协议知识小记

### TCP三次握手（Three-way Handshake）

假设： A是客户端 B是服务器

1. A向B发送一个SYN (Synchronize) 标记的包，请求与服务器建立连接：

    A --> [SYN] --> B

2. B收到A的SYN包，发送一个对SYN包的确认包（SYN/ACK）回去，表示对第一个SYN包的确认：
    
    B --> [SYN/ACK] --> A

3. A收到B的SYN/ACK包，发一个确认包（ACK）给B，通知B连接已经建立。

    A --> [ACK] --> B

当三此握手完成、连接建立以后，TCP连接的每个包都会设置ACK位。当防火墙收到ACK包时，最好是应当先在连接表中确认下是否属于哪个已经建立的连接，如果没有则认为是恶意攻击，应该丢弃此包。

### TCP四次握手关闭连接（Four-way Handshake）

1. A --> [ACK/FIN] --> B

2. B --> [ACK] --> A

3. B --> [ACK/FIN] --> A

4. A --> [ACK] --> B

ACK/FIN包即终结包，由于连接还没有关闭, FIN包总是打上ACK标记。没有ACK标记而仅有FIN标记的包不是合法的包，并且通常被认为是恶意的。

有时，如果主机需要尽快关闭连接(或连接超时,端口或主机不可达)，RST (Reset)包将被发送。注意在，由于RST包不是TCP连接中的必须部分, 可以只发送RST包(即不带ACK标记)。但在正常的TCP连接中RST包可以带ACK确认标记。

注意：由于SYN包是用来初始化连接的, 它不可能和FIN或RST标记一起出现，这也是一个恶意攻击。当网络中出现一下包组合时，表明网络已经遭受到攻击了，如：SYN/FIN，SYN/FIN/PSH, SYN/FIN/RST, SYN/FIN/RST/PSH。

