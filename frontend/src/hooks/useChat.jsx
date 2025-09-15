import { createContext, useContext, useEffect, useState } from "react";

import { API_URL } from "../config";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const chat = async (message) => {
    setLoading(true);
    try {
      const data = await fetch(`${API_URL}/api/tts/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!data.ok) throw new Error(`Request failed with ${data.status}`);

      const json = await data.json();
      const resp = json.messages || [];
      setMessages((messages) => [...messages, ...resp]);
      if (json.timings) {
        setTimings(json.timings);
        console.log("⏱️ API timings:", json.timings);
      }
      return json.timings;
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);
  const [cameraZoomed, setCameraZoomed] = useState(true);
  const [timings, setTimings] = useState(null);
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
        timings,
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