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
    var observerButton: SKSpriteNode!
    
    override func didMoveToView(view: SKView) {
        
        self.newGameButton = SKSpriteNode(imageNamed: "play_button")
        self.observerButton = SKSpriteNode(imageNamed: "play_button")
        self.newGameButton.name = "newGameButton"
        self.observerButton.name = "observerButton"
        Client.sharedInstance.setupHandlersAndConnect()
        self.newGameButton.xScale = 2
        self.newGameButton.yScale = 2
        self.observerButton.xScale = 2
        self.observerButton.yScale = 2
        self.newGameButton.position = CGPointMake(frame.width / 2, frame.height / 2)
        self.observerButton.position = CGPointMake(frame.width / 4, frame.height / 4)
        self.addChild(self.newGameButton)
        self.addChild(self.observerButton)
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        /* Called when a touch begins */
        for touch in touches {
            let touchedNode = self.getTouchedNode(touch.locationInView(self.view))
            
            // touched button, so show new game scene
            if let button = touchedNode {
                if button.name == "newGameButton" {
                    Client.sharedInstance.socket.emitWithAck("findPlayers", Client.sharedInstance.id)(timeoutAfter: 0, callback: {[weak self] data in
                        //self?.client.socket.emit("selectedPlayer", (self?.client)!.id, 2)
                        
                        if let players = data[0] as? NSArray {
                            let vc = self?.view?.window?.rootViewController
                            let storyBoard = UIStoryboard(name: "Main", bundle: nil)
                            let selectPlayerVC = storyBoard.instantiateViewControllerWithIdentifier("SelectPlayerViewController") as! SelectPlayerViewController
                            
                            // add data to table view controller
                            let otherPlayers = NSMutableArray()
                            for player in players {
                                if player as! Int != Client.sharedInstance.id {
                                    otherPlayers.addObject(player)
                                }
                            }
                            
                            selectPlayerVC.players = otherPlayers.copy() as! NSArray
                            vc?.presentViewController(selectPlayerVC, animated: true, completion: nil)
                        } else {
                            print("fail")
                        }
                    })
                } else if button.name == "observerButton" {
                    Client.sharedInstance.socket.emitWithAck("findGames", Client.sharedInstance.id)(timeoutAfter: 0, callback: {[weak self] data in
                        //self?.client.socket.emit("selectedPlayer", (self?.client)!.id, 2)
                        
                        if let players = data[0] as? NSArray {
                            let vc = self?.view?.window?.rootViewController
                            let storyBoard = UIStoryboard(name: "Main", bundle: nil)
                            let selectPlayerVC = storyBoard.instantiateViewControllerWithIdentifier("SelectPlayerViewController") as! SelectPlayerViewController
                            
                            // add data to table view controller
                            let otherPlayers = NSMutableArray()
                            for player in players {
                                otherPlayers.addObject(player)
                            }
                            
                            selectPlayerVC.players = otherPlayers.copy() as! NSArray
                            vc?.presentViewController(selectPlayerVC, animated: true, completion: nil)
                        } else {
                            print("fail")
                        }
                    })
                }
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