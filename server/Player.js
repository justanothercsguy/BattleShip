// Player class - parameters: id, score, ships
// board id is always 1 or 2 to signify who owns a ship
// player id is the unique id of the player upon logging in
module.exports = function Player(id, socket) {
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