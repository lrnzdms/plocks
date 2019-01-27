import { Scene, Color, Intersection, Object3D, Mesh, SphereBufferGeometry } from "three";
import { Engine, DefaultAssetProvider } from "threngine";
import axios from "axios";
import { IBoardProperties, IBoard, IBoardInput, IBlock } from "./core/interfaces";
import { Services } from "threngine/dist/types/src/engine";
import { Board } from "./core/board";

const CANVAS = document.getElementById("x") as HTMLDivElement;
const UI = document.getElementById("debug-ui");
const BUTTONS = document.createElement("div");
const ASSETS = new DefaultAssetProvider();
const ENGINE = new Engine(ASSETS);
let TOGGLEPOST = false;
export const SERVICES = ENGINE.services;

const addButton = (label:string, click:()=>void) => {
    const b = document.createElement("button");
    b.innerHTML = label;
    b.onclick = click;
    BUTTONS.appendChild( b )
}

const login = (tags = []) => {
    return axios({
        method: 'post',
        url: '/login',
        headers: {
            'Content-Type': 'application/json'
        },
        data: JSON.stringify({"user":"TestUser","password":"12345678"})
    });
}

login()
.then(() => ENGINE.initialize(CANVAS))
.then(() => {
    
    addButton( "debug menu", () => {
        TOGGLEPOST = !TOGGLEPOST;
        SERVICES.render.showPostDebug(TOGGLEPOST)
    } )

    UI && UI.appendChild(BUTTONS);
    const plocks = new BoardWrapper(SERVICES);
    const scene = SERVICES.scene.createScene("Assets/fabric.gltf")    
    scene.lights = [];
    SERVICES.scene.loadScene(scene)
    .then(ASSETS.getMaterials)
    .then(materials => {

        const count = 5;
        const indices = [];
        const d = count - materials.length;
        if (d > 0) {
            console.warn("NOT ENOUGH MATERIALS FOUND. "+d+" Materials are missing and are being supstituted.");
            for (let i=0; i<d;++i) {
                indices.push(0);
            }
        }

        while (indices.length < count) {
            const randI = Math.floor(Math.random()*materials.length)
            if (indices.indexOf(randI)===-1) {
                indices.push(randI);
            }
        }
        console.log(indices)
        MATERIALS = indices.map(i => materials[i].id)

        return Promise.resolve();
    })    
    .then(plocks.initialize)    
})

let MATERIALS:string[];


let LAST_UPDATE = 0;
const SCALE = .2;

class BoardWrapper {
    private _board:IBoard;
    private _scene:Scene;
    private _input:IBoardInput = {click: false, x: 0, y: 0};
    constructor (
        private _threngine:Services
    ) {}

    initialize = ():Promise<void> => {
        
        const boardProps:IBoardProperties = {
            block_width: 20,
            block_height: 20,
            block_width_min: 7,
            row_time: 3000,
            mark_threshold: 3,
            speed_per_sec: 20.0,
            gravity: 20.0 / 100,
            colors: [
                {id: MATERIALS[0], prob: 0.40},
                {id: MATERIALS[1], prob: 0.40},        
                {id: MATERIALS[2], prob: 0.16},
                {id: MATERIALS[3], prob: 0.03},
                {id: MATERIALS[4], prob: 0.01}
            ]
        }

        this._scene = new Scene();        
        this._threngine.render.scene.add(this._scene);
        this._threngine.render.scene.background = new Color(0,0,0);

        this._board = new Board();
        this._board.initialize(boardProps);
    
        this._threngine.render.onBeforeRender.subscribe(this._onBeforeRender);
        this._threngine.render.onObjectClicked.subscribe(this._onObjClicked);

        return Promise.resolve();
    }

    private _onBeforeRender = (time:number):Promise<void> => {
        const delta = time - LAST_UPDATE;
        LAST_UPDATE = time;
        this._board.update(delta, this._input)
        this._paint();
        this._input.click = false;

        return Promise.resolve();
    }

    private _onObjClicked = (i:Intersection[]):Promise<void> => {
        
        // find obj by id
        const mesh = i[0].object;
        const block = this._getBoardBlock(mesh);
        if (block) {
            this._input.x = block.x;
            this._input.y = block.y;
            this._input.click = true;
        }
console.log(this._board.killed_blocks);
        return Promise.resolve();
    }    
    private _paint = () => {
        // if in scene but not in blocks -> remove from scene
        const invalids:Object3D[] = [];
        this._scene.traverse(obj => {
            if (!this._getBoardBlock(obj)) {
                invalids.push(obj);
            }
        });        
        invalids.forEach(o => this._scene.remove(o));

        // Update position or create new
        this._board.blocks.forEach(b => {
            if (b) this._paintBlock(b);
        })
    }

    private _getMeshBlock = (b:IBlock):Mesh|undefined => {
        let foundMesh = undefined;
        this._scene.traverse(obj => {
            const mesh = obj as Mesh;
            if (mesh && mesh.userData["block_id"]===b.id) {
                foundMesh = mesh;
            }
        })

        return foundMesh;
    }

    private _getBoardBlock = (obj:Object3D|undefined) => {
        const mesh = obj as Mesh;
        if (!mesh) return;
        return this._board.blocks.find(b => b ? b.id===mesh.userData["block_id"] : false);
    }

    private _paintBlock = (b:IBlock) => {
        const mesh = this._getMeshBlock(b) || this._createBlock(b);
        let x = b.x_act * SCALE;
        let y = b.y_act * SCALE;
        mesh.position.set(x, y, 0.0);
    }
    
    private _createBlock = (b:IBlock):Mesh => {
        const sphere = new SphereBufferGeometry(.5*SCALE, 100, 100)
        const mesh = new Mesh(sphere)
        mesh.userData["block_id"] = b.id;
        this._threngine.material.setMaterial(mesh, b.color);
        this._scene.add(mesh);
        return mesh;
    }
}


// const createRandomMaterial = (id:string) => {

//     const material = new MeshStandardMaterial;
//     material.name = id;
//     material.color.setRGB(Math.random(), Math.random(), Math.random());
//     material.metalness = Math.random();
//     material.roughness = Math.random();
//     material.needsUpdate = true;
//     return material;
// }

// const MATERIALS:MeshStandardMaterial[] = [
//     createRandomMaterial("red"),
//     createRandomMaterial("blue"),
//     createRandomMaterial("green"),
//     createRandomMaterial("yellow"),
//     createRandomMaterial("orange"),
//     createRandomMaterial("aqua"),
//     createRandomMaterial("purple"),
//     createRandomMaterial("pink")
// ]