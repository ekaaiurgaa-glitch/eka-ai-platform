import React, { useMemo } from 'react';

interface StartScreenProps {
  onOptionSelect: (text: string) => void;
  username?: string;
}

const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Good Morning From Go4Garage Family";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon From Go4Garage Family";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening From Go4Garage Family";
  } else {
    return "Good Night From Go4Garage Family";
  }
};

const StartScreen: React.FC<StartScreenProps> = ({ onOptionSelect, username = "Technician" }) => {
  const greeting = useMemo(() => getTimeBasedGreeting(), []);
  
  const options = [
    {
      title: "Calculate MG Value", desc: "Contract validation & settlement logic",
      icon: <svg className="w-6 h-6 text-[#f18a22]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
    },
    {
      title: "Open New Job Card", desc: "Initiate workshop intake & diagnostics",
      icon: <svg className="w-6 h-6 text-[#f18a22]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
    },
    {
      title: "DTC Scanner", desc: "Analyze vehicle fault codes & symptoms",
      icon: <svg className="w-6 h-6 text-[#f18a22]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-12 text-left w-full pl-2">
        <h1 className="text-5xl md:text-6xl font-black mb-2 tracking-tight">
          <span className="bg-gradient-to-r from-[#f18a22] to-[#ffb366] bg-clip-text text-transparent">{greeting}</span>
        </h1>
        <p className="text-3xl text-zinc-600 font-medium">How can I assist the fleet today?</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {options.map((opt, idx) => (
          <button key={idx} onClick={() => onOptionSelect(opt.title)} className="group relative flex flex-col p-6 h-48 rounded-2xl bg-[#141414] border border-[#262626] hover:bg-[#1a1a1a] hover:border-[#f18a22] transition-all duration-300 text-left overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">{opt.icon}</div>
            <div className="mt-auto">
                <span className="p-2 mb-4 inline-block rounded-full bg-black border border-zinc-800 group-hover:border-[#f18a22] text-[#f18a22]">{opt.icon}</span>
                <h3 className="text-lg font-bold text-zinc-200 group-hover:text-white mb-1">{opt.title}</h3>
                <p className="text-xs text-zinc-500 group-hover:text-zinc-400">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
export default StartScreen;
