//
//  SelectPlayerViewController.swift
//  BattleShip
//
//  Created by fery3 on 3/7/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import UIKit

class SelectPlayerViewController: UIViewController, UITableViewDataSource, UITableViewDelegate, UINavigationBarDelegate {
    
    @IBOutlet weak var playerTableView: UITableView!
    @IBOutlet weak var navBar: UINavigationBar!
    
    var players: NSArray!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Do any additional setup after loading the view.
        self.playerTableView.delegate = self
        self.playerTableView.dataSource = self
        self.navBar.delegate = self
        
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
        
        // need to read through some ship objects
        Client.sharedInstance.socket.on("initialBoard") {[weak self]data, ack in
            if let data = data[0] as? NSArray {
                // print(data)
  
                // iterate through NSArray to get [col, row] data and add Coordinates(row, col) to shipsArray
                for index in 0...data.count - 1 {
                    let shipDictionary = data[index]
                    let length = shipDictionary["length"]! as! Int
                    let coordinates_js = shipDictionary["coordinates"]!
                    var coordinates_swift = [Coordinates]()
                    // JS and Swift Coordinate objects may be different so iterate through coordinate array and
                    // convert JS coordinate object to swift coordinate object
                    for i in 0...coordinates_js!.count - 1 {
                        let x = coordinates_js![i]["col"] as! Int
                        let y = coordinates_js![i]["row"] as! Int
                        let coordinate = Coordinates(xCoord: x, yCoord: y)
                        coordinates_swift.append(coordinate)
                    }
                    
                    let direction = shipDictionary["direction"] as! Int
                    let ship = Ship(length: length, coordinates: coordinates_swift, direction: direction)
                   
                    /*
                    let coordinateArray = data[index] as! NSDictionary
                    let col = coordinateArray["x"] as! Int
                    let row = coordinateArray["y"] as! Int
                    
                    let newCoordinate = Ship(length: 1, coordinates: [Coordinates(xCoord: col, yCoord: row)])
                    */
                     
                    Client.sharedInstance.shipsArray.append(ship)
                    //print(ship)
                }
                //print("ship array: \(Client.sharedInstance.shipsArray.count)")
                
                let storyBoard = UIStoryboard(name: "Main", bundle: nil)
                let gameVC = storyBoard.instantiateViewControllerWithIdentifier("GameViewController") as! GameViewController
                self?.presentViewController(gameVC, animated: true, completion: nil)
            } else {
                print("Failed to get data")
            }
        }
        
        Client.sharedInstance.socket.on("agreeToGame") {[weak self]data, ack in
            if let player = data[0] as? Int {
                Client.sharedInstance.otherPlayerID = player
                
                let alertController = UIAlertController(title: "Another player wants to play.", message: "Do you want to start a game with player \(player)?", preferredStyle: .Alert)
                
                let yesAction = UIAlertAction(title: "Yes", style: .Cancel) { (action) in
                    Client.sharedInstance.socket.emit("agreesToGame", Client.sharedInstance.id, Client.sharedInstance.otherPlayerID, true)
                }
                let noAction = UIAlertAction(title: "No", style: .Default) { (action) in
                    Client.sharedInstance.socket.emit("agreesToGame", Client.sharedInstance.id, Client.sharedInstance.otherPlayerID, false)
                }
                
                alertController.addAction(yesAction)
                alertController.addAction(noAction)
                
                self?.presentViewController(alertController, animated: true, completion: nil)
            } else {
                print("fail")
            }
        }
        
        Client.sharedInstance.socket.on("playerDisagreed") {[weak self]data, ack in
            let alertController = UIAlertController(title: "Other player said no.", message: "Other player doesn't want to play right now.", preferredStyle: .Alert)
            
            let okayAction = UIAlertAction(title: "Okay", style: .Cancel) { (action) in
                
            }
            
            alertController.addAction(okayAction)
            
            self?.presentViewController(alertController, animated: true, completion: nil)
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
        
        Client.sharedInstance.socket.emit("selectedPlayer", Client.sharedInstance.id, otherPlayerID)
        self.playerTableView.deselectRowAtIndexPath(indexPath, animated: true)
    }
    
    // called by nav bar delegate - to make nav bar be to the top of the screen
    func positionForBar(bar: UIBarPositioning) -> UIBarPosition {
        return UIBarPosition.TopAttached
    }
    
    @IBAction func cancelButtonPressed(sender: AnyObject) {
        Client.sharedInstance.socket.emit("notInterestedInGame", Client.sharedInstance.id)
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
