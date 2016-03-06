//
//  Client.swift
//  BattleShip
//
//  Created by Zishi Wu on 3/5/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import Foundation
import SocketIOClientSwift

class Client {
    let socket = SocketIOClient(socketURL: NSURL(string: "http://localhost:3000")!, options: [.Log(false), .ForcePolling(true)])
    var id: Int!
    var gameBoard: GameBoard
    
    init(gameBoard: GameBoard) {
        self.gameBoard = gameBoard
    }
    
    func setupHandlersAndConnect() {
        self.socket.on("connect") {data, ack in
            print("socket connected")
            
            if let id = data[0] as? Int {
                self.id = id
            }
        }
        
        self.socket.on("updateGameBoard") {data, ack in
            if let gameBoardData = data[0] as? NSDictionary {
                // go through the message and use it to update the gameboard
                for tileCoords in gameBoardData {

                }
            }
        }
        
        self.socket.on("gameWon") {data, ack in
            
        }
        
        socket.connect()
    }
}