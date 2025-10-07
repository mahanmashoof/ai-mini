import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");

  const askAI = async () => {
    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: input }],
      },
      {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}` },
      }
    );
    setResponse(res.data.choices[0].message.content);
  };

  return (
    <div className="App">
      <h1>Hello AI</h1>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={askAI}>Ask</button>
      <p>{response}</p>
    </div>
  );
}

export default App;
