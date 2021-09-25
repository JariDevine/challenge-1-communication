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

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:80/");

    socketRef.current.on("connect", () => {
      console.log(socketRef.current.id);
    });

    //receives if game started
    socketRef.current.on("game", (game) => {
      console.log("game data received");
      console.log(game);
      setGame(game);
    });

    //receives check (if player joined or game started)
    socketRef.current.on("check", (code) => {
      console.log("game data received");
      setInGame(code);
    });
  }, []);

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
      };
      socketRef.current.emit("player", player);
      setNameInput("");
      setPlayerCodeInput("");
      console.log("player sent:", player);
    }
  };

  const onSubmitHost = (event) => {
    event.preventDefault();
    console.log("set up game with code: ", gameCodeInput);
    if (gameCodeInput !== "") {
      socketRef.current.emit("code", gameCodeInput);
    }
  };

  const startGame = () => {
    socketRef.current.emit("onStart", game.host);
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
          ) : (
            <p>Waiting for host to start</p>
          )}
          {game.active ? <p>Game started</p> : null}
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
              <h3>Start game</h3>
              <h4>Code: {inGame}</h4>
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
          ) : (
            <p>Game started</p>
          )}
        </>
      ) : null}
    </div>
  );
}

export default App;
