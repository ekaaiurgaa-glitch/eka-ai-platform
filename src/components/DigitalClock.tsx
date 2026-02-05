
import React, { useState, useEffect, useMemo } from 'react';
import { Clock, Globe } from 'lucide-react';

interface TimeZoneInfo {
  name: string;
  zone: string;
  abbreviation: string;
}

interface DigitalClockProps {
  showTimezones?: string[];
}

const getTimezones = (): TimeZoneInfo[] => {
  const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const timezones: TimeZoneInfo[] = [
    { name: 'Local Time', zone: localZone, abbreviation: 'LOCAL' },
    { name: 'India', zone: 'Asia/Kolkata', abbreviation: 'IST' },
    { name: 'UTC/GMT', zone: 'UTC', abbreviation: 'UTC' },
    { name: 'US Eastern', zone: 'America/New_York', abbreviation: 'EST/EDT' },
    { name: 'US Pacific', zone: 'America/Los_Angeles', abbreviation: 'PST/PDT' },
    { name: 'UK', zone: 'Europe/London', abbreviation: 'GMT/BST' },
    { name: 'Japan', zone: 'Asia/Tokyo', abbreviation: 'JST' },
    { name: 'Dubai', zone: 'Asia/Dubai', abbreviation: 'GST' },
  ];
  
  // Remove duplicate if local timezone is same as any other timezone in the list
  const uniqueZones = new Map<string, TimeZoneInfo>();
  timezones.forEach(tz => {
    if (!uniqueZones.has(tz.zone)) {
      uniqueZones.set(tz.zone, tz);
    }
  });
  
  return Array.from(uniqueZones.values());
};

const DigitalClock: React.FC<DigitalClockProps> = ({ showTimezones }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(true);
  
  // Memoize timezones list to avoid recalculation on every render
  const TIMEZONES = useMemo(() => getTimezones(), []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formatTime = (date: Date, timezone: string, use24Hour: boolean): string => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: !use24Hour,
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const formatDate = (date: Date, timezone: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    };
    
    return new Intl.DateTimeFormat('en-US', options).format(date);
  };

  const getTimezoneAbbr = (date: Date, timezone: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      timeZoneName: 'short',
      hour: 'numeric',
    };
    
    const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  };

  const displayedTimezones = showTimezones
    ? TIMEZONES.filter(tz => showTimezones.includes(tz.zone))
    : TIMEZONES;

  return (
    <div className="w-full bg-[#000000] rounded-xl border-2 border-zinc-900 p-6 animate-in slide-in-from-top-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#f18a22] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(241,138,34,0.3)]">
            <Clock className="w-5 h-5 text-black" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-white font-black text-xl uppercase tracking-tight font-outfit">World Clock</h2>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest font-mono">Real-time zones</span>
          </div>
        </div>
        
        <button
          onClick={() => setIs24Hour(!is24Hour)}
          className="px-4 py-2 bg-zinc-900 hover:bg-[#f18a22]/10 border border-zinc-800 hover:border-[#f18a22]/40 rounded-lg transition-all duration-300 group"
        >
          <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-[#f18a22] font-mono">
            {is24Hour ? '24H' : '12H'}
          </span>
        </button>
      </div>

      {/* Timezone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {displayedTimezones.map((tz) => {
          const timeStr = formatTime(currentTime, tz.zone, is24Hour);
          const dateStr = formatDate(currentTime, tz.zone);
          const tzAbbr = getTimezoneAbbr(currentTime, tz.zone);

          return (
            <div
              key={tz.zone}
              className="bg-[#050505] border-2 border-zinc-900 rounded-xl p-4 flex flex-col gap-3 group hover:border-[#f18a22]/40 transition-all duration-300"
            >
              {/* Timezone Name */}
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#f18a22] transition-colors" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest font-mono group-hover:text-[#f18a22] transition-colors">
                  {tz.name}
                </span>
              </div>

              {/* Time Display */}
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-black text-white font-mono tracking-tight">
                  {timeStr}
                </div>
                <div className="text-[11px] text-zinc-500 font-bold font-sans">
                  {dateStr}
                </div>
              </div>

              {/* Timezone Abbreviation */}
              <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f18a22] animate-pulse"></div>
                <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest font-mono">
                  {tzAbbr}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DigitalClock;
