import React, { useState } from "react";
import { Cpu } from "lucide-react";
import { Contact, Message } from "./types";
import { INITIAL_CONTACTS, INITIAL_MESSAGES } from "./initial-contacts";
import { ContactSidebar } from "./components/ContactSidebar";
import { ChatHeader } from "./components/ChatHeader";
import { MessageFeed } from "./components/MessageFeed";
import { ChatInput } from "./components/ChatInput";

export const AgentChatPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Responsive sidebar toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const [messagesByContact, setMessagesByContact] =
    useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  const activeContact =
    contacts.find((c) => c.id === activeContactId) || contacts[0];
  const activeMessages = messagesByContact[activeContact.id] || [];

  const handleSelectContact = (id: string) => {
    setActiveContactId(id);
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
    setIsSidebarOpen(false);
  };

  const handleSendMessage = (
    text: string,
    audio: { name: string; duration: string } | null,
    image: string | null
  ) => {
    const isAudioMessage = !!audio;
    const isImageMessage = !!image;

    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const newMessage: Message = {
      id: `${activeContact.id}_${Date.now()}`,
      text: isAudioMessage || isImageMessage ? "" : text.trim(),
      sender: "agent",
      time: timestamp,
      ...(isAudioMessage && {
        audio: audio,
      }),
      ...(isImageMessage && {
        image: image,
      }),
    };

    // Update messages local state
    setMessagesByContact((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMessage],
    }));

    // Update contacts' last message preview
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? {
              ...c,
              lastMessage: isAudioMessage
                ? "🎤 Voice note"
                : isImageMessage
                  ? "🖼️ Image"
                  : text.trim(),
              time: "Just now",
            }
          : c
      )
    );

    // Trigger mock response after a slight delay to simulate authentic live interaction
    setTimeout(() => {
      let replyText = "";
      if (isAudioMessage) {
        replyText = `🎙️ *Audio Transcription:* 'Which products have critical stock in my inventory?'\n\n*Gemini Copilot AI Response:* Analyzing the inventory database in real-time... You currently have 3 products requiring urgent stock attention:\n- **Portland Cement (x50)**: Current stock: 12 units (minimum: 30).\n- **Deformed Steel Bar (x100)**: Current stock: 24 units (minimum: 100).\n- **White Latex Paint**: Current stock: 8 units (minimum: 20).\n\nWould you like me to prepare a purchase draft to replenish them?`;
      } else if (isImageMessage) {
        replyText = `🖼️ *AI Vision Analysis:* I have successfully processed the image. Reduced stock is registered on the warehouse shelf. I recommend initiating an automated purchase process.\n\nWould you like me to prepare a draft purchase order to validate replenishment?`;
      } else {
        const responses: Record<string, string> = {
          "1": "You are welcome! I am ready to process more stock inquiries or generate purchase reports.",
          "2": "Of course. I will be monitoring the revenue and predictive sales analysis.",
          "3": "Received. All systems are optimal and secure.",
        };
        replyText =
          responses[activeContact.id] ||
          "Thank you very much for the support! I will be validating it.";
      }

      const replyMessage: Message = {
        id: `${activeContact.id}_reply_${Date.now()}`,
        text: replyText,
        sender: "client",
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      };

      setMessagesByContact((prev) => ({
        ...prev,
        [activeContact.id]: [...(prev[activeContact.id] || []), replyMessage],
      }));

      setContacts((prev) =>
        prev.map((c) =>
          c.id === activeContact.id
            ? {
                ...c,
                lastMessage: isAudioMessage ? "Copilot Response" : replyText,
                time: "Just now",
              }
            : c
        )
      );
    }, 1500);
  };

  const handleSendSticker = (sticker: "brain" | "rocket" | "success") => {
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const newMsg: Message = {
      id: `sticker_${Date.now()}`,
      text: "",
      sender: "agent",
      time: timestamp,
      sticker,
    };

    setMessagesByContact((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg],
    }));

    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? {
              ...c,
              lastMessage: "🎨 Sticker",
              time: "Just now",
            }
          : c
      )
    );
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.4s_ease-out]">
      <div>
        <h1 className="text-3xl font-black text-stone-900 dark:text-stone-50 tracking-tight flex items-center gap-3">
          <Cpu className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          AI Copilot
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1.5 font-medium">
          Advanced intelligent assistance terminal to optimize CRM inventory,
          sales, and audits.
        </p>
      </div>

      <div className="h-[calc(100vh-17.5rem)] lg:h-[calc(100vh-15.5rem)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-sm relative">
        {/* Backdrop for Mobile Sidebar Drawer */}
        {isSidebarOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-stone-900/40 backdrop-blur-xs z-30 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <ContactSidebar
          contacts={contacts}
          activeContactId={activeContactId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          onSelectContact={handleSelectContact}
        />

        {/* COLUMN 2: Active Message Feed (col-span-8) */}
        <section className="lg:col-span-8 flex flex-col h-full min-h-0 max-h-full bg-stone-50/50 dark:bg-stone-950/20 overflow-hidden relative">
          <ChatHeader
            activeContact={activeContact}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />

          <MessageFeed activeMessages={activeMessages} />

          <ChatInput
            activeContact={activeContact}
            onSendMessage={handleSendMessage}
            onSendSticker={handleSendSticker}
          />
        </section>
      </div>
    </div>
  );
};

export default AgentChatPage;
