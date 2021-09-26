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
const questions = [
  "Who is most likely to pass wind in public?",
  "Who is most likely to become a social media influencer?",
  "Who is most likely to wear a crazy hairstyle all year long?",
  "Who is most likely to take the most candy at a go?",
];

const toPlayers = (game, variable, obj) => {
  game.players.forEach((player) => {
    io.to(player.id).emit(variable, obj);
  });
};

const generateQuestion = (currentGame) => {
  //Inform host new round has started
  io.to(currentGame.host).emit("roundEnded", false);

  //Set a question
  let question = questions[Math.floor(Math.random() * questions.length)];

  //As long as the question is in past questions, generate a new one
  while (
    currentGame.pastQuestions.find((pastQuestion) => pastQuestion === question)
  ) {
    question = questions[Math.floor(Math.random() * questions.length)];
  }
  currentGame.pastQuestions.push(question);

  //Send the generated question to the player
  io.to(currentGame.host).emit("question", question);
  toPlayers(currentGame, "question", question);
};

const checkAnswers = (game) => {
  //Check if all players submitted an answer
  if (game.answers.length === game.players.length) {
    console.log("all answers submitted");
    io.to(game.host).emit("game", game);

    //Add all votes to an array
    let submittedAnswers = [];
    game.answers.forEach((answer) => {
      submittedAnswers.push(answer.vote);
    });

    //Check who got the most votes
    const counts = {};
    submittedAnswers.forEach(function (x) {
      counts[x] = (counts[x] || 0) + 1;
    });
    console.log(counts);

    //Create array of values and search highest number
    let arr = Object.values(counts);
    let max = Math.max(...arr);

    //Check which entries contain the max
    let rightAnswers = [];
    let toCheck = Object.entries(counts);
    toCheck.forEach((answer) => {
      if (answer[1] === max) {
        rightAnswers.push(answer);
      }
    });
    console.log(rightAnswers);

    //Check if answer with max was voted on
    console.log("Checking answers");
    /* for each answer, compare it to a right answer, 
    right answers is an array cause everyone could have voted for someone else, 
    or in an even group, half could have voted for one person and the other half for another */

    game.answers.forEach((answer) => {
      rightAnswers.forEach((rightAnswer) => {
        const toCheckAnswer = rightAnswer.find((vote) => vote === answer.vote);
        if (toCheckAnswer) {
          const winner = game.players.find((player) => player.id === answer.id);
          if (winner) {
            winner.points = winner.points + 1;
            console.log(`${winner.name} now has ${winner.points} points`);

            //Return users with points
            console.log("sending winner id", winner.id);
            io.to(game.host).emit("winner", winner.id);
          }
        }
      });
    });

    //Return data
    generateQuestion(game);
    io.to(game.host).emit("game", game);
    io.to(game.host).emit("roundEnded", true);
    io.to(game.host).emit("rightAnswers", rightAnswers);
    toPlayers(game, "game", game);
  }
};

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
      games.push({
        host: socket.id,
        code: code,
        players: [],
        pastQuestions: [],
        answers: [],
      });
      console.log(games);
      io.to(socket.id).emit("check", code);
    } else {
      console.log("game already exists");
    }
  });

  socket.on("onStart", (host) => {
    console.log("game started");
    const currentGame = games.find((game) => game.host === host);

    //Set game as active
    currentGame.active = true;

    //Generate a question
    generateQuestion(currentGame);

    //Inform host that the game has started
    io.to(currentGame.host).emit("game", currentGame);

    //Inform players that the game has started
    toPlayers(currentGame, "game", currentGame);
  });

  socket.on("answer", (data) => {
    let currentGame = games.find((game) => game.host === data[0].host);

    const answerData = data[1];

    currentGame.answers.push(answerData);
    checkAnswers(currentGame);
  });
});

app.use(express.static("public"));

server.listen(port, () => {
  console.log(`App listening on port ${port}!`);
});
