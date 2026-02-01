
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
    const updatedContext: VehicleContext = {
      vehicleType: formData.get('vehicleType') as '2W' | '4W',
      brand: formData.get('brand') as string,
      model: formData.get('model') as string,
      year: formData.get('year') as string,
      fuelType: formData.get('fuelType') as string,
    };
    onUpdateContext?.(updatedContext);
  };

  const formatPriceRanges = (text: string) => {
    const rangeRegex = /((\d+[\d,]*)\s*(?:-|to)\s*(\d+[\d,]*))/gi;
    const parts = text.split(rangeRegex);
    return parts.map((part, i) => {
      if (part.match(/^(\d+[\d,]*)\s*(?:-|to)\s*(\d+[\d,]*)$/i)) {
        return (
          <span key={i} className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#f18a22]/10 border border-[#f18a22]/30 rounded text-[#f18a22] font-black text-[11px] shadow-[0_0_10px_rgba(241,138,34,0.1)] mx-0.5 group/range">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {part}
            <span className="text-[7px] opacity-60 uppercase tracking-tighter">(Est. Range)</span>
          </span>
        );
      }
      return part;
    });
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={i} className="h-2"></div>;
      
      const mainPointerMatch = trimmedLine.match(/^\d+\.\s+(.*)/);
      if (mainPointerMatch) {
        const title = mainPointerMatch[1];
        
        // Custom branding for technical search results
        const isPartSearch = title.toLowerCase().includes('part') || 
                             title.toLowerCase().includes('sourcing') || 
                             title.toLowerCase().includes('oem') ||
                             title.toLowerCase().includes('inventory');

        const isRecall = title.toLowerCase().includes('recall alert') || 
                         title.toLowerCase().includes('common reported issues');

        if (isRecall) {
          const isCritical = title.toLowerCase().includes('recall');
          return (
            <div key={i} className={`flex items-center gap-2 mt-6 mb-3 p-4 ${isCritical ? 'bg-red-600/15 border-red-500/50' : 'bg-amber-600/10 border-amber-500/30'} border-2 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.1)]`}>
              <div className={`p-2 rounded-lg ${isCritical ? 'bg-red-600' : 'bg-amber-500'}`}>
                <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
                  {isCritical ? 'High-Priority Safety Scan' : 'Market Intelligence Pattern'}
                </span>
                <span className="text-white font-black text-sm uppercase tracking-tight">{title}</span>
              </div>
            </div>
          );
        }

        if (isPartSearch) {
          return (
            <div key={i} className="flex items-center gap-3 mt-8 mb-4 p-4 bg-blue-600/10 border-blue-500/40 border-2 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.1)]">
              <div className="p-2.5 rounded-lg bg-blue-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-400">Inventory & Sourcing Audit</span>
                <span className="text-white font-black text-base uppercase tracking-tight">{title}</span>
              </div>
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

        return (
          <div key={i} className="mt-8 mb-4 group/section">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-[#f18a22] rounded-full shadow-[0_0_10px_#f18a22]"></div>
              <span className="text-[#f18a22] font-black text-sm uppercase tracking-[0.15em] group-hover/section:tracking-[0.2em] transition-all">{title}</span>
            </div>
            <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-zinc-800 via-zinc-900 to-transparent"></div>
          </div>
        );
      }
      
      const subPointerMatch = trimmedLine.match(/^[a-z]\.\s+(.*)/);
      if (subPointerMatch) {
        return (
          <div key={i} className="ml-5 mb-3 flex items-start gap-3 group/subpoint">
            <span className="text-[#f18a22] font-black text-[11px] mt-1 shrink-0 opacity-60 group-hover/subpoint:opacity-100 transition-opacity">{trimmedLine.split('.')[0]}.</span>
            <span className="text-zinc-300 text-sm leading-relaxed tracking-wide">
              {formatPriceRanges(subPointerMatch[1])}
            </span>
          </div>
        );
      }
      return <div key={i} className="mb-3 text-sm text-zinc-300 leading-relaxed font-medium pl-5">{formatPriceRanges(trimmedLine)}</div>;
    });
  };

  const displayContent = isAi ? (message.response_content?.visual_text || message.content) : message.content;
  const showContextForm = isAi && message.id === 'welcome' && vehicleContext && !isContextComplete(vehicleContext);
  const showOrangeBorder = isAi && message.ui_triggers?.show_orange_border;

  const renderVisualAssets = () => {
    if (!message.visual_assets) return null;
    const { vehicle_display_query, part_display_query } = message.visual_assets;
    return (
      <div className="mt-8 flex flex-col gap-6">
        {vehicle_display_query && !part_display_query && (
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] shadow-2xl transition-all hover:border-[#f18a22]/30">
            <div className="h-48 md:h-64 w-full bg-zinc-900/50 relative overflow-hidden">
               <img src={`https://source.unsplash.com/featured/?${encodeURIComponent(vehicle_display_query)}`} alt={vehicle_display_query} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1000'; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
            </div>
            <div className="p-4 relative">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-[#f18a22] uppercase tracking-widest">Diagnostic Profile</span>
                <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                <span className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Visual Asset</span>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-tight">{vehicle_display_query}</h4>
            </div>
          </div>
        )}
        {part_display_query && (
           <div className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-[#0A0C14] flex flex-col md:flex-row items-stretch gap-0 transition-all hover:border-blue-500/60 shadow-xl">
             <div className="w-full md:w-48 h-48 bg-zinc-900 overflow-hidden shrink-0 relative">
                <img src={`https://source.unsplash.com/featured/?${encodeURIComponent(part_display_query + ' automobile part')}`} alt={part_display_query} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=400'; }} />
                <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 rounded text-[8px] font-black text-white uppercase tracking-widest shadow-lg">Part Found</div>
             </div>
             <div className="flex flex-col p-6 justify-center bg-gradient-to-br from-transparent to-blue-900/10">
               <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                 <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                 Component Profile
               </span>
               <h5 className="text-xl font-black text-white uppercase tracking-tight leading-tight">{part_display_query}</h5>
               <div className="mt-4 flex flex-wrap gap-2">
                 <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[8px] font-black text-zinc-400 uppercase tracking-widest">Technical Spec Verified</span>
                 <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-[8px] font-black text-zinc-400 uppercase tracking-widest">OEM Compatibility: Checked</span>
               </div>
             </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-8 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[95%] md:max-w-[85%] p-6 md:p-8 rounded-2xl border shadow-2xl relative transition-all duration-500 ${isAi ? message.validationError ? 'bg-[#1a0a0a] border-red-900/50 text-zinc-100' : `bg-[#0A0A0A] ${showOrangeBorder ? 'border-[#f18a22]/50' : 'border-[#262626]'} text-zinc-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]` : 'bg-[#121212] border-[#f18a22]/30 text-zinc-100'}`}>
        {isAi && (
          <div className="absolute -top-3.5 -right-3.5 flex gap-2">
            {message.intelligenceMode === 'THINKING' && (
              <div className="text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-[0.1em] shadow-2xl ring-4 ring-black bg-purple-600 text-white flex items-center gap-2 animate-pulse">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                Expert Analysis
              </div>
            )}
            {message.response_content?.audio_text && (
              <button onClick={() => onPlayAudio?.(message.response_content!.audio_text)} className={`p-2.5 rounded-full ring-4 ring-black shadow-2xl transition-all ${isAudioPlaying ? 'bg-[#f18a22] animate-pulse scale-110' : 'bg-zinc-800 hover:bg-[#f18a22] hover:scale-110'}`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isAudioPlaying ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />}</svg>
              </button>
            )}
            <div className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-[0.1em] shadow-2xl ring-4 ring-black ${message.validationError ? 'bg-red-600' : 'bg-green-600'}`}>{message.validationError ? 'Audit Breach' : 'EKA Verified'}</div>
          </div>
        )}

        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
          <div className="flex items-center gap-4">
            {isAi ? (
              <>
                <div className={`w-8 h-8 ${message.validationError ? 'bg-red-600' : 'bg-[#f18a22]'} rounded-xl flex items-center justify-center text-sm font-black text-black shadow-lg ring-2 ring-white/5`}>e</div>
                <div className="flex flex-col">
                   <span className={`text-xs font-black uppercase tracking-[0.2em] ${message.validationError ? 'text-red-400' : 'text-[#f18a22]'}`}>EKA-Ai Service Advisor</span>
                   <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1 h-1 bg-zinc-700 rounded-full"></div>
                     Protocol Secured
                   </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Workshop Signal</span>
                <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Incoming Diagnostic Feed</span>
              </div>
            )}
          </div>
          <span className="text-[10px] text-zinc-600 font-mono font-bold bg-white/5 px-2.5 py-1 rounded-lg">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="whitespace-pre-wrap font-medium tracking-wide">
          {isAi ? renderContent(displayContent) : <div className="text-zinc-200 text-sm leading-relaxed italic border-l-2 border-zinc-800 pl-4 py-1">{displayContent}</div>}
        </div>

        {isAi && renderVisualAssets()}

        {isAi && message.grounding_urls && message.grounding_urls.length > 0 && (
          <div className="mt-10 pt-6 border-t border-white/5">
            <h5 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
              <span className="w-2 h-4 bg-zinc-800 rounded-sm"></span>
              Sourcing & Technical Documentation
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {message.grounding_urls.map((url, idx) => {
                const isPartSupplier = url.title.toLowerCase().includes('part') || 
                                       url.uri.toLowerCase().includes('oem') || 
                                       url.uri.toLowerCase().includes('supplier') ||
                                       url.uri.toLowerCase().includes('parts');
                return (
                  <a key={idx} href={url.uri} target="_blank" rel="noopener noreferrer" className={`text-[11px] px-5 py-4 bg-[#121212] border ${isPartSupplier ? 'border-blue-500/30 hover:border-blue-500 hover:bg-blue-600/5' : 'border-[#262626] hover:border-[#f18a22] hover:bg-[#f18a22]/5'} text-zinc-300 rounded-2xl font-bold transition-all flex items-center justify-between group shadow-lg`}>
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${isPartSupplier ? 'bg-blue-600/20 text-blue-400' : 'bg-zinc-800 text-zinc-500'}`}>
                        {isPartSupplier ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}</div>
                      <span className="truncate max-w-[120px] md:max-w-[200px]">{url.title}</span>
                    </div>
                    <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {showContextForm && (
          <form onSubmit={handleContextSubmit} className="mt-8 p-8 bg-black/40 border-2 border-[#f18a22]/30 rounded-3xl animate-in fade-in zoom-in duration-700 shadow-[inset_0_0_20px_rgba(241,138,34,0.1)]">
            <h4 className="text-[12px] font-black text-[#f18a22] uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f18a22] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#f18a22]"></span>
              </span>
              Critical: Context Sychronization
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Type</label><select name="vehicleType" required className="bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all hover:bg-black"><option value="">Select</option><option value="2W">2W</option><option value="4W">4W</option></select></div>
              <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Brand</label><input name="brand" required placeholder="Honda" className="bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all hover:bg-black" /></div>
              <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Model</label><input name="model" required placeholder="Civic" className="bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all hover:bg-black" /></div>
              <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Year</label><input name="year" required placeholder="2019" className="bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all hover:bg-black" /></div>
              <div className="flex flex-col gap-2"><label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Fuel</label><select name="fuelType" required className="bg-[#121212] border border-[#262626] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f18a22] transition-all hover:bg-black"><option value="Petrol">Petrol</option><option value="Diesel">Diesel</option><option value="Electric">Electric</option></select></div>
            </div>
            <button type="submit" className="mt-8 w-full py-4 bg-[#f18a22] text-black text-[13px] font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-[#e55c00] transition-all shadow-[0_15px_35px_-5px_rgba(229,92,0,0.4)] active:scale-95">Verify & Initialize Session</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
