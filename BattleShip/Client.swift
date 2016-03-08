//
//  Client.swift
//  BattleShip
//
//  Created by Zishi Wu on 3/5/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import Foundation
import SocketIOClientSwift
import SpriteKit

// to hold data that the server gives back
struct Coordinates {
    var xCoord: Int!
    var yCoord: Int!
}

class Client {
    // make this a singleton
    static let sharedInstance = Client()
    
    let socket = SocketIOClient(socketURL: NSURL(string: "http://localhost:3000")!, options: [.Log(false), .ForcePolling(true)])
    var id: Int!
    var otherPlayerID: Int!
    var gameWon = false
    var gameboardSize: Int!
    var shipsArray = [Coordinates]()
    
    func setupHandlersAndConnect() {
        self.socket.on("connect") {[weak self] data, ack in
            print("socket connected")
        }
        
        self.socket.on("updateGameBoard") {[weak self] data, ack in
            if let gameBoardData = data[0] as? NSDictionary {
                // go through the message - should be NSArray or NSDictionary
                for tileCoords in gameBoardData {

                }
            }
        }
        
        self.socket.on("gameWon") {data, ack in
            
        }
        
        self.socket.on("clientID") {[weak self] data, ack in
            if let id = data[0] as? Int {
                self?.id = id
            }
        }
        
        socket.connect()
    }
}