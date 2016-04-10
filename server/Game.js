var Player = require('./Player');

// don't know how to divide into separate class file - will do later
function Ship(length, coordinates, direction) {
    this.length = length;
    this.coordinates = coordinates;
    this.direction = direction;
}

// enum style object to denote direction of ship
// we will only use two directions: down and right
ShipDirection = {
    DOWN: 0,
    RIGHT: 1
}

// coordinate class: row = index of 1d array in the 2d array, column = index of value in 1d array
function Coordinate(row, col) {
    this.row = row;
		this.col = col;
}
		
// Game class - parameters: player1, player2, board
module.exports = function Game(p1, p2) {

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
    /* 
    NOTE: DON'T use this: this.p2_board = new Array(this.dimension).fill(new Array(this.dimension).fill(0));
    I was trying to test my validPlacement function by setting [row+1][col] = 1 (the point below the randomly 
    chosen point) so that the function would detect the 1 (not empty tile) -> unfortunately every row in that column = 1
    Fixed this bug by using nested for loops to make 2d array board	
    */
      
    // Once a game starts, the server will create an empty (full of O's) square grid
    // between size 8x8 and 24x24, then initialize boards for player 1 and player 2
    this.initializeBoard = function() {
       
        this.dimension = 10; //Math.floor((Math.random() * 16) + 8);    
        for (var i = 0; i < this.dimension; i++) {
            var row = [];
            for (var j = 0; j < this.dimension; j++) {
                row.push(0);
            }
            this.board[i] = row;
            this.p1_board[i] = row;
            this.p2_board[i] = row;
        }
    }  
      
    // return 0 if a tile in specified direction is not empty; otherwise return 1
    this.checkValidPlacement = function(row, col, length, direction) {  

    		// DOWN: same column number, check row numbers larger than randomly generated row
  			// example: coordinate is (row: 4, col: 5), length = 3 -> then check (5,5) and (6,5) 
        if (direction == ShipDirection.DOWN) {
        		// console.log("board before: check valid placement DOWN");
        		for (var r = row; r < row+length; r++) {
        				// console.log("row: " + r + ", col: " + col + ", value: " + this.board[r][col]);
        				if (this.board[r][col] != 0) {
        						console.log("invalid placement DOWN");
            				return 0;
            		}
       			}
       	}  
       	// RIGHT: same row number, check column numbers larger than randomly generated column
  			// example: coordinate is (row: 4, col: 5), length = 3 -> then check (4,6) and (4,7) 	
       	else {	
        		// console.log("board before: check valid placement RIGHT");
        		for (var c = col; c < col+length; c++) {
        				// console.log("row: " + row + ", col: " + c + ", value: " + this.board[row][c]);
        				if (this.board[row][c] != 0) {
        						console.log("invalid placement RIGHT");
            				return 0;
            		}
       			}    		
       	}      	
       	console.log("Valid placement");   	
       	return 1;
    }
    
    // add ship with parameters length, coordinates, direction
    this.addShip = function(row, col, length, direction, playerID) {
				var player = this.p1.id == playerID ? this.p1 : this.p2;    
				var coordinates = [];
				
				if (direction == ShipDirection.DOWN) {
        		console.log("reached addShip DOWN");
        		for (var r = row; r < row+length; r++) {
        				var coordinate = new Coordinate(r, col);
            		coordinates.push(coordinate);
            		this.board[r][col] = playerID;
        		}         		
        }
        else {	// direction == ShipDirection.RIGHT
       			console.log("reached addShip RIGHT");
	     			for (var c = col; c < col+length; c++) {
        				var coordinate = new Coordinate(row, c);
            		coordinates.push(coordinate);
            		this.board[row][c] = playerID;
            }		
       	} 
        var ship = new Ship(length, coordinates, direction);
        player.ships.push(ship);

       	// on the board, make sure the player's id are on the coordinates of his ship
        console.log("Board after adding ship");
        console.log(this.board);  	
    }
		
    this.initializeShips = function(playerID) {    
        var row = 0; 		// y-axis coordinate
        var col = 0;		// x-axis coordinate	
				var player = this.p1.id == playerID ? this.p1 : this.p2;
				
				// each player will get 2 ships for now
				while (player.ships.length < 2) {			         
						// randomly select a ship length between 2 and 5					
            var length = Math.floor((Math.random() * 4)) + 2;            
            if (length > this.dimension) {
            		console.log("ERROR: Length of ship is greater than board size");
            		break;
            }
            // randomly select a direction: down = 0, right = 1 
            var direction = Math.floor((Math.random() * 2)); 
            
            if (direction == ShipDirection.DOWN) {
            		console.log("Selected DOWN direction");
								col = Math.floor(Math.random() * this.dimension);		
             		row = Math.floor(Math.random() * (this.dimension - length + 1));
            } 
            else {	
            		console.log("Selected RIGHT direction");
								row = Math.floor(Math.random() * this.dimension);		
             		col = Math.floor(Math.random() * (this.dimension - length + 1));            		
            }
                    
            // if the point (row, col) is empty, check if the tiles that the ship needs to occupy are empty
        		if (this.board[row][col] == 0) {
        		
                console.log("row: " + row + ", col: " + col + " , length: " + length + ", direction: " + direction + ", dimension: " + this.dimension + ", playerID: " + playerID); 
                var validPlacement = this.checkValidPlacement(row, col, length, direction);    
                // console.log("board before adding ship");
        				// console.log(this.board);
               	if (validPlacement == 0) {
            				console.log("col: " + col + ", row: " + row + " ,length: " + length + " doesn't work");
            		}	else {
            				this.addShip(row, col, length, direction, playerID);    				
            		}		    						       		
						}
        		else {
        				console.log(row + ", " + col + " is not empty");
        				console.log(this.board);
        				console.log("row: " + row + ", col: " + col + ", value: " + this.board[row][col]);
        		}       		
				}	// end of while loop for generating 3 ships for player
				console.log("Reached end of loop to generate ships\n");
						
				// make sure Player ships array has ships 
				for (var i = 0; i < player.ships.length; i++) {
						console.log("player id: " + playerID + ", ship number: " + (i+1));
						console.log(player.ships[i]);
        		// console.log("ship length: " + player.ships[i].length);
        		// console.log("ship direction: " + player.ships[i].direction);
       		 	// console.log("start point: " + player.ships[i].coordinates[0].row + ", " + player.ships[i].coordinates[0].col);      	
        }
		}	// end of function to generate ships

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