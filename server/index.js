var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


// this index.html seems unnecessary
app.get('/', function(req, res){
  res.sendfile('index.html');	/
});

// Player class - parameters: id, score, ships
function Player(id) {
	this.id = id;
	this.score = 0;
	this.ships = [];
	
	this.getID = function() {
		return this.id;
	}
	
	this.getScore = function() {
		return this.score;
	}
	
	this.getShips = function() {
		return this.ships;
	}
}

// define Game class - parameters: player1, player2, board
function Game(p1, p2) {

	this.p1 = p1;
	this.p2 = p2;
	this.board = []
	this.dimension = this.board.length;

	this.getPlayer1 = function() {
		return this.p1;
	}
	
	this.getPlayer2 = function() {
		return this.p2;
	}
	
	this.getBoard = function() {
		return board;
	}
		
	// return 0 = empty, 1 = player1's ship, 2 = player2's ship, undefined if outside of board
	// column is the index of the 2-d board array
	this.getTile = function(col, row) {
		return this.board[col][row];
	}
	
	this.setTile = function(col, row, value) {
		this.board[col][row] = value;
	}
	
	// col, row = 2d coordinates of tile, gives unique values of tiles ranging from 
	// 0 to (dimension^2 - 1) to tell which tiles are empty and available for ship to be placed in
	/*	NOT WORKING FOR SOME REASON
	
	this.getOneDimensionalArrayIndex(col, row) {
		return (this.dimension * col) + row
	}*/
	
	// Once a game starts, the server will create an empty (full of O's) random size grid (square) 
	// that is not smaller than 8x8 and not larger than 24x24.
	this.initializeBoard = function() {
		this.dimension = Math.floor((Math.random() * 16) + 8);
		var col = [];
		for (var i = 0; i < this.dimension; i++) {
			col.push(0);
		}
  	for (var i = 0; i < this.dimension; i++) {
  		this.board[i] = col;
  	}
	}	
	
	// randomly add ships to board - 0 for empty spot, 1 for player 1's ship, 2 for player 2's ship
	// we will implement battleship actual rules later - for now, just add a ship for each player
	this.initializeShips = function() {		
		var added_player1_ship = 0;
		var added_player2_ship = 0;
			
		// add player 1's ship
		while (added_player1_ship == 0) {
			col = Math.floor((Math.random() * this.dimension));
			row = Math.floor((Math.random() * this.dimension));	
			// if we find an empty tile, insert 1 for player 1's ship and add coordinates to
			// player 1's array of ships
			if (this.getTile(col, row) == 0) {
				this.setTile(col, row, p1.getID());
				added_player1_ship++;
				this.p1.ships.push([col, row]);
			}
		}		
		// add player 2's ship
		while (added_player2_ship == 0) {
			col = Math.floor((Math.random() * this.dimension));
			row = Math.floor((Math.random() * this.dimension));	
			// if we find an empty tile, insert 2 for player 2's ship and add coordinates to 
			// player 2's array of ships
			if (this.getTile(col, row) == 0) {
				this.setTile(col, row, p2.getID());
				added_player2_ship++;
				this.p2.ships.push([col, row]);
			}
		}		
	}
	
}

/*
Required messages to be received and handled by the server:
playerTappedBoard - after checking whether the column and row are valid moves to be made, 
send back valid or invalid as strings to signifiy whether the move was valid or not.
findPlayer - the server will search all currently connected clients to the client that 
request this. this will be an emitWithAck message rather than regular emit. this way, 
after the server emits, it can expect the client to send back an ack message containing 
the id of the player they want to play with.

Required messages for the server to send to the client.
connect - send back id for player to identify with, this can be just a number. 
gameStart - send back to each client participating in the game the size of the gameboard,
 as well as the position of each player’s ship on the gameboard.
*/

// array of sockets (players)
var clients = {};
var id = 0;

// player requesting opponents will be given a list of other players connected to server 
var getOtherPlayers = function (player) {

	var otherPlayers = [];
	// if the player requesting is not alone in server
	if (clients.length > 1) {
		for (var i = 0; i < clients.length; i++) {
			if (player.getID() != clients[i].getID()) {
				otherPlayers.push(clients[i]);
			}
		}
	}
	return otherPlayers;
}

var requestPlayer = function ()

// if a player connects to server, add player to clients array and increment id for next player
io.on('connection', function(socket){
  console.log('a user connected');
  clients[id] = new Player(id, socket);
  id++;
  console.log("now, the dictionary is " + clients);
  
  socket.on("test", function(msg) {
  	socket.emit("got test"); //this is emit, emit with ack youll have to lookup how that looks in js
		console.log("got test");
	});
	
	socket.on("playerTappedBoard", function(msg) {
		//etc
	});
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});