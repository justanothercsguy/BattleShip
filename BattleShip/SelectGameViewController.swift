//
//  SelectGameViewController.swift
//  BattleShip
//
//  Created by fery3 on 3/19/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import UIKit

class SelectGameViewController: UIViewController, UITableViewDataSource, UITableViewDelegate {

    @IBOutlet weak var gamesTableView: UITableView!
    var games: NSArray!
    let TILE_EMPTY = 0
    let TILE_OCCUPIED = 3
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
        self.gamesTableView.dataSource = self
        self.gamesTableView.delegate = self
        
        Client.sharedInstance.socket.on("initialObserverBoard") {[weak self]data, ack in
            if let ships = data[0] as? NSArray {
                for row in 0...ships.count - 1 {
                    // first for loop is the number of columns
                    
                    let thisColumn = ships[row] as? NSArray
                    // iterate through NSArray to get [col, row] data and add Coordinates(row, col) to shipsArray
                    // row describes current index in the row while thisRow equals the entire row
                    for col in 0...thisColumn!.count - 1 {
                        let num: Int = thisColumn?.objectAtIndex(col) as! Int
                        if num != self!.TILE_EMPTY && num != self!.TILE_OCCUPIED {
                            // need to add x and y coordinates to ship array
                            
                            // wait what if we have to do the x and y reversal for the client and server
                            let coordinate = Ship(length: 1, coordinates: [Coordinates(xCoord: row, yCoord: col)])
                            Client.sharedInstance.shipsArray.append(coordinate)
                        }
                    }
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
    
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.games.count
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cellIdentifier = "zishiCell"
        let cell = self.gamesTableView.dequeueReusableCellWithIdentifier(cellIdentifier, forIndexPath: indexPath) as UITableViewCell
        
        cell.textLabel?.text = String(self.games.objectAtIndex(indexPath.row))
        print("it is \(self.games.objectAtIndex(indexPath.row))")
        
        return cell
    }
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        let game = self.games[indexPath.row] as! String
        let gameArray = game.characters.split{$0 == ":"}.map(String.init)
        
        Client.sharedInstance.socket.emitWithAck("selectedGame", gameArray[0] + gameArray[1])(timeoutAfter: 0, callback: {[weak self] data in
            if let data = data[0] as? String where data != "not ok" {
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
