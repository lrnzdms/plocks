import { IBoard, IBoardProperties, IBoardInput, IBlock } from "./interfaces";
import { Board } from "./board";

const COLORS:{id: string, marked:string, unmarked:string}[] = [
    {marked: "#FF3333", unmarked: "#CC0000", id: "red"}, //red
    {marked: "#3B9DFF", unmarked: "#0069D1", id: "blue"}, //blue 
    {marked: "#82FF21", unmarked: "#5DD600", id: "green"}, //green
    {marked: "#FFFF2E", unmarked: "#EDED00", id: "yellow"}, //yellow
    {marked: "#FFB35C", unmarked: "#E07800", id: "orange"}, //orange
    {marked: "#2BFFCD", unmarked: "#00D6A4", id: "aqua"}, //aqua 
    {marked: "#BD54FF", unmarked: "#9D00FF", id: "purple"}, //purple
    {marked: "#FF4AEA", unmarked: "#E300C8", id: "pink"} //pink 
]

const BOARD_PROPS:IBoardProperties = {
    block_width: 20,
    block_height: 20,
    block_width_min: 7,
    row_time: 3000,
    mark_threshold: 3,
    speed_per_sec: 20.0,
    gravity: 20.0 / 100,
    colors: [
        {id: COLORS[0].id, prob: 0.40},
        {id: COLORS[1].id, prob: 0.40},        
        {id: COLORS[2].id, prob: 0.16},
        {id: COLORS[3].id, prob: 0.03},
        {id: COLORS[4].id, prob: 0.01}
    ]
}

const SCREEN_WIDTH = 500;
const BLOCK_SIZE = SCREEN_WIDTH / BOARD_PROPS.block_width;
const SCREEN_HEIGHT = BLOCK_SIZE * BOARD_PROPS.block_height;

let FRAME_ID:number;
let CTX:CanvasRenderingContext2D;
let BOARD:IBoard;
let INPUT:IBoardInput = {click: false, x: 0, y: 0}
let LAST_UPDATE = 0;

export const initialize = ():Promise<HTMLDivElement> => {
    
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("eerroorr");
    CTX = context;

    const div = document.createElement("div");
    div.appendChild(canvas);
    div.addEventListener( 'mousedown', mouseDown );
    div.addEventListener( 'mousemove', mouseMove );

    BOARD = new Board();
    BOARD.initialize(BOARD_PROPS);

    requestAnimationFrame(animate);
    
    return Promise.resolve(div);
}

const animate = (time:number) => {
    const delta = time - LAST_UPDATE;
    LAST_UPDATE = time;
    BOARD.update(delta, INPUT)
    paint(BOARD.blocks);
    FRAME_ID = requestAnimationFrame(animate);
    INPUT.click = false;
}

const paint = (blocks:(IBlock|undefined)[]) => {

        CTX.fillStyle = "black"
        CTX.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
        
        blocks.forEach(b => b && paintBlock(b));

        CTX.fillStyle = "white"
        CTX.fillText("" + BOARD.killed_blocks, 50, 50)
        // // render text
        // label = this.font.render(str(this.board.killed_blocks), 1, (255,255,0))
        // this.screen.blit(label, (100, 100))
        // pygame.display.flip()
}

const paintBlock = (b:IBlock) => {
    const color = COLORS.find(c => c.id == b.color);
    if (!color) throw new Error("Could not find color");
    let marked = color.marked;
    let unmarked = color.unmarked;

    let x = b.x_act * BLOCK_SIZE;
    let y = SCREEN_HEIGHT - ((b.y_act + 1) * BLOCK_SIZE);
    
    CTX.fillStyle = b.marked ? unmarked : unmarked;
    CTX.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE)
    CTX.fillStyle = b.marked ? unmarked : marked;
    CTX.fillRect(x+2, y+2, BLOCK_SIZE-4, BLOCK_SIZE-4)
}

const mouseDown = (event:MouseEvent) => {
    INPUT.click = true;
}

const mouseMove = (event:MouseEvent) => {
    INPUT.y = SCREEN_HEIGHT - event.y;
    INPUT.y /= BLOCK_SIZE    
    INPUT.y = intInRange(0, INPUT.y, BOARD_PROPS.block_height - 1);

    INPUT.x = event.x;
    INPUT.x /= BLOCK_SIZE
    INPUT.x = intInRange(0, INPUT.x, BOARD_PROPS.block_width - 1);
}

const intInRange = (min:number, x:number, max:number) => Math.floor(Math.max( min, Math.min(max, x) ));
