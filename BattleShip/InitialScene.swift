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
        self.newGameButton.name = "newGameButton"
        self.newGameButton.size = CGSize(width: (self.view?.bounds.width)! / 16, height: (self.view?.bounds.height)! / 16)
        let yPos = (self.size.height - (self.view?.bounds.width)!) / 4
        let xPos = (self.view?.bounds.width)! / 4
        Client.sharedInstance.setupHandlersAndConnect()
        
        self.newGameButton.position = CGPoint(x: xPos, y: yPos)
        self.addChild(self.newGameButton)
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        /* Called when a touch begins */
        for touch in touches {
            let touchedNode = self.getTouchedNode(touch.locationInView(self.view))
            
            // touched button, so show new game scene
            if let button = touchedNode where button.name == "newGameButton" {
                Client.sharedInstance.socket.emitWithAck("findPlayers", Client.sharedInstance.id)(timeoutAfter: 0, callback: {[weak self] data in
                    //self?.client.socket.emit("selectedPlayer", (self?.client)!.id, 2)

                    if let players = data[0] as? NSArray {
                        let vc = self?.view?.window?.rootViewController
                        let storyBoard = UIStoryboard(name: "Main", bundle: nil)
                        let selectPlayerVC = storyBoard.instantiateViewControllerWithIdentifier("SelectPlayerViewController") as! SelectPlayerViewController
                        
                        // add data to table view controller
                        selectPlayerVC.players = players
                        vc?.presentViewController(selectPlayerVC, animated: true, completion: nil)
                    } else {
                        print("fail")
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
}