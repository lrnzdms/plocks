import { Block } from "./block";
import { BoardProperties } from "./boardProperties";

export class Board {

    block_width:number;
    block_height:number;
    block_count:number;
    block_width_min:number;    
    block_width_min_start:number;
    block_width_min_end:number;
    gravity:number;
    center_x:number;
    row_time:number;
    row_timer:number;
    mark_threshold:number;
    blocks:(Block|undefined)[];
    colors:any[] = []
    colors_prob:any = {}
    running:boolean = false
    started:boolean = false
    killed_blocks = 0
    won:boolean = false
    
    constructor (p:BoardProperties) {        
        
        this.running = false
        random.seed()        
        this.blocks = []
        this.colors = []
        this.colors_prob = {}
        this.block_width = p.block_width
        this.block_height = p.block_height
        this.block_count = this.block_height * this.block_width
        this.block_width_min = p.block_width_min
        this.center_x = this.block_width / 2
        this.block_width_min_start = this.center_x - this.block_width_min/2
        this.block_width_min_end = this.center_x + this.block_width_min/2
        this.gravity = p.gravity
        this.row_time = p.row_time
        this.row_timer = this.row_time        
        this.mark_threshold = p.mark_threshold
        this.colors = p.colors
                
        let prob = 0.0
        this.colors.forEach(c => {
            prob += c["prob"]
            this.colors_prob[ c["id"] ] = prob
        })
            
        for (let x = 0; x < this.block_width; ++x)
            for (let y = 0; y < this.block_height; ++y)
                if (y < 10) // todo no magic number
                    this.blocks.push(undefined)
                else
                    this.blocks.push(new Block(y, x, this.getRandomColorId()))
                    
        this.running = true
        this.started = false
    }
        
    getColorProbById = (id:any) => {
        const c = this.colors.find(c => c["id"] == id);
        if (!c)
            console.error("Could not find prob for given id!")
        return c["prob"]
    }
        
    getRandomColorId = () => {
        let rand = random.random();
        const id = Object.keys(this.colors_prob).find(id => rand < this.colors_prob[id])
        if (!id) throw new Error("Undefined color found");
        return id;
    }
                
    getBlockId = (y:number, x:number) => (x * this.block_height) + y;
        
    getBlock = (y:number, x:number) => this.blocks[this.getBlockId(y, x)];
        
    setBlock = (y:number, x:number, b:Block|undefined) => this.blocks[this.getBlockId(y, x)] = b;
        
    markBlocks = (b:Block) => {
        b.marked = true
        let count = 1
        let neighbours = []
        if (b.y - 1 >= 0)
            neighbours.push( this.getBlock(b.y - 1, b.x) )
        if (b.y + 1 < this.block_height)
            neighbours.push( this.getBlock(b.y + 1, b.x) )
        if (b.x - 1 >= 0)
            neighbours.push( this.getBlock(b.y, b.x - 1) )
        if (b.x + 1 < this.block_width)
            neighbours.push( this.getBlock(b.y, b.x + 1) )
        
        const marked = neighbours.filter(n => n && n.color == b.color && !n.marked).map(m => m as Block);
        const counts = marked.map(this.markBlocks);
        counts.forEach(c => count += c);
        return count;
    }
        
    isFreeCol = (x:number) => {
        
        for (let y = 0; y < this.block_height; ++y) {
            let f = this.getBlock(y, x);
            if (f) return false;
        }

        return true   
    }
        
    end = (won:boolean) => {
        //if won:
        //    print("WON")
        //else:
        //   print("FAIL")
        this.running = false
        this.won = won
    }
        
    getData = () => [Date.now(), this.killed_blocks, this.won]
        
    update = (delta:number, mouse:any) => {

        //reset
        const existing_colors:any = {}
        this.blocks.forEach(b => {
            if (b) b.marked = false;
        })
                
        const click = mouse[0]
        const target = this.getBlock(mouse[1], mouse[2])        
        const count = target ? this.markBlocks(target) : 0;
        
        let mark = count >= this.mark_threshold;
        let kill = click && mark;
        
        if (click && !this.started) {
            this.started = true
            this.killed_blocks = 0
        }
                
        this.blocks.forEach((b, i) => {
            if (!b) return;
            
            // delete
            if (b.marked && kill) {
                this.killed_blocks += 1;
                this.blocks[i] = undefined;
                return;
            }

            // update marked
            b.marked = b.marked && mark;

            // collect existing colors
            if (b.color in Object.keys(existing_colors))
                existing_colors[b.color] += 1
            else
                existing_colors[b.color] = 1

            // move down
            if (b.y > 0 && !this.getBlock(b.y-1, b.x)) {
                b.y -= 1
                this.setBlock(b.y, b.x, b)
                this.blocks[i] = undefined
            }
        })
                
        // move to center from right
        for (let x = this.center_x; x < this.block_width; ++x) {
            if (this.isFreeCol(x)) {
                for (let xx = x+1; xx < this.block_width; ++xx) {
                    for (let yy = 0; yy < this.block_height; ++yy) {
                        let b = this.getBlock(yy, xx)
                        if (b) b.x -= 1
                        this.setBlock(yy, xx-1, b)
                        this.setBlock(yy, xx, undefined)
                    }
                }
            }
        }

        // move to center from left 
        for (let x = this.center_x-1; x >= 0; --x) {
            if (this.isFreeCol(x)) {
                for (let xx = x-1; xx >= 0; --xx) {
                    for (let yy = 0; yy < this.block_height; ++yy) {
                        let b = this.getBlock(yy, xx)
                        if (b) b.x += 1
                        this.setBlock(yy, xx+1, b)
                        this.setBlock(yy, xx, undefined)
                    }
                }
            }
        }
                        
        // check win state
        if (Object.keys(existing_colors).length == 0) {
            this.end(true);
            return
        }
        
        // new row
        if (this.started) {
            this.row_timer -= delta
            if (this.row_timer <= 0) {

                // update color tables
                if (Object.keys(existing_colors).length != this.colors.length) {

                    this.colors_prob.clear()
                    let new_total = 0.0
                    Object.keys(existing_colors).forEach(id => new_total += this.getColorProbById(id))
                    let prob = 0.0
                    Object.keys(existing_colors).forEach(id => {
                        prob += this.getColorProbById(id) / new_total
                        this.colors_prob[id] = prob
                    })
                }

                // move all blocks up by one
                for (let y = this.block_height-1; y >= 0; --y) {
                    for (let x = 0; x < this.block_width; ++x) {
                        let b = this.getBlock(y, x)
                        if (b) {
                            b.y += 1
                            // check fail state
                            if (y+1 >= this.block_height) {
                                this.end(false)
                                return
                            }
                            this.setBlock(y+1, x, b)
                            this.setBlock(y, x, undefined)
                        }
                    }
                }

                // create new block row
                let filled_cols = 0
                for (let x = 0; x < this.block_width; ++x) {
                    if (!this.isFreeCol(x) || x > this.block_width_min_start || x < this.block_width_min_end) {
                        let n = new Block(0, x, this.getRandomColorId())
                        n.y_act = -0.9
                        this.setBlock(0, x, n)
                        filled_cols += 1
                    }
                }
                    
                this.row_timer = this.row_time
                if (filled_cols <= this.block_width_min) {
                    this.row_timer *= 0.5
                    //print ("SPEED")
                }
            }
        }
        
        // apply gravity
        this.blocks.filter(b => b != undefined).map(b => b as Block).forEach(b => {
            if (b.y_act < b.y) {
                b.y_act += this.gravity / 5.0
                b.y_act = Math.min(b.y, b.y_act)
            } else if (b.y_act > b.y) {
                let mod = Math.ceil(b.y_act - b.y)
                b.y_act -= this.gravity * mod
                b.y_act = Math.max(b.y, b.y_act)
            }

            if (b.x < this.center_x) {
                let mod = Math.ceil(b.x - b.x_act)
                b.x_act += this.gravity * mod
                b.x_act = Math.min(b.x, b.x_act)
            } else if (b.x >= this.center_x) {
                let mod = Math.ceil(b.x_act - b.x)
                b.x_act -= this.gravity * mod
                b.x_act = Math.max(b.x, b.x_act)
            }
        })
    }
}