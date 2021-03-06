/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------
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
function Ship(length, coordinates) {
		this.length = length;
		this.coordinates = coordinates;
}

// enum style object to denote empty and occupied tiles
TileState = {
    EMPTY: 0,
    OCCUPIED: 3
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


    // randomly add ships to board - 0 for empty spot, 1 for player 1's ships, 2 for player 2's ship
    // we will implement battleship actual rules later - for now, just add five ships for each player
    this.initializeShips = function() {

        // add player 1's five ships
        while (this.p1.ships.length < 5) {
            var col = Math.floor((Math.random() * this.dimension));
            var row = Math.floor((Math.random() * this.dimension));
            
            // if we find an empty tile, insert id number for player 1's ship into board, update
            // player1's board, and add coordinates to player 1's array of ships
            if (this.board[col][row] == 0) {
                this.board[col][row] = p1.boardID;
                this.p1_board[col][row] = p1.boardID;
							
						/* original code
                var coordinate = {
                    x: col,
                    y: row
                };*/
						
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

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

http.listen(appEnv.port, function() {
    console.log('listening on *:3000');
});

// if a player connects to server, add player to clients array and increment id for next player
io.on('connection', function(socket) {
    console.log('a user connected');

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
