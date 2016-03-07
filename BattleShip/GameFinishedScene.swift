//
//  GameFinishedScene.swift
//  BattleShip
//
//  Created by fery3 on 3/6/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import SpriteKit

class GameFinishedScene: SKScene {
    var winLoseLabel: SKLabelNode!
    var winLoseLabelText: String!
    
    override func didMoveToView(view: SKView) {
        self.size = view.bounds.size
        
        self.winLoseLabel = childNodeWithName("winLoseLabel") as! SKLabelNode
        self.winLoseLabel.text = self.winLoseLabelText
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        /* Called when a touch begins */
        
    }
    
    override func update(currentTime: CFTimeInterval) {
        /* Called before each frame is rendered */
    }
}
