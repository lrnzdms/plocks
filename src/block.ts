export class Block {

    x:number;
    y:number;
    x_act:number;
    y_act:number;
    color:string;
    marked:boolean;
    
    constructor (y:number, x:number, color:string) {
        this.y = y;
        this.x = x;
        this.y_act = y;
        this.x_act = x;
        this.color = color;
    }
}
