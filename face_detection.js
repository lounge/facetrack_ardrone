var cv = require('opencv')
  , assert = require('assert')
  , fs = require('fs')
  , http = require('http')
  , arDrone = require('ar-drone')
  , client  = arDrone.createClient();

var faceCascade = new cv.CascadeClassifier("./data/haarcascade_frontalface_alt.xml");

var lastPng
  , flying
  , goingUp
  , goingDown
  ,	processingImage = false;

var pngStream = client.createPngStream();


pngStream
		.on('error', function (error) {
			//console.log(error);
		})
		.on('data', function (buffer) {
			lastPng = buffer;
		});
	

function detectFace () {
	//console.log('flying: ' + flying);
	//console.log('processing: ' + processingImage);
//	console.log('lastPng: ' + lastPng);


	if( ! flying ) return;
	if( ( ! processingImage ) && lastPng ) {
		//console.log('processingImage');
        processingImage = true;

    	cv.readImage(lastPng, function (err, im) {

			faceCascade.detectMultiScale(im, function (err, faces) {

				var face, biggestFace;

				for (var i = 0; i < faces.length; i++) {
					//console.log('dected face');
					var face = faces[i];

					if (!biggestFace || (face.width > biggestFace.width)) {
						biggestFace = face;
					}

					if (biggestFace) {
						face = biggestFace;

						console.log('detected face');

						//console.log( face.x, face.y, face.width, face.height, im.width(), im.height() );
						//im.save('detected.png');

						face.centerX = face.x + face.width * 0.5;
						face.centerY = face.y + face.height * 0.5;

						//console.log(typeof face.centerX);
						//console.log('faceCenterX: ' + face.centerX);

						var imageCenterX = im.width() * 0.5;
						var imageCenterY = im.height() * 0.5;

						//console.log(typeof imageCenterX);
						//console.log('imageCenterX: ' + imageCenterX);

						//var turnAmount = (face.centerX - imageCenterX) / imageCenterX;
						var heightAmount = (face.centerY - imageCenterY) / imageCenterY;




						//console.log('turnAmount 1: ' + turnAmount);

			            //turnAmount = Math.min(1, turnAmount);
			            heightAmount = Math.min(1, heightAmount);
						//console.log('turnAmount 2: ' + turnAmount);

			            //turnAmount = Math.max(-1, turnAmount);
			            heightAmount = Math.max(-1, heightAmount);
			            console.log('heightAmount: ' + heightAmount);

			            //console.log('heightAmount abs: ' + Math.abs(heightAmount));


			            //client.clockwise(turnAmount);
			            //console.log('rising: ' + heightAmount);
			            //console.log('turning: ' + turnAmount);


			            if (heightAmount < 0) {
			            	goingUp = true;
			            	client.up(Math.abs(heightAmount));
			            	console.log('going up: ' + Math.abs(heightAmount));
			            } else {
			            	goingDown = true;
			            	client.down(Math.abs(heightAmount));
			            	console.log('going down: ' + Math.abs(heightAmount));
			            }

			            //var absoluteTurnAmount = Math.abs(turnAmount);
			            //console.log("absoluteTurnAmount: " + absoluteTurnAmount);

			            //if (turnAmount < 0) {
			            //	client.clockwise(Math.abs(turnAmount));
			            //	console.log('clockwise: ' + Math.abs(turnAmount));
			            //} else {
			            //	client.counterClockwise(turnAmount);
			            //	console.log('counterClockwise: ' + turnAmount);
			            //}

			            setTimeout(function () {
			            	if (goingUp) {
			            		goingUp = false;
			            		client.up(0);
			            		console.log('stoping up motion');
			            	} else {
			            		goingDown = false;
			            		client.down(0);
			            		console.log('stoping down motion');
			            	}

			            	//client.clockwise(0);
			            	
			            }, 100);

					}

					//im.ellipse(x.x + x.width/2, x.y + x.height/2, x.width/2, x.height/2);
					
				}

				processingImage = false;
			});
		});
	}

}
	
//flying = true;
var interval = setInterval( detectFace, 150);
//fly();
//

//function fly () {

	client.takeoff();
	client.after(5000,function(){ 
		console.log("going up");
		this.up(0.5);
		flying = true;
	}).after(1000,function(){ 
		console.log("stopping");
		this.stop(); 
		flying = true;
	});


	client.after(10000, function() {
		console.log('landing');
		this.stop();
		this.land();
		flying = false;
	});
//}







var server = http.createServer(function(req, res) {
  if (!lastPng) {
    res.writeHead(503);
    res.end('Did not receive any png data yet.');
    return;
  }

  res.writeHead(200, {'Content-Type': 'image/png'});
  res.end(lastPng);
});

server.listen(8080, function() {
  console.log('started on 8080');
});