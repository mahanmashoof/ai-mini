import React, { useState, useCallback, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";
import { convertDataTypes, sampleData, sortDataByKey } from "../helpers";

const AIDashboard = () => {
  const [data, setData] = useState<Record<string, string | number>[]>([]);
  const [rawData, setRawData] = useState<Record<string, string | number>[]>([]);
  const [dataKeys, setDataKeys] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [selectedXAxis, setSelectedXAxis] = useState<string>("");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
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
        const csvData = results.data as Record<string, string>[];
        const parsedData = convertDataTypes(csvData);

        setRawData(parsedData); // Store unsorted data

        // Extract keys from first data entry, excluding User_ID
        if (parsedData.length > 0) {
          const keys = Object.keys(parsedData[0]).filter(
            (key) => key.toLowerCase() !== "user_id"
          );
          setDataKeys(keys);
          const firstKey = keys[0] || "";
          setSelectedKey(firstKey);
          setSelectedXAxis(firstKey);
        }
      },
      error: (error) => {
        setAiError(`CSV Parsing Error: ${error.message}`);
      },
    });
  };

  // Memoize sorted and sampled data for performance
  const displayData = useMemo(() => {
    if (rawData.length === 0 || !selectedXAxis) return [];

    const sorted = sortDataByKey(rawData, selectedXAxis);
    const sampled = sampleData(sorted, 100); // Limit to 100 points

    return sampled;
  }, [selectedXAxis, rawData]);

  // Update data state when displayData changes
  useEffect(() => {
    setData(displayData);
  }, [displayData]);

  // Helper to render different chart types (memoized for performance)
  const renderChart = useMemo(() => {
    if (chartType === "bar") {
      return (
        <BarChart data={data}>
          <XAxis
            dataKey={selectedXAxis}
            stroke="#6366f1"
            height={70}
            label={{
              value: selectedXAxis.replace(/_/g, " "),
              position: "insideBottom",
              offset: 0,
              className: "hidden lg:block",
            }}
          />
          <YAxis
            stroke="#6366f1"
            width={80}
            className="hidden lg:block"
            label={{
              value: selectedKey.replace(/_/g, " "),
              angle: -90,
              position: "insideLeft",
              className: "hidden lg:block",
            }}
          />
          <YAxis stroke="#6366f1" width={20} className="lg:hidden" />
          <Tooltip
            formatter={(value, name) => [value, name]}
            labelFormatter={(label) =>
              `${selectedXAxis.replace(/_/g, " ")}: ${label}`
            }
          />
          <Bar
            dataKey={selectedKey}
            fill="#3b82f6"
            name={selectedKey.replace(/_/g, " ")}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      );
    }

    if (chartType === "line") {
      return (
        <LineChart data={data}>
          <XAxis
            dataKey={selectedXAxis}
            stroke="#6366f1"
            height={70}
            label={{
              value: selectedXAxis.replace(/_/g, " "),
              position: "insideBottom",
              offset: 0,
              className: "hidden lg:block",
            }}
          />
          <YAxis
            stroke="#6366f1"
            width={80}
            className="hidden lg:block"
            label={{
              value: selectedKey.replace(/_/g, " "),
              angle: -90,
              position: "insideLeft",
              className: "hidden lg:block",
            }}
          />
          <YAxis stroke="#6366f1" width={20} className="lg:hidden" />
          <Tooltip
            formatter={(value, name) => [value, name]}
            labelFormatter={(label) =>
              `${selectedXAxis.replace(/_/g, " ")}: ${label}`
            }
          />
          <Line
            type="monotone"
            dataKey={selectedKey}
            stroke="#8b5cf6"
            strokeWidth={2}
            name={selectedKey.replace(/_/g, " ")}
            dot={{ fill: "#8b5cf6", r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      );
    }

    return null;
  }, [chartType, data, selectedXAxis, selectedKey]);

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
  }, [data, selectedKey, selectedXAxis]);

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
          <div className="lg:col-span-1 mb-8 lg:mb-0 flex flex-col">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Visualization:
                </h2>
                {rawData.length > 100 && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Showing {data.length} of {rawData.length} points
                  </span>
                )}
              </div>
              {dataKeys.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={chartType}
                    onChange={(e) =>
                      setChartType(e.target.value as "bar" | "line")
                    }
                    className="px-3 py-2 rounded-lg border-2 border-purple-300 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer text-sm"
                    title="Chart Type"
                  >
                    <option value="bar">📊 Bar Chart</option>
                    <option value="line">📈 Line Chart</option>
                  </select>
                  <div>
                    <select
                      value={selectedXAxis}
                      onChange={(e) => setSelectedXAxis(e.target.value)}
                      className="px-3 py-2 mr-2 rounded-lg border-2 border-green-300 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer text-sm"
                      title="X-axis"
                    >
                      {dataKeys.map((key) => (
                        <option key={key} value={key}>
                          X: {key.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedKey}
                      onChange={(e) => setSelectedKey(e.target.value)}
                      className="px-3 py-2 rounded-lg border-2 border-indigo-300 bg-white text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer text-sm"
                      title="Y-axis"
                    >
                      {dataKeys.map((key) => (
                        <option key={key} value={key}>
                          Y: {key.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            {data.length > 0 ? (
              <div className="flex-1 w-full bg-white p-4 rounded-lg shadow-inner border border-gray-200 lg:min-h-[32rem]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={0}
                  minHeight={400}
                >
                  {renderChart}
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex-1 text-center p-10 bg-gray-100 rounded-lg text-gray-500 shadow-inner lg:min-h-[32rem] flex items-center justify-center">
                Upload a CSV file to see the chart.
              </div>
            )}
          </div>

          <div className="lg:col-span-1 flex flex-col">
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

            <div className="flex-1 bg-indigo-50 p-6 rounded-lg border border-indigo-200 shadow-md flex flex-col lg:min-h-[32rem]">
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
