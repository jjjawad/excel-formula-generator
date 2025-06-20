"use client";

import { useState } from 'react';

interface GeneratorProps {
  onGenerationSuccess: () => void;
}

export default function Generator({ onGenerationSuccess }: GeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [formula, setFormula] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a description first.');
      return;
    }

    // Reset state for a new request
    setIsLoading(true);
    setError('');
    setFormula('');
    setExplanation('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userPrompt: prompt }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Something went wrong');
      }

      const data = await response.json();
      setFormula(data.formula);
      setExplanation(data.explanation);
      onGenerationSuccess();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    // You can add a toast notification here later to show "Copied!"
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
          disabled={isLoading}
        />
        <button
          onClick={handleGenerate}
          className={`mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Generating...' : 'Generate Formula'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Output Section */}
      {!isLoading && formula && (
        <div className="mt-8 animate-fade-in">
          {/* Formula Output */}
          <div className="mb-6">
            <h3 className="text-gray-700 font-medium">Generated Formula:</h3>
            <div className="mt-2 p-3 bg-gray-100 rounded-md flex items-center justify-between">
              <pre className="text-gray-800 whitespace-pre-wrap"><code>{formula}</code></pre>
              <button 
                onClick={() => handleCopy(formula)}
                className="text-gray-500 hover:text-gray-800 p-1"
              >
                Copy
              </button>
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