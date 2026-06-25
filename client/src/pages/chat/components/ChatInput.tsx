import React, { useState, useEffect } from "react";
import {
  X,
  Mic,
  Send,
  MicOff,
  Smile,
  Image,
  Cpu,
  TrendingUp,
  Paperclip,
} from "lucide-react";
import { Contact } from "../types";

export interface ChatInputProps {
  activeContact: Contact;
  onSendMessage: (
    text: string,
    audio: { name: string; duration: string } | null,
    image: string | null
  ) => void;
  onSendSticker: (sticker: "brain" | "rocket" | "success") => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  activeContact,
  onSendMessage,
  onSendSticker,
}) => {
  const [inputText, setInputText] = useState<string>("");

  // Popover menus state
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);

  // Audio recording simulation state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [attachedAudioName, setAttachedAudioName] = useState<string | null>(null);
  const [attachedAudioDuration, setAttachedAudioDuration] = useState<string | null>(null);

  // Attachment previews state
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);

  // Audio recording timer simulation
  useEffect(() => {
    if (!isRecording) {
      setRecordingSeconds(0);
      return;
    }
    const interval = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isAudioMessage = !!attachedAudioName;
    const isImageMessage = !!attachedImage;
    if (!inputText.trim() && !isAudioMessage && !isImageMessage) return;

    onSendMessage(
      isAudioMessage || isImageMessage ? "" : inputText.trim(),
      isAudioMessage
        ? {
            name: attachedAudioName,
            duration: attachedAudioDuration || "0:08",
          }
        : null,
      attachedImage
    );

    setInputText("");
    setAttachedAudioName(null);
    setAttachedAudioDuration(null);
    setAttachedImage(null);
    setAttachedImageName(null);
  };

  const handleSendStickerAndClose = (sticker: "brain" | "rocket" | "success") => {
    onSendSticker(sticker);
    setShowAttachMenu(false);
  };

  const handleAttachImage = () => {
    setAttachedImage(
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
    );
    setAttachedImageName("cement_warehouse.png");
    setShowAttachMenu(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setAttachedAudioName("Audio_Query.mp3");
      const finalSecs = recordingSeconds || 8;
      const mins = Math.floor(finalSecs / 60);
      const secs = finalSecs % 60;
      setAttachedAudioDuration(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
      return;
    }
    setIsRecording(true);
    setAttachedAudioName(null);
    setAttachedAudioDuration(null);
    setAttachedImage(null);
    setAttachedImageName(null);
  };

  const isSendDisabled = !inputText.trim() && !attachedAudioName && !attachedImage;

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex flex-col gap-2 relative"
    >
      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-3 shadow-lg z-50 grid grid-cols-6 gap-2 w-48 animate-fadeIn">
          {[
            "👍",
            "❤️",
            "😂",
            "🎉",
            "🔥",
            "🚀",
            "👀",
            "🤔",
            "👏",
            "🙏",
            "💡",
            "📈",
          ].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleEmojiClick(emoji)}
              className="w-7 h-7 flex items-center justify-center text-lg hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Menu Popover */}
      {showAttachMenu && (
        <div className="absolute bottom-16 left-14 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-2 shadow-lg z-50 flex flex-col gap-1 w-44 animate-fadeIn">
          <button
            type="button"
            onClick={handleAttachImage}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-left cursor-pointer w-full font-medium"
          >
            <Image className="w-4 h-4 text-blue-500" />
            Attach Image
          </button>
          <button
            type="button"
            onClick={() => handleSendStickerAndClose("brain")}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-left cursor-pointer w-full font-medium"
          >
            <Cpu className="w-4 h-4 text-emerald-500" />
            Send Brain Sticker
          </button>
          <button
            type="button"
            onClick={() => handleSendStickerAndClose("rocket")}
            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors text-left cursor-pointer w-full font-medium"
          >
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Send Rocket Sticker
          </button>
        </div>
      )}

      {/* Attached file preview */}
      {attachedAudioName && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              {attachedAudioName} ({attachedAudioDuration})
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAttachedAudioName(null);
              setAttachedAudioDuration(null);
            }}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attached image preview */}
      {attachedImageName && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg animate-fadeIn">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Attached image: {attachedImageName}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAttachedImage(null);
              setAttachedImageName(null);
            }}
            className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 w-full">
        {/* WhatsApp Action Buttons on the Left */}
        {!isRecording && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowAttachMenu(false);
              }}
              className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                showEmojiPicker
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                  : "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500"
              }`}
              title="Emojis"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(!showAttachMenu);
                setShowEmojiPicker(false);
              }}
              className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                showAttachMenu
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                  : "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-500"
              }`}
              title="Attach media"
            >
              <Paperclip className="w-5 h-5" />
            </button>
          </div>
        )}

        {isRecording ? (
          /* Recording active view */
          <div className="flex-1 h-11 px-4 border border-red-200 dark:border-red-900/50 bg-red-50/10 dark:bg-red-950/10 rounded-xl flex items-center justify-between text-stone-800 dark:text-stone-100">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">
                Recording...
              </span>
              {/* Simulated soundwave */}
              <div className="flex items-end gap-[3px] h-4 ml-1">
                <span className="w-[3px] h-2 bg-red-500 dark:bg-red-400 rounded-xs animate-[pulse_0.6s_infinite_100ms]" />
                <span className="w-[3px] h-4 bg-red-500 dark:bg-red-400 rounded-xs animate-[pulse_0.6s_infinite_200ms]" />
                <span className="w-[3px] h-3 bg-red-500 dark:bg-red-400 rounded-xs animate-[pulse_0.6s_infinite_300ms]" />
                <span className="w-[3px] h-5 bg-red-500 dark:bg-red-400 rounded-xs animate-[pulse_0.6s_infinite_400ms]" />
                <span className="w-[3px] h-2.5 bg-red-500 dark:bg-red-400 rounded-xs animate-[pulse_0.6s_infinite_500ms]" />
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-red-600 dark:text-red-400">
              00:{recordingSeconds < 10 ? "0" : ""}
              {recordingSeconds}
            </span>
          </div>
        ) : (
          <input
            type="text"
            placeholder={
              attachedImageName
                ? "Write a comment for the image..."
                : attachedAudioName
                  ? "Audio attached. Press Send..."
                  : `Reply to ${activeContact.name}...`
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 h-11 px-4 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-stone-800 dark:text-stone-100 disabled:opacity-75"
          />
        )}

        {/* Mic toggle */}
        <button
          type="button"
          onClick={handleToggleRecording}
          className={`h-11 w-11 rounded-xl flex items-center justify-center transition-all shadow-xs flex-shrink-0 cursor-pointer ${
            isRecording
              ? "bg-red-500 text-white animate-pulse"
              : "bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300"
          }`}
          title={isRecording ? "Stop recording" : "Record voice note"}
        >
          {isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>

        <button
          type="submit"
          disabled={isSendDisabled}
          className="h-11 w-11 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white disabled:text-stone-400 dark:disabled:text-stone-600 rounded-xl flex items-center justify-center transition-colors shadow-xs flex-shrink-0 cursor-pointer"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
