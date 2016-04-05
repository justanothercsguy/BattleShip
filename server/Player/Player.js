// Player class - parameters: id, score, ships
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