import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { ASK_AGENT } from "@modules/chat/infrastructure/graphql/mutations";
import { Loader2 } from "lucide-react";

export interface SandboxChatUIProps {
  agentId: string;
}

export const SandboxChatUI: React.FC<SandboxChatUIProps> = ({ agentId }) => {
  const [messages, setMessages] = useState<Array<{ id: string; sender: "USER" | "AGENT" | "SYSTEM"; text: string }>>([
    { id: "init", sender: "SYSTEM", text: "Playtest Sandbox started. Speak directly to this AI Agent to test its custom system prompt and capability configurations in real-time." }
  ]);
  const [inputText, setInputText] = useState("");
  const [askAgent, { loading }] = useMutation(ASK_AGENT);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    setInputText("");

    // Append user message
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "USER", text: userText }]);

    try {
      const res = await askAgent({
        variables: { agentId, text: userText }
      });

      if (res.data?.askAgent) {
        setMessages((prev) => [
          ...prev,
          { id: (Date.now() + 1).toString(), sender: "AGENT", text: res.data.askAgent }
        ]);
      }
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "SYSTEM", text: `Error: ${(err as Error).message || "Failed to generate response"}` }
      ]);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-stone-50 dark:bg-stone-950/40">
      {/* Scrollable chat body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          if (msg.sender === "SYSTEM") {
            return (
              <div key={msg.id} className="flex justify-center">
                <span className="px-3.5 py-1.5 rounded-lg border border-stone-200/60 bg-stone-100/50 text-stone-500 text-[10px] font-bold text-center uppercase tracking-wide max-w-md dark:bg-stone-900/40 dark:border-stone-800/40 dark:text-stone-400">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isAgent = msg.sender === "AGENT";
          return (
            <div key={msg.id} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[75%] rounded-2xl p-4 shadow-xs text-xs font-semibold leading-relaxed border ${
                  isAgent
                    ? "bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 border-stone-200/60 dark:border-stone-800/40 rounded-tl-none"
                    : "bg-emerald-600 text-white border-emerald-600 rounded-tr-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-stone-900 text-stone-500 border border-stone-200/60 dark:border-stone-800/40 rounded-2xl rounded-tl-none p-4 shadow-xs flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider animate-pulse">Agent is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input bar */}
      <div className="p-4 border-t border-stone-100 dark:border-stone-800/60 bg-white dark:bg-stone-900 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder="Type your playtest message here..."
            className="flex-1 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="h-10 px-5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all flex items-center justify-center disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};
