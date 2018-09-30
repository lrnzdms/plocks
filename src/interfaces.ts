
export interface IBoard {
    initialize(props:IBoardProperties):void,
    update(delta:number, input:IBoardInput):void,
    blocks:(IBlock|undefined)[],
    killed_blocks:number
}

export interface IBlock {
    x:number,
    y:number,
    x_act:number,
    y_act:number,
    color:string,
    marked:boolean
}

export interface IBoardInput {
    click:boolean, 
    x:number, 
    y:number
}

export interface IBoardProperties {
    block_width:number,
    block_height:number,
    block_width_min:number,
    row_time:number,
    mark_threshold:number,
    speed_per_sec:number,
    gravity:number,
    colors:IColor[]
}

export interface IColor {
    id:string,
    prob:number
}