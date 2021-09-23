const express = require("express");
const app = express();
const server = require("http").Server(app);
const port = process.env.PORT || 80;

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let games = [];

io.on("connection", (socket) => {
  console.log("Socket connected", socket.id);

  //When a socket receives a player object
  socket.on("player", (player) => {
    //Check if the room exists that the player is trying to join
    const game = games.find((game) => game.code === player.game);
    if (game) {
      //Check if not duplicate
      let exists = false;
      game.players.forEach((playerToFind) => {
        if (playerToFind.name === player.name) {
          exists = true;
        }
      });
      //If player doesn't exist
      if (!exists) {
        game.players.push(player);
        console.log(
          `${player.name} is succesfully pushed to game ${game.code}`
        );
        console.log(games);
      } else {
        console.log(`${player.name} is already taken.`);
      }
    } else {
      console.log(`${player.game} is not found.`);
    }
  });

  //When a socket receives a code
  socket.on("code", (code) => {
    console.log("code entered:", code);
    io.sockets.emit(`code`, code);

    //Check if a game exists with that code, if it doesn't create the game
    if (!games.find((game) => game.code === code)) {
      games.push({ id: socket.id, code: code, players: [] });
      console.log(games);
    } else {
      console.log("game already exists");
    }
  });
});

app.use(express.static("public"));

server.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
