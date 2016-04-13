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

// represents a ship with its coordinates
struct Ship {
    var length: Int
    var coordinates: [Coordinates]
    var direction: Int
}

class Client {
    // make this a singleton
    static let sharedInstance = Client()
    
    // change 192.168.1.64 to your local ip address
    let socket = SocketIOClient(socketURL: NSURL(string: "http://battleship.mybluemix.net/:80")!, options: [.Log(false), .ForcePolling(true)])
    var id: Int!
    var otherPlayerID: Int!
    var gameWon = false
    var gameboardSize: Int!
    var shipsArray = [Ship]()
    var isObserver = false
    
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
        
        self.socket.on("clientID") {[weak self] data, ack in
            if let id = data[0] as? Int {
                self?.id = id
            }
        }
        /*
        self.socket.on("won") {data, ack in
            print("won")
        }
*/
        
        self.socket.on("newGameWithOtherPlayer") {[weak self] data, ack in
            // nothing else seems to work, have to do it this way to get the data out
            self?.gameboardSize = Int(String(data[0]))
            self?.otherPlayerID = Int(String(data[1]))
        }
        
        self.socket.on("disconnect") {[weak self] data, ack in
            print(data)
        }
        
        socket.connect()
    }
}