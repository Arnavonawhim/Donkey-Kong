const canvas = document.getElementById("Canvas")
const ctx = canvas.getContext('2d')

const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;

const playerImage = new Image();
playerImage.src = "mario_sprites(1).png";
const mario_width = 75;
const mario_height = 69;
let mario_state = 'WalkRight'

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


function animate(){
    ctx.clearRect(0,0,CANVAS_WIDTH, CANVAS_HEIGHT);
    let position = Math.floor(gameframe/staggerFrames)% (Mario_animations[mario_state].loc.length);
    position=position + 0;
    let Mario_FrameX=Mario_animations[mario_state].loc[position].x;
    let Mario_FrameY=Mario_animations[mario_state].loc[position].y;
    ctx.drawImage(playerImage,Mario_FrameX,Mario_FrameY,mario_width,mario_height,
        0, 0, CANVAS_WIDTH,CANVAS_HEIGHT); 


    gameframe++;
    requestAnimationFrame(animate);
}
animate();

