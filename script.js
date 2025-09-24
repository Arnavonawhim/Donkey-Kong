const canvas = document.getElementById("Canvas")
const ctx = canvas.getContext('2d')

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

const UI_HEIGHT = 80; 
let mapData;
let platforms = [];
let ladders = [];
const tilesetImage = new Image();
tilesetImage.src = "level1.png";
const TILE_WIDTH = 16;
const TILE_HEIGHT = 16;
const MAP_SCALE = 2.5;

let collisionObjects = [];
//MARIO
const playerImage = new Image();
playerImage.src = "mario_sprites(1).png";
const mario_width = 75;
const mario_height = 69;
let mario_state = 'IdleLeft'
let MarioX = 225;
let MarioY = 700;
let Mario_Velocity=0;
let Mario_Speed=2;
let Mario_Direction='right';


let gameframe = 4;
const staggerFrames = 23;
const Mario_animations = [];
const Mario_animation_states=[
    {
        name:'IdleLeft',
        frames:1,
        start:3,
        end:3,
        row:0
    },
    {
        name:'IdleRight',
        frames:1,
        start:4,
        end:4,
        row:0
    },
    {
        name:'WalkLeft',
        frames:3,
        start:3,
        end:1,
        row:0
    },
    {
        name:'WalkRight',
        frames:3,
        start:4,
        end:6,
        row:0
    },
    {
        name:'Climb',
        frames:2,
        start: 3,
        end:4,
        row:1
    },
    {
        name:'BonkLeft',
        frames:4,
        start:3,
        end:0,
        row:2
    },
    {
        name:'BonkRight',
        frames:4,
        start:4,
        end:7,
        row:2
    },
    {
        name:'Death',
        frames:8,
        start:0,
        end:7,
        row:3
    },
];


tilesetImage.onload = () => {
  playerImage.onload = () => {
    animate();
  };
};

Mario_animation_states.forEach((state)=>{
    let frames = {
        loc: [],
    }
    if (state.start <= state.end) {
        for (let j = state.start; j <= state.end; j++) {
            let positionX = j * mario_width;
            let positionY = state.row * mario_height;
            frames.loc.push({ x: positionX, y: positionY });
        }
    } else {
        for (let j = state.start; j >= state.end; j--) {
            let positionX = j * mario_width;
            let positionY = state.row * mario_height;
            frames.loc.push({ x: positionX, y: positionY });
        }
    }

    
    Mario_animations[state.name] = frames;
}
); 
console.log(Mario_animations);

//DONKEY KONG
const kongImage = new Image();
kongImage.src = "Kong_spritesheet.png";
const kong_width = 155;
const kong_height = 135.66;
let KongX = 250;
let KongY = 50;
let kong_state = 'Chest';
const Kong_animations = [];
const Kong_animation_states=[
    {
        name:'Idle',
        frames:1,
        start:0,
        end:0,
        row:0
    },
    {
        name:'Chest',
        frames:2,
        start:2,
        end:3,
        row:0
    },
    {
        name:'Barrel',
        frames:2,
        start:0,
        end:1,
        row:2
    },
];
Kong_animation_states.forEach((state)=>{
    let frames = {
        loc: [],
    }
    for (let j = state.start; j <= state.end; j++) {
        let positionX = j * kong_width;
        let positionY = state.row * kong_height;
        frames.loc.push({ x: positionX, y: positionY });
    }
    Kong_animations[state.name] = frames;
});

class InputHandler {
    constructor() {
        this.keys = [];
        window.addEventListener('keydown', (e) => {
            const allowedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ']; 
            if (allowedKeys.includes(e.key) && !this.keys.includes(e.key)) {
                this.keys.push(e.key);
            }
        });
        window.addEventListener('keyup', (e) => {
            this.keys = this.keys.filter(key => key !== e.key);
        });
    }
}
const input = new InputHandler();

function updatePlayer() {
    let onLadder = false;
    let onPlatform = false;
    for (const object of collisionObjects) {
        if (MarioX < object.x + object.width &&
            MarioX + mario_width > object.x &&
            MarioY < object.y + object.height &&
            MarioY + mario_height > object.y) {
            
            if (object.type === 'ladder') {
                onLadder = true;
            }
            if (object.type === 'platform' && Mario_Velocity >= 0) {
                if((MarioY + mario_height) > object.y && (MarioY + mario_height) < object.y + 30){
                    onPlatform = true;
                }
            }
        }
    }

    if (input.keys.includes(' ') && onPlatform) {
        Mario_Velocity = -7; 
        onPlatform = false; 
    }
    
    if(onPlatform){
        Mario_Velocity = 0;
    } else {
        MarioY += Mario_Velocity;
        Mario_Velocity += 0.5;
    }

    if (onLadder && (input.keys.includes('ArrowUp') || input.keys.includes('ArrowDown'))) {
        mario_state = 'Climb';
        Mario_Velocity = 0; 
    } 
    else if (!onPlatform) { 
        mario_state = (Mario_Direction === 'right') ? 'WalkRight' : 'WalkLeft';
    }
    else if (input.keys.includes('ArrowRight')) {
        mario_state = 'WalkRight';
        Mario_Direction = 'right';
    } else if (input.keys.includes('ArrowLeft')) {
        mario_state = 'WalkLeft';
        Mario_Direction = 'left';
    } 
    else {
        mario_state = (Mario_Direction === 'right') ? 'IdleRight' : 'IdleLeft';
    }

    if (mario_state === 'WalkRight' || mario_state === 'WalkRight') {
        MarioX += Mario_Speed;
    } else if (mario_state === 'WalkLeft' || mario_state === 'WalkLeft') {
        MarioX -= Mario_Speed;
    } else if (mario_state === 'Climb') {
        if (input.keys.includes('ArrowUp')) {
            MarioY -= Mario_Speed / 2;
        } else if (input.keys.includes('ArrowDown')) {
            MarioY += Mario_Speed / 2;
        }
    }
}


function parseMap(data) {
  const objectLayer = data.layers.find(layer => layer.type === "objectgroup");

  objectLayer.objects.forEach(obj => {
    const typeProp = obj.properties?.find(p => p.name === "type");
    if (!typeProp) return;

    if (typeProp.value === "platform") {
      platforms.push({
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height
      });
    } else if (typeProp.value === "ladder") {
      ladders.push({
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height
      });
    }
  });
}



function drawMap() {
    if (!mapData) return;
    const tileLayer = mapData.layers.find(l => l.type === "tilelayer");
    const tileset = mapData.tilesets.find(ts => ts.columns > 0);
    const tilesetCols = tileset.columns;
    for (let row = 0; row < tileLayer.height; row++) {
        for (let col = 0; col < tileLayer.width; col++) {
            const tileIndex = tileLayer.data[row * tileLayer.width + col];
            if (tileIndex <= 0) continue;
            const id = tileIndex - tileset.firstgid;
            const sx = (id % tilesetCols) * TILE_WIDTH;
            const sy = Math.floor(id / tilesetCols) * TILE_HEIGHT;
            const destY = (row * TILE_HEIGHT * MAP_SCALE) + UI_HEIGHT;
            ctx.drawImage(
                tilesetImage, sx, sy, TILE_WIDTH, TILE_HEIGHT,
                col * TILE_WIDTH * MAP_SCALE, destY,
                TILE_WIDTH * MAP_SCALE, TILE_HEIGHT * MAP_SCALE
            );
        }
    }
}




function animate(){
    ctx.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
    drawMap();
    updatePlayer();
    debugCollisions();
    let position = Math.floor(gameframe/staggerFrames)% (Mario_animations[mario_state].loc.length);
    position=position + 0;
    let Mario_FrameX=Mario_animations[mario_state].loc[position].x;
    let Mario_FrameY=Mario_animations[mario_state].loc[position].y;
    ctx.drawImage(playerImage,Mario_FrameX,Mario_FrameY,mario_width,mario_height,
        MarioX, MarioY, mario_width*2,mario_height*2); 
    let kong_pos = Math.floor(gameframe/staggerFrames) % (Kong_animations[kong_state].loc.length);
    let Kong_FrameX = Kong_animations[kong_state].loc[kong_pos].x;
    let Kong_FrameY = Kong_animations[kong_state].loc[kong_pos].y;
    ctx.drawImage(kongImage, Kong_FrameX, Kong_FrameY, kong_width, kong_height,
        KongX, KongY, kong_width , kong_height ); 
    
    gameframe++;
    requestAnimationFrame(animate);
}


async function main() {
    try {
        const response = await fetch('level1.json');
        mapData = await response.json();
        const objectLayer = mapData.layers.find(layer => layer.type === 'objectgroup');
        if (objectLayer) {
            collisionObjects = objectLayer.objects.map(obj => {
                const typeProp = obj.properties ? obj.properties.find(prop => prop.name === 'type') : null;
                return {
                    x: obj.x * MAP_SCALE +74,
                    y: (obj.y * MAP_SCALE)-44,
                    width: obj.width * MAP_SCALE ,
                    height: obj.height * MAP_SCALE,
                    type: typeProp ? typeProp.value : 'platform'
                };
            });
        }
        await Promise.all([
            new Promise(resolve => { tilesetImage.onload = resolve; }),
            new Promise(resolve => { playerImage.onload = resolve; })
        ]);
        animate();
    } catch (error) {
        console.error("Error loading game assets:", error);
    }
}
function debugCollisions() {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    collisionObjects.forEach(obj => {
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
    });
}

main();