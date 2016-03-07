var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


// this index.html seems unnecessary
app.get('/', function(req, res) {
    res.sendfile('index.html');
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

// Game class - parameters: player1, player2, board
function Game(p1, p2) {

    this.p1 = p1;
    this.p2 = p2;
    
    // full game board array
    this.board = []
    this.dimension = this.board.length;
    
    // two arrays to separate what each player can see in board
    // initially each array is same dimension as board but full of 0's
    this.p1_board = new Array(dimension).fill(new Array(dimension));
    this.p2_board = new Array(dimension).fill(new Array(dimension));
    
    // keeps track of number of ships each player has
    this.player1_ship_count = 0;
    this.player2_ship_count = 0;

    this.getPlayer1 = function() {
        return this.p1;
    }

    this.getPlayer2 = function() {
        return this.p2;
    }

    this.getBoard = function() {
        return board;
    }
    
    this.getPlayer1Board = function() {
    		return this.p1_board;
    }
    
    this.getPlayer2Board = function() {
    		return this.p2_board;
    }
	
    // return 0 = empty, 1 = player1's ship, 2 = player2's ship, undefined if outside of board
    // column is the index of the 2-d board array - 
    this.getTile = function(col, row, board) {
        return board[col][row];
    }

		// add value to specified board (full game, player1's view, or player2's view)
    this.setTile = function(col, row, value, board) {
        board[col][row] = value;
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

    // randomly add ships to board - 0 for empty spot, 1 for player 1's ships, 2 for player 2's ship
    // we will implement battleship actual rules later - for now, just add five ships for each player
    this.initializeShips = function() {

        // add player 1's five ships
        while (this.player1_ship_count < 5) {
            col = Math.floor((Math.random() * this.dimension));
            row = Math.floor((Math.random() * this.dimension));
            // if we find an empty tile, insert id number for player 1's ship into board, update
            // player1's board, and add coordinates to player 1's array of ships
            if (this.getTile(col, row, this.board) == 0) {
                this.setTile(col, row, p1.getID(), this.board);
                this.setTile(col, row, p1.getID(), this.p1_board);
                this.player1_ship_count++;
                this.p1.ships.push([col, row]);
            }
        }
        // add player 2's five ships
        while (this.player2_ship_count < 5) {
            col = Math.floor((Math.random() * this.dimension));
            row = Math.floor((Math.random() * this.dimension));
            // if we find an empty tile, insert id number for player 2's ship into board, update
            // player1's board, and add coordinates to player 1's array of ships
            if (this.getTile(col, row, this.board) == 0) {
                this.setTile(col, row, p2.getID(), this.board);
                this.setTile(col, row, p2.getID(), this.p2_board);
                this.player2_ship_count++;
                this.p2.ships.push([col, row]);
            }
        }
    }
    
    this.checkValidMove = function(column, row, playerID) {
        var tile = this.getTile(column, row);

        // valid move if the tile is empty or if the tile is a ship of the opposite player
        return tile == 0 || tile != playerID;
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

//var requestPlayer = function()

// if a player connects to server, add player to clients array and increment id for next player
io.on('connection', function(socket) {
    console.log('a user connected');

    // testing get player list
    //---------------------------------------------
    if (id == 0) {
    	clients[id] = new Player(id, socket);
    	id++;
    }
    //---------------------------------------------
    clients[id] = new Player(id, socket);

    // send id to client
    socket.emit("clientID", id);

    id++;

    // client wants to find other players
    socket.on("findPlayers", function(playerID, fn) {
        var otherPlayers = getOtherPlayers(clients[playerID]);
        //var otherPlayersJSONString = JSON.stringify(otherPlayers);
        // send the other players
        fn(otherPlayers);
    });

    socket.on("selectedPlayer", function(playerID, selectedPlayerID, fn) {
        var player1 = clients[playerID];
        var player2 = clients[selectedPlayerID];

        games[playerID.toString() + selectedPlayerID.toString()] = new Game(player1, player2);
        fn("ok");
        
        // send player1's view of board as 2d array to client
        socket.emit("initialBoard", games[playerID.toString() + selectedPlayerID.toString()].getPlayer1Board());
    });

    // this will be emitted with ack, fn is the function we use to ack
    socket.on("playerTappedBoard", function(playerID, column, row, fn) {
        //etc
        //var validMove = 

        fn("valid");
    });
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});
