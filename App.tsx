
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CapturedEvent, KeyEventType } from './types';

const ModifierKey: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <span className={`px-2 py-1 text-xs font-bold text-yellow-200 bg-yellow-600/50 border border-yellow-500 rounded-md ${className}`}>
    {children}
  </span>
);

const EventRow: React.FC<{ event: CapturedEvent }> = ({ event }) => {
  const typeStyles: Record<KeyEventType, string> = {
    [KeyEventType.KeyDown]: 'bg-green-500/80 text-green-50 border-green-400',
    [KeyEventType.KeyUp]: 'bg-red-500/80 text-red-50 border-red-400',
    [KeyEventType.KeyPress]: 'bg-blue-500/80 text-blue-50 border-blue-400',
  };

  // FIX: The `fractionalSecondDigits` option is not available in all TypeScript lib versions.
  // Manually format the time to include milliseconds for broader compatibility.
  const timePart = event.timestamp.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const msPart = event.timestamp.getMilliseconds().toString().padStart(3, '0');
  const formattedTime = `${timePart}.${msPart}`;

  return (
    <div className="bg-gray-700/50 p-3 rounded-md flex flex-wrap gap-x-4 gap-y-2 items-center text-sm ring-1 ring-gray-600/50 hover:ring-cyan-400/50 transition-shadow shadow-sm">
      <span className="text-gray-400 w-28 text-left font-semibold">{formattedTime}</span>

      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold w-24 text-center border ${typeStyles[event.type]}`}>
        {event.type}
      </span>
      
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs">key:</span>
        <span className="font-bold text-cyan-300 bg-gray-600 px-2 py-0.5 rounded text-base">
          {event.key === ' ' ? "' '" : event.key}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs">code:</span>
        <span className="font-semibold text-purple-300 bg-gray-600 px-2 py-0.5 rounded">
          {event.code}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-xs">keyCode:</span>
        <span className="font-bold text-lime-300 w-8">{event.keyCode}</span>
      </div>

      <div className="flex gap-2 items-center ml-auto">
        {event.altKey && <ModifierKey>Alt</ModifierKey>}
        {event.ctrlKey && <ModifierKey>Ctrl</ModifierKey>}
        {event.shiftKey && <ModifierKey>Shift</ModifierKey>}
        {event.metaKey && <ModifierKey>Meta</ModifierKey>}
      </div>
    </div>
  );
};


export default function App() {
  const [events, setEvents] = useState<CapturedEvent[]>([]);
  const [filters, setFilters] = useState<Record<KeyEventType, boolean>>({
    [KeyEventType.KeyDown]: true,
    [KeyEventType.KeyUp]: true,
    [KeyEventType.KeyPress]: true,
  });
  const [isCopied, setIsCopied] = useState(false);

  const handleKeyEvent = useCallback((e: KeyboardEvent) => {
    // keypress is deprecated, but we'll still show it if the browser fires it.
    // Some keys don't fire keypress (e.g., modifier keys), which is normal.
    const newEvent: CapturedEvent = {
      id: Date.now() + Math.random(), // Add random to avoid collision on fast events
      timestamp: new Date(),
      type: e.type as KeyEventType,
      key: e.key,
      code: e.code,
      which: e.which,
      keyCode: e.keyCode,
      altKey: e.altKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey,
      shiftKey: e.shiftKey,
    };
    setEvents(prevEvents => [newEvent, ...prevEvents].slice(0, 100)); // Keep max 100 events
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyEvent);
    window.addEventListener('keyup', handleKeyEvent);
    window.addEventListener('keypress', handleKeyEvent);

    return () => {
      window.removeEventListener('keydown', handleKeyEvent);
      window.removeEventListener('keyup', handleKeyEvent);
      window.removeEventListener('keypress', handleKeyEvent);
    };
  }, [handleKeyEvent]);

  const toggleFilter = (type: KeyEventType) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const clearLog = () => {
    setEvents([]);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(e => filters[e.type]);
  }, [events, filters]);

  const copyLog = useCallback(() => {
    if (filteredEvents.length === 0 || isCopied) return;

    const logText = filteredEvents
      .map(event => {
        const timePart = event.timestamp.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const msPart = event.timestamp.getMilliseconds().toString().padStart(3, '0');
        const formattedTime = `${timePart}.${msPart}`;
        
        const modifiers = [];
        if (event.altKey) modifiers.push('Alt');
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.metaKey) modifiers.push('Meta');

        const keyString = event.key === ' ' ? `'${event.key}'` : event.key;
        let line = `[${formattedTime}] ${event.type.padEnd(8)} | key: ${keyString.padEnd(10)} | code: ${event.code.padEnd(10)} | keyCode: ${String(event.keyCode).padEnd(5)}`;
        if (modifiers.length > 0) {
          line += ` | modifiers: ${modifiers.join(', ')}`;
        }
        return line;
      })
      .reverse() // events are stored newest first, so reverse for chronological copy
      .join('\n');

    navigator.clipboard.writeText(logText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [filteredEvents, isCopied]);
  
  const filterOptions: { type: KeyEventType; color: string; hoverColor: string; textColor: string; ringColor: string }[] = [
      { type: KeyEventType.KeyDown, color: 'bg-green-600', hoverColor: 'bg-green-500', textColor: 'text-green-50', ringColor: 'ring-green-400' },
      { type: KeyEventType.KeyUp, color: 'bg-red-600', hoverColor: 'bg-red-500', textColor: 'text-red-50', ringColor: 'ring-red-400' },
      { type: KeyEventType.KeyPress, color: 'bg-blue-600', hoverColor: 'bg-blue-500', textColor: 'text-blue-50', ringColor: 'ring-blue-400' },
  ];

  return (
    <div className="min-h-screen text-gray-200 font-mono p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-cyan-400 tracking-wider">
          Keyboard Event Inspector
        </h1>
        <p className="text-gray-400 mt-2">Press any key to see its event details in real-time.</p>
      </header>
      
      <div className="flex flex-wrap gap-4 items-center justify-center mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <span className="font-semibold mr-4">Show Events:</span>
        <div className="flex gap-3">
          {filterOptions.map(({ type, color, hoverColor, textColor, ringColor }) => (
            <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                filters[type] 
                    ? `${color} ${hoverColor} ${textColor} ${ringColor}`
                    : 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                }`}
            >
                {type}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
            <button
                onClick={copyLog}
                disabled={filteredEvents.length === 0 || isCopied}
                className={`font-bold py-2 px-4 rounded transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCopied 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-700 hover:bg-cyan-600 hover:text-white text-gray-300'
                }`}
            >
              {isCopied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              )}
              {isCopied ? 'Copied!' : 'Copy Log'}
            </button>
            <button
                onClick={clearLog}
                className="bg-gray-700 hover:bg-red-600 hover:text-white text-gray-300 font-bold py-2 px-4 rounded transition-colors duration-200 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Log
            </button>
        </div>
      </div>

      <main className="flex-grow bg-gray-800 rounded-lg shadow-inner h-[65vh] overflow-y-auto p-4 space-y-3">
        {filteredEvents.length > 0 ? (
          filteredEvents.map(event => <EventRow key={event.id} event={event} />)
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>Waiting for keyboard events...</p>
          </div>
        )}
      </main>
    </div>
  );
}
