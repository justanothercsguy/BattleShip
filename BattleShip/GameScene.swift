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
    var vc: GameViewController!
    var myLabel: SKLabelNode!
    
    override func didMoveToView(view: SKView) {
        // gamescene.sks messes up view, let's fix that
        self.size = view.bounds.size
        
        // if observer, receive message on who won
        Client.sharedInstance.socket.on("someoneWon") {[weak self] data, ack in
            
            if let wonID = data[0] as? Int {
                let storyBoard = UIStoryboard(name: "Main", bundle: nil)
                let endScreenVC = storyBoard.instantiateViewControllerWithIdentifier("EndScreenViewController") as! EndScreenViewController
                
                endScreenVC.string = "Player \(wonID) won!"
                self?.vc.presentViewController(endScreenVC, animated: true, completion: nil)
            }
        }
        
        // check's if player hit or miss
        Client.sharedInstance.socket.on("hitOrMiss") {[weak self] data, ack in
            
            if let did_hit = data[0] as? Int {
                /*
                self!.label = UILabel(frame: CGRectMake(0, 0, 200, 30))
                self!.label.center = CGPointMake(self!.frame.size.width / 2, self!.frame.size.height / 4)
                self!.label.textAlignment = NSTextAlignment.Center
                */
                if did_hit == 1 {
                    self!.myLabel.text = "Hit!"
                    print("hit")
                } else {
                    self!.myLabel.text = "Miss!"
                }
                
            } else {
                print("failed to get hit or miss message")
            }
        }
        
        Client.sharedInstance.socket.on("won") {[weak self] data, ack in
            
            let storyBoard = UIStoryboard(name: "Main", bundle: nil)
            let endScreenVC = storyBoard.instantiateViewControllerWithIdentifier("EndScreenViewController") as! EndScreenViewController
            
            if let did_win = data[0] as? Int {
                // print(did_win)
                if did_win == 1 {
                    endScreenVC.string = "Won!"
                } else {
                    endScreenVC.string = "Lost!"
                }
            } else {
                print("failed to get data")
            }
            self?.vc.presentViewController(endScreenVC, animated: true, completion: nil)
        }
        
        // add a gameboard to the screen
        game_board = GameBoard(rows: Client.sharedInstance.gameboardSize, columns: Client.sharedInstance.gameboardSize, boardWidth: self.size.width, boardHeight: self.size.height)
        // add sprites to scene
        for tiles in game_board.tiles {
            for tile in tiles {
                // print(tile.description)
                self.addChild(tile.sprite!)
            }
        }
        // add ships to GameBoard - this part is crashing
        let ships = Client.sharedInstance.shipsArray
        for index in 0...ships.count - 1 {
            // tile that we need to add ship_sprite to
            let tile = game_board.tiles[ships[index].coordinates[0].yCoord][ships[index].coordinates[0].xCoord]
            let ship = SKSpriteNode(imageNamed: "battleship")
            ship.position = tile.sprite!.position
            ship.size = tile.sprite!.size
            
            // if I set ship to same size as tile sprite, then ship sprite prevents tile from 
            // getting registered as a valid move and showing an x mark
            // ship.setScale(0.5)
            self.addChild(ship)
        }
        // add label to tell if player hit or miss
        self.myLabel = SKLabelNode(fontNamed: "Arial")
        self.myLabel.text = "Test"
        self.myLabel.fontSize = 20;
        self.myLabel.position = CGPointMake(CGRectGetMidX(self.frame), CGRectGetMidY(self.frame)/2);
        self.addChild(self.myLabel)
        
        // handle updating gameboard when the other player makes a move
        Client.sharedInstance.socket.on("otherPlayerMoved") {[weak self] data, ack in
            let column = String(data[0])
            let row = String(data[1])
            
            self?.drawHitSpriteAt(Int(column)!, row: Int(row)!)
        }
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        /* Called when a touch begins */
        if Client.sharedInstance.isObserver {
            return
        }
        
        for touch in touches {
            let touchedNode = self.getTouchedNode(touch.locationInView(self.view))
            let touchedTile = self.game_board.tileFromName(touchedNode?.name)
            
            if let tile = touchedTile {
                Client.sharedInstance.socket.emitWithAck("playerTappedBoard", Client.sharedInstance.id, Client.sharedInstance.otherPlayerID, tile.column, tile.row)(timeoutAfter: 0, callback: {data in
                    // if server returns valid move, let us place the used sprite on that tile
                    if data[0] as! String == "valid" {
                        self.drawHitSpriteAt(tile.column, row: tile.row)
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
    
    func drawHitSpriteAt(column: Int, row: Int) {
        let tile = self.game_board.tileFromName("\(column),\(row)")
        
        let usedTileSprite = SKSpriteNode(imageNamed: "hit_sprite")
        usedTileSprite.position = tile!.sprite!.position
        usedTileSprite.size = tile!.sprite!.size
        
        // shrink to half the size so it fits within a tile
        usedTileSprite.setScale(0.5)
        self.addChild(usedTileSprite)
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