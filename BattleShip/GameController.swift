//
//  GameController.swift
//  Vectors
//
//  Created by fery3 on 2/18/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import Foundation


// controls main state of the game and main logic of the game
class GameController {
    let gameBoard: GameBoard!
    var currentLoadedLevel: GameBoard!
    var startTime: NSTimeInterval!
    
    // game state variables
    var numberOfMoves: Int
    
    init(gameBoard: GameBoard, gameScene: GameScene) {
        self.gameBoard = gameBoard
        self.numberOfMoves = 0
    }
    
    // returns true if game won, false otherwise
    func checkGameWon() -> Bool {
        for column in 0...self.gameBoard.tiles.count - 1 {
            for row in 0...self.gameBoard.tiles[column].count - 1 {
                if  self.gameBoard.tiles[column][row] != self.currentLoadedLevel.tiles[column][row] {
                    return false
                }
            }
        }
        
        return true
    }
}