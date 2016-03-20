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

    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return self.games.count
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cellIdentifier = "cell"
        let cell = self.gamesTableView.dequeueReusableCellWithIdentifier(cellIdentifier, forIndexPath: indexPath) as UITableViewCell
        
        cell.textLabel?.text = String(self.games[indexPath.row])
        
        return cell
    }
    
    func tableView(tableView: UITableView, didSelectRowAtIndexPath indexPath: NSIndexPath) {
        let game = self.games[indexPath.row] as! String
        let gameArray = game.characters.split{$0 == ":"}.map(String.init)
        
        Client.sharedInstance.socket.emitWithAck("selectedGame", Client.sharedInstance.id, gameArray[0] + gameArray[1])(timeoutAfter: 0, callback: {[weak self] data in
            if let data = data[0] as? String where data != "not ok" {
                Client.sharedInstance.gameboardSize = Int(data)
            } else {
                print("error creating game")
            }
        })
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
