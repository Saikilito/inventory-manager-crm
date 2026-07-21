import { useEffect, useState } from "react";
import { useQuery, useSubscription, useMutation, gql } from "@apollo/client";
import { Contact, Message } from "./types";
import { INITIAL_CONTACTS, INITIAL_MESSAGES } from "./initial-contacts";
import { GET_CHAT_SESSIONS } from "./components/ContactSidebar";
import { CLIENTS_QUERY } from "../../modules/client/infrastructure/graphql/queries";
import { buildLiveContact, resolveClientName } from "./contact-factory";
import { buildMockReply, buildStickerMessage, MOCK_REPLY_DELAY_MS } from "./mock-ai-replies";
import {
  GET_WHATSAPP_CONNECTION_STATE,
  WHATSAPP_CONNECTION_UPDATED,
} from "./components/QrPortal";

export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($whatsappId: String!) {
    getChatMessages(whatsappId: $whatsappId) {
      id
      text
      sender
      isPrivate
      createdAt
    }
  }
`;

export const CHAT_MESSAGE_RECEIVED_SUB = gql`
  subscription OnChatMessageReceived($whatsappId: String!) {
    chatMessageReceived(whatsappId: $whatsappId) {
      id
      text
      sender
      isPrivate
      createdAt
    }
  }
`;

export const SEND_MESSAGE_TO_CHAT = gql`
  mutation SendMessageToChat($whatsappId: String!, $text: String!) {
    sendMessageToChat(whatsappId: $whatsappId, text: $text)
  }
`;

export const SEND_WHISPER_MESSAGE = gql`
  mutation SendWhisperToAgent($whatsappId: String!, $text: String!) {
    sendWhisperToAgent(whatsappId: $whatsappId, text: $text) {
      id
      text
      sender
      isPrivate
      createdAt
    }
  }
`;

export type ConnectionStatus = "DISCONNECTED" | "CONNECTING" | "QR" | "CONNECTED";
export type ChatChannel = "whatsapp" | "whisper";
export type ActiveTab = "conversations" | "agents";

interface SessionLookup {
  whatsappId: string;
}

interface ChatMessageLookup {
  id: string;
}

export interface UseChatSessionResult {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  activeContactId: string;
  setActiveContactId: (id: string) => void;
  isWhatsAppMode: boolean;
  setIsWhatsAppMode: (mode: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isActionPanelOpen: boolean;
  setIsActionPanelOpen: (open: boolean) => void;
  chatChannel: ChatChannel;
  setChatChannel: (channel: ChatChannel) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  connectionStatus: ConnectionStatus;
  refetchConnection: () => void;
  activeContact: Contact | null;
  activeMessages: Message[];
  handleSelectContact: (id: string, isWhatsApp?: boolean) => void;
  handleSendMessage: (
    text: string,
    audio: { name: string; duration: string } | null,
    image: string | null,
  ) => Promise<void>;
  handleSendSticker: (sticker: "brain" | "rocket" | "success") => void;
  currentSessionStatus: string | undefined;
  refetchSessions: () => void;
}

const visibleSenderShorthand = (sender: string): "client" | "agent" =>
  sender === "CUSTOMER" ? "client" : "agent";

export const useChatSession = (): UseChatSessionResult => {
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [activeContactId, setActiveContactId] = useState<string>("");
  const [isWhatsAppMode, setIsWhatsAppMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isActionPanelOpen, setIsActionPanelOpen] = useState<boolean>(true);
  const [chatChannel, setChatChannel] = useState<ChatChannel>("whatsapp");
  const [activeTab, setActiveTab] = useState<ActiveTab>("conversations");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("DISCONNECTED");
  const [messagesByContact, setMessagesByContact] = useState<Record<string, Message[]>>(INITIAL_MESSAGES);

  const { data: connectionData, refetch: refetchConnection } = useQuery(GET_WHATSAPP_CONNECTION_STATE);
  const { data: connectionSubData } = useSubscription(WHATSAPP_CONNECTION_UPDATED);

  useEffect(() => {
    const next = connectionData?.getWhatsAppConnectionState?.status;
    if (next) setConnectionStatus(next);
  }, [connectionData]);

  useEffect(() => {
    const next = connectionSubData?.whatsAppConnectionUpdated?.status;
    if (next) setConnectionStatus(next);
  }, [connectionSubData]);

  const { data: clientsData } = useQuery(CLIENTS_QUERY);
  const { data: sessionsData, loading: sessionsLoading, refetch: refetchSessions } = useQuery(GET_CHAT_SESSIONS);

  const currentSession = sessionsData?.getChatSessions?.find(
    (s: SessionLookup) => s.whatsappId === activeContactId,
  );

  const { data: liveMessagesData, subscribeToMore } = useQuery(GET_CHAT_MESSAGES, {
    variables: { whatsappId: activeContactId },
    skip: !isWhatsAppMode || !activeContactId,
  });

  useEffect(() => {
    if (!isWhatsAppMode || !activeContactId) return;
    const unsubscribe = subscribeToMore({
      document: CHAT_MESSAGE_RECEIVED_SUB,
      variables: { whatsappId: activeContactId },
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data || !prev?.getChatMessages) return prev;
        const newMsg = subscriptionData.data.chatMessageReceived;
        if (prev.getChatMessages.some((m: ChatMessageLookup) => m.id === newMsg.id)) {
          return prev;
        }
        return {
          getChatMessages: [...prev.getChatMessages, newMsg],
        };
      },
    });
    return () => unsubscribe();
  }, [isWhatsAppMode, activeContactId, subscribeToMore]);

  useEffect(() => {
    if (sessionsLoading || !sessionsData?.getChatSessions) return;
    const sessions = sessionsData.getChatSessions;
    if (isWhatsAppMode && activeContactId) {
      const exists = sessions.some(
        (s: SessionLookup) => s.whatsappId === activeContactId,
      );
      if (!exists) {
        if (sessions.length > 0) {
          setActiveContactId(sessions[0].whatsappId);
          setIsWhatsAppMode(true);
        } else {
          setActiveContactId("");
          setIsWhatsAppMode(true);
        }
      }
    } else if (!activeContactId && sessions.length > 0) {
      setActiveContactId(sessions[0].whatsappId);
      setIsWhatsAppMode(true);
    }
  }, [isWhatsAppMode, activeContactId, sessionsData, sessionsLoading]);

  const [sendMessageToChat] = useMutation(SEND_MESSAGE_TO_CHAT);
  const [sendWhisperMessage] = useMutation(SEND_WHISPER_MESSAGE);

  const activeContact: Contact | null = isWhatsAppMode
    ? activeContactId
      ? buildLiveContact({
          whatsappId: activeContactId,
          clientName: resolveClientName({
            whatsappId: activeContactId,
            clients: clientsData?.getAllClients,
          }),
          status: currentSession?.status,
        })
      : null
    : contacts.find((c) => c.id === activeContactId) || null;

  const rawMessages: Message[] = isWhatsAppMode && activeContactId
    ? (liveMessagesData?.getChatMessages || []).map((m: { id: string; text: string; sender: string; isPrivate: boolean; createdAt?: string }) => ({
        id: m.id,
        text: m.text,
        sender: visibleSenderShorthand(m.sender),
        rawSender: m.sender,
        isPrivate: m.isPrivate,
        time: new Date(m.createdAt || Date.now()).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
      }))
    : activeContactId
      ? messagesByContact[activeContactId] || []
      : [];

  const activeMessages = rawMessages.filter((m) => {
    if (!isWhatsAppMode) return true;
    if (chatChannel === "whatsapp") {
      return !m.isPrivate || ["CUSTOMER", "BOT", "OPERATOR"].includes((m as Message & { rawSender?: string }).rawSender ?? "");
    }
    return m.isPrivate === true;
  });

  const handleSelectContact = (id: string, isWhatsApp = false) => {
    setActiveContactId(id);
    setIsWhatsAppMode(isWhatsApp);
    if (!isWhatsApp) {
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)));
    }
    setIsSidebarOpen(false);
  };

  const handleSendMessage = async (
    text: string,
    audio: { name: string; duration: string } | null,
    image: string | null,
  ) => {
    if (!activeContact) return;

    if (isWhatsAppMode) {
      if (!text.trim()) return;
      try {
        if (chatChannel === "whatsapp") {
          await sendMessageToChat({ variables: { whatsappId: activeContactId, text: text.trim() } });
        } else {
          await sendWhisperMessage({ variables: { whatsappId: activeContactId, text: text.trim() } });
        }
      } catch (err) {
        console.error("Failed to send live WhatsApp message:", err);
      }
      return;
    }

    const { newMessage, replyMessage, contactPreview, replyPreview } = buildMockReply({
      contactId: activeContact.id,
      text,
      audio,
      image,
    });

    setMessagesByContact((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMessage],
    }));

    setContacts((prev) =>
      prev.map((c) => (c.id === activeContact.id ? { ...c, ...contactPreview } : c)),
    );

    setTimeout(() => {
      setMessagesByContact((prev) => ({
        ...prev,
        [activeContact.id]: [...(prev[activeContact.id] || []), replyMessage],
      }));
      setContacts((prev) =>
        prev.map((c) => (c.id === activeContact.id ? { ...c, ...replyPreview } : c)),
      );
    }, MOCK_REPLY_DELAY_MS);
  };

  const handleSendSticker = (_sticker: "brain" | "rocket" | "success") => {
    if (!activeContact || isWhatsAppMode) return;
    const stickerMessage = buildStickerMessage(activeContact.id);
    setMessagesByContact((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), stickerMessage],
    }));
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id ? { ...c, lastMessage: "🎨 Sticker", time: "Just now" } : c,
      ),
    );
  };

  return {
    contacts,
    setContacts,
    activeContactId,
    setActiveContactId,
    isWhatsAppMode,
    setIsWhatsAppMode,
    searchQuery,
    setSearchQuery,
    isSidebarOpen,
    setIsSidebarOpen,
    isActionPanelOpen,
    setIsActionPanelOpen,
    chatChannel,
    setChatChannel,
    activeTab,
    setActiveTab,
    connectionStatus,
    refetchConnection,
    activeContact,
    activeMessages,
    handleSelectContact,
    handleSendMessage,
    handleSendSticker,
    currentSessionStatus: currentSession?.status,
    refetchSessions,
  };
};
