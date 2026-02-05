import React from 'react';
import DigitalClock from '../components/DigitalClock';

const ClockDemoPage = () => {
  return (
    <main className="flex-1 overflow-y-auto bg-[#000000] h-screen">
      <div className="max-w-7xl mx-auto px-8 py-12">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-white font-black text-4xl uppercase tracking-tight font-outfit mb-2">Digital Clock</h1>
          <p className="text-zinc-500 text-sm font-mono">Real-time display of multiple timezones</p>
        </div>

        {/* Clock Component */}
        <DigitalClock />

      </div>
    </main>
  );
};

export default ClockDemoPage;
