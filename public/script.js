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
}); 

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

const barrelImage = new Image();
barrelImage.src = "barrel_spritesheet.png";
barrelImage.onerror = function() {
    console.error("Failed to load barrel_spritesheet.png");
};
barrelImage.onload = function() {
    console.log(`Barrel sprite loaded: ${barrelImage.width}x${barrelImage.height}`);
};

const barrel_width = 50;
const barrel_height = 43;

let barrels = [];
let barrelSpawnTimer = 0;
const BARREL_SPAWN_INTERVAL = 120;

const Barrel_animation_states = [
    {
        name: 'Rolling',
        frames: 2,
        start: 0,
        end: 1,
        row: 0
    },
    {
        name: 'Falling',
        frames: 2,
        start: 4,
        end: 5,
        row: 0
    }
];

const Barrel_animations = [];
Barrel_animation_states.forEach((state) => {
    let frames = {
        loc: [],
    }
    for (let j = state.start; j <= state.end; j++) {
        let positionX = j * barrel_width;
        let positionY = state.row * barrel_height;
        frames.loc.push({ x: positionX, y: positionY });
    }
    Barrel_animations[state.name] = frames;
});


const BARREL_PATH = [
    // Level 0 
    {
        y: 200,
        startX: 350,
        endX: 860,
        direction: 1,
        fallToNextX: 540
    },
    // Level 1
    {
        y: 320,
        startX: 860,
        endX: 250,
        direction: -1,
        fallToNextX: 110
    },
    // Level 2
    {
        y: 440,
        startX: 250,
        endX: 880,
        direction: 1,
        fallToNextX: 510
    },
    // Level 2.5
    {
        y: 570,
        startX: 150,
        endX: 480,
        direction: -1,
        fallToNextX: -1
    },
    // Level 3
    {
        y: 580,
        startX: 880,
        endX: 170,
        direction: -1,
        fallToNextX: 170
    },
    // Level 4
    {
        y: 650,
        startX: 170,
        endX: 860,
        direction: 1,
        fallToNextX: 490
    },
    // Level 5
    {
        y: 812,
        startX: 860,
        endX: 140,
        direction: -1,
        fallToNextX: 150
    }
    
];

class Barrel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 2.5;
        this.velocityY = 0;
        this.state = 'Falling';
        this.currentLevel = -1;
        this.active = true;
        this.gravity = 0.6;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.rollFrameRate = 8;
        this.fallFrameRate = 6;
    }
    
    update() {
        if (!this.active) return;
        
        if (this.state === 'Rolling') {
            this.rollOnCurrentPlatform();
        } else if (this.state === 'Falling') {
            this.fallToNextPlatform();
        }
        
        if (this.y > CANVAS_HEIGHT + 50 || this.x < -50 || this.x > CANVAS_WIDTH + 50) {
            this.active = false;
        }
    }
    
    rollOnCurrentPlatform() {
        if (this.currentLevel < 0 || this.currentLevel >= BARREL_PATH.length) return;
        
        const currentPath = BARREL_PATH[this.currentLevel];
        
        this.x += this.velocityX * currentPath.direction;
        
        this.frameTimer++;
        if (this.frameTimer >= this.rollFrameRate) {
            this.currentFrame = (this.currentFrame + 1) % Barrel_animations['Rolling'].loc.length;
            this.frameTimer = 0;
        }
        
        const reachedEnd = (currentPath.direction > 0) ? 
            (this.x >= currentPath.endX) : 
            (this.x <= currentPath.endX);
            
        if (reachedEnd) {
            this.state = 'Falling';
            this.velocityY = 0;
            this.frameTimer = 0;
            this.currentFrame = 0;
            
            if (currentPath.fallToNextX !== -1) {
                this.x = currentPath.fallToNextX;
            }
        }
    }
    
    fallToNextPlatform() {
        this.velocityY += this.gravity;
        this.y += this.velocityY;
        
        this.frameTimer++;
        if (this.frameTimer >= this.fallFrameRate) {
            this.currentFrame = (this.currentFrame + 1) % Barrel_animations['Falling'].loc.length;
            this.frameTimer = 0;
        }
        
        let targetLevel = this.currentLevel + 1;
        
        if (targetLevel >= BARREL_PATH.length) {
            return;
        }
        
        const targetPath = BARREL_PATH[targetLevel];
        
        if (this.y + barrel_height >= targetPath.y) {
            this.y = targetPath.y - barrel_height;
            this.x = targetPath.startX;
            this.velocityY = 0;
            this.state = 'Rolling';
            this.currentLevel = targetLevel;
            this.frameTimer = 0;
            this.currentFrame = 0;
            
            console.log(`Barrel landed on level ${targetLevel} at x:${targetPath.startX}, y:${targetPath.y}`);
        }
    }
    
    draw() {
        if (!this.active) return;
        
        if (barrelImage.complete && barrelImage.naturalWidth > 0) {
            const animationState = this.state;
            if (Barrel_animations[animationState] && Barrel_animations[animationState].loc.length > 0) {
                const position = this.currentFrame % Barrel_animations[animationState].loc.length;
                const BarrelX = Barrel_animations[animationState].loc[position].x;
                const BarrelY = Barrel_animations[animationState].loc[position].y;
                
                ctx.drawImage(barrelImage, BarrelX, BarrelY, barrel_width, barrel_height,
                    this.x, this.y, barrel_width, barrel_height);
            }
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(this.x + barrel_width/2, this.y + barrel_height/2, barrel_width/2, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = '#654321';
            ctx.fillRect(this.x + 5, this.y + 10, barrel_width - 10, 3);
            ctx.fillRect(this.x + 5, this.y + barrel_height - 13, barrel_width - 10, 3);
        }
        
        ctx.fillStyle = 'white';
        ctx.font = '8px Arial';
        ctx.fillText(`L${this.currentLevel}`, this.x, this.y - 5);
    }
}

function spawnBarrel() {
    const barrel = new Barrel(KongX + kong_width + 10, KongY + kong_height - 20);
    barrels.push(barrel);
    console.log(`Spawned barrel at x:${barrel.x}, y:${barrel.y}`);
}

function updateBarrels() {
    barrelSpawnTimer++;
    
    if (barrelSpawnTimer >= BARREL_SPAWN_INTERVAL) {
        spawnBarrel();
        barrelSpawnTimer = 0;
        
        kong_state = 'Barrel';
        setTimeout(() => {
            kong_state = 'Chest';
        }, 1000);
    }
    
    barrels.forEach(barrel => {
        barrel.update();
    });
    
    barrels = barrels.filter(barrel => barrel.active);
}

function drawBarrels() {
    barrels.forEach(barrel => {
        barrel.draw();
    });
    
    ctx.fillStyle = 'yellow';
    ctx.font = '14px Arial';
    ctx.fillText(`Barrels: ${barrels.length}`, 10, 30);
}


function drawBarrelPaths() {
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.lineWidth = 2;
    
    BARREL_PATH.forEach((path, index) => {
        ctx.beginPath();
        ctx.moveTo(path.startX, path.y);
        ctx.lineTo(path.endX, path.y);
        ctx.stroke();
        
        if (path.fallToNextX !== -1) {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(path.fallToNextX, path.y, 3, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.fillText(`${index}`, path.startX - 15, path.y - 5);
    });
}

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

    if (mario_state === 'WalkRight') {
        MarioX += Mario_Speed;
    } else if (mario_state === 'WalkLeft') {
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
    updateBarrels();
    
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
    
    drawBarrels();
    
     drawBarrelPaths();
    debugCollisions();
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
                    x: obj.x * MAP_SCALE +80,
                    y: (obj.y * MAP_SCALE)-44,
                    width: obj.width * MAP_SCALE ,
                    height: obj.height * MAP_SCALE,
                    type: typeProp ? typeProp.value : 'platform'
                };
            });
        }
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