//
//  InitialScene.swift
//  BattleShip
//
//  Created by fery3 on 3/6/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import SpriteKit

class InitialScene: SKScene {
    var newGameButton: SKSpriteNode!
    
    override func didMoveToView(view: SKView) {
        self.size = view.bounds.size
        
        self.newGameButton = SKSpriteNode(imageNamed: "blank_tile")
        self.newGameButton.size = CGSize(width: (self.view?.bounds.width)! / 16, height: (self.view?.bounds.height)! / 16)
        let yPos = (self.size.height - (self.view?.bounds.width)!) / 4
        let xPos = (self.view?.bounds.width)! / 4
        self.newGameButton.position = CGPoint(x: xPos, y: yPos)
        self.addChild(self.newGameButton)
        let scene = GameScene(fileNamed: "GameScene")
        self.view?.presentScene(scene)
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        /* Called when a touch begins */
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