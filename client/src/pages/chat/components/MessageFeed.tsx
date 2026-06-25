import React, { useRef, useEffect, useState } from "react";
import { Play, Pause, Volume2, Cpu, TrendingUp, CheckCheck } from "lucide-react";
import { Message } from "../types";

const BAR_HEIGHTS = [
  30, 50, 70, 40, 80, 60, 45, 90, 75, 55, 35, 60, 80, 50, 70, 95, 60, 40, 50,
  70, 55, 80, 40, 30,
] as const;

export interface MessageFeedProps {
  activeMessages: Message[];
}

export const MessageFeed: React.FC<MessageFeedProps> = ({ activeMessages }) => {
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [activeMessages]);

  return (
    <div ref={feedRef} className="flex-1 overflow-y-auto p-4 space-y-4">
      {activeMessages.map((message) => {
        const isClient = message.sender === "client";
        const hasAudio = !!message.audio;
        const hasImage = !!message.image;
        const hasSticker = !!message.sticker;

        return (
          <div
            key={message.id}
            className={`flex flex-col ${isClient ? "items-start" : "items-end"} animate-fadeIn`}
          >
            {hasAudio ? (
              /* Audio player card bubble (emerald if agent/sent, stone if client/received) */
              <div
                className={`${
                  isClient
                    ? "bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                    : "bg-emerald-600 dark:bg-emerald-700 text-white"
                } rounded-2xl ${isClient ? "rounded-tl-none" : "rounded-tr-none"} p-4 w-72 sm:w-80 shadow-sm space-y-3`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPlayingMessageId(
                        playingMessageId === message.id ? null : message.id
                      )
                    }
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                      isClient
                        ? "bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    {playingMessageId === message.id ? (
                      <Pause
                        className={`w-4 h-4 ${isClient ? "text-stone-700 dark:text-stone-200 fill-stone-700 dark:fill-stone-200" : "text-white fill-white"}`}
                      />
                    ) : (
                      <Play
                        className={`w-4 h-4 ml-0.5 ${isClient ? "text-stone-700 dark:text-stone-200 fill-stone-700 dark:fill-stone-200" : "text-white fill-white"}`}
                      />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">
                      {message.audio?.name}
                    </p>
                    <p
                      className={`text-[10px] ${isClient ? "text-stone-500 dark:text-stone-400" : "text-emerald-200"}`}
                    >
                      Recorded voice note
                    </p>
                  </div>
                  <Volume2
                    className={`w-4 h-4 flex-shrink-0 ${isClient ? "text-stone-500 dark:text-stone-400" : "text-emerald-200"}`}
                  />
                </div>

                {/* Simulated Waveform & Progress Bar */}
                <div
                  className={`flex items-end gap-[2px] h-8 pt-2 px-2 rounded-lg overflow-hidden ${isClient ? "bg-stone-200/50 dark:bg-stone-900/50" : "bg-black/10"}`}
                >
                  {BAR_HEIGHTS.map((barHeight, i) => {
                    const isPlaying = playingMessageId === message.id;
                    return (
                      <div
                        key={i}
                        style={{ height: `${barHeight}%` }}
                        className={`flex-1 rounded-t-xs transition-all duration-300 ${
                          isPlaying
                            ? isClient
                              ? "bg-emerald-500 dark:bg-emerald-400 animate-[pulse_1s_infinite]"
                              : "bg-white animate-[pulse_1s_infinite]"
                            : isClient
                              ? "bg-stone-300 dark:bg-stone-600"
                              : "bg-emerald-300/60"
                        }`}
                      />
                    );
                  })}
                </div>

                <div
                  className={`flex items-center justify-between text-[10px] px-1 ${isClient ? "text-stone-500 dark:text-stone-400" : "text-emerald-200"}`}
                >
                  <span>
                    {playingMessageId === message.id ? "Playing..." : "Paused"}
                  </span>
                  <span>{message.audio?.duration}</span>
                </div>
              </div>
            ) : hasSticker ? (
              /* Sticker floats transparently */
              <div className="animate-fadeIn flex flex-col items-end max-w-[150px] p-1 bg-white/5 dark:bg-black/5 rounded-2xl border border-stone-200/20">
                {message.sticker === "brain" && (
                  <div className="w-24 h-24 p-2 bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center shadow-xs">
                    <Cpu className="w-16 h-16 text-emerald-500 animate-pulse" />
                  </div>
                )}
                {message.sticker === "rocket" && (
                  <div className="w-24 h-24 p-2 bg-amber-500/5 dark:bg-amber-950/10 border border-amber-500/20 rounded-2xl flex items-center justify-center shadow-xs">
                    <TrendingUp className="w-16 h-16 text-amber-500 animate-[float_3s_ease-in-out_infinite]" />
                  </div>
                )}
                {message.sticker === "success" && (
                  <div className="w-24 h-24 p-2 bg-blue-500/5 dark:bg-blue-950/10 border border-blue-500/20 rounded-2xl flex items-center justify-center shadow-xs">
                    <CheckCheck className="w-16 h-16 text-blue-500" />
                  </div>
                )}
              </div>
            ) : (
              /* Standard message bubble or Image bubble */
              <div
                className={
                  isClient
                    ? "bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-sm shadow-sm whitespace-pre-line"
                    : "bg-emerald-600 text-white rounded-2xl rounded-tr-none p-3.5 max-w-[85%] text-sm shadow-sm ml-auto whitespace-pre-line"
                }
              >
                {hasImage && (
                  <div className="rounded-lg overflow-hidden border border-black/5 dark:border-white/5 mb-1.5 shadow-xs max-w-xs">
                    <img
                      src={message.image}
                      alt="Attachment"
                      className="w-full h-auto object-cover max-h-52 hover:scale-[1.03] transition-transform duration-200"
                    />
                  </div>
                )}
                {message.text && <p className="leading-relaxed">{message.text}</p>}
              </div>
            )}
            <span className="text-[9px] text-stone-400 dark:text-stone-500 font-medium mt-1 px-1 flex items-center gap-1">
              {message.time}
              {!isClient && <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />}
            </span>
          </div>
        );
      })}
    </div>
  );
};
