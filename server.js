const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let scores = {};
let leaderboard = [];

wss.on('connection', (ws) => {
  let secretNumber;
  let username;

  ws.on('message', (message) => {
    const data = JSON.parse(message);

    if (data.type === 'username') {
      username = data.data;
      secretNumber = Math.floor(Math.random() * 4) + 1;
      scores[username] = 0;
      ws.send(JSON.stringify({ type: 'number', data: secretNumber }));
      broadcastLeaderboard();
      return;
    }

    if (data.type === 'newGame') {
      secretNumber = Math.floor(Math.random() * 4) + 1;
      ws.send(JSON.stringify({ type: 'number', data: secretNumber }));
      broadcastLeaderboard();
      return;
    }

    const guess = parseInt(data.data);
    if (guess === secretNumber) {
      scores[username]++;
      broadcastLeaderboard();
      ws.send(JSON.stringify({ type: 'result', data: 'Congratulations! You guessed the number.' }));
    } else {
      ws.send(JSON.stringify({ type: 'result', data: 'Incorrect guess. Try again.' }));
    }
  });

  ws.on('close', () => {
    delete scores[username];
    broadcastLeaderboard();
  });
});

function broadcastLeaderboard() {
  leaderboard = Object.entries(scores).map(([username, score]) => ({ username, score }));
  leaderboard.sort((a, b) => b.score - a.score); // Sort the leaderboard in descending order of scores

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'leaderboard', data: leaderboard }));
    }
  });
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

server.listen(3000, () => {
  console.log('Server is listening on port 3000');
});