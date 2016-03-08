var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


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

// Game class - parameters: player1, player2, board
function Game(p1, p2) {

    this.p1 = p1;
    this.p2 = p2;

    // full game board array
    this.board = []
    this.dimension = this.board.length;

    // two arrays to separate what each player can see in board
    this.p1_board = []
    this.p2_board = []

    // keeps track of number of ships each player has
    this.player1_ship_count = 0;
    this.player2_ship_count = 0;

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

    this.getBoard = function(player) {
        if (player.id == this.p1.id) {
            return this.getPlayer1Board();
        }

        if (player.id == this.p2.id) {
            return this.getPlayer2Board();
        }

        return this.board;
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
    /*  NOT WORKING FOR SOME REASON
    
    this.getOneDimensionalArrayIndex(col, row) {
        return (this.dimension * col) + row
    }*/

    // Once a game starts, the server will create an empty (full of O's) random size grid (square) 
    // that is not smaller than 8x8 and not larger than 24x24.
    this.initializeBoard = function() {
        this.dimension = 4;//;Math.floor((Math.random() * 16) + 8);

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

		// why are repeating coordinates being printed for player 2
		
        // add player 1's five ships
        while (this.player1_ship_count < 5) {
            var col = Math.floor((Math.random() * this.dimension));
            var row = Math.floor((Math.random() * this.dimension));
            // if we find an empty tile, insert id number for player 1's ship into board, update
            // player1's board, and add coordinates to player 1's array of ships
            if (this.getTile(col, row, this.board) == 0) {
            		console.log(col + ", " + row + "p1 board id: " + p1.boardID);
                // this.setTile(col, row, p1.getID(), this.board);
                this.board[col][row] = p1.boardID;
                this.setTile(col, row, p1.boardID, this.p1_board);
                this.player1_ship_count++;
                this.p1.ships.push([col, row]);
            }
        }
        // add player 2's five ships
        while (this.player2_ship_count < 5) {
            var col = Math.floor((Math.random() * this.dimension));
            var row = Math.floor((Math.random() * this.dimension));

            // if we find an empty tile, insert id number for player 2's ship into board, update
            // player1's board, and add coordinates to player 1's array of ships
            if (this.getTile(col, row, this.board) == 0) {
            		console.log(col + ", " + row + "p2 board id: " + p2.boardID);
            		this.board[col][row] = p2.boardID;
                // this.setTile(col, row, p2.getID(), this.board);
                this.setTile(col, row, p2.boardID, this.p2_board);
                this.player2_ship_count++;
                this.p2.ships.push([col, row]);
            }
        }
        console.log(this.p1.ships)
        console.log(this.p2.ships)
    }

    this.checkValidMove = function(column, row, playerID) {
    	var otherPlayer = this.p1.id == playerID ? this.p2 : this.p1;
        var tile = this.getTile(column, row, this.board);
        console.log(column, ", " + row);

        // valid move if the tile is empty or if the tile is a ship of the opposite player
        return tile == 0 || tile == otherPlayer.boardID;
    }

    this.checkHit = function(column, row, playerBoard) {
        var otherPlayer = this.p1.id == playerID ? this.p2 : this.p1;

        return this.getBoard()[column][row] == otherPlayer.id;
    }

    this.won = function(playerID) {
        var otherPlayer = this.p1.id == playerID ? this.p2 : this.p1;
        var otherPlayerArray = otherPlayer.getShips();

        for (var i = 0; i < otherPlayerArray.length; i++) {
            var column = otherPlayerArray[i][0];
            var row = otherPlayerArray[i][1];

            // are the other players ships all hit?
            if (this.getTile(column, row, this.board) != otherPlayer.boardID) {
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

        player1.boardID = 1;
        player2.boardID = 2;

        var game = new Game(player1, player2);
        game.initializeBoard();
        game.initializeShips();
        games[playerID.toString() + selectedPlayerID.toString()] = game;

        fn(game.dimension.toString());

        // send player1's view of board as 2d array to client
        socket.emit("initialBoard", player1.getShips());
    });

    // this will be emitted with ack, fn is the function we use to ack
    socket.on("playerTappedBoard", function(p1ID, p2ID, column, row, fn) {
    	var player1 = clients[p1ID];
    	var player2 = clients[p2ID];
    	console.log(player2.getShips());

        var game = games[p1ID.toString() + p2ID.toString()];
        var validMove = game.checkValidMove(column, row, p1ID);

        if (validMove) {
            game.setTile(column, row, player1.boardID, game.board);

            fn("valid");
            // TODO: if won, emit won

            if (game.won(p1ID)) {
                //socket.emit("won");
                var p2Socket = clients[p1ID].socket;
                p2Socket.emit("won");
            }
        } else {
            fn("invalid");
        }
    });
});

http.listen(3000, function() {
    console.log('listening on *:3000');
});
