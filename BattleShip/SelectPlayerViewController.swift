//
//  SelectPlayerViewController.swift
//  BattleShip
//
//  Created by fery3 on 3/7/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import UIKit

class SelectPlayerViewController: UIViewController, UITableViewDataSource, UITableViewDelegate {

    @IBOutlet weak var playerTableView: UITableView!
    var players: NSArray!
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
        self.playerTableView.delegate = self
        self.playerTableView.dataSource = self
        
        Client.sharedInstance.socket.on("availablePlayers") {[weak self]data, ack in
            if let players = data[0] as? NSArray {
                // add data to table view controller
                let otherPlayers = NSMutableArray()
                for player in players {
                    if player as! Int != Client.sharedInstance.id {
                        otherPlayers.addObject(player)
                    }
                }
                self?.players = otherPlayers.copy() as! NSArray
                self?.playerTableView.reloadData()
            } else {
                print("fail")
            }
        }
        
        Client.sharedInstance.socket.on("initialBoard") {[weak self]data, ack in
            if let data = data[0] as? NSArray {
                // iterate through NSArray to get [col, row] data and add Coordinates(row, col) to shipsArray
                for index in 0...data.count - 1 {
                    let coordinateArray = data[index] as! NSDictionary
                    let col = coordinateArray["x"] as! Int
                    let row = coordinateArray["y"] as! Int
                    
                    let newCoordinate = Ship(length: 1, coordinates: [Coordinates(xCoord: col, yCoord: row)])
                    Client.sharedInstance.shipsArray.append(newCoordinate)
                    // print(newCoordinate)
                }
                
                let storyBoard = UIStoryboard(name: "Main", bundle: nil)
                let gameVC = storyBoard.instantiateViewControllerWithIdentifier("GameViewController") as! GameViewController
                self?.presentViewController(gameVC, animated: true, completion: nil)
            } else {
                print("Failed to get data")
            }
        }
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    // how many rows in tableview
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.players.count
    }
    
    // what to show at each row in the table view
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cellIdentifier = "cell"
        let cell = self.playerTableView.dequeueReusableCellWithIdentifier(cellIdentifier, forIndexPath: indexPath) as UITableViewCell
        
        cell.textLabel?.text = String(self.players[indexPath.row])
        
        return cell
    }
    
    // selected a row in the table view
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        let otherPlayerID = self.players[indexPath.row] as! Int

        Client.sharedInstance.socket.emitWithAck("selectedPlayer", Client.sharedInstance.id, otherPlayerID)(timeoutAfter: 0, callback: {[weak self] data in
            if let data = data[0] as? String where data != "not ok" {
                Client.sharedInstance.otherPlayerID = otherPlayerID
                Client.sharedInstance.gameboardSize = Int(data)
            } else {
                print("error creating game")
            }
        })
    }
    
    @IBAction func cancelButtonPressed(sender: AnyObject) {
        self.presentingViewController?.dismissViewControllerAnimated(true, completion: nil)
    }
    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepareForSegue(segue: UIStoryboardSegue, sender: AnyObject?) {
        // Get the new view controller using segue.destinationViewController.
        // Pass the selected object to the new view controller.
    }
    */

}
