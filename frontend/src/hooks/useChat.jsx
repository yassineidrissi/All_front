import { createContext, useContext, useEffect, useState } from "react";

import { API_URL } from "../config";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [timings, setTimings] = useState(null);
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
      setTimings(json.timings || null);
      if (json.timings) console.log("⏱️ Timing data:", json.timings);
      return json.timings;
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setLoading(false);
    }
  };
  const saveSimulation = async (
    prompt,
    timeSpentSeconds,
    timingData,
    token,
    userId
  ) => {
    const ipqScore = localStorage.getItem("ipqScore");
    console.log("🚀 Sending simulation:", {
      prompt,
      timeSpentSeconds,
      timingData,
      ipqScore,
    });
    try {
      await fetch(`${API_URL}/api/auth/simulation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId,
          prompt,
          timeSpentSeconds: Number(timeSpentSeconds),
          timings: timingData,
          ipqScore: ipqScore ? Number(ipqScore) : null,
        }),
      });
    } catch (err) {
      console.error("Simulation save error:", err);
    }
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
        timings,
        saveSimulation,
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