import { createContext, useContext, useEffect, useState } from "react";

import { API_URL } from "../config";
import { measureTFFT } from "../metrics/latency.ts";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const chat = async (message) => {
    setLoading(true);
    let tfft = null;
    try {
      const { tfftMs, fullText } = await measureTFFT(`${API_URL}/api/tts/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      tfft = tfftMs;

      const resp = (JSON.parse(fullText).messages) || [];
      setMessages((messages) => [...messages, ...resp]);
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
    return tfft;
  };
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <ChatContext.Provider
      value={{
        chat,
        message,
        onMessagePlayed,
        loading,
        cameraZoomed,
        setCameraZoomed,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};