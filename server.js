var http  = require('http'),
    fs    = require('fs'),
    path  = require('path'),
    mime  = require('mime'),
    chat  = require('./lib/chat_server.js');

var cache = {};

function send404 (response) {
  response.writeHead(404, { 'Content-Type' : 'text/plain' });
  response.write('Error 404: resource not found');
  response.end();
}

function sendFile(response, filePath, fileContents) {
  response.writeHead(
      200,
      { "content-type" : mime.lookup(path.basename(filePath))}
  );

  response.end(fileContents);
}

function serveStatic (response,cache,absPath) {
  if(cache[absPath]){
    sendFile(response,absPath, cache[absPath]);
  } else {
    fs.exists(absPath, function(exists){
      if(!exists){
        send404(response);
        return; 
      }

      fs.readFile(absPath, function(err,data){
        if(err){
          send404(response);
          return;
        }

        cache[absPath] = data;
        sendFile(response, absPath, data);

      });
    });
  }

}

var server = http.createServer(function(request, response){
  var filePath = false;

  if(request.url == '/'){
    filePath = 'public/index.html';
  } else {
    filePath = 'public' + request.url;
  }

  var absPath = './' + filePath
  serveStatic(response, cache, absPath);
});

var port = 3001;
server.listen(port);

console.log('Server listening on port %d', port);

chat.listen(server);

console.log('Chat listening');
