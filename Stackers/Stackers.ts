import { TopDownEngine as TDE } from '../TopDownEngine/Engine.js';

class CutieArm {
    goingLeft: boolean;
    color: string;

    checkTouch() {
        // Begin stretching
        // Check neighbor cell
        let checkX = this.myCell.cell.x;
        if (this.goingLeft) {
            checkX--;
        }
        else {
            checkX++;
        }
        // Check to spread        
        if (checkX > 0 && checkX < 10) {
            if (!this.myCell.myBoard[ this.myCell.cell.y ][ checkX ].contents ) {
                this.myCell.myBoard[ this.myCell.cell.y ][ checkX ].contents = new CutieArm( this.myCell.myBoard[ this.myCell.cell.y ][ checkX ], this.myCutie );
            }
        }
    }

    constructor(public myCell: Cell, public myCutie: Cutie) {

    }
}

class Cutie {
    isCutie = true;
    isFalling: boolean;
    myPos: TDE.Coord;

    isReaching: boolean;
    isPopping: boolean;

    color: string;

    myCell: Cell;

    getTouched() {

    }

    checkFall() {
        // Check finished sliding
            // Check if seated
                // Check neighbors for 4 count
                    // Begin Touch!
                // Fall Again
        // Continue sliding
    }

    getSeated() {
        // Seat and check neighbors for trigger
        // Find closest cell

        this.myCell = this.myBoard.getClosestCell(this.myPos.x, this.myPos.y);
        this.myCell.seat(this);
    }

    constructor(public myBoard: Board) {

    }
}

class CutiePair {
    dropPos: TDE.Coord;
    Cutie1: Cutie;
    Cutie2: Cutie;

    rotation: number;
}

class Baddie {

}

class Cell {
    contents: Cutie | CutieArm | Baddie | null;
    cell: TDE.Coord;
    lastCountedOn: number;

    constructor(cellX: number, cellY: number, public myBoard: Board) {
        this.cell = new TDE.Coord(cellX, cellY);
    }

    seat(content: Cutie | CutieArm | Baddie) {
        this.contents = content;
    }

    checkTrigger() {
        // Count surrounding cuties for group of 4
        let stack: Cell[] = [ this ];
        let targetType = (<Cutie>this.contents).color;
        let triggerCount = 0;

        while (stack.length) {
            let toCheck = stack.pop();
            if (toCheck.lastCountedOn < this.myBoard.currentFrame && (<Cutie>toCheck.contents).color === targetType) {

                toCheck.lastCountedOn = this.myBoard.currentFrame;

                if ((<Cutie>toCheck.contents).isCutie) {
                    triggerCount++;
                }

                // Check x neighbors
                if (toCheck.cell.x > 0) {
                    stack.push(this.myBoard.cells[ toCheck.cell.y ][ toCheck.cell.x - 1 ]);
                }
                if (toCheck.cell.x < this.myBoard.boardSize.x - 1) {
                    stack.push(this.myBoard.cells[ toCheck.cell.y ][ toCheck.cell.x + 1 ]);
                }
                // Check y neighbors
                if (toCheck.cell.y > 0) {
                    stack.push(this.myBoard.cells[ toCheck.cell.y - 1 ][ toCheck.cell.x ]);
                }
                if (toCheck.cell.y < this.myBoard.boardSize.y - 1) {
                    stack.push(this.myBoard.cells[ toCheck.cell.y + 1 ][ toCheck.cell.x ]);
                }
            }

        }

        if (triggerCount >= 4) {

        }
    }
}

class Board {
    boardSize: TDE.Coord = new TDE.Coord();
    cells: Cell[][] = [];
    currentFrame: number = 0;

    constructor(xSize: number, ySize: number) {
        this.boardSize.x = xSize || 10;
        this.boardSize.y = ySize || 20;

        for (let eachRowNumber = 0; eachRowNumber < this.boardSize.y; eachRowNumber++) {
            this.cells[eachRowNumber] = []
            for (let eachColNumber = 0; eachColNumber < this.boardSize.x; eachColNumber++) {
                this.cells[eachRowNumber][eachColNumber] = new Cell(eachColNumber, eachRowNumber, this);
            }
        }
    }

    getClosestCell(xPos: number, yPos: number): Cell {
        let x, y;
        return this.cells[ y ][ x ] || null;
    }
}

export class Stackers {
    board: Board;
    constructor() {
        this.board = new Board(10, 20);
    }
}