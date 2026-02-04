import React from 'react';
import { JobStatus, JOB_CARD_LIFECYCLE_STATES, mapStatusToLifecycleState, JobCardLifecycleStatus } from '../types';

interface JobCardProgressProps {
  currentStatus: JobStatus;
  className?: string;
}

const JobCardProgress: React.FC<JobCardProgressProps> = ({ currentStatus, className = '' }) => {
  const lifecycleState = mapStatusToLifecycleState(currentStatus);
  const currentIndex = JOB_CARD_LIFECYCLE_STATES.findIndex(s => s.id === lifecycleState);
  
  const getStateStyle = (stateId: JobCardLifecycleStatus, index: number) => {
    const isCompleted = index < currentIndex;
    const isCurrent = stateId === lifecycleState;
    const isPending = index > currentIndex;
    
    if (isCurrent) {
      return {
        container: 'bg-[#f18a22] border-[#f18a22] shadow-[0_0_20px_rgba(241,138,34,0.4)]',
        text: 'text-black',
        dot: 'bg-black',
        line: 'bg-[#f18a22]'
      };
    }
    if (isCompleted) {
      return {
        container: 'bg-green-500/20 border-green-500',
        text: 'text-green-500',
        dot: 'bg-green-500',
        line: 'bg-green-500'
      };
    }
    return {
      container: 'bg-zinc-900 border-zinc-800',
      text: 'text-zinc-600',
      dot: 'bg-zinc-700',
      line: 'bg-zinc-800'
    };
  };

  return (
    <div className={`w-full bg-[#0a0a0a] border-b border-zinc-900 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Mobile view - compact */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
              Progress
            </span>
            <span className="text-[10px] font-black text-[#f18a22] uppercase tracking-wider font-mono">
              {currentIndex + 1} / {JOB_CARD_LIFECYCLE_STATES.length}
            </span>
          </div>
          <div className="relative h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 via-[#f18a22] to-[#f18a22] transition-all duration-500 rounded-full"
              style={{ width: `${((currentIndex + 1) / JOB_CARD_LIFECYCLE_STATES.length) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#f18a22] animate-pulse" />
            <span className="text-[11px] font-bold text-white uppercase font-mono">
              {JOB_CARD_LIFECYCLE_STATES[currentIndex]?.label || 'Unknown'}
            </span>
            <span className="text-[9px] text-zinc-500 font-mono">
              — {JOB_CARD_LIFECYCLE_STATES[currentIndex]?.description}
            </span>
          </div>
        </div>

        {/* Desktop view - full pipeline */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono">
              Job Card Lifecycle Pipeline
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-zinc-600 uppercase font-mono">
                Status:
              </span>
              <span className="text-[10px] font-black text-[#f18a22] uppercase tracking-wider font-mono bg-[#f18a22]/10 px-2 py-1 rounded border border-[#f18a22]/30">
                {currentStatus}
              </span>
            </div>
          </div>

          <div className="relative flex items-center justify-between">
            {JOB_CARD_LIFECYCLE_STATES.map((state, index) => {
              const style = getStateStyle(state.id, index);
              const isLast = index === JOB_CARD_LIFECYCLE_STATES.length - 1;
              
              return (
                <React.Fragment key={state.id}>
                  <div className="flex flex-col items-center relative group">
                    {/* State indicator */}
                    <div 
                      className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all duration-300 ${style.container}`}
                    >
                      {index < currentIndex ? (
                        <svg className={`w-4 h-4 ${style.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className={`text-[10px] font-black font-mono ${style.text}`}>
                          {index + 1}
                        </span>
                      )}
                    </div>
                    
                    {/* State label */}
                    <span className={`mt-2 text-[8px] font-black uppercase tracking-wider font-mono transition-colors ${style.text}`}>
                      {state.label}
                    </span>

                    {/* Tooltip on hover */}
                    <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="bg-black border border-zinc-800 rounded px-2 py-1 whitespace-nowrap shadow-xl">
                        <span className="text-[9px] text-zinc-400 font-mono">{state.description}</span>
                      </div>
                    </div>
                  </div>

                  {/* Connector line */}
                  {!isLast && (
                    <div className="flex-1 h-0.5 mx-1 relative">
                      <div className="absolute inset-0 bg-zinc-800 rounded-full" />
                      <div 
                        className={`absolute inset-y-0 left-0 ${style.line} rounded-full transition-all duration-500`}
                        style={{ 
                          width: index < currentIndex ? '100%' : index === currentIndex ? '50%' : '0%' 
                        }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCardProgress;
