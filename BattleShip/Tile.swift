//
//  Tile.swift
//  Vectors
//
//  Created by Zishi Wu on 2/11/16.
//  Copyright © 2016 Zishi Wu. All rights reserved.
//
import SpriteKit

enum TileColor: Int, CustomStringConvertible {
    
    // enum identification: blank(grey) = 0, red = 1, blue = 2
    case Blank = 0, Red, Blue
    
    var spriteName: String {
        switch self {
        case .Blank:
            return "blank"
        case .Red:
            return "red"
        case .Blue:
            return "blue"
        }
    }
    // return tile color
    var description: String {
        return self.spriteName
    }
}

// overload == operator
func == (left: Tile, right: Tile) -> Bool {
    return left.column == right.column && left.row == right.row && left.color == right.color
}

func != (left: Tile, right: Tile) -> Bool {
    return !(left == right)
}

// by default, tile color is white
class Tile: CustomStringConvertible {
    
    // Properties of a tile: column, row, color, sprite
    var column: Int
    var row: Int
    var color: TileColor
    var sprite: SKSpriteNode?
    
    // returns name of sprite file to represent this tile
    var spriteName: String {
        return "\(color)_tile"
    }
    
    // return description of tile: column, row, color
    var description: String {
        return "\(column), \(row), \(color)"
    }
    
    // initialize tile, default color is blank
    init(column:Int, row:Int) {
        self.column = column
        self.row = row
        self.color = .Blank
        self.sprite = SKSpriteNode(imageNamed: "\(spriteName)")
    }
    
    // another way to initialize with CG coordinates
    // do we need this self.sprite?.name variable on intialization? I think we already have spriteName
    convenience init(column: Int, row: Int, spritePosition: CGPoint, spriteSize: CGSize, spriteName: String) {
        self.init(column: column, row: row)
        self.sprite?.position = spritePosition
        self.sprite?.size = spriteSize
        self.sprite?.name = spriteName
    }
    
    // changes color according to player
    func changeColor(player_num: Int) {
        if (player_num == 1) {
            self.color = .Red
        } else if (player_num == 2) {
            self.color = .Blue
        }
        self.sprite?.texture = SKTexture(imageNamed: "\(spriteName)")
    }
}
