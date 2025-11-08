import axios from "axios";

/**
 * Fetches AI summary analysis of the dataset
 */
export const fetchAiDataSummary = async (
  data: Record<string, string | number>[],
  selectedXAxis: string,
  selectedKey: string
): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_KEY || "";

  if (!apiKey) {
    throw new Error(
      "OpenAI API Key is missing. Check your environment configuration."
    );
  }

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a concise data analyst. Analyze the provided JSON statistics from a survey on digital well-being. Summarize the most essential parts of the analysis in one sentence.",
        },
        {
          role: "user",
          content: `Analyze the data focusing on the relationship between ${selectedXAxis.replace(
            /_/g,
            " "
          )} and ${selectedKey.replace(
            /_/g,
            " "
          )}. Summarize key trends and patterns: ${JSON.stringify(
            data,
            null,
            2
          )}`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0]?.message?.content || "No summary generated.";
};

/**
 * Asks a custom question about the dataset
 */
export const askAiQuestion = async (
  question: string,
  data: Record<string, string | number>[]
): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_KEY || "";

  if (!apiKey) {
    throw new Error(
      "OpenAI API Key is missing. Check your environment configuration."
    );
  }

  const res = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful data analyst. Answer questions about the provided dataset in maximum 2 phrases. Be extremely concise and direct.",
        },
        {
          role: "user",
          content: `Dataset: ${JSON.stringify(data.slice(0, 50))}
                    
Question: ${question}`,
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return res.data.choices[0]?.message?.content || "No answer generated.";
};
