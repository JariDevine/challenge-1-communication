import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./App.css";

function App() {
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = io.connect("http://localhost:80/");

    socketRef.current.on("connect", () => {
      console.log("connected");
    });
  }, []);

  return (
    <div className="App">
      <h1>Welcome to the app!</h1>
    </div>
  );
}

export default App;
