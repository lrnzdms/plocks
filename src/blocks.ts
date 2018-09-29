const random:any;

class Block {

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

class BoardProperties {

    block_width:number = 20;
    block_height:number = 20;
    block_width_min:number = 7;
    row_time:number = 3.0;
    mark_threshold:number = 3;
    speed_per_sec:number = 20.0;
    gravity:number;
    colors:any[] = [];;

    constructor (frames:number){
        this.gravity = this.speed_per_sec / frames
        this.row_time *= 1000
        this.colors.push( {'id': 0, 'prob': 0.40} )
        this.colors.push( {'id': 1, 'prob': 0.40} )        
        this.colors.push( {'id': 2, 'prob': 0.16} )
        this.colors.push( {'id': 3, 'prob': 0.03} )
        this.colors.push( {'id': 4, 'prob': 0.01} )
    }
}
        
class Board {

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
    
    constructor (p:Board) {
        this.initialize(p)
    }
    
        
    initialize = (p:Board) => {

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
        
    setBlock = (y:number, x:number, b:Block) => this.blocks[this.getBlockId(y, x)] = b;
        
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
        const filtered = this.blocks.forEach(b => {
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
        for x in range(this.center_x, this.block_width):
            if this.isFreeCol(x):
                for xx in range(x+1, this.block_width):
                    for yy in range(this.block_height):
                        b = this.getBlock(yy, xx)
                        if b is not 0:
                            b.x -= 1
                        this.setBlock(yy, xx-1, b)
                        this.setBlock(yy, xx, 0)
                        
        // move to center from left
        for x in reversed(range(this.center_x)):
            if this.isFreeCol(x):
                for xx in reversed(range(0, x)):
                    for yy in range(this.block_height):
                        b = this.getBlock(yy, xx)
                        if b is not 0:
                            b.x += 1
                        this.setBlock(yy, xx+1, b)
                        this.setBlock(yy, xx, 0)
                        
        // check win state
        if (Object.keys(existing_colors).length == 0) {
            this.end(true);
            return
        }
        
        // new row
        if this.started:
            this.row_timer -= delta
            if this.row_timer <= 0:           
                // update color tables
                if len(existing_colors) is not len(this.colors):
                    this.colors_prob.clear()
                    new_total = 0.0
                    for id in existing_colors:
                        new_total += this.getColorProbById(id)
                    prob = 0.0
                    for id in existing_colors:
                        prob += this.getColorProbById(id) / new_total
                        this.colors_prob[id] = prob
                // move all blocks up by one
                for y in reversed(range(this.block_height)):
                    for x in range(this.block_width):
                        b = this.getBlock(y, x)
                        if b is not 0:
                            b.y += 1
                            // check fail state
                            if y+1 >= this.block_height:
                                this.end(false)
                                return
                            this.setBlock(y+1, x, b)
                            this.setBlock(y, x, 0)
                // create new block row
                filled_cols = 0
                for x in range(this.block_width):
                    if not this.isFreeCol(x) or x in range(this.block_width_min_start, this.block_width_min_end):
                        n = Block(0, x, this.getRandomColorId())
                        n.y_act = -0.9
                        this.setBlock(0, x, n)
                        filled_cols += 1
                this.row_timer = this.row_time
                if filled_cols <= this.block_width_min:
                    this.row_timer *= 0.5
                    //print ("SPEED")
        
        // apply gravity
        for b in this.blocks:
            if b is not 0:
                if b.y_act < b.y:
                    b.y_act += this.gravity / 5.0
                    b.y_act = min(b.y, b.y_act)
                elif b.y_act > b.y:
                    mod = ceil(b.y_act - b.y)
                    b.y_act -= this.gravity * mod
                    b.y_act = max(b.y, b.y_act)
                if b.x < this.center_x:
                    mod = ceil(b.x - b.x_act)
                    b.x_act += this.gravity * mod
                    b.x_act = min(b.x, b.x_act)
                elif b.x >= this.center_x:
                    mod = ceil(b.x_act - b.x)
                    b.x_act -= this.gravity * mod
                    b.x_act = max(b.x, b.x_act)
    }
}

class Blocks():

    frames = 100
    screen_width = 500
    screen_height = None
    block_width = None
    block_height = None
    clock = None
    screen = None
    mouse = [false, -1, -1] // click, y, x
    stats = None
    
    def initPygame(self):
        pygame.init()
        this.font = pygame.font.SysFont(None, 24)
        pygame.mouse.set_visible(true)
        this.screen = pygame.display.set_mode((this.screen_width, this.screen_height))
        this.screen.fill(pygame.Color("black"))
        pygame.display.flip()
        this.clock = pygame.time.Clock()
    
    def updatePygame(self):
        this.mouse[0] = false
        for event in pygame.event.get():
            if event.type is pygame.MOUSEBUTTONDOWN:
                if event.button is 1:
                    this.mouse[0] = true
            if event.type is pygame.MOUSEMOTION:
                this.mouse[1] = this.screen_height - event.pos[1]
                this.mouse[1] /= this.block_size
                this.mouse[1] = int(max( 0, min(this.block_height - 1, this.mouse[1]) ))
                this.mouse[2] = event.pos[0]
                this.mouse[2] /= this.block_size
                this.mouse[2] = int(max( 0, min(this.block_width - 1, this.mouse[2]) ))
            if event.type == pygame.QUIT:
                this.exit()
    
    def getColorById(self, id, marked):
        if marked:
            return this.colors_pygame[id][0]
        else:
            return this.colors_pygame[id][1]
  //Iwmfb      
    def paint(self, blocks):
        this.screen.fill(pygame.Color("black"))
        for b in blocks:
            if b is not 0:
                unmarked = this.getColorById(b.color, false)
                marked = this.getColorById(b.color, true)
                x = b.x_act*this.block_size
                y = this.screen_height - (b.y_act + 1)*this.block_size
                if b.marked:
                    unmarked, marked = marked, unmarked
                this.screen.fill(unmarked, (x, y, this.block_size, this.block_size))                
                this.screen.fill(marked, (x+2, y+2, this.block_size-4, this.block_size-4))
        
        // render text
        label = this.font.render(str(this.board.killed_blocks), 1, (255,255,0))
        this.screen.blit(label, (100, 100))
        pygame.display.flip()
        
    def loadStats(self):
        f = open('plocks/blocks.sav', 'r')
        this.stats = json.loads(f.read())        
        f.close()
        
    def saveStats(self):
        f = open('blocks.sav', 'w')
        d = json.dumps(this.stats)
        f.write(d)
        f.close()
        
    def printStats(self):
        count = len(this.stats)
        w = 0
        l = 0
        min = float("inf")
        sum = 0
        
        for s in this.stats:
            if s[2]:
                w += 1
            else:
                l += 1
            sum += s[1]
            if (s[1] < min):
                min = s[1]
        print("Total: " + str(count) + " (w: " + str(w) + ", l: " + str(l) + ")")
        print("Win:   " + str(100.0 * w / count) + "%")
        print("Min:   " + str(min))
        print("Mid:   " + str(sum / float(count)))
            
    def exit(self):
        this.running = false
        pygame.quit()
        sys.exit(1)
        
    def __init__(self):
        this.colors_pygame = {}
        this.colors_pygame[0] = [pygame.Color("#FF3333"), pygame.Color("#CC0000")] #red
        this.colors_pygame[1] = [pygame.Color("#3B9DFF"), pygame.Color("#0069D1")] #blue 
        this.colors_pygame[2] = [pygame.Color("#82FF21"), pygame.Color("#5DD600")] #green
        this.colors_pygame[3] = [pygame.Color("#FFFF2E"), pygame.Color("#EDED00")] #yellow
        this.colors_pygame[4] = [pygame.Color("#FFB35C"), pygame.Color("#E07800")] #orange
        this.colors_pygame[5] = [pygame.Color("#2BFFCD"), pygame.Color("#00D6A4")] #aqua 
        this.colors_pygame[6] = [pygame.Color("#BD54FF"), pygame.Color("#9D00FF")] #purple
        this.colors_pygame[7] = [pygame.Color("#FF4AEA"), pygame.Color("#E300C8")] #pink 
        
        p = BoardProperties(this.frames)
        this.block_width = p.block_width
        this.block_height = p.block_height
        this.block_size = int(this.screen_width / this.block_width)
        this.screen_height = int(this.block_size * this.block_height)
        
        this.initPygame()
        this.board = Board(p)
        this.loadStats()
        this.printStats()        
        
        this.running = true
        while this.running:
            while this.board.running:
                this.clock.tick(this.frames)
                this.updatePygame()
                this.board.update(this.clock.get_time(), this.mouse)
                this.paint(this.board.blocks)
            
            d = this.board.getData()
            this.stats.append(d)
            this.saveStats()
            this.printStats()
            this.board.initialize(p)
        
if __name__ == "__main__":
    blocks = Blocks()