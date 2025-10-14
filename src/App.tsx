import { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!input.trim()) return;
    try {
      setLoading(true);
      setResponse("");
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a polite assistant that improves form messages for clarity and tone.",
            },
            {
              role: "user",
              content: `Give a very brief, concise, and constructive feedback for this message: ${input}`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
          },
        }
      );
      setResponse(res.data.choices[0].message.content || "");
    } catch (err) {
      console.error(err);
      setResponse("Error: failed to get response. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app">
      <div className="container">
        <header className="header">
          <h1>Refine with AI</h1>
          <p>Polish your message with concise, constructive feedback.</p>
        </header>
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            askAI();
          }}
        >
          <div className="input-group">
            <label htmlFor="input" className="label">
              Your Message
            </label>
            <textarea
              id="input"
              className="textarea input-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or write your message here..."
              rows={6}
              disabled={loading}
              required
            />
          </div>
          <div className="actions">
            <button
              type="submit"
              className="button"
              disabled={loading || !input.trim()}
            >
              {loading ? "Thinking..." : "Refine Message"}
            </button>
            {loading && <div className="spinner" aria-hidden="true"></div>}
          </div>
        </form>
        <div className="output-group">
          <label htmlFor="output" className="label">
            AI Response
          </label>
          <textarea
            id="output"
            className="textarea output-textarea"
            value={response}
            readOnly
            placeholder="AI response will appear here."
            rows={6}
          />
        </div>
      </div>
    </main>
  );
}

export default App;
