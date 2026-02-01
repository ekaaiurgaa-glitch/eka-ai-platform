
import React from 'react';
import { Message, VehicleContext, isContextComplete } from '../types';

interface ChatMessageProps {
  message: Message;
  onPlayAudio?: (text: string) => void;
  isAudioPlaying?: boolean;
  vehicleContext?: VehicleContext;
  onUpdateContext?: (context: VehicleContext) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onPlayAudio, 
  isAudioPlaying, 
  vehicleContext,
  onUpdateContext 
}) => {
  const isAi = message.role === 'assistant';

  const handleContextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updated = {
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      year: formData.get('year') as string,
      fuelType: formData.get('fuelType') as string || (vehicleContext?.fuelType || ''),
    };
    if (onUpdateContext) onUpdateContext(updated);
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const priceRangeRegex = /((?:[\$₹£€]\s?)?\d+(?:,\d+)*(?:\.\d+)?\s*(?:to|-|and)\s*(?:[\$₹£€]\s?)?\d+(?:,\d+)*(?:\.\d+)?)/gi;

    return lines.map((line, i) => {
      const trimmedLine = line.trim();
      
      const mainPointerMatch = trimmedLine.match(/^\d+\.\s+(.*)/);
      if (mainPointerMatch) {
        const title = mainPointerMatch[1];
        
        if (title.toLowerCase().includes('dtc definition') || title.toLowerCase().includes('official recall alerts')) {
          const isRecall = title.toLowerCase().includes('recall');
          return (
            <div key={i} className={`flex items-center gap-2 mt-6 mb-3 p-3 ${isRecall ? 'bg-red-600/10 border-red-600/30' : 'bg-[#FF6600]/10 border-[#FF6600]/30'} border rounded-lg shadow-sm`}>
              <svg className={`w-5 h-5 ${isRecall ? 'text-red-500' : 'text-[#FF6600]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isRecall ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                )}
              </svg>
              <span className={`${isRecall ? 'text-red-500' : 'text-[#FF6600]'} font-black text-sm uppercase tracking-widest`}>{title}</span>
            </div>
          );
        }

        if (title.toUpperCase().includes('AUDIT ALERT') || title.toUpperCase().includes('SYSTEM ERROR')) {
          const isError = title.toUpperCase().includes('ERROR');
          return (
            <div key={i} className={`flex items-center gap-2 mt-4 mb-2 p-3 ${isError ? 'bg-orange-950/30 border-orange-500' : 'bg-red-950/30 border-red-500'} border-l-4 rounded-md`}>
              <svg className={`w-5 h-5 ${isError ? 'text-orange-500' : 'text-red-500'} shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className={`text-xs font-black ${isError ? 'text-orange-400' : 'text-red-400'} uppercase tracking-widest`}>{title}</span>
            </div>
          );
        }

        return <div key={i} className="text-[#FF6600] font-black text-xs uppercase tracking-wider mt-6 mb-2 border-b border-[#262626] pb-1">{line}</div>;
      }

      const subPointerMatch = trimmedLine.match(/^[a-z]\.\s+(.*)/);
      if (subPointerMatch) {
        return (
          <div key={i} className="ml-4 mb-2 flex items-start gap-2">
            <span className="text-[#FF6600] font-bold text-xs mt-0.5">•</span>
            <span className="text-zinc-300 text-sm leading-relaxed">{subPointerMatch[1]}</span>
          </div>
        );
      }

      const riskMatch = trimmedLine.match(/Risk Level:\s*(Low|Medium|High)/i);
      if (riskMatch) {
        const level = riskMatch[1].toLowerCase();
        let color = 'text-green-500';
        if (level === 'medium') color = 'text-yellow-500';
        if (level === 'high') color = 'text-red-500';
        return <div key={i} className={`font-black text-xs uppercase tracking-widest mt-4 ${color}`}>{line}</div>;
      }

      if (line.includes('Exact pricing is governed externally') || line.includes('Pricing Firewall')) {
        return (
          <div key={i} className="my-6 p-5 bg-amber-950/20 border-2 border-dashed border-amber-600/50 rounded-xl shadow-inner">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-black text-amber-500 uppercase tracking-[0.2em]">Governance: Pricing Firewall</span>
            </div>
            <p className="text-sm font-medium text-amber-100/90 italic leading-relaxed">{line}</p>
          </div>
        );
      }

      if (line.match(priceRangeRegex)) {
        const parts = line.split(priceRangeRegex);
        return (
          <div key={i} className="mb-2 text-sm text-zinc-300 leading-relaxed">
            {parts.map((part, index) => {
              if (part.match(priceRangeRegex)) {
                return (
                  <span key={index} className="inline-flex flex-col items-center gap-0.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded mx-1 align-middle">
                    <span className="text-amber-400 font-black text-base tracking-tight">{part}</span>
                    <span className="text-[7px] bg-amber-500 text-black px-1.5 py-0 rounded-sm font-black uppercase tracking-tighter">NON-BINDING ESTIMATE</span>
                  </span>
                );
              }
              return <span key={index}>{part}</span>;
            })}
          </div>
        );
      }

      return <div key={i} className="mb-2 text-sm text-zinc-300 leading-relaxed">{line}</div>;
    });
  };

  const displayContent = isAi ? (message.response_content?.visual_text || message.content) : message.content;
  const showContextForm = isAi && message.id === 'welcome' && vehicleContext && !isContextComplete(vehicleContext);
  const showOrangeBorder = isAi && message.ui_triggers?.show_orange_border;

  // Visual Assets Display
  const renderVisualAssets = () => {
    if (!message.visual_assets) return null;
    const { vehicle_display_query, part_display_query } = message.visual_assets;
    
    return (
      <div className="mt-8 flex flex-col gap-6">
        {vehicle_display_query && (
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl transition-all hover:border-[#FF6600]/30">
            <div className="aspect-[16/9] w-full bg-zinc-900/50 relative overflow-hidden">
               <img 
                 src={`https://source.unsplash.com/featured/?${encodeURIComponent(vehicle_display_query)}`} 
                 alt={vehicle_display_query}
                 className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105"
                 onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000'; }}
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
            </div>
            <div className="p-4 relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-[#FF6600] uppercase tracking-widest">Reference Profile</span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Visual Identity</span>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">{vehicle_display_query}</h4>
            </div>
          </div>
        )}

        {part_display_query && (
           <div className="group relative overflow-hidden rounded-xl border border-white/5 bg-[#121212] flex items-center p-4 gap-4 transition-all hover:border-[#FF6600]/20">
             <div className="w-16 h-16 rounded-lg bg-zinc-900 overflow-hidden shrink-0 border border-white/5">
                <img 
                  src={`https://source.unsplash.com/featured/?${encodeURIComponent(part_display_query)}`} 
                  alt={part_display_query}
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=400'; }}
                />
             </div>
             <div className="flex flex-col">
               <span className="text-[8px] font-black text-[#FF6600] uppercase tracking-widest mb-0.5">Component Scan</span>
               <h5 className="text-xs font-black text-white uppercase tracking-tight">{part_display_query}</h5>
             </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-8 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div 
        className={`max-w-[92%] md:max-w-[85%] p-6 rounded-2xl border shadow-2xl relative transition-all duration-300 ${
          isAi 
            ? message.validationError 
              ? 'bg-[#1a0a0a] border-red-900/50 text-zinc-100' 
              : `bg-[#0A0A0A] ${showOrangeBorder ? 'border-[#FF6600]' : 'border-[#262626]'} text-zinc-100` 
            : 'bg-[#121212] border-[#FF6600] text-zinc-100'
        }`}
      >
        {isAi && (
          <div className="absolute -top-3 -right-3 flex gap-2">
            {message.response_content?.audio_text && (
              <button 
                onClick={() => onPlayAudio?.(message.response_content!.audio_text)}
                className={`p-2 rounded-full ring-4 ring-black shadow-2xl transition-all ${isAudioPlaying ? 'bg-[#FF6600] animate-pulse scale-110' : 'bg-zinc-800 hover:bg-[#FF6600] hover:scale-110'}`}
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isAudioPlaying ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  )}
                </svg>
              </button>
            )}
            <div className={`text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-[0.1em] shadow-2xl ring-4 ring-black ${message.validationError ? 'bg-red-600' : 'bg-green-600'}`}>
              {message.validationError ? 'Audit Breach' : 'Verified Output'}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
          <div className="flex items-center gap-3">
            {isAi ? (
              <>
                <div className={`w-6 h-6 ${message.validationError ? 'bg-red-600' : 'bg-[#FF6600]'} rounded-lg flex items-center justify-center text-[12px] font-black text-black shadow-md`}>E</div>
                <div className="flex flex-col">
                   <span className={`text-[11px] font-black uppercase tracking-widest ${message.validationError ? 'text-red-400' : 'text-[#FF6600]'}`}>EKA-Ai Agent</span>
                   <span className="text-[8px] text-zinc-500 font-bold uppercase">Automobile Intelligence</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col">
                <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">Diagnostic Request</span>
                <span className="text-[8px] text-zinc-600 font-bold uppercase">External Signal</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-zinc-600 font-mono font-bold bg-white/5 px-2 py-0.5 rounded">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="whitespace-pre-wrap font-medium">
          {isAi ? renderContent(displayContent) : <div className="text-zinc-200 text-sm leading-relaxed">{displayContent}</div>}
        </div>

        {isAi && renderVisualAssets()}

        {isAi && message.grounding_urls && message.grounding_urls.length > 0 && (
          <div className="mt-8 pt-4 border-t border-white/5">
            <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-3 flex items-center gap-2">
              <span className="w-1 h-3 bg-zinc-700"></span>
              Verified Technical Bulletins
            </h5>
            <div className="flex flex-wrap gap-2">
              {message.grounding_urls.map((url, idx) => (
                <a 
                  key={idx} 
                  href={url.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] px-3 py-1.5 bg-[#121212] border border-[#262626] text-zinc-400 hover:border-[#FF6600] hover:text-[#FF6600] rounded-md font-bold transition-all flex items-center gap-2 group"
                >
                  <svg className="w-3 h-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10 a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {url.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {showContextForm && (
          <form onSubmit={handleContextSubmit} className="mt-8 p-6 bg-black/60 border-2 border-[#FF6600]/20 rounded-2xl animate-in fade-in zoom-in duration-500 shadow-inner">
            <h4 className="text-[11px] font-black text-[#FF6600] uppercase tracking-[0.25em] mb-6 flex items-center gap-3">
              <span className="w-2 h-2 bg-[#FF6600] rounded-full shadow-[0_0_8px_#FF6600]"></span>
              Critical: Context Lock Required
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Brand</label>
                <input name="brand" required placeholder="e.g. Honda" className="bg-[#121212] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/30 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Model</label>
                <input name="model" required placeholder="e.g. Civic" className="bg-[#121212] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/30 transition-all" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Year</label>
                <input name="year" required placeholder="e.g. 2019" className="bg-[#121212] border border-[#262626] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#FF6600] focus:ring-1 focus:ring-[#FF6600]/30 transition-all" />
              </div>
            </div>
            <button type="submit" className="mt-6 w-full py-3 bg-[#FF6600] text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-[#e55c00] active:scale-[0.98] transition-all shadow-xl">
              Initialize Context Synchronizer
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
