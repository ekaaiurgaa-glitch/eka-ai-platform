import React, { useState } from 'react';
import { AuditEntry, AuditActorType } from '../types';

interface AuditLogProps {
  entries: AuditEntry[];
  jobId?: string;
  className?: string;
}

const AuditLog: React.FC<AuditLogProps> = ({ entries, jobId, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const getActorStyle = (actor: AuditActorType) => {
    switch (actor) {
      case 'USER':
        return { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', icon: '👤' };
      case 'AI':
        return { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', icon: '🤖' };
      case 'SYSTEM':
        return { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', icon: '⚙️' };
      default:
        return { bg: 'bg-zinc-800', border: 'border-zinc-700', text: 'text-zinc-500', icon: '📝' };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const handleExportAuditTrail = async () => {
    setIsExporting(true);
    
    // Export as text file (PDF would require additional library like jsPDF)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Create a simple text representation for download
    const content = entries.map(entry => 
      `[${entry.timestamp}] ${entry.actor}: ${entry.action}${entry.confidence_score ? ` (Confidence: ${entry.confidence_score}%)` : ''}`
    ).join('\n');
    
    const blob = new Blob([
      `EKA-AI Audit Trail\n`,
      `Job ID: ${jobId || 'N/A'}\n`,
      `Generated: ${new Date().toISOString()}\n`,
      `${'='.repeat(50)}\n\n`,
      content,
    ], { type: 'text/plain' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${jobId || 'export'}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    setIsExporting(false);
  };

  // Group entries by date
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = formatDate(entry.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, AuditEntry[]>);

  return (
    <div className={`bg-[#050505] border border-zinc-900 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-900/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider font-mono">
            Audit Trail
          </span>
          <span className="text-[9px] font-bold text-zinc-600 font-mono">
            ({entries.length})
          </span>
        </div>
        <svg 
          className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="border-t border-zinc-900">
          {/* Entries */}
          <div className="max-h-64 overflow-y-auto">
            {entries.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-[10px] text-zinc-600 font-mono uppercase">No audit entries</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {Object.entries(groupedEntries).map(([date, dateEntries]: [string, AuditEntry[]]) => (
                  <div key={date}>
                    <div className="px-2 py-1">
                      <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest font-mono">
                        {date}
                      </span>
                    </div>
                    {dateEntries.map((entry) => {
                      const style = getActorStyle(entry.actor);
                      return (
                        <div
                          key={entry.id}
                          className={`p-2 rounded-lg border ${style.border} ${style.bg} mb-1 transition-all hover:scale-[1.01]`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-xs">{style.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[9px] font-black uppercase font-mono ${style.text}`}>
                                  {entry.actor}
                                </span>
                                <span className="text-[9px] text-zinc-600 font-mono">
                                  {formatTimestamp(entry.timestamp)}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-300 font-mono mt-0.5 leading-tight">
                                {entry.action}
                              </p>
                              {entry.confidence_score !== undefined && (
                                <div className="mt-1 flex items-center gap-1">
                                  <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-[#f18a22] rounded-full"
                                      style={{ width: `${entry.confidence_score}%` }}
                                    />
                                  </div>
                                  <span className="text-[8px] text-zinc-500 font-mono">
                                    {entry.confidence_score}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export button */}
          {entries.length > 0 && (
            <div className="p-2 border-t border-zinc-900">
              <button
                onClick={handleExportAuditTrail}
                disabled={isExporting}
                className={`w-full py-2 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono transition-all flex items-center justify-center gap-2 ${
                  isExporting 
                    ? 'bg-zinc-800 text-zinc-600 cursor-wait' 
                    : 'bg-zinc-900 text-zinc-400 hover:bg-[#f18a22]/10 hover:text-[#f18a22] hover:border-[#f18a22]/30 border border-transparent'
                }`}
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    Export Audit Trail
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuditLog;
