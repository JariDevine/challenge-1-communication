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
    let exists = false;
    //Check if the room exists that the player is trying to join
    games.forEach((game) => {
      if (game.code === player.game) {
        game.players.forEach((playerToCheck) => {
          //Check for duplicate names in the game
          if (playerToCheck.name === player.name) {
            exists = true;
          }
        });
        //If not duplicate
        if (!exists) {
          game.players.push(player);
          console.log(
            `${player.name} is succesfully pushed to game ${game.code}`
          );
          console.log(games);
        }
      }
    });
  });

  //When a socket receives a code
  socket.on("code", (code) => {
    console.log("code entered:", code);
    io.sockets.emit(`code`, code);

    let exists = false;

    //Check if a game exists with that code, if it doesn't create the game
    //TODO: (Maybe use find or dictionary)
    games.forEach((game) => {
      if (game.code === code) {
        console.log("game already exists");
        exists = true;
        return;
      }
    });

    if (!exists) {
      games.push({ id: socket.id, code: code, players: [] });
      console.log(games);
    }
  });
});

app.use(express.static("public"));

server.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
