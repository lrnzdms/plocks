import sys
import pygame
import pygame.font
import random
from math import ceil
import json
import datetime

class Block():
    x = 0,
    y = 0,
    x_act = 0.0
    y_act = 0.0
    color = "black"
    marked = False
    
    def __init__(self, y, x, color):
        self.y = y
        self.x = x
        self.y_act = y
        self.x_act = x
        self.color = color

class BoardProperties():
    block_width = 20
    block_height = 20
    block_width_min = 7
    row_time = 3.0
    mark_threshold = 3
    speed_per_sec = 20.0
    gravity = None
    colors = []
    def __init__(self, frames):
        self.gravity = self.speed_per_sec / frames
        self.row_time *= 1000
        self.colors.append( {'id': 0, 'prob': 0.40} )
        self.colors.append( {'id': 1, 'prob': 0.40} )        
        self.colors.append( {'id': 2, 'prob': 0.16} )
        self.colors.append( {'id': 3, 'prob': 0.03} )
        self.colors.append( {'id': 4, 'prob': 0.01} )
        
class Board():
    
    block_width = None
    block_height = None
    block_count = None
    block_width_min = None    
    block_width_min_start = None
    block_width_min_end = None
    gravity = None
    center_x = None
    row_time = None
    row_timer = None
    mark_threshold = None
    blocks = []
    colors = []
    colors_prob = {}
    running = False
    
    killed_blocks = 0
    won = False
    
    def __init__(self, p):
        self.initialize(p)
        
    def initialize(self, p):
        self.running = False
        random.seed()        
        self.blocks = []
        self.colors = []
        self.colors_prob = {}
        self.block_width = p.block_width
        self.block_height = p.block_height
        self.block_count = self.block_height * self.block_width
        self.block_width_min = p.block_width_min
        self.center_x = self.block_width / 2
        self.block_width_min_start = self.center_x - self.block_width_min/2
        self.block_width_min_end = self.center_x + self.block_width_min/2        
        self.gravity = p.gravity
        self.row_time = p.row_time
        self.row_timer = self.row_time        
        self.mark_threshold = p.mark_threshold
        self.colors = p.colors
                
        prob = 0.0
        for c in self.colors:
            prob += c["prob"]
            self.colors_prob[ c["id"] ] = prob
            
        for x in range(self.block_width):
            for y in range(self.block_height):
                if y < 10: # todo no magic number
                    self.blocks.append(0)
                else:
                    self.blocks.append(Block(y, x, self.getRandomColorId()))
                    
        self.running = True
        self.started = False
        
    def getColorProbById(self, id):
        for c in self.colors:
            if c["id"] is id:
                return c["prob"]
        print "Could not find prob for given id!"
        
    def getRandomColorId(self):
        rand = random.random()
        for id in self.colors_prob:
            if rand < self.colors_prob[id]:
                return id
                
    def getBlockId(self, y, x):
        return x * self.block_height + y
        
    def getBlock(self, y, x):
        return self.blocks[self.getBlockId(y, x)]
        
    def setBlock(self, y, x, b):
        self.blocks[self.getBlockId(y, x)] = b
        
    def markBlocks(self, b):        
        b.marked = True
        count = 1
        neighbours = []
        if b.y - 1 >= 0:
            neighbours.append( self.getBlock(b.y - 1, b.x) )
        if b.y + 1 < self.block_height:
            neighbours.append( self.getBlock(b.y + 1, b.x) )
        if b.x - 1 >= 0:
            neighbours.append( self.getBlock(b.y, b.x - 1) )
        if b.x + 1 < self.block_width:
            neighbours.append( self.getBlock(b.y, b.x + 1) )
        for n in neighbours:
            if n is not 0 and n.color is b.color and not n.marked:            
                count += self.markBlocks(n)
        return count
        
    def isFreeCol(self, x):
        for y in range(self.block_height):
            f = self.getBlock(y, x)
            if f is not 0:
                return False
        return True   
        
    def end(self, won):
        #if won:
        #    print "WON"
        #else:
        #    print "FAIL"
        self.running = False
        self.won = won
        
    def getData(self):
        return [str(datetime.datetime.now()), self.killed_blocks, self.won]
        
    def update(self, delta, mouse):
        # reset
        existing_colors = {}
        for b in self.blocks:
            if b is not 0:
                b.marked = False
                
        click = mouse[0]
        target = self.getBlock(mouse[1], mouse[2])
        count = 0
        if target is not 0:
            count = self.markBlocks(target)
        mark = count >= self.mark_threshold        
        kill = click and mark        
        
        if click and not self.started:
            self.started = True
            self.killed_blocks = 0
                
        for i in range(self.block_count):
            b = self.blocks[i]
            if b is 0:
                continue
            # delete
            if b.marked and kill:
                self.killed_blocks += 1
                self.blocks[i] = 0
                continue
            # update marked
            b.marked = b.marked and mark
            # collect existing colors
            if b.color in existing_colors.keys():
                existing_colors[b.color] += 1
            else:
                existing_colors[b.color] = 1
            # move down
            if b.y > 0 and self.getBlock(b.y-1, b.x) is 0:
                b.y -= 1
                self.setBlock(b.y, b.x, b)
                self.blocks[i] = 0
                
        # move to center from right
        for x in range(self.center_x, self.block_width):
            if self.isFreeCol(x):
                for xx in range(x+1, self.block_width):
                    for yy in range(self.block_height):
                        b = self.getBlock(yy, xx)
                        if b is not 0:
                            b.x -= 1
                        self.setBlock(yy, xx-1, b)
                        self.setBlock(yy, xx, 0)
                        
        # move to center from left
        for x in reversed(range(self.center_x)):
            if self.isFreeCol(x):
                for xx in reversed(range(0, x)):
                    for yy in range(self.block_height):
                        b = self.getBlock(yy, xx)
                        if b is not 0:
                            b.x += 1
                        self.setBlock(yy, xx+1, b)
                        self.setBlock(yy, xx, 0)
                        
        # check win state
        if not existing_colors:
            self.end(True)
            return
        
        # new row
        if self.started:
            self.row_timer -= delta
            if self.row_timer <= 0:           
                # update color tables
                if len(existing_colors) is not len(self.colors):
                    self.colors_prob.clear()
                    new_total = 0.0
                    for id in existing_colors:
                        new_total += self.getColorProbById(id)
                    prob = 0.0
                    for id in existing_colors:
                        prob += self.getColorProbById(id) / new_total
                        self.colors_prob[id] = prob
                # move all blocks up by one
                for y in reversed(range(self.block_height)):
                    for x in range(self.block_width):
                        b = self.getBlock(y, x)
                        if b is not 0:
                            b.y += 1
                            # check fail state
                            if y+1 >= self.block_height:
                                self.end(False)
                                return
                            self.setBlock(y+1, x, b)
                            self.setBlock(y, x, 0)
                # create new block row
                filled_cols = 0
                for x in range(self.block_width):
                    if not self.isFreeCol(x) or x in range(self.block_width_min_start, self.block_width_min_end):
                        n = Block(0, x, self.getRandomColorId())
                        n.y_act = -0.9
                        self.setBlock(0, x, n)
                        filled_cols += 1
                self.row_timer = self.row_time
                if filled_cols <= self.block_width_min:
                    self.row_timer *= 0.5
                    #print "SPEED"
        
        # apply gravity
        for b in self.blocks:
            if b is not 0:
                if b.y_act < b.y:
                    b.y_act += self.gravity / 5.0
                    b.y_act = min(b.y, b.y_act)
                elif b.y_act > b.y:
                    mod = ceil(b.y_act - b.y)
                    b.y_act -= self.gravity * mod
                    b.y_act = max(b.y, b.y_act)
                if b.x < self.center_x:
                    mod = ceil(b.x - b.x_act)
                    b.x_act += self.gravity * mod
                    b.x_act = min(b.x, b.x_act)
                elif b.x >= self.center_x:
                    mod = ceil(b.x_act - b.x)
                    b.x_act -= self.gravity * mod
                    b.x_act = max(b.x, b.x_act)

class Blocks():

    frames = 100
    screen_width = 500
    screen_height = None
    block_width = None
    block_height = None
    clock = None
    screen = None
    mouse = [False, -1, -1] # click, y, x
    stats = None
    
    def initPygame(self):
        pygame.init()
        self.font = pygame.font.SysFont(None, 24)
        pygame.mouse.set_visible(True)
        self.screen = pygame.display.set_mode((self.screen_width, self.screen_height))
        self.screen.fill(pygame.Color("black"))
        pygame.display.flip()
        self.clock = pygame.time.Clock()
    
    def updatePygame(self):
        self.mouse[0] = False
        for event in pygame.event.get():
            if event.type is pygame.MOUSEBUTTONDOWN:
                if event.button is 1:
                    self.mouse[0] = True
            if event.type is pygame.MOUSEMOTION:
                self.mouse[1] = self.screen_height - event.pos[1]
                self.mouse[1] /= self.block_size
                self.mouse[1] = max( 0, min(self.block_height - 1, self.mouse[1]) )
                self.mouse[2] = event.pos[0]
                self.mouse[2] /= self.block_size
                self.mouse[2] = max( 0, min(self.block_width - 1, self.mouse[2]) )            
            if event.type == pygame.QUIT:
                self.exit()
    
    def getColorById(self, id, marked):
        if marked:
            return self.colors_pygame[id][0]
        else:
            return self.colors_pygame[id][1]
  #Iwmfb      
    def paint(self, blocks):
        self.screen.fill(pygame.Color("black"))
        for b in blocks:
            if b is not 0:
                unmarked = self.getColorById(b.color, False)
                marked = self.getColorById(b.color, True)
                x = b.x_act*self.block_size
                y = self.screen_height - (b.y_act + 1)*self.block_size
                if b.marked:
                    unmarked, marked = marked, unmarked
                self.screen.fill(unmarked, (x, y, self.block_size, self.block_size))                
                self.screen.fill(marked, (x+2, y+2, self.block_size-4, self.block_size-4))
        
        # render text
        label = self.font.render(str(self.board.killed_blocks), 1, (255,255,0))
        self.screen.blit(label, (100, 100))
        pygame.display.flip()
        
    def loadStats(self):
        f = open('blocks.sav', 'r')
        self.stats = json.loads(f.read())        
        f.close()
        
    def saveStats(self):
        f = open('blocks.sav', 'w')
        d = json.dumps(self.stats)
        f.write(d)
        f.close()
        
    def printStats(self):
        count = len(self.stats)
        w = 0
        l = 0
        min = sys.maxint
        sum = 0
        
        for s in self.stats:
            if s[2]:
                w += 1
            else:
                l += 1
            sum += s[1]
            if (s[1] < min):
                min = s[1]
        print "Total: " + str(count) + " (w: " + str(w) + ", l: " + str(l) + ")"
        print "Win:   " + str(100.0 * w / count) + "%"
        print "Min:   " + str(min)
        print "Mid:   " + str(sum / float(count))
            
    def exit(self):
        self.running = False
        pygame.quit()
        sys.exit(1)
        
    def __init__(self):
        self.colors_pygame = {}
        self.colors_pygame[0] = [pygame.Color("#FF3333"), pygame.Color("#CC0000")] #red
        self.colors_pygame[1] = [pygame.Color("#3B9DFF"), pygame.Color("#0069D1")] #blue 
        self.colors_pygame[2] = [pygame.Color("#82FF21"), pygame.Color("#5DD600")] #green
        self.colors_pygame[3] = [pygame.Color("#FFFF2E"), pygame.Color("#EDED00")] #yellow
        self.colors_pygame[4] = [pygame.Color("#FFB35C"), pygame.Color("#E07800")] #orange
        self.colors_pygame[5] = [pygame.Color("#2BFFCD"), pygame.Color("#00D6A4")] #aqua 
        self.colors_pygame[6] = [pygame.Color("#BD54FF"), pygame.Color("#9D00FF")] #purple
        self.colors_pygame[7] = [pygame.Color("#FF4AEA"), pygame.Color("#E300C8")] #pink 
        
        p = BoardProperties(self.frames)
        self.block_width = p.block_width
        self.block_height = p.block_height
        self.block_size = self.screen_width / self.block_width
        self.screen_height = self.block_size * self.block_height
        
        self.initPygame()
        self.board = Board(p)
        self.loadStats()
        self.printStats()        
        
        self.running = True
        while self.running:
            while self.board.running:
                self.clock.tick(self.frames)
                self.updatePygame()
                self.board.update(self.clock.get_time(), self.mouse)
                self.paint(self.board.blocks)
            
            d = self.board.getData()
            self.stats.append(d)
            self.saveStats()
            self.printStats()
            self.board.initialize(p)
        
if __name__ == "__main__":
    blocks = Blocks()