module.exports = {
    initGame,
    gameLoop,
    startGame,
    addNewPlayer,
    switchBallColor,
    hitBall,
    resetBall,
}

const ballColorList = [
    '#ff0000', // red
    '#ffa500', // orange
    '#ffff00', // yellow
    '#00ff00', // lime
    '#00ffff', // aqua
    '#0000ff', // blue
    '#ff00ff', // fuchsia
    '#ffffff', // white
    '#808080', // gray
    '#000000', // black
    '#964b00', // brown
];

function initGame() {
    const state = createGameState();
    return state;
}

function createGameState() {
    newGameState = {
        players: [
            /*
            {
                playerNumber: number_of_player,
                username: name_of_player,
                strokes: [
                    array_of_strokes_per_hole
                ],
                ball: {
                    color: color_of_ball,
                    x: x_position_of_ball,
                    y: y_position_of_ball,
                    vel: velocity_of_ball,
                    angle: angle_of_velocity
                },
                finishedHol: boolean_whether_player_finished_the_current_hole
            },
            */
        ],
        map: {
            width: 10,
            height: 10,
            size: 100, // width * size === height * size === canvas.width === canvas.height === 1000
            grid: [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 3, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 1, 1, 1, 0, 0,
                0, 0, 0, 0, 0, 1, 0, 1, 0, 0,
                0, 0, 0, 0, 0, 1, 1, 1, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 2, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ],
        },
        currentHole: 0,
        totalHoles: 10,
        active: false,
        gameOver: false,
    };

    return newGameState;
}

function startGame(state) {
    state.active = true;
    return state;
}

function gameLoop(state) {
    // if this is true at the end of the function, all players have finished the hole
    let allFinished = true;
    if(state.players.length === 0) {
        allFinished = false;
    }

    // update each person's ball
    for(let i = 0; i < state.players.length; i++) {
        // don't update a non-moving ball
        if(state.players[i].ball.vel === 0) {
            if(!state.players[i].finishedHole) {
                allFinished = false;
            }
            continue;
        }
        if(state.players[i].finishedHole) {
            continue;
        }

        // grid coordinates of ball's original position
        let ballCellX = Math.floor(state.players[i].ball.x / state.map.size);
        let ballCellY = Math.floor(state.players[i].ball.y / state.map.size);
        let ballCellLeft = Math.floor((state.players[i].ball.x - (state.map.size / 8)) / state.map.size);
        let ballCellRight = Math.floor((state.players[i].ball.x + (state.map.size / 8)) / state.map.size);
        let ballCellAbove = Math.floor((state.players[i].ball.y - (state.map.size / 8)) / state.map.size);
        let ballCellBelow = Math.floor((state.players[i].ball.y + (state.map.size / 8)) / state.map.size);

        // calculate new x and y positions
        let dx = Math.abs(Math.cos(state.players[i].ball.angle * Math.PI / 180)) * state.players[i].ball.vel;
        let dy = Math.abs(Math.sin(state.players[i].ball.angle * Math.PI / 180)) * state.players[i].ball.vel;
        let newX = state.players[i].ball.x;
        let newY = state.players[i].ball.y;
        // add or subtract based on angle
        if(state.players[i].ball.angle >= 270) {
            newX += dx;
            newY += dy;
        }
        else if(state.players[i].ball.angle >= 180) {
            newX -= dx;
            newY += dy;
        }
        else if(state.players[i].ball.angle >= 90) {
            newX -= dx;
            newY -= dy;
        }
        else {
            newX += dx;
            newY -= dy;
        }
        // decrease velocity (acceleration/ friction)
        state.players[i].ball.vel -= 0.25;
        if(state.players[i].ball.vel < 0) {
            state.players[i].ball.vel = 0;
        }

        // grid coordinates of ball's new position
        let newBallCellLeft = Math.floor((newX - (state.map.size / 8)) / state.map.size);
        let newBallCellRight = Math.floor((newX + (state.map.size / 8)) / state.map.size);
        let newBallCellAbove = Math.floor((newY - (state.map.size / 8)) / state.map.size);
        let newBallCellBelow = Math.floor((newY + (state.map.size / 8)) / state.map.size);
        
        // if the ball has changed cells in the grid, check for a collision
        if(ballCellLeft !== newBallCellLeft || ballCellRight !== newBallCellRight || ballCellAbove !== newBallCellAbove || ballCellBelow !== newBallCellBelow) {
//            console.log('X: ' + ballCellX + '   Y: ' + ballCellY);
//            console.log('L: ' + ballCellLeft + '   R: ' + ballCellRight + '   A: ' + ballCellAbove + '   B: ' + ballCellBelow);
//            console.log('newL: ' + newBallCellLeft + '   newR: ' + newBallCellRight + '   newA: ' + newBallCellAbove + '   newB: ' + newBallCellBelow);
            // calculate if there are walls around the ball's position
            let ballGridIndex = ballCellX + (ballCellY * state.map.width);
            let wallLeft, wallRight, wallAbove, wallBelow, cornerTopLeft, cornerTopRight, cornerBottomLeft, cornerBottomRight;
            wallLeft = wallRight = wallAbove = wallBelow = cornerTopLeft = cornerTopRight = cornerBottomLeft = cornerBottomRight = false;
            if(ballCellX - 1 < 0 || state.map.grid[ballGridIndex - 1] === 0) {
                wallLeft = true;
            }
            if(ballCellX + 1 >= state.map.width || state.map.grid[ballGridIndex + 1] === 0) {
                wallRight = true;
            }
            if(ballCellY - 1 < 0 || state.map.grid[ballGridIndex - state.map.width] === 0) {
                wallAbove = true;
            }
            if(ballCellY + 1 >= state.map.height || state.map.grid[ballGridIndex + state.map.width] === 0) {
                wallBelow = true;
            }
            if(state.map.grid[(ballGridIndex - 1) - state.map.width] === 0) {
//            if(ballCellX - 1 >= 0 && ballCellY - 1 >= 0 && state.map.grid[(ballGridIndex - 1) - state.map.width] === 0) {
                cornerTopLeft = true;
            }
            if(state.map.grid[(ballGridIndex + 1) - state.map.width] === 0) {
//            if(ballCellX + 1 < state.map.width && ballCellY - 1 >= 0 && state.map.grid[(ballGridIndex + 1) - state.map.width] === 0) {
                cornerTopRight = true;
            }
            if(state.map.grid[(ballGridIndex - 1) + state.map.width] === 0) {
//            if(ballCellX - 1 >= 0 && ballCellY + 1 < state.map.height && state.map.grid[(ballGridIndex - 1) + state.map.width] === 0) {
                cornerBottomLeft = true;
            }
            if(state.map.grid[(ballGridIndex + 1) + state.map.width] === 0) {
//            if(ballCellX + 1 < state.map.width && ballCellY + 1 < state.map.height && state.map.grid[(ballGridIndex + 1) + state.map.width] === 0) {
                cornerBottomRight = true;
            }
//            console.log('wL: ' + wallLeft + '   wR: ' + wallRight + '   wA: ' + wallAbove + '   wB: ' + wallBelow);
//            console.log('cTL: ' + cornerTopLeft + '   cTR: ' + cornerTopRight + '   cBL: ' + cornerBottomLeft + '   cBR: ' + cornerBottomRight);
            
            function cornerHit(xo, yo) {
                let x1 = state.players[i].ball.x + (xo * (state.map.width / 8 * Math.cos(Math.PI / 4)));
                let y1 = state.players[i].ball.y + (yo * (state.map.width / 8 * Math.sin(Math.PI / 4)));
                let xc = Math.floor(x1 / state.map.size);
                let yc = Math.floor(y1 / state.map.size);
                if(state.map.grid[xc + (yc * state.map.width)] === 0) {
                    return true;
                }
                else {
                    return false;
                }
            }

            // ball moved up and to the left
            if(newBallCellAbove < ballCellAbove && newBallCellLeft < ballCellLeft && wallAbove && wallLeft) {
                newX = newX + ((newBallCellRight * state.map.size) - (newX - (state.map.size / 8)));
                newY = newY + ((newBallCellBelow * state.map.size) - (newY - (state.map.size / 8)));
                state.players[i].ball.angle = (360 - (state.players[i].ball.angle - 90)) % 360;
            }
            // ball moved up and to the right
            else if(newBallCellAbove < ballCellAbove && newBallCellRight > ballCellRight && wallAbove && wallRight) {
                newX = newX - ((newX + (state.map.size / 8)) - (newBallCellRight * state.map.size));
                newY = newY + ((newBallCellBelow * state.map.size) - (newY - (state.map.size / 8)));
                state.players[i].ball.angle = (270 - state.players[i].ball.angle) % 360;
            }
            // ball moved down and to the left
            else if(newBallCellBelow > ballCellBelow && newBallCellLeft < ballCellLeft && wallBelow && wallLeft) {
                newX = newX + ((newBallCellRight * state.map.size) - (newX - (state.map.size / 8)));
                newY = newY - ((newY + (state.map.size / 8) - (newBallCellBelow * state.map.size)));
                state.players[i].ball.angle = (90 - (state.players[i].ball.angle - 180)) % 360;
            }
            // ball moved down and to the right
            else if(newBallCellBelow > ballCellBelow && newBallCellRight > ballCellRight && wallBelow && wallRight) {
                newX = newX - ((newX + (state.map.size / 8)) - (newBallCellRight * state.map.size));
                newY = newY - ((newY + (state.map.size / 8) - (newBallCellBelow * state.map.size)));
                state.players[i].ball.angle = (180 - (state.players[i].ball.angle - 270)) % 360;
            }
            // ball moved up
            else if(newBallCellAbove < ballCellAbove && wallAbove) {
                newY = newY + ((newBallCellBelow * state.map.size) - (newY - (state.map.size / 8)));
                state.players[i].ball.angle = (360 - state.players[i].ball.angle) % 360;
            }
            // ball moved down
            else if(newBallCellBelow > ballCellBelow && wallBelow) {
                newY = newY - ((newY + (state.map.size / 8) - (newBallCellBelow * state.map.size)));
                state.players[i].ball.angle = (360 - state.players[i].ball.angle) % 360;
            }
            // ball moved to the left
            else if(newBallCellLeft < ballCellLeft && wallLeft) {
                newX = newX + ((newBallCellRight * state.map.size) - (newX - (state.map.size / 8)));
                state.players[i].ball.angle = (270 + (270 - state.players[i].ball.angle)) % 360;
            }
            // ball moved to the right
            else if(newBallCellRight > ballCellRight && wallRight) {
                newX = newX - ((newX + (state.map.size / 8)) - (newBallCellRight * state.map.size));
                state.players[i].ball.angle = (270 - (state.players[i].ball.angle - 270)) % 360;
            }
            // top left corner hit
            else if(!wallLeft && !wallAbove && cornerHit(-1, -1)) {
                newX = newX + ((ballCellRight * state.map.size) - (newX - (state.map.size / 8)));
                newY = newY + ((ballCellBelow * state.map.size) - (newY - (state.map.size / 8)));
                state.players[i].ball.angle = (360 - (state.players[i].ball.angle - 90)) % 360;
            }
            // top right corner hit
            else if(!wallRight && !wallAbove && cornerHit(1, -1)) {
                newX = newX - ((newX + (state.map.size / 8)) - (ballCellLeft * state.map.size));
                newY = newY + ((ballCellBelow * state.map.size) - (newY - (state.map.size / 8)));
                state.players[i].ball.angle = (270 - state.players[i].ball.angle) % 360;
            }
            // bottom left corner hit
            else if(!wallLeft && !wallBelow && cornerHit(-1, 1)) {
                newX = newX + ((ballCellRight * state.map.size) - (newX - (state.map.size / 8)));
                newY = newY - ((newY + (state.map.size / 8) - (ballCellAbove * state.map.size)));
                state.players[i].ball.angle = (90 - (state.players[i].ball.angle - 180)) % 360;
            }
            // bottom right corner hit
            else if(!wallRight && !wallBelow && cornerHit(1, 1)) {
                newX = newX - ((newX + (state.map.size / 8)) - (ballCellLeft * state.map.size));
                newY = newY - ((newY + (state.map.size / 8) - (ballCellAbove * state.map.size)));
                state.players[i].ball.angle = (180 - (state.players[i].ball.angle - 270)) % 360;
            }
        }
        
        // set the ball's new position into the state
        state.players[i].ball.x = newX;
        state.players[i].ball.y = newY;

        // check if the player finished the course
        let endGridIndex;
        for(let i = 0; i < state.map.grid.length; i++) {
            if(state.map.grid[i] == 3) {
                endGridIndex = i;
                break;
            }
        }
        let endX = ((endGridIndex % state.map.width) * state.map.size) + (state.map.size / 2);
        let endY = (Math.floor(endGridIndex / state.map.height) * state.map.size) + (state.map.size / 2);
        if((newX - (state.map.size / 8)) >= (endX - (state.map.size / 4)) &&
            (newX + (state.map.size / 8)) <= (endX + (state.map.size / 4)) &&
            (newY - (state.map.size / 8)) >= (endY - (state.map.size / 4)) &&
            (newY + (state.map.size / 8)) <= (endY + (state.map.size / 4))) {
            state.players[i].finishedHole = true;
            state.players[i].vel = 0;
        }
        else {
            allFinished = false;
        }
    }

    // start next hole
    if(allFinished) {
        state = startNextHole(state);
    }

    return state;
}

function startNextHole(state) {
    state.currentHole++;
    if(state.currentHole >= state.totalHoles) {
        state.gameOver = true;
        return state;
    }

    switch(state.currentHole) {
        case 1:
            state.map.grid = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 3, 1, 1, 1, 1, 0,
                0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
                0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
                0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
                0, 1, 0, 0, 1, 1, 1, 0, 1, 0,
                0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
                0, 0, 0, 0, 1, 2, 1, 0, 0, 0,
                0, 0, 0, 0, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];
            break;
        case 2:
            state.map.grid = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 3, 1, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 1, 0, 0, 0,
                0, 0, 0, 0, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 0, 1, 0, 1, 0, 0, 0,
                0, 0, 0, 0, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 0, 0, 2, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];
            break;
        case 3:
            state.map.grid = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 1, 1, 1, 0, 0,
                0, 0, 0, 0, 0, 1, 3, 1, 0, 0,
                0, 0, 0, 0, 0, 1, 1, 1, 0, 0,
                0, 0, 0, 0, 0, 1, 0, 0, 0, 0,
                0, 0, 0, 1, 1, 1, 0, 0, 0, 0,
                0, 0, 0, 1, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 2, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];
            break;
        case 4:
            state.map.grid = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 1, 0, 1, 0, 1, 0, 1, 3, 0,
                0, 1, 1, 1, 0, 1, 1, 1, 1, 0,
                0, 0, 1, 1, 1, 1, 0, 1, 0, 0,
                0, 1, 1, 0, 0, 1, 1, 1, 1, 0,
                0, 0, 1, 0, 0, 0, 1, 0, 0, 0,
                0, 1, 1, 0, 0, 0, 1, 1, 1, 0,
                0, 1, 1, 1, 1, 1, 1, 1, 0, 0,
                0, 2, 1, 1, 0, 1, 0, 1, 1, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];
            break;
        case 5:
            state.map.grid = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 0, 1, 1, 1, 0, 0,
                0, 1, 0, 1, 0, 1, 0, 1, 0, 0,
                0, 3, 0, 1, 1, 1, 0, 1, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
                0, 2, 0, 1, 1, 1, 0, 1, 0, 0,
                0, 1, 0, 1, 0, 1, 0, 1, 0, 0,
                0, 1, 1, 1, 0, 1, 1, 1, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];
            break;
        case 6:
            state.map.grid = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
                0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
                0, 1, 0, 1, 1, 1, 1, 0, 1, 0,
                0, 1, 0, 1, 0, 0, 1, 0, 1, 0,
                0, 1, 0, 1, 0, 0, 1, 0, 1, 0,
                0, 1, 0, 1, 0, 3, 1, 0, 1, 0,
                0, 1, 0, 1, 0, 0, 0, 0, 1, 0,
                0, 2, 0, 1, 1, 1, 1, 1, 1, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];
            break;
        case 7:
            state.map.grid = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 1, 3, 1, 0, 0, 0,
                0, 0, 0, 1, 1, 1, 1, 1, 0, 0,
                0, 0, 1, 1, 1, 1, 1, 1, 1, 0,
                0, 0, 1, 1, 0, 0, 0, 1, 1, 0,
                0, 0, 1, 1, 1, 0, 1, 1, 1, 0,
                0, 0, 0, 1, 1, 1, 1, 1, 0, 0,
                0, 0, 0, 0, 1, 2, 1, 0, 0, 0,
                0, 0, 0, 0, 1, 1, 1, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];
            break;
        case 8:
            state.map.grid = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 1, 1, 1, 1, 1, 1, 1, 0,
                0, 0, 1, 1, 0, 1, 0, 1, 1, 0,
                0, 0, 1, 1, 0, 1, 0, 1, 1, 0,
                0, 0, 1, 1, 0, 3, 0, 1, 1, 0,
                0, 0, 1, 1, 0, 0, 0, 1, 1, 0,
                0, 0, 1, 1, 0, 2, 0, 1, 1, 0,
                0, 0, 1, 1, 1, 1, 1, 1, 1, 0,
                0, 0, 1, 1, 1, 1, 1, 1, 1, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];
            break;
        case 9:
            state.map.grid = [
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
                0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
                0, 1, 0, 0, 0, 0, 0, 0, 3, 0,
                0, 1, 1, 1, 1, 1, 1, 0, 0, 0,
                0, 0, 1, 1, 0, 0, 1, 1, 0, 0,
                0, 0, 1, 1, 0, 0, 1, 1, 0, 0,
                0, 0, 0, 1, 1, 1, 1, 1, 1, 0,
                0, 2, 0, 0, 0, 0, 0, 0, 1, 0,
                0, 1, 1, 1, 1, 1, 1, 1, 1, 0,
                0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            ];
            break;
    }

    let startGridIndex;
    for(let i = 0; i < state.map.grid.length; i++) {
        if(state.map.grid[i] == 2) {
            startGridIndex = i;
            break;
        }
    }
    let startX = ((startGridIndex % state.map.width) * state.map.size) + (state.map.size / 2);
    let startY = (Math.floor(startGridIndex / state.map.height) * state.map.size) + (state.map.size / 2);

    for(let i = 0; i < state.players.length; i++) {
        state.players[i].finishedHole = false;
        state.players[i].ball.x = startX;
        state.players[i].ball.y = startY;
        state.players[i].ball.vel = 0;
    }
    return state;
}

function addNewPlayer(state, playerNumber, username) {
    let startGridIndex;
    for(let i = 0; i < state.map.grid.length; i++) {
        if(state.map.grid[i] == 2) {
            startGridIndex = i;
            break;
        }
    }
    let startX = ((startGridIndex % state.map.width) * state.map.size) + (state.map.size / 2);
    let startY = (Math.floor(startGridIndex / state.map.height) * state.map.size) + (state.map.size / 2);

    newPlayer = {
        playerNumber: playerNumber,
        username: username,
        strokes: [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0
        ],
        ball: {
            color: getInitialBallColor(state),
            x: startX,
            y: startY,
            vel: 0,
            angle: 0,
        },
        finishedHole: false,
    };
    state.players.push(newPlayer);
    return state;
}

function getInitialBallColor(state) {
    let colorsUsed = [];
    for(let i = 0; i < state.players.length; i++) {
        colorsUsed.push(state.players[i].ball.color);
    }

    let index = 0;
    while(colorsUsed.includes(ballColorList[index])) {
        index++;
    }
    return ballColorList[index];
}

function switchBallColor(state, playerId) {
    let colorsUsed = [];
    let currentBallColor = null;
    let playerIndex = -1;

    for(let i = 0; i < state.players.length; i++) {
        colorsUsed.push(state.players[i].ball.color);
        if(state.players[i].playerNumber === playerId) {
            currentBallColor = state.players[i].ball.color;
            playerIndex = i;
        }
    }

    let index = ballColorList.indexOf(currentBallColor);
    while(colorsUsed.includes(ballColorList[index])) {
        index = (index + 1) % ballColorList.length;
    }
    
    state.players[playerIndex].ball.color = ballColorList[index];

    return state;
}

function hitBall(state, playerId, angle, force) {
    for(let i = 0; i < state.players.length; i++) {
        if(state.players[i].playerNumber === playerId) {
            state.players[i].ball.angle = angle;
            state.players[i].ball.vel = (force / 100) * 20;
            state.players[i].strokes[state.currentHole]++;
            return state;
        }
    }
}

function resetBall(state, playerId) {
    let startGridIndex;
    for(let i = 0; i < state.map.grid.length; i++) {
        if(state.map.grid[i] == 2) {
            startGridIndex = i;
            break;
        }
    }
    let startX = ((startGridIndex % state.map.width) * state.map.size) + (state.map.size / 2);
    let startY = (Math.floor(startGridIndex / state.map.height) * state.map.size) + (state.map.size / 2);

    for(let i = 0; i < state.players.length; i++) {
        if(state.players[i].playerNumber === playerId) {
            if(state.players[i].finishedHole) {
                return state;
            }

            state.players[i].ball.x = startX;
            state.players[i].ball.y = startY;
            state.players[i].ball.vel = 0;
            state.players[i].ball.angle = 0;
            state.players[i].strokes[state.currentHole] = 0;
            return state;
        }
    }
}