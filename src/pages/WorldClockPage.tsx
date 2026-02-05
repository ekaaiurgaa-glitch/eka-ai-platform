import React from 'react';
import WorldClock from '../components/WorldClock';

const WorldClockPage = () => {
  return (
    <main className="flex-1 overflow-y-auto bg-[#000000] h-screen">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-outfit text-4xl font-black text-white uppercase tracking-tight mb-2">World Clock</h1>
          <p className="text-zinc-500 text-sm font-medium">Real-time global timezones for Go4Garage operations</p>
        </div>

        {/* World Clock Component */}
        <WorldClock />

        {/* Additional Info */}
        <div className="mt-8 p-4 bg-zinc-900/30 border border-zinc-800 rounded-lg">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest font-mono mb-2">Component Features</h3>
          <ul className="space-y-1 text-xs text-zinc-600 font-mono">
            <li>• Real-time updates every second</li>
            <li>• Support for multiple timezones (IANA standard)</li>
            <li>• 24-hour format by default</li>
            <li>• EKA-AI design system integration</li>
            <li>• Responsive grid layout</li>
            <li>• Primary timezone highlighting (IST for Go4Garage India)</li>
          </ul>
        </div>

      </div>
    </main>
  );
};

export default WorldClockPage;