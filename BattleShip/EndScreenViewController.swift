//
//  EndScreenViewController.swift
//  BattleShip
//
//  Created by Zishi Wu on 3/16/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//

import UIKit

class EndScreenViewController: UIViewController {

    var string: String!
    @IBOutlet weak var end_message: UILabel!
    
    override func viewDidLoad() {
        super.viewDidLoad()

        // Do any additional setup after loading the view.
        self.end_message.text = string
    }

    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
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
