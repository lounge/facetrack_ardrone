var assert = require('assert')
  , fs = require('fs')
  , http = require('http')
  , io = require('socket.io')
  , arDrone = require('ar-drone')
  , client  = arDrone.createClient()
  , dronestream = require("dronestream");

 // var index = fs.readFileSync('index.html');

var flying = false
  , movementSpeed = 0.5;



var streamServer = http.createServer(onStreamServerRequest).listen(5555);
var socketServer = http.createServer(onSocketServerRequest).listen(8081);

function onStreamServerRequest (req, res) {
 	fs.createReadStream(__dirname + "/index.html").pipe(res);
 	console.log('streamServer started on 5555');
}

function onSocketServerRequest (req, res) {
    console.log('socketServer started on 8081');
}





dronestream.listen(streamServer);
io = io.listen(socketServer, { log: false });


io.sockets.on('connection', function (socket) {
  	socket.emit('connection', { status: 'online', camera: client.config('video:video_channel') });
  	socket.on('command', function (data) {
    	runCommand(data.command);
    });

  	client.on('navdata', sendNavData);


  	function sendNavData (data) {
		socket.emit('navdata', { navdata: data });
	}



	function runCommand (command) {
		switch (command) {
			case 13:
				takeOff();
				break;
			case 27:
				land();
				break;
			case 32:
				client.stop();
				console.log('stop / hover');
				break;
			case 38:
				client.up(movementSpeed);
				console.log('up');
				break;
			case 40: 
				client.down(movementSpeed);
				console.log('down');
				break;
			case 37:
				client.left(movementSpeed);
				console.log('left');
				break;
			case 39:
				client.right(movementSpeed);
				console.log('right');
				break;
			case 65:
				client.counterClockwise(movementSpeed);
				console.log('rotate left');
				break;
			case 68:
				client.clockwise(movementSpeed);
				console.log('rotate right');
				break;
			case 83:
				client.back(movementSpeed);
				console.log('backward');
				break;
			case 87:
				client.front(movementSpeed);
				console.log('forward');
				break;

			case 49:
				client.config('video:video_channel', 0);
				console.log('camera 1');
				break;
			case 50:
				client.config('video:video_channel', 3);
				console.log('camera 2');
				break;
		}
	} 

	function takeOff (command) {
		console.log('takeoff');
		client.takeoff();
		
		socket.emit('flying', { status: true });
		
	}

	function land (command) {
		console.log('land');
		client.stop();
		client.land();

		socket.emit('flying', { status: false });
		
	}

});


 