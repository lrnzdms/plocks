import { IBoardProperties } from "./iBoardProperties";
import { IBoardInput } from "./iBoardInput";
import { IBlock } from "./iblock";

export interface IBoard {
    initialize(props:IBoardProperties):void,
    update(delta:number, input:IBoardInput):void,
    blocks:(IBlock|undefined)[]
}