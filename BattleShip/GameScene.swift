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
    var gameController: GameController!
    var brushColor = TileColor.Red
    var gameTimer: NSTimer!
    let client = Client()
    
    override func didMoveToView(view: SKView) {
        // gamescene.sks messes up view, let's fix that
        self.size = view.bounds.size
        
        // pan gesture recognizer
        let panGestureRecognizer = UIPanGestureRecognizer(target: self, action: "didPanOnTiles:")
        let tapToChangeColorGestureRecognizer = UITapGestureRecognizer(target: self, action: "tappedOutsideOfGameBoard:")
        tapToChangeColorGestureRecognizer.numberOfTapsRequired = 1 // require two fingers
        tapToChangeColorGestureRecognizer.numberOfTouchesRequired = 1 // require two consecutive taps
        self.view?.addGestureRecognizer(panGestureRecognizer)
        self.view?.addGestureRecognizer(tapToChangeColorGestureRecognizer)
        
        // add a gameboard to the screen
        game_board = GameBoard(rows: 7, columns: 7, boardWidth: self.size.width, boardHeight: self.size.height)
        // add sprites to scene
        for tiles in game_board.tiles {
            for tile in tiles {
                print(tile.description)
                self.addChild(tile.sprite!)
            }
        }
        
        self.gameController = GameController(gameBoard: self.game_board, gameScene: self)
        
        // everything loaded, let us set up game timer
        self.gameController.startTime = NSDate.timeIntervalSinceReferenceDate()
        //self.gameTimer = NSTimer.scheduledTimerWithTimeInterval(0.01, target: self, selector: "updateTimer:", userInfo: nil, repeats: true)
        client.talkToServer()
    }
    
    func updateTimer(timer: NSTimer) {
        let currentTime = NSDate.timeIntervalSinceReferenceDate()
        
        var passedTime: NSTimeInterval = currentTime - self.gameController.startTime
        
        // calculate minutes passed
        let minutes = UInt8(passedTime / 60.0)
        
        passedTime -= (NSTimeInterval(minutes) * 60)
        
        // seconds passed
        let seconds = UInt8(passedTime)
        
        passedTime -= NSTimeInterval(seconds)
        
        // fraction of second passed (0.01 second accuracy)
        let fractionOfSecond = UInt8(passedTime * 100)
        
        // print for now, but this can be put into a label later
        let strMinutes = String(format: "%02d", minutes)
        let strSeconds = String(format: "%02d", seconds)
        let strFraction = String(format: "%02d", fractionOfSecond)
        
        print("\(strMinutes):\(strSeconds):\(strFraction)")
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        /* Called when a touch begins */
    }
    
    override func update(currentTime: CFTimeInterval) {
        /* Called before each frame is rendered */
    }
    
    // handle tap to change color
    func tappedOutsideOfGameBoard(gestureRecognizer: UITapGestureRecognizer) {
        let position = gestureRecognizer.locationInView(self.view)
        let touchedNode = getTouchedNode(position);
        let touchedTile = game_board.tileFromName(touchedNode?.name)
        
        guard let _ = touchedTile else {
            if self.brushColor == .Red {
                self.brushColor = .Blue
            } else {
                self.brushColor = .Red
            }
            return
        }
    }
    
    // handle pan gestures
    func didPanOnTiles(gestureRecognizer: UIPanGestureRecognizer) {
        let position = gestureRecognizer.locationInView(self.view)
        let touchedNode = getTouchedNode(position);
        let touchedTile = game_board.tileFromName(touchedNode?.name)
        
        guard let _ = touchedTile else {
            return
        }
        
        // get beginning tile
        if gestureRecognizer.state == UIGestureRecognizerState.Began {
            initialTouchedTile = touchedTile
            lastTouchedTile = initialTouchedTile
            // once we've ended
        } else if gestureRecognizer.state == UIGestureRecognizerState.Ended {
            if lastTouchedTile.row != initialTouchedTile.row {
                game_board.changeRowColor(lastTouchedTile.column, color: self.brushColor.rawValue)
            } else if lastTouchedTile.column != initialTouchedTile.column {
                game_board.changeColumnColor(lastTouchedTile.row, color: self.brushColor.rawValue)
            }
            
            self.gameController.numberOfMoves++
            // while dragging
        } else {
            lastTouchedTile = touchedTile
        }
    }
    
    // handles sprite behavior (i.e. rotation, highlating) based on touch position
    func getTouchedNode(locationInView: CGPoint) -> SKNode? {
        // convert to the coord system of this scene class
        let convertedPosition = self.convertPointFromView(locationInView)
        let touchedSprite = self.nodeAtPoint(convertedPosition)
        
        return touchedSprite
    }
}