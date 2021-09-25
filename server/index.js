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
        if (
          playerToFind.name === player.name ||
          playerToFind.id === player.id
        ) {
          exists = true;
        }
      });
      //If player doesn't exist
      if (!exists) {
        game.players.push(player);
        io.to(player.id).emit("check", "ok");
        if (game.players.length >= 3) {
          game.playable = true;
          console.log(
            "The game contains at least 3 players and is now playable"
          );
        } else {
          game.playable = false;
        }
        console.log(
          `${player.name} is succesfully pushed to game ${game.code}`
        );
        //Push game object to host
        io.to(game.host).emit("game", game);
        console.log(games);
      } else {
        console.log(`${player.name} is already taken.`);
      }
    } else {
      console.log(`${player.game} is not found.`);
    }
  });

  //When server receives a code
  socket.on("code", (code) => {
    console.log("code entered:", code);
    io.sockets.emit(`code`, code);

    //Check if a game exists with that code, if it doesn't create the game
    if (!games.find((game) => game.code === code)) {
      games.push({ host: socket.id, code: code, players: [] });
      console.log(games);
      io.to(socket.id).emit("check", code);
    } else {
      console.log("game already exists");
    }
  });

  socket.on("onStart", (code) => {
    console.log("game started");
    const currentGame = games.find((game) => game.host === code);
    currentGame.active = true;

    //Inform host that the game has started
    io.to(currentGame.host).emit("game", currentGame);

    //Inform players that the game has started
    currentGame.players.forEach((player) => {
      io.to(player.id).emit("game", currentGame);
    });
  });
});

app.use(express.static("public"));

server.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
