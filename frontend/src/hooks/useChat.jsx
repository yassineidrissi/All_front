// import { createContext, useContext, useEffect, useState } from "react";

// const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

// const ChatContext = createContext();

// export const ChatProvider = ({ children }) => {
//     const chat = async (message) => {
//         setLoading(true);
//         const data = await fetch(`${backendUrl}/chat`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ message }),
//         });
//         const resp = (await data.json()).messages;
//         setMessages((messages) => [...messages, ...resp]);
//         setLoading(false);
//     };
//     const [messages, setMessages] = useState([]);
//     const [message, setMessage] = useState();
//     const [loading, setLoading] = useState(false);
//     const [cameraZoomed, setCameraZoomed] = useState(true);
//     const onMessagePlayed = () => {
//         setMessages((messages) => messages.slice(1));
//     };

//     useEffect(() => {
//         if (messages.length > 0) {
//             setMessage(messages[0]);
//         } else {
//             setMessage(null);
//         }
//     }, [messages]);

//     return (
//         <ChatContext.Provider
//             value={{
//                 chat,
//                 message,
//                 onMessagePlayed,
//                 loading,
//                 cameraZoomed,
//                 setCameraZoomed,
//             }}
//         >
//             {children}
//         </ChatContext.Provider>
//     );
// };

// export const useChat = () => {
//     const context = useContext(ChatContext);
//     if (!context) {
//         throw new Error("useChat must be used within a ChatProvider");
//     }
//     return context;
// };

import React, { createContext, useContext, useEffect, useState, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
    useAnimations,
    useGLTF,
    Loader,
    CameraControls,
    ContactShadows,
    Environment,
    Text
} from "@react-three/drei";
import * as THREE from "three";

// Mock backend URL - replace with your actual backend
const backendUrl = "http://localhost:3000";

// Chat Context
const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState();
    const [loading, setLoading] = useState(false);
    const [cameraZoomed, setCameraZoomed] = useState(true);

    const chat = async (message) => {
        if (!message.trim()) return;

        setLoading(true);

        // Mock response - replace with actual API call
        setTimeout(() => {
            const mockResponse = {
                messages: [{
                    text: `You said: ${message}`,
                    animation: "Talking",
                    facialExpression: "smile",
                    audio: "", // Base64 audio data would go here
                    lipsync: {
                        mouthCues: [
                            { start: 0, end: 0.5, value: "A" },
                            { start: 0.5, end: 1.0, value: "B" },
                            { start: 1.0, end: 1.5, value: "C" }
                        ]
                    }
                }]
            };

            setMessages(prev => [...prev, ...mockResponse.messages]);
            setLoading(false);
        }, 1000);

        // Uncomment this for real API calls:
        /*
        try {
          const response = await fetch(`${backendUrl}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
          });
          
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          
          const data = await response.json();
          setMessages(prev => [...prev, ...data.messages]);
        } catch (error) {
          console.error('Chat error:', error);
          // Handle error appropriately
        } finally {
          setLoading(false);
        }
        */
    };

    const onMessagePlayed = () => {
        setMessages(messages => messages.slice(1));
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
