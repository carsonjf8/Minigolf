// local development socket
//const socket = io('localhost:3000');
// heroku deployment socket
const socket = io('https://still-thicket-37510.herokuapp.com/');

const initialScreen = document.getElementById('initialScreen');
const usernameInput = document.getElementById('usernameInput');
const newGameBtn = document.getElementById('newGameBtn');
newGameBtn.addEventListener('click', newGame);
const gameCodeInput = document.getElementById('gameCodeInput');
const joinGameBtn = document.getElementById('joinGameBtn');
joinGameBtn.addEventListener('click', joinGame);

const playerListScreen = document.getElementById('playerScreen');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const playerListGrid = document.getElementById('playerListGrid');
const playerDisplayList = [];
const playerColorBtnList = [];
const startGameBtn = document.getElementById('startGameBtn');
startGameBtn.addEventListener('click', startGame);

const gameScreen = document.getElementById('gameScreen');
const scoresDisplay = document.getElementById('scoresDisplay');
const playerScoresDisplayList = [];

const finalScoresScreen = document.getElementById('finalScoresScreen');
const finalScoresDisplay = document.getElementById('finalScoresDisplay');

// frame rate
const FRAME_RATE = 60;
// unique code for the room
let gameCode;
// player username
let username;
// can start game
let roomLeader = false;
// player number
let playerNumber;
// whether the game has started or not
let gameActive;
// canvas the game will be drawn on
let canvas;
// used to draw on the canvas
let ctx;
// canvas dimensions
let canvasWidth, canvasHeight;
// current game state
let gameState;
// interval to update screen
let intervalId;
// x and y coordinates of the mouse
let mouseX, mouseY;
// angle between mouse and ball
let forceAngle;
// how hard the ball was hit (0 - 100)
let force;
// info about the user's player
let me;

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('unknownGame', handleUnknownGame);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('startGame', handleStartGame);

function newGame() {
    // check if username is not empty or just whitespace
    username = usernameInput.value;
    if(username.trim().length === 0) {
        alert('Please enter a valid username');
        usernameInput.value = '';
        return;
    }

    socket.emit('newGame', username);
    roomLeader = true;
    init();
}

function joinGame() {
    // check if username is not empty or just whitespace
    username = usernameInput.value;
    if(username.trim().length === 0) {
        alert('Please enter a valid username');
        usernameInput.value = '';
        return;
    }

    gameCode = gameCodeInput.value;
    socket.emit('joinGame', gameCode, username);
    init();
}

function handleUnknownGame() {
    reset();
    alert('Unknown game code');
}

function handleTooManyPlayers() {
    reset();
    alert('This game is already in progress');
}

function reset() {
    playerNumber = null;
    gameCodeInput.value = '';
    initialScreen.style.display = 'block';
    playerListScreen.style.display = 'none';
}

function init() {
    initialScreen.style.display = 'none';
    playerListScreen.style.display = 'block';
    startGameBtn.style.display = 'none';
    startGameBtn.disabled = true;
}

function handleInit(number, roomCode) {
    playerNumber = number;
    gameCode = roomCode;
    gameCodeDisplay.innerText = gameCode;
    
    // only the host can start the game
    if(playerNumber === 1) {
        startGameBtn.style.display = 'block';
        startGameBtn.disabled = false;
    }
}

function addNewPlayer() {
    const newDiv = document.createElement('div');
    newDiv.classList.add('row');

    const newPlayerNameDisplay = document.createElement('h3');
    newPlayerNameDisplay.classList.add('justify-content-center');
    newPlayerNameDisplay.classList.add('playerName');
    newPlayerNameDisplay.style.display = 'block';
    
    const newPlayerColorBtn = document.createElement('button');
    newPlayerColorBtn.classList.add('circleBtn');
    newPlayerColorBtn.addEventListener('click', switchBallColor);

    newDiv.appendChild(newPlayerNameDisplay);
    newDiv.appendChild(newPlayerColorBtn);
    playerListGrid.appendChild(newDiv);

    playerDisplayList.push(newPlayerNameDisplay);
    playerColorBtnList.push(newPlayerColorBtn);
}

function addNewPlayerScoreDisplay() {
    const newH3 = document.createElement('h3');
    newH3.style.display = 'block';
    scoresDisplay.appendChild(newH3);
    playerScoresDisplayList.push(newH3);
}

function switchBallColor() {
    socket.emit('switchBallColor', playerNumber);
}

function startGame() {
    socket.emit('startGame');
}

function handleStartGame(canvasSideLength) {
    playerListScreen.style.display = 'none';
    gameScreen.style.display = 'block';

    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    canvasWidth = canvasSideLength;
    canvasHeight = canvasSideLength;
    canvas.width = canvas.height = canvasSideLength;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    gameActive = true;

    canvas.addEventListener('mousemove', function(event) {
        let mousePos = getMousePos(canvas, event);
        mouseX = mousePos.x;
        mouseY = mousePos.y;
    })

    document.addEventListener('keydown', keydown);

    intervalId = setInterval(() => {
        paintGame();
    }, 1000 / FRAME_RATE);
}

function getMousePos(element, event) {
    let rect = element.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function keydown(e) {
    // 32 is SPACE
    if(e.keyCode === 32 && me.ball.vel === 0 && force !== null && forceAngle !== null && !me.finishedHole) {
        socket.emit('hitBall', forceAngle, force);
    }
    // 82 is R
    if(e.keyCode === 82 && me !== null && !me.finishedHole) {
        socket.emit('resetBall');
    }
}

function handleGameState(data) {
    gameState = JSON.parse(data);

    if(gameState.active) {
        // extract info about the user
        for(let i = 0; i < gameState.players.length; i++) {
            if(gameState.players[i].playerNumber === playerNumber && gameState.players[i].username === username) {
                me = gameState.players[i];
            }
        }
    }
    else {
        for(let i = 0; i < gameState.players.length; i++) {
            if(i < playerDisplayList.length) {
                playerDisplayList[i].innerText = gameState.players[i].username;
                playerColorBtnList[i].style.background = gameState.players[i].ball.color;
            }
            else {
                addNewPlayer();
                playerDisplayList[i].innerText = gameState.players[i].username
                playerColorBtnList[i].style.background = gameState.players[i].ball.color;
            }
        }
    }
}

function paintGame() {
    let state = gameState;
    
    if(gameActive) {
        // check if game is over
        if(state.gameOver) {
            clearInterval(intervalId);
            gameOver(state);
        }

        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, state.map.width * state.map.size, state.map.height * state.map.size); // background
        for(let i = 0; i < state.map.grid.length; i++) {
            if(state.map.grid[i] === 1) { // ground
                ctx.fillStyle = '#006400'; // dark green
                ctx.fillRect(
                    (i % state.map.width) * state.map.size,
                    (Math.floor(i / state.map.width)) * state.map.size,
                    state.map.size,
                    state.map.size
                );
            }
            else if(state.map.grid[i] === 2) { // start
                ctx.fillStyle = '#006400'; // dark green
                ctx.fillRect(
                    (i % state.map.width) * state.map.size,
                    (Math.floor(i / state.map.width)) * state.map.size,
                    state.map.size,
                    state.map.size
                    );
                ctx.beginPath();
                ctx.fillStyle = '#a9a9a9'; // light gray
                ctx.arc(
                    ((i % state.map.width) * state.map.size) + (state.map.size / 2),
                    ((Math.floor(i / state.map.width)) * state.map.size) + (state.map.size / 2),
                    state.map.size / 4,
                    0,
                    Math.PI * 2,
                    false
                );
                ctx.fill();
            }
            else if(state.map.grid[i] === 3) { // end
                ctx.fillStyle = '#006400'; // dark green
                ctx.fillRect(
                    (i % state.map.width) * state.map.size,
                    (Math.floor(i / state.map.width)) * state.map.size,
                    state.map.size,
                    state.map.size
                );
                ctx.beginPath();
                ctx.fillStyle = '#ffff00'; // yellow
                ctx.arc(
                    ((i % state.map.width) * state.map.size) + (state.map.size / 2),
                    ((Math.floor(i / state.map.width)) * state.map.size) + (state.map.size / 2),
                    state.map.size / 4,
                    0,
                    Math.PI * 2,
                    false
                );
                ctx.fill();
            }
        }

        // draw player's balls
        for(let i = 0; i < state.players.length; i++) {
            ctx.beginPath();
            ctx.fillStyle = state.players[i].ball.color;
            ctx.arc(
                state.players[i].ball.x,
                state.players[i].ball.y,
                state.map.size / 8,
                0,
                Math.PI * 2,
                false
            );
            ctx.fill();

            if(i < playerScoresDisplayList.length) {
                playerScoresDisplayList[i].innerText = state.players[i].username + ': ' + state.players[i].strokes[state.currentHole];
                playerScoresDisplayList[i].style.background = state.players[i].ball.color;
            }
            else {
                addNewPlayerScoreDisplay();
                playerScoresDisplayList[i].innerText = state.players[i].username + ': ' + state.players[i].strokes[state.currentHole];
                playerScoresDisplayList[i].style.background = state.players[i].ball.color;
            }
        }

        if(me != null && me.ball.vel === 0 && !me.finishedHole) {
            ctx.beginPath();
            // calculate angle between the mouse and ball
            let length = Math.sqrt(Math.pow(mouseX - me.ball.x, 2) + Math.pow(mouseY - me.ball.y, 2));
            let angle = Math.atan2((mouseY - me.ball.y), (mouseX - me.ball.x));

            if(length <= 33) {
                force = length;
                ctx.strokeStyle = '#4ee44e'; // green
            }
            else if(length <= 66) {
                force = length;
                ctx.strokeStyle = '#fcf75e'; // yellow
            }
            else if(length <= 99) {
                force = length;
                ctx.strokeStyle = '#ff8c00'; // orange
            }
            else { // >= 100
                force = 100;
                ctx.strokeStyle = '#b22222'; // red
            }

            forceAngle = (360 - (angle * 180 / Math.PI)) % 360;
            ctx.moveTo(me.ball.x, me.ball.y);
            if(length >= 100) {
                ctx.lineTo(
                    me.ball.x + (Math.cos(angle) * 100),
                    me.ball.y + (Math.sin(angle) * 100)
                )
            }
            else {
                ctx.lineTo(mouseX, mouseY);
            }
            ctx.lineWidth = 5;
            ctx.stroke();
        }
    }
}

function gameOver(state) {
    // display final scores for each player
    gameScreen.style.display = 'none';
    finalScoresScreen.style.display = 'block';

    for(let i = 0; i < state.players.length; i++) {
        let newH3 = document.createElement('h3');
        newH3.style.display = 'block';
        newH3.innerText = state.players[i].username;
        newH3.color = state.players[i].ball.color;
        for(let j = 0; j < state.totalHoles; j++) {
            newH3.innerText = newH3.innerText + ' ' + state.players[i].strokes[j];
        }
        finalScoresDisplay.appendChild(newH3);
    }
}