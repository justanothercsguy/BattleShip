//
//  GameScene.swift
//  Vectors
//
//  Created by Zishi Wu on 2/11/16.
//  Copyright (c) 2016 Zishi Wu. All rights reserved.
//

import SpriteKit

class GameScene: SKScene {
    var touchedTiles = [Tile]()
    var initialTouchedTile: Tile!
    var lastTouchedTile: Tile!
    var game_board: GameBoard!
    var brushColor = TileColor.Red
    var gameTimer: NSTimer!
    var client : Client!
    
    override func didMoveToView(view: SKView) {
        // gamescene.sks messes up view, let's fix that
        self.size = view.bounds.size
        
        // add a gameboard to the screen
        game_board = GameBoard(rows: 7, columns: 7, boardWidth: self.size.width, boardHeight: self.size.height)
        // add sprites to scene
        for tiles in game_board.tiles {
            for tile in tiles {
                print(tile.description)
                self.addChild(tile.sprite!)
            }
        }
        
        self.client = Client(gameBoard: self.game_board)
        
        client.setupHandlersAndConnect()
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        /* Called when a touch begins */
        for touch in touches {
            let touchedNode = self.getTouchedNode(touch.locationInView(self.view))
            let touchedTile = self.game_board.tileFromName(touchedNode?.name)
            
            if let tile = touchedTile {
                self.client.socket.emit("playerTappedBoard", tile.column, tile.row)
            }
        }
    }
    
    override func update(currentTime: CFTimeInterval) {
        /* Called before each frame is rendered */
    }
    
    // handles sprite behavior (i.e. rotation, highlating) based on touch position
    func getTouchedNode(locationInView: CGPoint) -> SKNode? {
        // convert to the coord system of this scene class
        let convertedPosition = self.convertPointFromView(locationInView)
        let touchedSprite = self.nodeAtPoint(convertedPosition)
        
        return touchedSprite
    }
}