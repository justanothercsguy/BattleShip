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
    var alertController: UIAlertController! // class var so it doesn't get deallocated in touches began until you press okay
    var vc: InitialSceneViewController!
    
    override func didMoveToView(view: SKView) {
        
        self.newGameButton = SKSpriteNode(imageNamed: "play_button")
        self.observerButton = SKSpriteNode(imageNamed: "observer_button")
        self.newGameButton.name = "newGameButton"
        self.observerButton.name = "observerButton"
        Client.sharedInstance.setupHandlersAndConnect()
        self.newGameButton.xScale = 2
        self.newGameButton.yScale = 2
        self.observerButton.xScale = 1.5
        self.observerButton.yScale = 1.5
        
        // SpriteKit CGFloat Coordinates: x = 0, y = 0 is bottom left corner of screen
        // Make play start at top third of screen and observer button stop at bottom third of screen
        self.newGameButton.position = CGPointMake(frame.width / 2, frame.height / 1.5)
        self.observerButton.position = CGPointMake(frame.width / 2, frame.height / 3)
        self.addChild(self.newGameButton)
        self.addChild(self.observerButton)
    }
    
    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        /* Called when a touch begins */
        for touch in touches {
            let touchedNode = self.getTouchedNode(touch.locationInView(self.view))
            
            // touched button, so show new game scene
            if let button = touchedNode {
                // if socket isn't connected and we are touching the new game or observer button, show UIAlertAction
                if Client.sharedInstance.socket.status == .NotConnected || Client.sharedInstance.socket.status == .Reconnecting || Client.sharedInstance.socket.status == .Connecting {
                    if button.name == "newGameButton" || button.name == "observerButton" {
                        self.alertController = UIAlertController(title: "Not Connected.", message: "You aren't connected to the server.", preferredStyle: .Alert)
                        
                        let okAction = UIAlertAction(title: "Okay", style: .Cancel, handler: nil)
                        
                        self.alertController.addAction(okAction)
                        self.vc.presentViewController(self.alertController, animated: true, completion: nil)
                        return
                    }
                }
                
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
                            let selectPlayerVC = storyBoard.instantiateViewControllerWithIdentifier("SelectGameViewController") as! SelectGameViewController
                            
                            // add data to table view controller
                            let games = NSMutableArray()
                            for player in players {
                                games.addObject(player)
                            }
                            
                            selectPlayerVC.games = games.copy() as! NSArray
                            vc?.presentViewController(selectPlayerVC, animated: true, completion: nil)
                            Client.sharedInstance.isObserver = true
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