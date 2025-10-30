import React, { useState, useCallback } from "react";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

interface DataPoint {
  User_ID: string;
  Age: string;
  Gender: string;
  "Daily_Screen_Time(hrs)": string;
  "Sleep_Quality(1-10)": string;
  "Stress_Level(1-10)": string;
  Days_Without_Social_Media: string;
  "Exercise_Frequency(week)": string;
  Social_Media_Platform: string;
  "Happiness_Index(1-10)": string;
}

//Todo:
//1. dropdown to select visualization A vs visualizations B
//2. params for AI to analyze focused on these aspects + give a solution

const AIDashboard = () => {
  const [data, setData] = useState<DataPoint[]>([]);
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(
      file.name
        .replace(".csv", "")
        .replace(/_/g, " ")
        .replace(/\s+\S+$/, "")
    );

    setData([]);
    setAiSummary("");
    setAiError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const typedData = results.data as DataPoint[];

        const sortedData = typedData.sort(
          (a, b) => Number(a.Age) - Number(b.Age)
        );

        setData(sortedData);
      },
      error: (error) => {
        setAiError(`CSV Parsing Error: ${error.message}`);
      },
    });
  };

  const fetchAiSummary = useCallback(async () => {
    if (data.length === 0) {
      setAiError("Please upload data first.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiSummary("");

    const apiKey = import.meta.env.VITE_OPENAI_KEY || "";

    if (!apiKey) {
      setAiError(
        "OpenAI API Key is missing. Check your environment configuration."
      );
      setAiLoading(false);
      return;
    }

    try {
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
              content: `Summarize the main trends and patterns in this aggregated data: ${JSON.stringify(
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

      const content =
        res.data.choices[0]?.message?.content || "No summary generated.";
      setAiSummary(content);
    } catch (e) {
      console.error("OpenAI API Error:", e);
      setAiError(
        "Failed to fetch AI summary. Check API key and network connection."
      );
    } finally {
      setAiLoading(false);
    }
  }, [data]);

  return (
    <div className="p-8 min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100">
      <div className="max-w-7xl mx-auto bg-white shadow-2xl rounded-xl p-8">
        <h1 className="text-3xl font-bold text-indigo-700 mb-8 flex items-center">
          <span className="text-2xl mr-3">📊</span> {fileName}
        </h1>
        <div className="mb-8 border-b pb-6">
          <label className="block text-lg font-medium text-gray-700 mb-3">
            Upload CSV Data File
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500
                       file:mr-4 file:py-2 file:px-4
                       file:rounded-full file:border-0
                       file:text-sm file:font-semibold
                       file:bg-indigo-50 file:text-indigo-700
                       hover:file:bg-indigo-100 cursor-pointer"
          />
        </div>
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-8">
          <div className="lg:col-span-1 mb-8 lg:mb-0">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Visualization: Screen Time by Age
            </h2>
            {data.length > 0 ? (
              <div className="h-96 w-full min-w-0 min-h-[24rem] bg-white p-4 rounded-lg shadow-inner border border-gray-200">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={0}
                >
                  <BarChart data={data}>
                    <XAxis
                      dataKey="Age"
                      stroke="#6366f1"
                      label={{ value: "Age", position: "bottom" }}
                    />
                    <YAxis
                      dataKey="Daily_Screen_Time(hrs)"
                      stroke="#6366f1"
                      label={{
                        value: "Screen Time (hrs)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => [`${value} hrs`, name]}
                      labelFormatter={(label) => `Age: ${label}`}
                    />
                    <Bar
                      dataKey="Daily_Screen_Time(hrs)"
                      fill="#3b82f6"
                      name="Daily Screen Time"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center p-10 bg-gray-100 rounded-lg text-gray-500 shadow-inner min-h-[24rem] flex items-center justify-center">
                Upload a CSV file to see the chart.
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
                <span className="text-xl mr-2">✨</span>
                AI Trend Analysis
              </h2>
              <button
                onClick={fetchAiSummary}
                disabled={data.length === 0 || aiLoading}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center
                  ${
                    data.length === 0 || aiLoading
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                  }`}
              >
                {aiLoading ? (
                  <>
                    <span className="mr-2 animate-spin">🌀</span> Analyzing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span> Generate Summary
                  </>
                )}
              </button>
            </div>

            <div className="min-h-[24rem] bg-indigo-50 p-6 rounded-lg border border-indigo-200 shadow-md flex flex-col justify-between">
              {aiError && (
                <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded flex items-center mb-4">
                  <span className="text-xl mr-2">⚠️</span>
                  {aiError}
                </div>
              )}
              {aiSummary ? (
                <p className="text-gray-800 whitespace-pre-wrap">{aiSummary}</p>
              ) : (
                !aiLoading &&
                !aiError && (
                  <p className="text-gray-500 italic">
                    Click "Generate Summary" to get an AI analysis of your
                    uploaded data.
                  </p>
                )
              )}
            </div>
          </div>
        </div>{" "}
      </div>
    </div>
  );
};

export default AIDashboard;
