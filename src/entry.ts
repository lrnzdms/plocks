import { BoardProperties } from "./boardProperties";
import { Board } from "./board";
import { Block } from "./block";

const colors:{id: string, marked:string, unmarked:string}[] = [
    {marked: "#FF3333", unmarked: "#CC0000", id: "red"}, //red
    {marked: "#3B9DFF", unmarked: "#0069D1", id: "blue"}, //blue 
    {marked: "#82FF21", unmarked: "#5DD600", id: "green"}, //green
    {marked: "#FFFF2E", unmarked: "#EDED00", id: "yellow"}, //yellow
    {marked: "#FFB35C", unmarked: "#E07800", id: "orange"}, //orange
    {marked: "#2BFFCD", unmarked: "#00D6A4", id: "aqua"}, //aqua 
    {marked: "#BD54FF", unmarked: "#9D00FF", id: "purple"}, //purple
    {marked: "#FF4AEA", unmarked: "#E300C8", id: "pink"} //pink 
]

const FRAMES = 100;
let SCREEN_WIDTH = 500;
let SCREEN_HEIGHT = 100;
let BLOCK_SIZE = 1;
let CTX:CanvasRenderingContext2D;
export const initialize = (callback:()=>void) => {
    
    let p = new BoardProperties(FRAMES)
    
    BLOCK_SIZE = SCREEN_WIDTH / p.block_width;
    SCREEN_HEIGHT = BLOCK_SIZE * p.block_height;
    
    let board = new Board(p)

    const canvas = new HTMLCanvasElement();
    const context = canvas.getContext("2d");
    if (!context) throw new Error("eerroorr");
    CTX = context;
}

const paint = (blocks:(Block|undefined)[]) => {

        // this.screen.fill(pygame.Color("black"))


        blocks.forEach(b => b && paintBlock(b));

        // // render text
        // label = this.font.render(str(this.board.killed_blocks), 1, (255,255,0))
        // this.screen.blit(label, (100, 100))
        // pygame.display.flip()
}

const paintBlock = (b:Block) => {
    const color = colors.find(c => c.id == b.color);
    if (!color) throw new Error("Could not find color");
    let marked = color.marked;
    let unmarked = color.unmarked;

    let x = b.x_act * BLOCK_SIZE;
    let y = SCREEN_HEIGHT - (b.y_act + 1) * BLOCK_SIZE;
    
    // DEPENDING ON MARKED SWITCH IF COLOR IS USED AS OUTLINE
    // if (b.marked)
    //     unmarked, marked = marked, unmarked

    CTX.fillStyle = unmarked;
    CTX.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE)
    CTX.fillStyle = marked;
    CTX.fillRect(x+2, y+2, BLOCK_SIZE-4, BLOCK_SIZE-4)
}