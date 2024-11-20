'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export default function DomainInfoGenerator() {
  const [domainField, setDomainField] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setOutput(''); // Clear previous output
    setLoading(true); // Set loading state

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: domainField }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let jsonString = ''; // To handle JSON array chunks

      while (!done) {
        const { value, done: streamDone } = await reader.read();
        done = streamDone;

        if (value) {
          jsonString += decoder.decode(value, { stream: true });

          try {
            // Parse each JSON chunk as it comes in
            const jsonChunk = JSON.parse(jsonString);
            setOutput((prevOutput) => prevOutput + JSON.stringify(jsonChunk, null, 2) + '\n\n');
            jsonString = ''; // Reset the buffer for the next chunk
          } catch (err) {
            // Keep accumulating until we have a full JSON object
          }
        }
      }
    } catch (error) {
      setOutput('Error fetching domain information');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>AI Domain Information Generator</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="domainField">Enter Field of Domain</label>
        <input
          type="text"
          id="domainField"
          value={domainField}
          onChange={(e) => setDomainField(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Generating...' : 'Generate Information'}
        </button>
      </form>
      <div>
        <h2>Generated Domain Information</h2>
        <ReactMarkdown>{'```json\n' + output + '\n```'}</ReactMarkdown>
      </div>
    </div>
  );
}
