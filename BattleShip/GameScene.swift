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
    
    override func didMoveToView(view: SKView) {
        // gamescene.sks messes up view, let's fix that
        self.size = view.bounds.size
        
        // add a gameboard to the screen
        game_board = GameBoard(rows: Client.sharedInstance.gameboardSize, columns: Client.sharedInstance.gameboardSize, boardWidth: self.size.width, boardHeight: self.size.height)
        // add sprites to scene
        for tiles in game_board.tiles {
            for tile in tiles {
                // print(tile.description)
                self.addChild(tile.sprite!)
            }
        }
        // add ships to GameBoard
        let ships = Client.sharedInstance.shipsArray
        for index in 0...ships.count - 1 {
            // tile that we need to add ship_sprite to
            let tile = game_board.tiles[ships[index].yCoord][ships[index].xCoord]
            let ship = SKSpriteNode(imageNamed: "battleship")
            ship.position = tile.sprite!.position
            ship.size = tile.sprite!.size
            
            // if I set ship to same size as tile sprite, then ship sprite prevents tile from 
            // getting registered as a valid move and showing an x mark
            // ship.setScale(0.5)
            self.addChild(ship)
        }
        
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        /* Called when a touch begins */
        for touch in touches {
            let touchedNode = self.getTouchedNode(touch.locationInView(self.view))
            let touchedTile = self.game_board.tileFromName(touchedNode?.name)
            
            if let tile = touchedTile {
                Client.sharedInstance.socket.emitWithAck("playerTappedBoard", Client.sharedInstance.id, Client.sharedInstance.otherPlayerID, tile.row, tile.column)(timeoutAfter: 0, callback: {data in
                    // if server returns valid move, let us place the used sprite on that tile
                    if data[0] as! String == "valid" {
                        let usedTileSprite = SKSpriteNode(imageNamed: "hit_sprite")
                        usedTileSprite.position = tile.sprite!.position
                        usedTileSprite.size = tile.sprite!.size
                        
                        // shrink to half the size so it fits within a tile
                        usedTileSprite.setScale(0.5)
                        self.addChild(usedTileSprite)
                    } else {
                        // do something more pretty with the ui later, let mr. wu handle this
                        print("invalid move")
                    }
                })
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
    
    func handleWin(youWon: Bool) {
        let gameFinishedScene = GameFinishedScene(fileNamed: "GameFinishedScene")
        
        // we set the winLoseLabelText variable as appropriate and then in didMoveToView, we set the actual label to the value of the text variable.
        // otherwise, if we set it here, the actual sklabelnode will be nil since it hasn't been unwrapped from the sks file yet
        if youWon {
            gameFinishedScene?.winLoseLabelText = "you won"
        } else {
            gameFinishedScene?.winLoseLabelText = "you lost"
        }
        
        self.view?.presentScene(gameFinishedScene)
    }
}