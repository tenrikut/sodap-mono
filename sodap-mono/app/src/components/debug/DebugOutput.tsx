import React from 'react';

interface DebugOutputProps {
  title?: string;
  data: Record<string, unknown>;
}

const DebugOutput: React.FC<DebugOutputProps> = ({ title, data }) => {
  return (
    <div className="p-4 m-4 border border-orange-500 rounded bg-orange-50 text-black">
      {title && <h3 className="text-lg font-bold mb-2">{title}</h3>}
      <details className="whitespace-pre-wrap">
        <summary className="cursor-pointer text-gray-700">Show Debug Data</summary>
        <pre className="mt-2 p-2 bg-white rounded overflow-auto text-sm">
          {typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data)}
        </pre>
      </details>
    </div>
  );
};

export default DebugOutput;
