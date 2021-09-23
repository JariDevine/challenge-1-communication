import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

function App() {
  const socketRef = useRef();
  const [nameInput, setNameInput] = useState("");
  const [playerCodeInput, setPlayerCodeInput] = useState("");
  const [gameCodeInput, setGameCodeInput] = useState("");

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:80/");

    socketRef.current.on("connect", () => {
      console.log(socketRef.current.id);
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
      setGameCodeInput("");
    }
  };

  return (
    <div className="App">
      <h1>Welcome to the app!</h1>
      <h2>User form</h2>
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

      <h2>Host form</h2>
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
    </div>
  );
}

export default App;
