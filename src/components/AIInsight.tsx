'use client';

import { useState } from 'react';

export default function AIInsight() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error.message || 'API returned an error.');
      } else {
        setResponse(data.response || 'No response.');
      }
    } catch (err) {
      setError('Something went wrong while calling the AI API.');
    }

    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <textarea
        rows={4}
        className="w-full p-2 border rounded"
        placeholder="Ask AI a question (e.g. suggest resource allocation rules)..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        onClick={handleClick}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        disabled={loading}
      >
        {loading ? 'Thinking...' : 'Ask AI'}
      </button>

      {error && <p className="text-red-600 whitespace-pre-wrap">{error}</p>}
      {response && <p className="text-gray-800 whitespace-pre-wrap">{response}</p>}
    </div>
  );
}
