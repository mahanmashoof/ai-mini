interface AnalyzeRequest {
  method?: string;
  body: {
    password: string;
    data: unknown[];
    question?: string;
  };
}

interface AnalyzeResponse {
  status: (code: number) => AnalyzeResponse;
  json: (data: unknown) => void;
  end: () => void;
}

export default async function handler(
  req: AnalyzeRequest,
  res: AnalyzeResponse
) {
  if (req.method !== "POST") return res.status(405).end();
  const { password, data, question } = req.body;

  if (password !== process.env.ACCESS_PASSWORD)
    return res.status(401).json({ error: "Unauthorized" });

  const completion = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a data analyst." },
        {
          role: "user",
          content: `Dataset: ${JSON.stringify(data.slice(0, 50))}
                    Question: ${question || "Describe trends."}`,
        },
      ],
    }),
  });
  const json = await completion.json();
  res.status(200).json({ answer: json.choices[0].message.content });
}
