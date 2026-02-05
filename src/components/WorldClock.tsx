import React, { useState, useEffect } from 'react';

interface TimeZoneConfig {
  id: string;
  label: string;
  timezone: string; // IANA timezone string
  primary?: boolean;
}

interface WorldClockProps {
  timezones?: TimeZoneConfig[];
  showDate?: boolean;
  use24Hour?: boolean;
  className?: string;
}

const defaultTimezones: TimeZoneConfig[] = [
  { id: 'ist', label: 'IST', timezone: 'Asia/Kolkata', primary: true },
  { id: 'utc', label: 'UTC', timezone: 'UTC' },
  { id: 'est', label: 'EST/EDT', timezone: 'America/New_York' },
  { id: 'pst', label: 'PST/PDT', timezone: 'America/Los_Angeles' },
  { id: 'gmt', label: 'GMT', timezone: 'Europe/London' },
  { id: 'jst', label: 'JST', timezone: 'Asia/Tokyo' },
  { id: 'gst', label: 'GST', timezone: 'Asia/Dubai' },
];

const WorldClock: React.FC<WorldClockProps> = ({
  timezones = defaultTimezones,
  showDate = true,
  use24Hour = true,
  className = '',
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (date: Date, timezone: string): string => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !use24Hour,
    });
    return formatter.format(date);
  };

  const formatDate = (date: Date, timezone: string): string => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    return formatter.format(date);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-[#f18a22] rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight font-outfit">World Clock</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {timezones.map((tz) => (
          <div
            key={tz.id}
            className={`bg-[#050505] border-2 rounded-xl p-4 transition-all hover:border-[#f18a22]/40 ${
              tz.primary ? 'border-[#f18a22]/30 shadow-[0_0_20px_rgba(241,138,34,0.15)]' : 'border-zinc-900'
            }`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest font-mono">
                  {tz.label}
                </span>
                {tz.primary && (
                  <span className="px-2 py-0.5 bg-[#f18a22]/10 border border-[#f18a22]/30 rounded text-[8px] font-black text-[#f18a22] uppercase tracking-wider font-mono">
                    PRIMARY
                  </span>
                )}
              </div>

              <div className="font-mono text-2xl font-bold text-white tracking-tight">
                {formatTime(currentTime, tz.timezone)}
              </div>

              {showDate && (
                <div className="text-[11px] font-medium text-zinc-600 font-mono">
                  {formatDate(currentTime, tz.timezone)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/30 border border-zinc-800 rounded-lg">
        <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></div>
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest font-mono">
          REAL-TIME SYNC ACTIVE
        </span>
      </div>
    </div>
  );
};

export default WorldClock;