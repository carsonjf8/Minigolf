const io = require('socket.io')();
const { initGame, startGame, gameLoop, addNewPlayer, switchBallColor, hitBall, resetBall } = require('./game');
const { MAX_PLAYERS, FRAME_RATE, CANVAS_SIDE_LENGTH } = require('./constants');
const { makeid } = require('./utils');

const state = {};
const clientRooms = {};

io.on('connection', client => {

    client.on('newGame', handleNewGame);
    client.on('joinGame', handleJoinGame);
    client.on('switchBallColor', handleSwitchBallColor);
    client.on('startGame', handleStartGame);
    client.on('hitBall', handleHitBall);
    client.on('resetBall', handleResetBall);

    function handleJoinGame(roomName, playerName) {
        const room = io.sockets.adapter.rooms[roomName];

        let allUsers;
        if(room) {
            allUsers = room.sockets;
        }

        let numClients = 0;
        if(allUsers) {
            numClients = Object.keys(allUsers).length;
        }

        if(numClients === 0) {
            client.emit('unknownGame');
            return;
        }
        else if(numClients === MAX_PLAYERS) {
            client.emit('tooManyPlayers');
            return;
        }

        clientRooms[client.id] = roomName;

        client.join(roomName);
        client.number = numClients + 1;
        state[roomName] = addNewPlayer(state[roomName], client.number, playerName);
        
        client.emit('init', client.number, roomName);
        emitGameState(roomName);
    }

    function handleNewGame(playerName) {
        let roomName = makeid(5);
        clientRooms[client.id] = roomName;

        client.join(roomName);
        state[roomName] = initGame();
        client.number = 1;
        state[roomName] = addNewPlayer(state[roomName], client.number, playerName);

        client.emit('init', client.number, roomName);
        emitGameState(roomName);
    }

    function handleSwitchBallColor(playerId) {
        state[clientRooms[client.id]] = switchBallColor(state[clientRooms[client.id]], playerId);
        emitGameState(clientRooms[client.id]);
    }

    function handleStartGame() {
        state[clientRooms[client.id]] = startGame(state[clientRooms[client.id]]);
        io.sockets.in(clientRooms[client.id]).emit('startGame', CANVAS_SIDE_LENGTH);

        startGameInterval(clientRooms[client.id]);
    }

    function handleHitBall(angle, force) {
        state[clientRooms[client.id]] = hitBall(state[clientRooms[client.id]], client.number, angle, force);
        emitGameState(clientRooms[client.id]);
    }
    
    function handleResetBall() {
        state[clientRooms[client.id]] = resetBall(state[clientRooms[client.id]], client.number);
        emitGameState(clientRooms[client.id]);
    }
});

function startGameInterval(roomName) {
    const intervalId = setInterval(() => {
        const updatedGameState = gameLoop(state[roomName]);
        state[roomName] = updatedGameState;
        emitGameState(roomName);
    }, 1000 / FRAME_RATE);
}

function emitGameState(room) {
    io.sockets.in(room).emit('gameState', JSON.stringify(state[room]));
}

io.listen(process.env.PORT || 3000);