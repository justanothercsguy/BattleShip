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
    let socket = SocketIOClient(socketURL: NSURL(string: "http://localhost:8080")!, options: [.Log(true), .ForcePolling(true)])
    
    func talkToServer() {        
        socket.on("connect") {data, ack in
            print("socket connected")
        }
        
        socket.on("currentAmount") {data, ack in
            if let cur = data[0] as? Double {
                self.socket.emitWithAck("canUpdate", cur)(timeoutAfter: 0) {data in
                    self.socket.emit("update", ["amount": cur + 2.50])
                }
                
                ack.with("Got your currentAmount", "dude")
            }
        }
        
        socket.connect()

    }
}