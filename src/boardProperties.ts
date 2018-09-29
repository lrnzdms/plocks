export class BoardProperties {

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