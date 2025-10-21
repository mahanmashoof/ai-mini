import { useState } from "react";
import axios from "axios";

function App() {
  const [input, setInput] = useState("");
  const [issues, setIssues] = useState("");
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const askAI = async () => {
    if (!input.trim()) return;
    try {
      setLoading(true);
      setIssues("");
      setAdvice("");
      const res = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a precise validator that reviews messages for completeness, tone, and clarity.",
            },
            {
              role: "user",
              content: `Validate this user message and respond in JSON:
    {
      "issues": [list of problems found],
      "advice": "how to fix or improve"
    }
    Message: ${input}`,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_OPENAI_KEY}`,
          },
        }
      );

      const content = res.data.choices[0].message.content || "";

      try {
        // Remove markdown code blocks if present
        const cleanedContent = content
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        const parsed = JSON.parse(cleanedContent);
        if (parsed.issues && Array.isArray(parsed.issues)) {
          setIssues(parsed.issues.join("\n• "));
        }
        if (parsed.advice) {
          setAdvice(parsed.advice);
        }
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        console.error("Raw content:", content);
        setIssues("Unable to parse response");
        setAdvice("Please try again");
      }
    } catch (err) {
      console.error(err);
      setIssues("Error occurred");
      setAdvice("Please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 space-y-6">
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Refine with AI
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Polish your message with concise, constructive feedback.
          </p>
        </header>

        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            askAI();
          }}
        >
          <div className="space-y-2">
            <label
              htmlFor="input"
              className="block text-sm font-semibold text-gray-700"
            >
              Your Message
            </label>
            <textarea
              id="input"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 resize-none text-gray-900 placeholder-gray-500 disabled:bg-gray-50 disabled:text-gray-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste or write your message here..."
              rows={5}
              disabled={loading}
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  <span>Refine Message</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Issues Section */}
        {issues.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="issues"
                className="block text-sm font-semibold text-red-700"
              >
                ⚠️ List of detected problems
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(issues || "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  } catch (e) {
                    console.error("Copy failed", e);
                  }
                }}
                disabled={!issues}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Copy issues to clipboard"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              id="issues"
              className="w-full px-4 py-3 border-2 border-red-200 rounded-xl bg-red-50 text-red-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all duration-200 resize-none"
              value={issues}
              readOnly
              placeholder="Issues found in your message will appear here."
              rows={3}
            />
          </div>
        )}

        {/* Advice Section */}
        {issues.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="advice"
                className="block text-sm font-semibold text-green-700"
              >
                💡 Advice for improvement
              </label>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(advice || "");
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  } catch (e) {
                    console.error("Copy failed", e);
                  }
                }}
                disabled={!advice}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                aria-label="Copy advice to clipboard"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              id="advice"
              className="w-full px-4 py-3 border-2 border-green-200 rounded-xl bg-green-50 text-green-800 focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-200 resize-none"
              value={advice}
              readOnly
              placeholder="Improvement advice will appear here."
              rows={3}
            />
          </div>
        ) : input.length === 0 ? null : (
          <div>✅ No issues found</div>
        )}
      </div>
    </main>
  );
}

export default App;
