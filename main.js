/* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/
alert
let gl;
 let programData;
 const programs = [];
 const touch = {x: null, y: null, dir: null};
 
 let run = true
 
 class Tetromino {
 
     constructor() {
         const geometry = Tetromino.getGeometry();
         const geometryIndex = ~~(Math.random() * geometry.length);
         const textureIndex = geometryIndex / 7;
 
         this.geometry = geometry[geometryIndex];
     
         this.indexBuffer = gl.createBuffer();
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, 
             new Uint8Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
 
         this.data = [
             ...Tetromino.getSquareGeometry(game.tileSize * 0.9),
             ...Tetromino.getSquareTexture(textureIndex)
         ];
 
         this.buffer = gl.createBuffer();
         gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(
             [...this.data ]), gl.STATIC_DRAW);
 
         this.translation = {
             x: Math.floor(randRange(this.geometry[0].length, game.column - geometry[0].length)), 
             y: 5
         };
 
         const rotateRandomlyCount = Math.floor(randRange(3, 5));
         for(let i = 0; i < rotateRandomlyCount; i++) 
             this.rotate(true);
         this.translation.y = -this.geometry.length ;
 
         this.lastTime = Date.now();
     }
 
     draw() {
         this.drawAt(this.translation.x, this.translation.y, 
             game.tileSize);
     }
 
     drawAt(tx, ty, scale, useSeperateScale = null) {
 
         gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
         if(useSeperateScale != null) {
             gl.bindBuffer(gl.ARRAY_BUFFER, game.nextTetroMinoBuffer);
             const oldData = [...this.data];
             const data = [
                 ...Tetromino.getSquareGeometry(useSeperateScale),
                 ...oldData.splice(8, 8)
             ];
             gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
         }
 
         for(let i = 0; i < this.geometry.length; i++) {
             for(let j = 0; j < this.geometry[i].length; j++) {
                 const id = this.geometry[i][j];
                 if(id != 0) {
                     const px = j * scale + tx * scale;
                     const py = i * scale + ty * scale;
                     gl.uniform2f(programData.uniforms.translation, px, py);
                     gl.enableVertexAttribArray(programData.attributes.position);
                     gl.vertexAttribPointer(programData.attributes.position, 2, gl.FLOAT, false, 0, 0);
                 
                     gl.enableVertexAttribArray(programData.attributes.texCoord);
                     gl.vertexAttribPointer(programData.attributes.texCoord, 2, gl.FLOAT, false, 
                         0, 4 * 2 * Float32Array.BYTES_PER_ELEMENT);
                     gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
                 }
             } 
         }
 
     }
 
     /**
      * This method handles the rotation of each tetrominos,
      * it works by rotating the geometry in a specified direction,
      * if any of the block is out of game boundary or has been
      * allocated by other tiles, it rejects the rotation
      * 
      * @param {Boolean} clockwise should rotate clockwise?
      */
     rotate(clockwise = true) {
 
         const newGeometry = [];
         let isValid = true;
         const width = this.geometry[0].length;
 
         outer:
         for(let i = 0; i < this.geometry.length; i++) {
             newGeometry.push([]);
             for(let j = 0; j < this.geometry[i].length; j++) {  
                 newGeometry[i][j] = clockwise ? this.geometry[width - j - 1][i] : 
                     this.geometry[j][width - i - 1];
                 const id = newGeometry[i][j];
                 if(id != 0) {
                     let px = j + this.translation.x;
                     let py = i + this.translation.y;
                     if(py >= 0) {
                         if(px < 0 || px > game.column - 1 || py > game.row - 1
                             || game.gridArrayData[py][px] !== 0) {
                             isValid = false;
                             break outer;
                         }
                     }
                 }
             }
         }
         if(isValid) this.geometry = [...newGeometry];
     }
 
     /**
      * This method checks if a tetromino is colliding at a certain direction
      * Velocity are added to the tetromino geometry based on their direction, 
      * and for each block in the geometry, the value of the nearest tile 
      * are retrieved for collision check..... 
      * 
      * if a single block is colliding at a specific direction, then the velocity does not 
      * have effect on the previous position
      * 
      * @param {string} dir Direction to check collision for
      * @returns 
      */
     collisionCheck(dir) {
         let isColliding = false;
         const vel = (dir === "left") ? -1 : 1;
 
         for(let y = 0; y < this.geometry.length; y++) {
             for(let x = 0; x < this.geometry[0].length; x++) {
                 const id = this.geometry[y][x];
                 if(id !== 0) {
 
                     // check for left right collision
                     if(dir === "left" || dir == "right") {
                         const px = x + this.translation.x + vel;
                         const py = this.translation.y + y;
                         if(py >= 0) {
                             if(px < 0 || px > game.column - 1 || 
                                 game.gridArrayData[this.translation.y + y][px] != 0) {
                                 isColliding = true;
                                 break;
                             }
                         }
                     } 
                     // check for down collision and sa
                     else if(dir === "down") {
                         const py = this.translation.y + y + 1;
                         if(py >= 0) {
                             if(py > game.row - 1) {
                                 isColliding = true;
                                 break;
                             }
                             if(game.gridArrayData[py][this.translation.x + x] != 0) {
                                 isColliding = true;
                                 break;
                             }
                         }
                     }
                 }    
             }
         }
 
         if(dir === "left" || dir === "right") {
             if(!isColliding) this.translation.x += vel;
             return null;
         } else if(dir === "down"){
             if(!isColliding) this.translation.y += 1;
             else this.lock();
         }
     }
 
     /**
      * This method lock the current tetrominos to the tile 
      * and try to create a new one
      */
     lock() {
         for(let i = 0; i < this.geometry.length; i++) {
             for(let j = 0; j < this.geometry[i].length; j++) {
                 const id = this.geometry[i][j];
                 if(id != 0) {
                     const px = j + this.translation.x;
                     const py = i + this.translation.y;
                     if(py >= 0) {
                         game.gridArrayData[py][px] = [...this.data];
                     } else {
                        
                           document.getElementById("menu").style.opacity = 1; document.getElementById("menu").style.zIndex = 100;
                         game.state = game.State.GAMEOVER;
                         return;
                     }
                 }
             }
         }
         Tetromino.create(false);
     }
 
     /**
      * Update each piece
      * @param {number} currTime current time from Date.now()
      */
     update(currTime) {
         this.lastTime += 1 * currTime;
         if(this.lastTime >= 0.25) {
             this.lastTime = 0;
             this.collisionCheck("down");
         }
     }
 
     /**
      * Create New Tetromino and make it the current Active Tetrominos
      */
     static create(init = true) {
         game.activeTetromino = null;
         if(init) {
             const tetromino = new Tetromino();
             game.activeTetromino = tetromino;
             tetromino.lastTime = Date.now();
             for(let i = 0; i < 5; i++)
                 game.tetrominos.push(new Tetromino());
         } else {
             game.activeTetromino = game.tetrominos.shift();
             game.activeTetromino.lastTime = Date.now();
             game.tetrominos.push(new Tetromino());
         }
     }
 
     static getSquareGeometry(size) {
         return [
             0 * size, 0 * size,
             1 * size, 0 * size,
             1 * size, 1 * size,
             0 * size, 1 * size
         ];
     }
 
     static getSquareTexture(x) {
         return [
             x, 0, 
             x + 1/7, 0,
             x + 1/7, 1, 
             x, 1
         ];
     }
  
     static getGeometry() {
         return [
             [
                 [1,1,0],
                 [0,1,1],
                 [0,0,0]
             ],
             [
                 [0,1,0,0],
                 [0,1,0,0],
                 [0,1,0,0],
                 [0,1,0,0]
             ],
             [
                 [0,1,0],
                 [0,1,0],
                 [0,1,1]
             ],
             [
                 [0,1,1],
                 [1,1,0],
                 [0,0,0]
             ],
             [
                 [0,1,0],
                 [0,1,0],
                 [1,1,0]
             ],
             [
                 [0,1,0],
                 [0,1,1],
                 [0,1,0]
             ],
             [
                 [1,1],
                 [1,1]
             ]
         ]
     }
 
 }
 
 const commonVertexShaderSource = texture => `
 attribute vec2 a_position;
 uniform vec2 u_translation;
 uniform vec2 u_resolution;
 void main() {
     vec2 zeroToOne = (u_translation + a_position) / u_resolution;
     vec2 zeroToTwo = zeroToOne * 2.0;
     vec2 clipSpace = zeroToTwo - 1.0;
     gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
     ${texture}
 }`;
 
 const randRange = (min, max) => Math.random() * (max - min) + min;
 /* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/
 const game = {
 
     row: 20,
     column: 10,
     otherColumn: 5,
     activeTetromino: null,
     tetrominos: [],
 
     gridBuffer: null,
     nextTetroMinoBuffer: null,
     gridArrayData: [],
     music: true,
 
     State: {
         GAMEOVER: "gameover",
         PLAYING: "gamePlaying",
         PAUSED: "gamePaused",
     },
 
     get tileSizeSpacing() { return 0.9 },
 
     get tileSize() { return (gl.canvas.height) / this.row },
 
     set score(s) {
         this._score = s;
         this._level = Math.floor(s / 360 + 1);
         this.scoreText.innerHTML = `Score: ${this._score}`;
         this.levelText.innerHTML = `Level: ${this._level}`;
     },
 
     get score() { return this._score; },
 
     drawGrid() {
         
         for(let i = 0; i < this.gridArrayData.length; i++) {
             for(let j = 0; j < this.gridArrayData[i].length; j++) {
                 const obj = this.gridArrayData[i][j];
                 if(typeof obj === "object") {
                     gl.useProgram(programData.program);
                     gl.uniform2f(programData.uniforms.translation, j * this.tileSize, i * this.tileSize);
                     const data = [...obj];;
                     gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
                     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
                     gl.enableVertexAttribArray(programData.attributes.position);
                     gl.vertexAttribPointer(programData.attributes.position, 2, gl.FLOAT, false, 0, 0);
                 
                     gl.enableVertexAttribArray(programData.attributes.texCoord);
                     gl.vertexAttribPointer(programData.attributes.texCoord, 2, gl.FLOAT, false, 
                         0, 4*2*Float32Array.BYTES_PER_ELEMENT);
         
                     gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
                 } else {
                     const program = programs[0];
                     gl.useProgram(program.program);
                     gl.uniform2f(program.uniforms.resolution, gl.canvas.width, gl.canvas.height);
                     gl.uniform2f(program.uniforms.translation, j * this.tileSize, i * this.tileSize);
                     let vert = [
                         0, 0, 
                         this.tileSize * 0.9, 0,
                         this.tileSize * 0.9, this.tileSize * 0.9,
                         0, this.tileSize * 0.9
                     ];
                     gl.bindBuffer(gl.ARRAY_BUFFER, this.gridBuffer);
                     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vert), gl.DYNAMIC_DRAW);
                     gl.enableVertexAttribArray(program.attributes.position);
                     gl.vertexAttribPointer(program.attributes.position, 2, gl.FLOAT, false, 0, 0);
                     gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
                 }
             }
         }
 
         gl.useProgram(programData.program);
     },
 
     initDOM() {
         this.scoreText = document.getElementById("score-text");
         this.levelText = document.getElementById("level-text");
     },
 
     restart() {
        // document.body.style.background = "#003380";
         gl.canvas.style.filter = "blur(0px)";
         document.getElementById("menu").style.zIndex = -100;
         document.getElementById("menu").style.opacity = 0;
         game.tetrominos = [];
         game.activeTetromino = null;
         this.gridArrayData = [];
         for(let i = 0; i < this.row; i++) {
             this.gridArrayData[i] = [];
             for(let j = 0; j < this.column; j++) {
                 this.gridArrayData[i][j] = 0;
             }
         }
         this.maxScore = Math.max(this.score, this.maxScore);
         this.score = 0;
         this.state = this.State.PLAYING;
         let time = setTimeout(() => {
             Tetromino.create();
             this.lastTime = Date.now();
             clearTimeout(time);
         }, 1000);
     },
 
     init() {
         this.initDOM();
         this.nextTetroMinoBuffer = gl.createBuffer();
         this.gridBuffer = gl.createBuffer();
         this.sprite = document.getElementById("textureImg");
         // Create a texture.
         var texture = gl.createTexture();
         gl.bindTexture(gl.TEXTURE_2D, texture);
         
         // Set the parameters so we can render any size image.
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
         gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
         
         // Upload the image into the texture.
         gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.sprite);
         requestAnimationFrame(animate);
     }
 }
 
 const update = dt => {
     // accept input and update current tetrominos
     if(game.activeTetromino != null) {
         events.executeAction();
         game.activeTetromino.update(dt);
     }
 
     // delete all filled rows
     let tobeDeleted = 0;
     game.gridArrayData.forEach((row, i) => {
         if(row.every(i => typeof i === "object")) {
             run = false
             setTimeout(function(){
                 game.gridArrayData.splice(i, 1);
                 game.gridArrayData.unshift(new Array(game.column).fill(0));
                  tobeDeleted++;
                  game.score += 20;
                 run = true
                 requestAnimationFrame(animate);          
             }, 1500)        
         }
    
     });
 
 
     
 }
 
 /**
  * This is the main function for all other drawing functions
  */
 const draw = () => {
     //draw grid and locked tetromino
     game.drawGrid();
     gl.useProgram(programData.program);
 
     // draw the current tetromino
     if(game.activeTetromino) 
         game.activeTetromino.draw();
 
     // draw the list of all next tetrominos
     const sideX = game.column * game.tileSize;
     const size = Math.floor((gl.canvas.width - (sideX)) / 4);
     [...game.tetrominos].forEach((tetromino, i) => {
         tetromino.drawAt(sideX / size, 8 + i * 4 * 2, size, size * 0.95);
     });
 
 }
 
 const animate = () => {
     if(run){
         const deltaTime = Date.now() - game.lastTime;
         update(deltaTime * 0.001);
         draw();
         game.lastTime = Date.now();
         switch(game.state) {
             case game.State.GAMEOVER:
                 gl.canvas.style.filter = "blur(10px)";
                 game.lastTime = null;
         }
         requestAnimationFrame(animate);
     }
     
 }
 
 const initProgram = () => {
     const vertexShaderSource = `attribute vec2 a_texCoord;
     varying vec2 v_texCoord; ${commonVertexShaderSource("v_texCoord = a_texCoord;")}`;
     const fragmentShaderSource = document.getElementById("fragment-shader-2d").textContent;
     const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
     const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
     const program = createProgram(gl, vertexShader, fragmentShader);
     gl.useProgram(program);
     return {
         program,
         attributes: {
             position: gl.getAttribLocation(program, "a_position"),
             texCoord: gl.getAttribLocation(program, "a_texCoord"),
         },
         uniforms: {
             translation: gl.getUniformLocation(program, "u_translation"),
             resolution: gl.getUniformLocation(program, "u_resolution"),
             scale: gl.getUniformLocation(program, "u_scale"),
         },
 
         /**
          * uniforms = {index: [], translation: []}
          * buffer: { vertex, index }
          * @param {*} index 
          * @param {*} translation 
          * @param {*} buffer 
          */
         draw(uniforms, buffer) {
             gl.uniform2f(programData.uniforms.tetrominoIndex, ...uniforms.index);
             gl.uniform2f(programData.uniforms.translation, ...uniforms.translation);
             gl.bindBuffer(gl.ARRAY_BUFFER, buffer.vertex);
             gl.enableVertexAttribArray(programData.attributes.position);
             gl.vertexAttribPointer(programData.attributes.position, 2, gl.FLOAT, false, 0, 0);
         
             gl.enableVertexAttribArray(programData.attributes.texCoord);
             gl.vertexAttribPointer(programData.attributes.texCoord, 2, gl.FLOAT, false, 
                 0, 4 * 2 * Float32Array.BYTES_PER_ELEMENT);
         
             gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer.index);
             gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
         }
     }
 }
 
 
 const controls = {
     keys: {
         a: false,
         d: false,
         left: false,
         right: false,
         down: false
     }
 }
 
 
 const events = {
     
     executeAction() {
         const {keys} = controls;
         if(keys.a) {
             game.activeTetromino.rotate(true);
             keys.a = false;
         }
     
         if(keys.d) {
             game.activeTetromino.rotate(false);
             keys.d = false;
         }
 
         if(keys.left) {
             game.activeTetromino.collisionCheck("left");
             keys.left = false;
         }
 
         if(keys.right) {
             game.activeTetromino.collisionCheck("right");
             keys.right = false;
         }
 
         if(keys.down) {
             game.activeTetromino.collisionCheck("down");
             keys.down = false;
         }
     },
 
     initHandlers() {
         window.addEventListener("touchstart", e => {
             touch.x = e.touches[0].pageX;
             touch.y = e.touches[0].pageY;
         });
         
         window.addEventListener("touchmove", e => {
             if(touch.dir == null) {
                 const diffX = e.touches[0].pageX - touch.x;
             const diffY = e.touches[0].pageY - touch.y;
             if(Math.abs(diffX) > Math.abs(diffY)) {
                 if(diffX < 0) touch.dir = "left";
                 else touch.dir = "right";
             } else {
                 if(diffY < 0) touch.dir = "up";
                 else touch.dir = "down";
             }
             }
             
             if(game.activeTetromino != null && touch.dir != null) {
                 switch(touch.dir.toLowerCase()) {
 
 
                     case "down":
                         controls.keys.down = true;
                         break;
                 }
             }
             
         });
         
         window.addEventListener("touchend", e => {
             if(game.activeTetromino != null && touch.dir != null) {
                 switch(touch.dir.toLowerCase()) {
 
                     case "up":
                         controls.keys.a = true;
                         break;
 
                     case "left":
                         controls.keys.left = true;
                         break;
                     case "right":
                         controls.keys.right = true;
                         break;
 
                 }
             }
             touch.dir = null;
             touch.x = null;
             touch.y = null;
         });
         
         window.addEventListener("keyup", e => {
             if(game.activeTetromino != null) {
                 switch(e.key.toLowerCase()) {
                     case "r":
                         //game.activeTetromino.velocity.y = -1;
                         break;
                     case "a":
                         controls.keys.a = true;
                         break;
                     case "d":
                         controls.keys.d = true;
                         break;
                     case "w":
                        // controls.keys.w = true;
                         break;
                     case "arrowleft":
                         controls.keys.left = true;
                         break;
                     case "arrowright":
                         controls.keys.right = true;
                         break;
                     case "arrowdown":
                         controls.keys.down = true;
                         break;
                 }
             }
         });
     }
 
 }
 
 const initProgram2 = () => {
     const fragmentShaderSource = document.getElementById("fragment2-shader-2d").textContent;
     const vertexShader = createShader(gl, gl.VERTEX_SHADER, commonVertexShaderSource(""));
     const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
     const program = createProgram(gl, vertexShader, fragmentShader);
     programs.push( {
         program, 
         attributes: {
             position: gl.getAttribLocation(program, "a_position"),
         },
         uniforms: {
             resolution: gl.getUniformLocation(program, "u_resolution"),
             translation: gl.getUniformLocation(program, "u_translation"),
         }
     })
 
 }
 
 
 
 const main = () => {
     const canvas = document.getElementById("gl");
     canvas.height = parseInt(getComputedStyle(canvas).getPropertyValue("height"));
     canvas.width = parseInt(getComputedStyle(canvas).getPropertyValue("width"));
     gl = canvas.getContext("webgl", {
         stencil: false,
         antialias: false,
         depth: false,
     });
 
     initProgram2();
     programData = initProgram();
 
     gl.viewport(0, 0, canvas.width, canvas.height);
     gl.uniform2f(programData.uniforms.translation, 0, 0);
     gl.uniform2f(programData.uniforms.resolution, canvas.width, canvas.height);
     gl.uniform3f(programData.uniforms.color, 255, 0, 0);
 
     game.state = game.State.GAMEOVER;
 
     // menu event handlers
     const playBtn = document.getElementById("playBtn");
     const controlBtn = document.getElementById("controlsBtn");
     const aboutBtn = document.getElementById("aboutBtn");
 
     playBtn.addEventListener("click", e => {
         if(game.music)
             document.getElementById("music").play();
         game.restart();
     });
 
     controlBtn.addEventListener("click", e => {
        anout_amsr();
     });
    function anout_amsr(){
        Swal.fire({
            icon: "info",
            title: "TOUCH : Swipe LEFT, RIGHT, DOWN to control block movement. Swipe UP to rotate. \n\n KEYBOARD: Press the ARROW keys to control block movement. Press the A and D keys to rotate",
            showClass: {
              popup: `
           animate__animated
           animate__fadeInUp
           animate__faster
         `,
            },
            hideClass: {
              popup: `
           animate__animated
           animate__fadeOutDown
           animate__faster
         `,
            },
          });
    }
     aboutBtn.addEventListener("click", e => {
        dev_amsr();
     });
 function dev_amsr(){
    Swal.fire({
        icon: "success",
        title: "Developed by ~Aryan Maurya",
        showConfirmButton: false,
        timer: 1800,
        showClass: {
          popup: `
       animate__animated
       animate__fadeInUp
       animate__faster
     `,
        },
        hideClass: {
          popup: `
       animate__animated
       animate__fadeOutDown
       animate__faster
     `,
        },
      });
 }
     const soundBtn = document.getElementById("TransparentBtn");
     soundBtn.addEventListener("click", e => {
         const isPlaying = `<svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M40.3 45.2 2.85 7.75 5 5.6l37.45 37.45Zm-13-21.55-3-3V6H36v6.75h-8.7ZM19.8 42q-3.15 0-5.325-2.175Q12.3 37.65 12.3 34.5q0-3.15 2.175-5.325Q16.65 27 19.8 27q1.4 0 2.525.4t1.975 1.1v-3.6l3 3v6.6q0 3.15-2.175 5.325Q22.95 42 19.8 42Z"/></svg>`;
         const isPaused = `<svg xmlns="http://www.w3.org/2000/svg" height="48" width="48"><path d="M16 37.85v-28l22 14Zm3-14Zm0 8.55 13.45-8.55L19 15.3Z"/></svg>`;
         game.music = !game.music;
         soundBtn.innerHTML = "";
         if(game.music) {
             soundBtn.innerHTML = isPlaying;
             document.getElementById("music").play();
         } else {
             soundBtn.innerHTML = isPaused;
             document.getElementById("music").pause();
         } 
 
     });
 
     document.getElementById("music").loop = true;
 
     events.initHandlers();
     game.init();
 }
 
/* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/

 window.addEventListener("load", main);
 
 const AssetManager = (function() {
 
     const api = {};
 
     api.Type = {
         IMAGE: "image",
         AUDIO: "audio",
         JSON: "json"
     }
 
     api.images = [];
     api.json = [];
     api.audios = [];
 
     api.getImageById = id => api.images.filter(i => i.id === id)[0];
 
     api.getJsonById = id => api.json.filter(i => i.id === id)[0];
 
     // {src, id. type}
     api.loadFile = async function(...datas) {
         const promises = [];
 
         datas.forEach(data => {
             let promise;
             switch (data.type) {
                 case api.Type.IMAGE:
 
                     promise = new Promise((resolve, reject) => {
                         const img = new Image();
                         img.src = data.src;
                         img.addEventListener("load", e => {
                             const res = {...data, img};
                             api.images.push(res);
                             resolve(res);
                         });
                         img.addEventListener("error", e => {
                             reject(e);
                         });
                     });
                     promises.push(promise);
                     break;
 
                 case api.Type.JSON:
                     promise = new Promise((resolve, reject) => {
                         fetch(data.src).then(e => e.json())
                             .then(e => {
                                 const res = {...data, content: e};
                                 api.json.push(res);
                                 resolve(res);
                             })
                             .catch(e => reject(e));
                     });
                     promises.push(promise);
                     break;
             }
 
         });
 
         return await Promise.all(promises);
     }
 
     return api;
 
 });
 
 const setUpGL = (canvas, width, height, context = {}) => {
     const gl = canvas.getContext("webgl", context);
     if (!gl)
         return null;
     gl.viewport(0, 0, width, height);
     return gl;
 };
 
 const createShader = (gl, type, source) => {
     const shader = gl.createShader(type);
     gl.shaderSource(shader, source);
     gl.compileShader(shader);
     const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
     if (success)
         return shader;
     console.log(gl.getShaderInfoLog(shader));
     gl.deleteShader(shader);
     return null;
 };
 
 const createProgram = (gl, vertexShader, fragmentShader) => {
     const program = gl.createProgram();
     gl.attachShader(program, vertexShader);
     gl.attachShader(program, fragmentShader);
     gl.linkProgram(program);
     const success = gl.getProgramParameter(program, gl.LINK_STATUS);
     if (success)
         return program;
     console.log(gl.getProgramInfoLog(program));
     gl.deleteProgram(program);
     return null;
 }
 

 /* 

    #############################################################
      
          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

(   By ~Aryan Maurya Mr.perfect https://amsrportfolio.netlify.app  )

          @@@@@@@@@@    &&&&&&&&&&&&&&&&&&&    %%%%%%%%%%

    #############################################################

*/