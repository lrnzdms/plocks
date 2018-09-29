import { IColor } from "./iColor";

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