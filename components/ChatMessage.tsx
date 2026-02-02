
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

  const formatTechnicalTags = (text: string) => {
    // Regex for Price Ranges
    const rangeRegex = /((\d+[\d,]*)\s*(?:-|to)\s*(\d+[\d,]*))/gi;
    // Regex for HSN Codes
    const hsnRegex = /(HSN:\s*\d+)/gi;
    // Regex for GST Tags
    const gstRegex = /(GST:\s*\d+%\s*\([^)]+\))/gi;

    let parts: (string | React.ReactNode)[] = [text];

    const applyRegex = (regex: RegExp, className: string, iconType: 'price' | 'hsn' | 'gst') => {
      let nextParts: (string | React.ReactNode)[] = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          nextParts.push(part);
          return;
        }
        const matches = part.split(regex);
        matches.forEach((subPart, i) => {
          if (subPart.match(regex)) {
            nextParts.push(
              <span key={`${iconType}-${i}`} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-black text-[10px] shadow-sm mx-0.5 group/tag ${className}`}>
                {iconType === 'price' && (
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2v-3M13 11l-4-4m0 4l4-4" />
                  </svg>
                )}
                {iconType === 'hsn' && (
                   <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                   </svg>
                )}
                {iconType === 'gst' && (
                   <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                )}
                {subPart}
              </span>
            );
          } else {
            nextParts.push(subPart);
          }
        });
      });
      parts = nextParts;
    };

    applyRegex(rangeRegex, "bg-[#f18a22]/10 border border-[#f18a22]/30 text-[#f18a22]", 'price');
    applyRegex(hsnRegex, "bg-blue-600/10 border border-blue-500/30 text-blue-400", 'hsn');
    applyRegex(gstRegex, "bg-green-600/10 border border-green-500/30 text-green-400", 'gst');

    return parts;
  };

  const renderGovernedLineItem = (line: string, index: number) => {
    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 3) return null;

    const [name, price, hsn, gst] = parts;

    return (
      <div key={`line-${index}`} className="group mb-3 bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden hover:border-[#f18a22]/30 transition-all flex flex-col sm:flex-row items-stretch sm:items-center">
        <div className="flex-1 p-4 border-b sm:border-b-0 sm:border-r border-zinc-800 bg-gradient-to-r from-zinc-900 to-transparent">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-1.5">
              <svg className="w-2 h-2 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
              EKA Compliance Verified
            </span>
          </div>
          <h6 className="text-white font-black text-sm uppercase tracking-tight">{name}</h6>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 p-4 bg-black/40">
          <div className="flex flex-col items-start min-w-[120px]">
            <span className="text-[7px] font-black text-[#f18a22] uppercase tracking-[0.2em] mb-0.5">Governed Estimate</span>
            <span className="text-xs font-black text-white">{price}</span>
          </div>
          
          <div className="h-8 w-[1px] bg-zinc-800 hidden sm:block"></div>

          <div className="flex flex-col items-start">
            <span className="text-[7px] font-black text-blue-400 uppercase tracking-[0.2em] mb-0.5">HSN Audit</span>
            <span className="text-[10px] font-black text-zinc-300 bg-blue-500/10 px-1.5 rounded">{hsn?.replace('HSN:', '').trim() || 'N/A'}</span>
          </div>

          <div className="flex flex-col items-start">
            <span className="text-[7px] font-black text-green-400 uppercase tracking-[0.2em] mb-0.5">GST Logic</span>
            <span className="text-[10px] font-black text-zinc-300 bg-green-500/10 px-1.5 rounded">{gst?.replace('GST:', '').trim() || 'N/A'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <div key={i} className="h-2"></div>;
      
      // High Voltage Warning Detection
      if (trimmedLine.toUpperCase().includes('WARNING: HIGH VOLTAGE SYSTEM')) {
        return (
          <div key={i} className="my-6 p-6 bg-red-600/10 border-2 border-red-500 rounded-2xl flex items-center gap-4 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-[11px] font-black text-red-500 uppercase tracking-[0.3em] block mb-1">HV Safety Protocol Active</span>
              <p className="text-white font-black text-sm uppercase leading-tight tracking-tight">{trimmedLine}</p>
            </div>
          </div>
        );
      }

      // Governed Estimate Line Item Detection (Pipe Delimited)
      if (trimmedLine.includes('|') && trimmedLine.includes('HSN:') && trimmedLine.includes('GST:')) {
        const lineItem = renderGovernedLineItem(trimmedLine, i);
        if (lineItem) return lineItem;
      }

      const mainPointerMatch = trimmedLine.match(/^\d+\.\s+(.*)/);
      if (mainPointerMatch) {
        const title = mainPointerMatch[1];
        
        const isComponentId = title.toLowerCase().includes('component') || 
                              title.toLowerCase().includes('specification') || 
                              title.toLowerCase().includes('technical');

        const isRecall = title.toLowerCase().includes('recall alert') || 
                         title.toLowerCase().includes('common reported issues');

        if (isRecall) {
          const isCritical = title.toLowerCase().includes('recall');
          return (
            <div key={i} className={`flex items-center gap-3 mt-8 mb-4 p-5 ${isCritical ? 'bg-red-600/10 border-red-500/40' : 'bg-amber-600/10 border-amber-500/30'} border-2 rounded-2xl shadow-[0_0_20px_rgba(239,68,68,0.1)]`}>
              <div className={`p-3 rounded-xl ${isCritical ? 'bg-red-600' : 'bg-amber-500'} shadow-lg`}>
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isCritical ? 'text-red-500' : 'text-amber-500'}`}>
                  {isCritical ? 'Critical Safety Audit' : 'Market Insight Pattern'}
                </span>
                <span className="text-white font-black text-base uppercase tracking-tight">{title}</span>
              </div>
            </div>
          );
        }

        if (isComponentId) {
          return (
            <div key={i} className="flex items-center gap-3 mt-8 mb-4 p-5 bg-blue-600/10 border-blue-500/40 border-2 rounded-2xl shadow-[0_0_25px_rgba(59,130,246,0.15)]">
              <div className="p-3 rounded-xl bg-blue-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Component Specification Profile</span>
                <span className="text-white font-black text-base uppercase tracking-tight">{title}</span>
              </div>
            </div>
          );
        }

        return (
          <div key={i} className="mt-8 mb-4 group/section">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-[#f18a22] rounded-full shadow-[0_0_10px_rgba(241,138,34,0.5)]"></div>
              <span className="text-[#f18a22] font-black text-sm uppercase tracking-[0.2em] group-hover/section:tracking-[0.25em] transition-all">{title}</span>
            </div>
            <div className="mt-2 h-[1px] w-full bg-gradient-to-r from-zinc-800 via-zinc-900 to-transparent"></div>
          </div>
        );
      }

      const subPointerMatch = trimmedLine.match(/^[a-z]\.\s+(.*)/);
      if (subPointerMatch) {
        return (
          <div key={i} className="ml-6 mb-3 flex items-start gap-4 group/subpoint">
            <span className="text-[#f18a22] font-black text-[12px] mt-1 shrink-0 opacity-70 group-hover/subpoint:opacity-100 transition-opacity">{trimmedLine.split('.')[0]}.</span>
            <span className="text-zinc-300 text-sm leading-relaxed tracking-wide">
              {formatTechnicalTags(subPointerMatch[1])}
            </span>
          </div>
        );
      }
      return <div key={i} className="mb-3 text-sm text-zinc-300 leading-relaxed font-medium pl-6">{formatTechnicalTags(trimmedLine)}</div>;
    });
  };

  const displayContent = isAi ? (message.response_content?.visual_text || message.content) : message.content;
  const showOrangeBorder = isAi && message.ui_triggers?.show_orange_border;

  const renderVisualAssets = () => {
    if (!message.visual_assets) return null;
    const { vehicle_display_query, part_display_query } = message.visual_assets;
    return (
      <div className="mt-10 flex flex-col gap-8">
        {vehicle_display_query && !part_display_query && (
          <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#0a0a0a] shadow-2xl transition-all hover:border-[#f18a22]/40">
            <div className="h-56 md:h-72 w-full bg-zinc-900/50 relative overflow-hidden">
               <img src={`https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200&q=${encodeURIComponent(vehicle_display_query)}`} alt={vehicle_display_query} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-110" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200'; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>
            </div>
            <div className="p-6 relative">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-[#f18a22] uppercase tracking-[0.3em]">Visual Ecosystem Identity</span>
                <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></div>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">G4G Central OS</span>
              </div>
              <h4 className="text-lg font-black text-white uppercase tracking-tight">{vehicle_display_query}</h4>
            </div>
          </div>
        )}
        {part_display_query && (
           <div className="group relative overflow-hidden rounded-3xl border border-blue-500/30 bg-[#0A0C14] flex flex-col md:flex-row items-stretch gap-0 transition-all hover:border-blue-500/60 shadow-[0_20px_50px_rgba(59,130,246,0.15)]">
             <div className="w-full md:w-56 h-56 bg-zinc-900 overflow-hidden shrink-0 relative">
                <img src={`https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80&w=600&q=${encodeURIComponent(part_display_query + ' automobile part')}`} alt={part_display_query} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-1000 group-hover:scale-125" onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&get=80&w=600'; }} />
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-blue-600/90 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest shadow-xl">Component Lock</div>
             </div>
             <div className="flex flex-col p-8 justify-center bg-gradient-to-br from-transparent to-blue-900/10">
               <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.4em] mb-3 flex items-center gap-2">
                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
                 Technical Profile
               </span>
               <h5 className="text-2xl font-black text-white uppercase tracking-tight leading-none mb-4">{part_display_query}</h5>
               <div className="flex flex-wrap gap-3">
                 <span className="px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-[9px] font-black text-zinc-400 uppercase tracking-widest">Inventory Checked</span>
                 <span className="px-3 py-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl text-[9px] font-black text-zinc-400 uppercase tracking-widest">HSN Verified</span>
               </div>
             </div>
           </div>
        )}
      </div>
    );
  };

  const renderGroundingLinks = () => {
    if (!message.grounding_links || message.grounding_links.length === 0) return null;
    return (
      <div className="mt-8 pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Supplier Sourcing (Search Grounded)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {message.grounding_links.map((link, idx) => (
            <a 
              key={idx} 
              href={link.uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group/link flex items-center justify-between p-3 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all"
            >
              <div className="flex flex-col overflow-hidden">
                <span className="text-white text-xs font-bold truncate pr-4">{link.title}</span>
                <span className="text-[9px] text-zinc-600 truncate opacity-60 group-hover/link:opacity-100 transition-opacity">{link.uri}</span>
              </div>
              <svg className="w-4 h-4 text-zinc-700 group-hover/link:text-blue-500 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`flex w-full mb-10 ${isAi ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[95%] md:max-w-[88%] p-8 md:p-10 rounded-3xl border shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] relative transition-all duration-500 ${isAi ? message.validationError ? 'bg-[#1a0a0a] border-red-900/50 text-zinc-100' : `bg-[#0A0A0A] ${showOrangeBorder ? 'border-[#f18a22]/50' : 'border-[#262626]'} text-zinc-100` : 'bg-[#121212] border-[#f18a22]/40 text-zinc-100'}`}>
        
        {isAi && (
          <div className="absolute -top-4 -right-4 flex gap-2.5">
            {message.intelligenceMode === 'THINKING' && (
              <div className="text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-[0.15em] shadow-2xl ring-4 ring-black bg-purple-600 text-white flex items-center gap-2 animate-pulse">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                Deep Reasoning
              </div>
            )}
            <div className={`text-[10px] px-5 py-2 rounded-full font-black uppercase tracking-[0.15em] shadow-2xl ring-4 ring-black ${message.validationError ? 'bg-red-600' : 'bg-green-600'}`}>{message.validationError ? 'OS Conflict' : 'Governance Verified'}</div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-5">
          <div className="flex items-center gap-5">
            {isAi ? (
              <>
                <div className={`w-10 h-10 ${message.validationError ? 'bg-red-600' : 'bg-[#f18a22]'} rounded-2xl flex items-center justify-center text-lg font-black text-black shadow-xl ring-2 ring-white/10`}>e</div>
                <div className="flex flex-col">
                   <span className={`text-sm font-black uppercase tracking-[0.25em] ${message.validationError ? 'text-red-400' : 'text-[#f18a22]'}`}>EKA-Ai Central OS</span>
                   <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                     <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></div>
                     Ecosystem Secure
                   </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-[0.25em] text-zinc-500">Workshop/Fleet Operator</span>
                <span className="text-[10px] text-zinc-700 font-bold uppercase tracking-widest">Inbound Governance signal</span>
              </div>
            )}
          </div>
          <span className="text-[11px] text-zinc-600 font-mono font-black bg-white/5 px-3 py-1.5 rounded-xl">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        
        <div className="whitespace-pre-wrap font-medium tracking-wide">
          {isAi ? renderContent(displayContent) : <div className="text-zinc-200 text-base leading-relaxed italic border-l-4 border-zinc-800 pl-6 py-2">{displayContent}</div>}
        </div>

        {isAi && renderVisualAssets()}
        {isAi && renderGroundingLinks()}
      </div>
    </div>
  );
};

export default ChatMessage;
