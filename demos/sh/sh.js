var Connection = require('ssh2');

var conn = new Connection();
conn.on('ready', function() {
  console.log('Connection :: ready');
  conn.shell('uptime', function(err, stream) {
    if (err) throw err;
    stream.on('close', function() {
      console.log('Stream :: close');
      conn.end();
    }).on('data', function(data) {
      console.log('> ', data.toString('utf8'));
    }).stderr.on('data', function(data) {
      console.log('STDERR: ' + data);
    });

    process.stdin.on('data', function(data) {
      stream.write(data);
    });
    // stream.end('ls -l\nexit\n');
  });
}).connect({
  host: '162.243.148.109',
  port: 22,
  username: 'root',
  password: 'pass4dm@vps'
});
