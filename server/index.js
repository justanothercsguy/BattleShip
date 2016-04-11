var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var Player = require('./Player');
var Game = require('./Game.js');

// this index.html seems unnecessary
app.get('/', function(req, res) {
    res.sendfile('index.html');
});

// coordinate class: row = index of 1d array in the 2d array, row number = index of value in 1d array
function Coordinate(row, col) {
    this.row = row;
		this.col = col;
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
    DOWN: 0,
    RIGHT: 1
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

    var player = new Player(id, socket);
    clients[id.toString()] = player;
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
        delete playersAvailableToPlay[currentPlayer.id.toString()];

        socket.broadcast.emit("availablePlayers", getAllPlayers());
    });

    // client wants to find other players
    socket.on("findPlayers", function(playerID, fn) {
        //var otherPlayersJSONString = JSON.stringify(otherPlayers);
        // send the other players
        // add this player to the available players, since he now wants to play
        var player = clients[playerID.toString()];
        playersAvailableToPlay[playerID.toString()] = player
        fn(getAllPlayers());
        socket.broadcast.emit("availablePlayers", getAllPlayers());
    });

    socket.on("notInterestedInGame", function(playerID) {
    	delete playersAvailableToPlay[playerID.toString()];
    	socket.broadcast.emit("availablePlayers", getAllPlayers());
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
        game.observerSockets.push(socket);
        fn(game.dimension.toString());
        console.log(game.board);
        socket.emit("initialObserverBoard", game.board);

    });

    socket.on("selectedPlayer", function(playerID, selectedPlayerID, fn) {
    	var otherPlayer = clients[selectedPlayerID.toString()];
    	otherPlayer.socket.emit("agreeToGame", playerID)
    });

    socket.on("agreesToGame", function(playerID, selectedPlayerID, agrees) {
    	if (agrees) {
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
   
	        // intialize ships using player.id to identify player, then use boardID to fill board
	        game.initializeShips(player1.id);       
	        game.initializeShips(player2.id);
	        
	        game.currentTurn = player1.id;
	        games[playerID.toString() + selectedPlayerID.toString()] = game;

	        var player2Socket = clients[selectedPlayerID.toString()].socket;

	        // send size to the players
	        socket.emit("newGameWithOtherPlayer", game.dimension.toString(), player2.id);       
	        player2Socket.emit("newGameWithOtherPlayer", game.dimension.toString(), player1.id);

	        // send player1's view of board as 2d array to client - does program crash here?
	        socket.emit("initialBoard", player1.getShips());
	        player2Socket.emit("initialBoard", player2.getShips());
	        // sent everything to client
	        

	    } else {
	    	// tell original player this player doesn't want to play
	    	var otherPlayer = clients[selectedPlayerID.toString()];
	    	otherPlayer.socket.emit("playerDisagreed");
	    }
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
            game.board[row][column] = TileState.OCCUPIED;

            // other player's turn
            game.currentTurn = p2ID;

            fn("valid");
            var p2Socket = clients[p2ID.toString()].socket;

            // send to the other player the move the first player made
            p2Socket.emit("otherPlayerMoved", column, row);

            // send to observerSocket the state of the board after a move
            // need to test if observer gets initial socket before implementing this code
            for (var observerSocket in game.observerSockets) {
                observerSocket.emit("otherPlayerMoved", column, row);
            }
            // 1 = won, 0 = lose
            if (game.won(p1ID)) {
                socket.emit("won", 1);
                p2Socket.emit("won", 0);

                // if there is observer send ID of player that won       
                for (var observerSocket in game.observerSockets) {
                    observerSocket.emit("someoneWon", p1ID);
                }

            } else if (game.won(p2ID)) {
                socket.emit("won", 0);
                p2Socket.emit("won", 1);

                for (var observerSocket in game.observerSockets) {
                    observerSocket.emit("someoneWon", p2ID);
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
