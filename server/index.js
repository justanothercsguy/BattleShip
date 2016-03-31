var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
require('./Player.js');

// this index.html seems unnecessary
app.get('/', function(req, res) {
    res.sendfile('index.html');
});

// Player class - parameters: id, score, ships
function Player(id, socket) {
    this.id = id;
    this.socket = socket;
    this.score = 0;
    this.ships = [];
    this.boardID = -1;

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
// coordinate class: x = column number, y = row number
function Coordinate(x, y) {
		this.x = x;
		this.y = y;
}

// Ship class: length of ship and array of coordinates that ship occupies
function Ship(length, coordinates, direction) {
		this.length = length;
		this.coordinates = coordinates;
		this.direction = direction;
}

// enum style object to denote empty and occupied tiles
TileState = {
    EMPTY: 0,
    OCCUPIED: 3
}

// enum style object to denote direction of ship
ShipDirection = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
  	LEFT: 3
}

// Game class - parameters: player1, player2, board
function Game(p1, p2) {

    this.p1 = p1;
    this.p2 = p2;
    this.currentTurn = 0;
    
    // Socket that sends message to observer != null
    this.observerSocket = null;

    // full game board array
    // return 0 = empty, 1 = player1's ship, 2 = player2's ship, 3 = occupied, undefined if outside of board
    this.board = [];
    this.dimension = this.board.length;

    // two arrays to separate what each player can see in board
    this.p1_board = []
    this.p2_board = []

    this.getPlayer1 = function() {
        return this.p1;
    }

    this.getPlayer2 = function() {
        return this.p2;
    }

    this.getPlayer1Board = function() {
        return this.p1_board;
    }

    this.getPlayer2Board = function() {
        return this.p2_board;
    }

    // Once a game starts, the server will create an empty (full of O's) random size grid (square) 
    // that is not smaller than 8x8 and not larger than 24x24.
    this.initializeBoard = function() {
        this.dimension = 10; // Math.floor((Math.random() * 16) + 8);

        for (var i = 0; i < this.dimension; i++) {
            var col = [];

            for (var j = 0; j < this.dimension; j++) {
                col.push(0);
            }

            this.board[i] = col;
        }
        // also initialize player one and player 2 boards - trying different 2d array initialize method
        this.p1_board = new Array(this.dimension).fill(new Array(this.dimension).fill(0));
        this.p2_board = new Array(this.dimension).fill(new Array(this.dimension).fill(0));
    }

		// original logic for generating ships
    // randomly add ships to board - 0 for empty spot, 1 for player 1's ships, 2 for player 2's ship
    // we will implement battleship actual rules later - for now, just add five ships for each player
    this.initializeShips = function() {

				// new logic to generate ships of different sizes
				while (this.p1.ships.length < 3) {
				
						// generate a starting point - will be in format [col][row]
            var col = Math.floor((Math.random() * this.dimension));		// x-axis coordinate
            var row = Math.floor((Math.random() * this.dimension));		// y-axis coordinate
            
            // generate a random length for ship between 2-4
            var length = Math.floor((Math.random() * 3)) + 2;					
            
            // if we find an empty tile, see if it has enough empty tiles to it's left, right, up, down
            // direction to insert the ship into. For example, if we have a ship of length = 3 and the
            // random coordinate is (4,5) then we can insert ship in left if (3,5) and (2,5) are working
            if (this.board[col][row] == 0) {
            
            		// if ship can't be placed in a direction, turn this into 0
                var validPlacement = 1;
                
                // coordinates to hold ship if validPlacement = 1
                var coordinates = [];
            
            		// up = 0, right = 1, down = 2, left = 3 - start with one number, then try the 
            		// others if the first direction selected fails
            		// if no direction works, then exit this if statement and go back to while loop 
            		// to generate a new coordinate and try directions again
            		var startDirection = Math.floor((Math.random() * 4));
            		for (var i = startDirection; i < startDirection+4; i++) {
            		
            				// get the current direction we are on and try fitting it into board
            				var currentDirection = i % 4;
            				
            				if (currentDirection == ShipDirection.UP) {		// try UP direction
            						console.log("Reached UP direction");
            						// same column number, check row numbers above randomly generated row
            						// example: coordinate is (col: 4, row: 5), length = 3 -> then check (4,4) and (4,3) 
            						for (var j = 1; j < length; j++) {
            								if (this.board[col][row-j] != 0) {
            										// console.log("col: " + col + ", row: " + row + " doesn't work")
            										validPlacement = 0;
            								}
            						}
            						// test validPlacement var
            						if (validPlacement == 0) {
            								console.log("col: " + col + ", row: " + row + " doesn't work going UP")
            						} else {
            						   	console.log("col: " + col + ", row: " + row + " works going UP")
            								
            								// create all coordinates for ship array
            								for (var j = 1; j < length; j++) {
            										var coordinate = new Coordinate(col, row-j);
            										coordinates.push(coordinate);
            										
            										// problem is how do we distinguish player 1's ships from each other
            										this.board[col][row-j] = p1.ID;
            										console.log("added ship at " + col + "," + row-j + " to the board");
            								}
            								break;       						
            						}
            				} else if (currentDirection == ShipDirection.RIGHT) {		// try RIGHT direction
            						console.log("Reached RIGHT direction");
            						// same row number, check column numbers to right of randomly generated column
            						// example: coordinate is (col: 4, row: 5), length = 3 -> then check (5,5) and (6,5) 
            						for (var j = 1; j < length; j++) {
            								if (this.board[col+j][row] != 0) {
            										validPlacement = 0;
            								}
            						}
            						// test validPlacement var
            						if (validPlacement == 0) {
            								console.log("col: " + col + ", row: " + row + " doesn't work going RIGHT")
            						} else {
            								console.log("col: " + col + ", row: " + row + " works going RIGHT")
            								
            								// create all coordinates for ship array
            								for (var j = 1; j < length; j++) {
            										var coordinate = new Coordinate(col+j, row);
            										coordinates.push(coordinate);
            										
            										// problem is how do we distinguish player 1's ships from each other
            										this.board[col+j][row] = p1.ID;
            										console.log("added ship at " + col+j + "," + row + " to the board");
            								}
            								break;       						
            						}
            				} else if (currentDirection == ShipDirection.DOWN) {	// try DOWN direction
            						console.log("Reached DOWN direction");
            						// same column number, check row numbers below randomly generated row
            						// example: coordinate is (col: 4, row: 5), length = 3 -> then check (4,6) and (4,7) 
            						for (var j = 1; j < length; j++) {
            								if (this.board[col][row+j] != 0) {
            										// console.log("col: " + col + ", row: " + row + " doesn't work")
            										validPlacement = 0;
            								}
            						}
            						// test validPlacement var
            						if (validPlacement == 0) {
            								console.log("col: " + col + ", row: " + row + " doesn't work going DOWN")
            						} else {
            								console.log("col: " + col + ", row: " + row + " works going DOWN")
            								
            								// create all coordinates for ship array
            								for (var j = 1; j < length; j++) {
            										var coordinate = new Coordinate(col, row+j);
            										coordinates.push(coordinate);
            										
            										// problem is how do we distinguish player 1's ships from each other
            										this.board[col][row+j] = p1.ID;
            										console.log("added ship at " + col + "," + row+j + " to the board");
            								}
            								break;          						
            						}
            				} else {		//currentDirection must equal LEFT
            						console.log("Reached LEFT direction");
            						// same row number, check column numbers to left of randomly generated column
            						// example: coordinate is (col: 4, row: 5), length = 3 -> then check (3,5) and (2,5) 
            						for (var j = 1; j < length; j++) {
            								// if not empty, then this is not valid direction to place ship
            								if (this.board[col-j][row] != 0) {
            										validPlacement = 0;
            								}
            						}
            						// test validPlacement var
            						if (validPlacement == 0) {
            								console.log("col: " + col + ", row: " + row + " doesn't work going LEFT")
            						}	else {		// valid placement of ship at (col, row) going to LEFT
            								console.log("col: " + col + ", row: " + row + " works going LEFT")
            								
            								// create all coordinates for ship array
            								for (var j = 1; j < length; j++) {
            										var coordinate = new Coordinate(col-j, row);
            										coordinates.push(coordinate);
            										
            										// push ship coordinate to board
            										// problem is how do we distinguish player 1's ships from each other
            										this.board[col-j][row] = p1.ID;
            										console.log("added ship at " + col-j + "," + row + " to the board");
            								}
														break;
            						}	
            				}
            				
            		}		// end of for loop to test all four directions
            		
            		// if ship can be put in coordinate (col, row) in currentDirection, make new ship 
            		// and add to player board and game board
            		if (validPlacement == 1) {
            				var ship = new Ship(length, coordinates, currentDirection);
            				console.log("made ship - length: " + length + ", direction: " + currentDirection);
            				console.log("made ship - coordinates: " + coordinates);  
            				p1.ships.push(ship);
            				console.log("added ship to player 1's ships array");
            		}
            		
            }
            
				}
		/*
        // add player 1's five ships
        while (this.p1.ships.length < 5) {
            var col = Math.floor((Math.random() * this.dimension));
            var row = Math.floor((Math.random() * this.dimension));
            
            // if we find an empty tile, insert id number for player 1's ship into board, update
            // player1's board, and add coordinates to player 1's array of ships
            if (this.board[col][row] == 0) {
                this.board[col][row] = p1.boardID;
                this.p1_board[col][row] = p1.boardID;
						
						// use new Coordinate class
								var coordinate = new Coordinate(col, row);	
                this.p1.ships.push(coordinate);
            }
            
        }
        // add player 2's five ships
        while (this.p2.ships.length < 5) {
            var col = Math.floor((Math.random() * this.dimension));
            var row = Math.floor((Math.random() * this.dimension));

            // if we find an empty tile, insert id number for player 2's ship into board, update
            // player1's board, and add coordinates to player 1's array of ships
            if (this.board[col][row] == 0) {
                this.board[col][row] = p2.boardID;
                this.p1_board[col][row] = p2.boardID;

                var coordinate = new Coordinate(col, row);
                this.p2.ships.push(coordinate);
            }
        }
        */
    }

    this.checkValidMove = function(column, row, playerID) {
        var otherPlayer = this.p1.id == playerID ? this.p2 : this.p1;
        var tile = this.board[column][row];

        // valid move if the tile is empty or if the tile is a ship of the opposite player
        return tile == TileState.EMPTY || tile == otherPlayer.boardID;
    }

    this.checkHit = function(column, row, playerID) {
        var otherPlayer = this.p1.id == playerID ? this.p2 : this.p1;
        var tile = this.board[column][row];

        // hit if the tile is a ship of the opposite player
        return tile == otherPlayer.boardID;
    }

    this.won = function(playerID) {
        var otherPlayer = this.p1.id == playerID ? this.p2 : this.p1;
        var otherPlayerArray = otherPlayer.ships;

        for (var i = 0; i < otherPlayerArray.length; i++) {
            var column = otherPlayerArray[i].x;
            var row = otherPlayerArray[i].y

            // are the other players ships all hit?
            if (this.board[column][row] == otherPlayer.boardID) {
                return false;
            }
        }

        return true;
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

// dictionary of players
var clients = {};

// dictionary of players not in a game
var playersAvailableToPlay = {};
// socket to player dictionary
var socketToPlayer = {};

// id of players - large numbers mean player logged in later
var id = 0;

// dictionary of active games
var games = {};

// player requesting opponents will be given a list of other players connected to server 
var getOtherPlayers = function(player) {

    var otherPlayers = [];

    // if the player requesting is not alone in server
    for (var key in clients) {
        if (player.getID() != clients[key].getID()) {
            otherPlayers.push(clients[key].id);
        }
    }

    return otherPlayers;
}

function getAllPlayers() {
    var players = [];

    for (var key in playersAvailableToPlay) {
        players.push(playersAvailableToPlay[key].id);
    }

    return players;
}

function getAllGames() {
    var allGames = [];

    for (var key in games) {
        allGames.push(games[key].p1.id.toString() + ":" + games[key].p2.id.toString());
    }

    return allGames;
}

//var requestPlayer = function()

// if a player connects to server, add player to clients array and increment id for next player
io.on('connection', function(socket) {
    console.log('a user connected');

    // testing get player list
    //---------------------------------------------
    if (id == 0) {
        clients[id.toString()] = new Player(id, socket);
        id++;
    }
    //---------------------------------------------
    var player = new Player(id, socket);
    clients[id.toString()] = player;
    playersAvailableToPlay[id.toString()] = player
    socketToPlayer[socket] = player;

    // send id to client
    socket.emit("clientID", id);

    // broadcast all clients to those that are in the select player view controller
    socket.broadcast.emit("availablePlayers", getAllPlayers());

    id++;

    socket.on("disconnect", function() {
        console.log("a user disconnected");
        var currentPlayer = socketToPlayer[socket];
        delete clients[currentPlayer.id.toString()];

        socket.broadcast.emit("availablePlayers", getAllPlayers());
    });

    // client wants to find other players
    socket.on("findPlayers", function(playerID, fn) {
        //var otherPlayersJSONString = JSON.stringify(otherPlayers);
        // send the other players
        fn(getAllPlayers());
    });

    // client wants to find active games
    socket.on("findGames", function(playerID, fn) {
        //var otherPlayersJSONString = JSON.stringify(otherPlayers);
        // send the other players
        fn(getAllGames());
    });
    
    // observer wants to find active game to observe - when observer clicks this.observerSocket != null
    // server sends observer dimensions of initial board and the board itself
    socket.on("selectedGame", function(selectedGameID, fn) {    
    		var game = games[selectedGameID.toString()];
    		game.observerSocket = socket;
    		fn(game.dimension.toString());   
    		console.log(game.board);
    		socket.emit("initialObserverBoard", game.board);
    					
    });

    socket.on("selectedPlayer", function(playerID, selectedPlayerID, fn) {
        // remove these players from those available to start a game with, as they aren't available anymore
        delete playersAvailableToPlay[playerID.toString()];
        delete playersAvailableToPlay[selectedPlayerID.toString()];
        // update avaialble players for each connected client
        socket.broadcast.emit("availablePlayers", getAllPlayers());

        var player1 = clients[playerID.toString()];
        var player2 = clients[selectedPlayerID.toString()];

        player1.boardID = 1;
        player2.boardID = 2;

        var game = new Game(player1, player2);
        game.initializeBoard();
        game.initializeShips();
        game.currentTurn = player1.id;

        games[playerID.toString() + selectedPlayerID.toString()] = game;

        var player2Socket = clients[selectedPlayerID.toString()].socket;

        // send size to this player
        fn(game.dimension.toString());

        // send size to the other player
        player2Socket.emit("newGameWithOtherPlayer", game.dimension.toString(), player1.id);

        // send player1's view of board as 2d array to client
        socket.emit("initialBoard", player1.getShips());
        player2Socket.emit("initialBoard", player2.getShips());
        
        // print out player ship array to see if coordinate class worked
        console.log(player1.ships);
        console.log(player2.ships);

    });

    // this will be emitted with ack, fn is the function we use to ack
    socket.on("playerTappedBoard", function(p1ID, p2ID, column, row, fn) {
        var player1 = clients[p1ID.toString()];
        var player2 = clients[p2ID.toString()];

        /*
        // test game_won message by immediately sending won message to client   
        socket.emit("won", 1);
        console.log("emit socket 1");
      var player2Socket = clients[p2ID.toString()].socket;
      player2Socket.emit("lost", 0);
      console.log("emit socket 2");
      */

        var game = games[p1ID.toString() + p2ID.toString()];

        if (!game) {
            game = games[p2ID.toString() + p1ID.toString()];
        }
        // make sure it is our turn
        if (game.currentTurn == p2ID) {
            fn("invalid");
            return;
        }

        var validMove = game.checkValidMove(column, row, p1ID);

        if (validMove) {
            if (game.checkHit(column, row, p1ID)) {
                console.log("hit");
                socket.emit("hitOrMiss", 1);
            } else {
                console.log("not hit");
                socket.emit("hitOrMiss", 0);
            }
            game.board[column][row] = TileState.OCCUPIED;

            // other player's turn
            game.currentTurn = p2ID;

            fn("valid");
            var p2Socket = clients[p2ID.toString()].socket;

            // send to the other player the move the first player made
            p2Socket.emit("otherPlayerMoved", column, row);
            
            // send to observerSocket the state of the board after a move
            // need to test if observer gets initial socket before implementing this code
            if (game.observerSocket != null) {
            		game.observerSocket.emit("otherPlayerMoved", column, row);
            }
						// 1 = won, 0 = lose
            if (game.won(p1ID)) {
                socket.emit("won", 1);
                p2Socket.emit("won", 0);
            		   
            		// if there is observer send ID of player that won       
            		if (game.observerSocket !== null) {
            				game.observerSocket.emit("someoneWon", p1ID); 
            		}
            		
            } else if (game.won(p2ID)) {
                socket.emit("won", 0);
                p2Socket.emit("won", 1); 
                            
            		if (game.observerSocket !== null) {
            				game.observerSocket.emit("someoneWon", p2ID);
            		}
            }            
        } else {
            fn("invalid");
        }
    });
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});