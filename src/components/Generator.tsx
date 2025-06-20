"use client";

import { useState } from 'react';

export default function Generator() {
  const [prompt, setPrompt] = useState('');
  const [formula, setFormula] = useState('');
  const [explanation, setExplanation] = useState('');

  const handleGenerate = () => {
    // We will add AI logic here later
    console.log("Generating formula for:", prompt);

    // --- Placeholder Data ---
    setFormula('=SUMIF(A1:A10, "Sales", B1:B10)');
    setExplanation('This formula sums the values in the range B1:B10 where the corresponding value in the range A1:A10 is "Sales".');
    // --- End Placeholder Data ---
  };

  return (
    <div className="w-full max-w-3xl mt-12 bg-white p-8 rounded-xl shadow-lg">
      {/* Input Section */}
      <div className="flex flex-col">
        <label htmlFor="prompt-input" className="text-gray-700 font-medium">
          Describe what you want to calculate:
        </label>
        <textarea
          id="prompt-input"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Sum all sales from the 'East' region in column C"
          className="mt-2 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={handleGenerate}
          className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
        >
          Generate Formula
        </button>
      </div>

      {/* Output Section */}
      {formula && (
        <div className="mt-8">
          {/* Formula Output */}
          <div className="mb-6">
            <h3 className="text-gray-700 font-medium">Generated Formula:</h3>
            <div className="mt-2 p-3 bg-gray-100 rounded-md flex items-center justify-between">
              <pre className="text-gray-800 whitespace-pre-wrap"><code>{formula}</code></pre>
              <button className="text-gray-500 hover:text-gray-800">Copy</button>
            </div>
          </div>

          {/* Explanation Output */}
          <div>
            <h3 className="text-gray-700 font-medium">Explanation:</h3>
            <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-gray-800">{explanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 