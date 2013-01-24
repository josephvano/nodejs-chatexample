var socketio = require('socket.io');

var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed =[];
var currentRoom = {};


exports.listen = function(server){
  io = socketio.listen(server);
  io.set('log level', 1);

  io.sockets.on('connection', function(socket){
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);

    joinRoom(socket, 'Lobby');

    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on('rooms', function(){
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed);
  });
}


function assignGuestName(socket, guestNumber, nickNames, namesUsed){
  var next = guestNumber + 1;
  var name = 'Guest' + guestNumber;

  nickNames[socket.id] = name;

  socket.emit('nameRequest', {
    success : true,
    name : name
  });

  namesUsed.push(name);

  return next;
}

function joinRoom(socket, room) {
  socket.join(room);

  currentRoom[socket.id] = room;

  socket.emit('joinResult', { room : room });
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + ' has joined ' + room + '.'
  });

  var usersInRoom = io.sockets.clients(room);
  
  if(usersInRoom.length > 1){
    var usersInRoomSummary = 'Users currently in ' + room + ': ';
    for(var index in usersInRoom){
      var sid = usersInRoom[index].id;

      if(sid === socket.id) continue;

      if(index>0){
        usersInRoomSummary += ', ';
      }

      usersInRoomSummary  += nickNames[sid];
    }

    usersInRoomSummary += '.';
    socket.emit('message', {text : usersInRoomSummary}); 
  }
}

function handleNameChangeAttempts (socket, nickName, namesUsed) {
  socket.on('nameAttempt', function(name){

    if(name.indexOf('Guest') === 0) {

      socket.emit('nameResult', {
        success : false,
        message : 'Names cannot begin with "Guest".'
      });

      return;
    }

    if(namesUsed.indexOf(name) == -1){
      var previousName = nickNames[socket.id];
      var previousNameIndex = namesUsed.indexOf(previousName);

      namesUsed.push(name);
      nickNames[socket.id] = name;

      delete namesUsed[previousNameIndex];
      
      socket.emit('nameResult', {
        success : true,
        name : name
      });

      return;
    }

    socket.emit('nameResult', {
      success : false,
      message : 'That name is already in use.'
    });

  });
}

function handleMessageBroadcasting (socket) {
  socket.on('message', function(message){
    socket.broadcast.to(message.room).emit('message', {
      text : nickNames[socket.id] + ': ' + message.text
    });
  });
}

function handleRoomJoining (socket) {
  socket.on('join', function(room){
    socket.leave(currentRoom[socket.id]);

    joinRoom(socket, room.newRoom);
  });
}

function handleClientDisconnection(socket){
  socket.on('disconnect', function(){
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}
