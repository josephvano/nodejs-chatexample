function userOutput(message){
  return $('<div></div>').text(message);
}

function systemOutput(message){
  return $('<div></div>').html('<em>' + message + '</em>');
}

function processUserInput (chatApp, socket) {
  var message = $('#send-message').val();
  var systemMessage;

  if(message.charAt(0) === '/'){
    systemMessage = chatApp.processCommand(message);

    if(systemMessage){
      $('#messages').append(systemOutput(systemMessage));
    }

  } else {

    chatApp.sendMessage( $('#room').text(), message );
    $('#messages').append(userOutput(message));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }

  $('#send-message').val('');
}

var socket = io.connect();
var $message = $('#messages');

var chatApp = new Chat(socket);

socket.on('nameResult', function(result){
  var message;

  if(result.success){
    message = 'You are now nown as ' + result.name + '.';
  } else {
    message = result.message;
  }

  $('#messages').append(systemOutput(message));
});

socket.on('joinResult', function(result){
  $('#room').text(result.room);
  $('#messages').append(systemOutput('Room changed'));
});

socket.on('message', function(result){
  var element = $('<div></div>').text(result.text);
  $message.append(element);
});

socket.on('rooms', function(rooms){
  $('#room-list').empty();

  for(var room in rooms){
    room = room.substring(1, room.length);
    if(room != ''){
      $('#room-list').append(userOutput(room));
    }
  }


  $('#room-list div').click(function(){
    chatApp.processCommand('/join' + $(this).text());
    $('#send-message').focus();
  });
});

setInterval(function(){
  socket.emit('rooms');
}, 1000);

$('#send-messages').focus();

$('#send-form').submit(function(){
  processUserInput(chatApp, socket);
  return false;
});
