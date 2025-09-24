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
const TILE_HEIGHT = 15.5    ;
const MAP_SCALE = 2.5;

let collisionObjects = [];

const playerImage = new Image();
playerImage.src = "mario_sprites(1).png";
const mario_width = 75;
const mario_height = 69;
let mario_state = 'WalkRight'
const player = {
    x: 120, 
    y: 500, 
    width: mario_width * 1.5,
    height: mario_height * 1.5,
    state: 'WalkRight',
    gameFrame: 0,
    staggerFrames: 10,
    velocityY: 0
};

let gameframe = 4;
const staggerFrames = 23;
const Mario_animations = [];
const Mario_animation_states=[
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

class InputHandler {
    constructor() {
        this.lastkey = '';
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                    this.lastkey = "Press Left";
                    mario_state = 'WalkLeft';
                    break;
                case 'ArrowUp':
                    this.lastkey = "Press Up";
                    mario_state = 'Climb';
                    break;
                case 'ArrowRight':
                    this.lastkey = "Press Right";
                    mario_state = 'WalkRight';
                    break;
            }
        });
    }
}
const input = new InputHandler();
console.log(input.lastkey);

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

Promise.all([
  new Promise(res => tilesetImage.onload = res),
  new Promise(res => playerImage.onload = res),
  fetch("level1.json").then(r => r.json())
]).then(([_, __, data]) => {
  mapData = data;
  parseMap(data);

  const tileset = mapData.tilesets[0];
  console.log("Tileset width:", tilesetImage.width, "columns:", tileset.columns);

  animate();
});

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
    let position = Math.floor(gameframe/staggerFrames)% (Mario_animations[mario_state].loc.length);
    position=position + 0;
    let Mario_FrameX=Mario_animations[mario_state].loc[position].x;
    let Mario_FrameY=Mario_animations[mario_state].loc[position].y;
    ctx.drawImage(playerImage,Mario_FrameX,Mario_FrameY,mario_width,mario_height,
        200, 739, mario_width*2,mario_height*2); 


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
                    x: obj.x * MAP_SCALE,
                    y: (obj.y * MAP_SCALE) + UI_HEIGHT, 
                    width: obj.width * MAP_SCALE,
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

main();