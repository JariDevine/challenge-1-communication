import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

function App() {
  const socketRef = useRef();
  //role select
  const [role, setRole] = useState("");

  //form input
  const [nameInput, setNameInput] = useState("");
  const [playerCodeInput, setPlayerCodeInput] = useState("");
  const [gameCodeInput, setGameCodeInput] = useState("");

  //game variables
  const [game, setGame] = useState("");
  const [inGame, setInGame] = useState("");
  const [question, setQuestion] = useState();
  const [scorers, setScorers] = useState([]);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:80/");

    socketRef.current.on("connect", () => {
      console.log(socketRef.current.id);
    });

    //receives if game started
    socketRef.current.on("game", (game) => {
      setGame(game);
      if (game.active === false) {
        setQuestion("");
        setScorers([]);
        setVoted(false);
      }
    });

    //receives check (if player joined or game started)
    socketRef.current.on("check", (code) => {
      setInGame(code);
    });

    //receives question
    socketRef.current.on("question", (question) => {
      setQuestion(question);
    });

    //receives update round
    socketRef.current.on("newRound", () => {
      setScorers([]);
      setVoted(false);
    });
  }, []);

  useEffect(() => {
    //receives player who scored point
    socketRef.current.on("winner", (winner) => {
      let temp = [...scorers];
      temp.push(winner);
      setScorers([...temp]);
    });
  }, [scorers]);

  const onSubmitPlayer = (event) => {
    event.preventDefault();
    if (
      nameInput ||
      nameInput.trim ||
      nameInput.trim().length !== 0 ||
      playerCodeInput ||
      playerCodeInput.trim ||
      playerCodeInput.trim().length !== 0
    ) {
      let player = {
        id: socketRef.current.id,
        name: nameInput,
        game: playerCodeInput,
        points: 0,
      };
      socketRef.current.emit("player", player);
      setNameInput("");
      setPlayerCodeInput("");
    }
  };

  const onSubmitHost = (event) => {
    event.preventDefault();
    if (gameCodeInput !== "") {
      socketRef.current.emit("code", gameCodeInput);
    }
  };

  const startGame = () => {
    socketRef.current.emit("onStart", game.host);
  };

  const submitAnswer = (vote, user, game) => {
    socketRef.current.emit("answer", [game, { id: user, vote: vote }]);
    setVoted(true);
  };

  const setNextQuestion = () => {
    socketRef.current.emit("next", game.host);
  };

  return (
    <div className="App">
      <h1>Who would 🤔</h1>
      <button onClick={() => setRole("host")}>Create room</button>
      <button onClick={() => setRole("player")}>Join room</button>

      {role === "player" ? (
        <>
          <h2>Player View</h2>
          {!inGame ? (
            <form onSubmit={onSubmitPlayer}>
              <label htmlFor="name">Username</label>
              <br />
              <input
                type="text"
                value={nameInput}
                onChange={(event) => {
                  setNameInput(event.target.value);
                }}
              />
              <br />
              <label htmlFor="name">Code</label>
              <br />
              <input
                type="text"
                value={playerCodeInput}
                onChange={(event) => {
                  setPlayerCodeInput(event.target.value);
                }}
              />
              <br />
              <button type="submit">Join</button>
            </form>
          ) : null}
          {game.active ? (
            !voted ? (
              game.players.map((player) => (
                <p
                  key={player.id}
                  onClick={() =>
                    submitAnswer(player.id, socketRef.current.id, game)
                  }
                >
                  {player.name}
                </p>
              ))
            ) : (
              <p>Waiting for other players to vote...</p>
            )
          ) : inGame ? (
            <p>Waiting for host to start...</p>
          ) : null}
        </>
      ) : null}
      {role === "host" ? (
        <>
          <h2>Host View</h2>
          {!inGame ? (
            <>
              <form onSubmit={onSubmitHost}>
                <label htmlFor="name">Code</label>
                <br />
                <input
                  type="text"
                  value={gameCodeInput}
                  onChange={(event) => {
                    setGameCodeInput(event.target.value);
                  }}
                />
                <br />
                <button type="submit">Host</button>
              </form>
            </>
          ) : !game.active ? (
            <>
              <h3>Code: {inGame}</h3>
              {game
                ? game.players.map((player) => (
                    <p key={player.id}>{player.name}</p>
                  ))
                : null}
              {game.playable ? (
                <button onClick={() => startGame()}>Host</button>
              ) : (
                <p>waiting for players...</p>
              )}
            </>
          ) : scorers.length === 0 ? (
            <p>{question}</p>
          ) : (
            <>
              {game.players.map((player) => (
                <>
                  <p key={player.id}>player: {player.name}</p>
                  <p>
                    voted for: {console.log(game)}
                    {console.log(game.answers)}
                    {game.answers.map((answer) => {
                      if (answer.id === player.id) {
                        let value = "";
                        game.players.forEach((player) => {
                          if (answer.vote === player.id) {
                            value = player.name;
                          }
                        });
                        return <strong>{value}</strong>;
                      } else {
                        return null;
                      }
                    })}
                  </p>
                  <p>
                    now has {player.points} points
                    {scorers.map((scorer) => {
                      if (scorer === player.id) {
                        return <strong> (+1)</strong>;
                      } else {
                        return null;
                      }
                    })}
                  </p>
                  <p>_________________</p>
                </>
              ))}
              <button onClick={() => setNextQuestion()}>Next question</button>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

export default App;
