//
//  EndScreenViewController.swift
//  BattleShip
//
//  Created by Zishi Wu on 3/16/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import UIKit

class EndScreenViewController: UIViewController, UINavigationBarDelegate {

    var string: String!
    @IBOutlet weak var end_message: UILabel!
    @IBOutlet weak var navBar: UINavigationBar!
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
        self.end_message.text = string
        self.navBar.delegate = self
        Client.sharedInstance.setupHandlersAndConnect()
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    @IBAction func newGamePressed(sender: AnyObject) {
        Client.sharedInstance.socket.emitWithAck("findPlayers", Client.sharedInstance.id)(timeoutAfter: 0, callback: {[weak self] data in
            //self?.client.socket.emit("selectedPlayer", (self?.client)!.id, 2)
            
            if let players = data[0] as? NSArray {
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
                self?.presentViewController(selectPlayerVC, animated: true, completion: nil)
            } else {
                print("fail")
            }
        })
    }

    @IBAction func returnToMainScreenPressed(sender: AnyObject) {
        let storyBoard = UIStoryboard(name: "Main", bundle: nil)
        let mainScreenVC = storyBoard.instantiateViewControllerWithIdentifier("InitialSceneViewController") as! InitialSceneViewController
        
        self.presentViewController(mainScreenVC, animated: true, completion: nil)
    }
    
    func positionForBar(bar: UIBarPositioning) -> UIBarPosition {
        return UIBarPosition.TopAttached
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
