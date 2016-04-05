// Game class - parameters: player1, player2, board
module.exports = function Game(p1, p2) {

    this.p1 = p1;
    this.p2 = p2;
    this.currentTurn = 0;

    // Socket that sends message to observer != null
    this.observerSockets = [];

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
            var col = Math.floor((Math.random() * this.dimension)); // x-axis coordinate
            var row = Math.floor((Math.random() * this.dimension)); // y-axis coordinate

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
                for (var i = startDirection; i < startDirection + 4; i++) {

                    // get the current direction we are on and try fitting it into board
                    var currentDirection = i % 4;

                    if (currentDirection == ShipDirection.UP) { // try UP direction
                        console.log("Reached UP direction");
                        // same column number, check row numbers above randomly generated row
                        // example: coordinate is (col: 4, row: 5), length = 3 -> then check (4,4) and (4,3) 
                        for (var j = 1; j < length; j++) {
                            if (this.board[col][row - j] != 0) {
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
                                var coordinate = new Coordinate(col, row - j);
                                coordinates.push(coordinate);

                                // problem is how do we distinguish player 1's ships from each other
                                this.board[col][row - j] = p1.ID;
                                console.log("added ship at " + col + "," + row - j + " to the board");
                            }
                            break;
                        }
                    } else if (currentDirection == ShipDirection.RIGHT) { // try RIGHT direction
                        console.log("Reached RIGHT direction");
                        // same row number, check column numbers to right of randomly generated column
                        // example: coordinate is (col: 4, row: 5), length = 3 -> then check (5,5) and (6,5) 
                        for (var j = 1; j < length; j++) {
                            if (this.board[col + j][row] != 0) {
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
                                var coordinate = new Coordinate(col + j, row);
                                coordinates.push(coordinate);

                                // problem is how do we distinguish player 1's ships from each other
                                this.board[col + j][row] = p1.ID;
                                console.log("added ship at " + col + j + "," + row + " to the board");
                            }
                            break;
                        }
                    } else if (currentDirection == ShipDirection.DOWN) { // try DOWN direction
                        console.log("Reached DOWN direction");
                        // same column number, check row numbers below randomly generated row
                        // example: coordinate is (col: 4, row: 5), length = 3 -> then check (4,6) and (4,7) 
                        for (var j = 1; j < length; j++) {
                            if (this.board[col][row + j] != 0) {
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
                                var coordinate = new Coordinate(col, row + j);
                                coordinates.push(coordinate);

                                // problem is how do we distinguish player 1's ships from each other
                                this.board[col][row + j] = p1.ID;
                                console.log("added ship at " + col + "," + row + j + " to the board");
                            }
                            break;
                        }
                    } else { //currentDirection must equal LEFT
                        console.log("Reached LEFT direction");
                        // same row number, check column numbers to left of randomly generated column
                        // example: coordinate is (col: 4, row: 5), length = 3 -> then check (3,5) and (2,5) 
                        for (var j = 1; j < length; j++) {
                            // if not empty, then this is not valid direction to place ship
                            if (this.board[col - j][row] != 0) {
                                validPlacement = 0;
                            }
                        }
                        // test validPlacement var
                        if (validPlacement == 0) {
                            console.log("col: " + col + ", row: " + row + " doesn't work going LEFT")
                        } else { // valid placement of ship at (col, row) going to LEFT
                            console.log("col: " + col + ", row: " + row + " works going LEFT")

                            // create all coordinates for ship array
                            for (var j = 1; j < length; j++) {
                                var coordinate = new Coordinate(col - j, row);
                                coordinates.push(coordinate);

                                // push ship coordinate to board
                                // problem is how do we distinguish player 1's ships from each other
                                this.board[col - j][row] = p1.ID;
                                console.log("added ship at " + col - j + "," + row + " to the board");
                            }
                            break;
                        }
                    }

                } // end of for loop to test all four directions

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