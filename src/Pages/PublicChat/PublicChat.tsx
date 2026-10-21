import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { PublicChatSidebar } from "./Layout/Sidebar/PublicChatSidebar";
import api from "../../api/axios";
import "./Styles/PublicChat.css";

import { AnimatedDots } from "./AnimatedDots";
import { MessageBubble } from "./MessageBubble";
import { type ChatMessage, generateId } from "./chatTypes";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Hello! How can I help you today?",
  timestamp: new Date(),
};

export const PublicChat = () => {
  const { token } = useParams<{ token: string }>();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [isOptionSelected, setIsOptionSelected] = useState<boolean>(false);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(true);

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [typingStatus, setTypingStatus] = useState<'none' | 'just_a_sec...' | 'typing'>('none');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session from backend using token
  useEffect(() => {
    if (!token) {
      setIsLoadingSession(false);
      return;
    }

    setIsLoadingSession(true);
    api.post('/public/chat/session/init', {
      token,
      campaign_link: window.location.href,
    })
      .then(res => {
        if (res.data?.status && res.data?.data) {
          const data = res.data.data;
          setBusinessId(data.business_id);
          if (Array.isArray(data.options)) {
            setOptions(data.options);
          }
          if (data.business_name) {
            setMessages([
              {
                id: "welcome",
                role: "assistant",
                content: `Hii, Welcome to ${data.business_name}`,
                timestamp: new Date(),
              },
            ]);
          }
        }
      })
      .catch(err => {
        console.error("Failed to initialize chat session", err);
      })
      .finally(() => {
        setIsLoadingSession(false);
      });
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingStatus]);

  const handleClearChat = () => {
    setMessages([
      {
        ...WELCOME_MESSAGE,
        id: generateId(),
        timestamp: new Date(),
      },
    ]);
    setIsOptionSelected(false);
  };

  const dispatchMessage = useCallback((text: string) => {
    if (!text || typingStatus !== 'none') return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTypingStatus('just_a_sec...');

    setTimeout(() => {
      setTypingStatus('none');

      let replyContent = "Thank you for reaching out! We received your message and will provide you with all the details shortly.";
      const lower = text.toLowerCase();
      if (lower.includes("price") || lower.includes("pricing")) {
        replyContent = "hey something went wrong on the server, I'll try to connect you with my team, kindly share your phone number.";
      } else if (lower.includes("portfolio")) {
        replyContent = "Thank you for your interest in our portfolio! We take pride in delivering top-quality projects. Our team will share our featured work and design samples with you.";
      }

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: replyContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
      inputRef.current?.focus();
    }, 600);
  }, [typingStatus]);

  const handleSelectOption = (optionText: string) => {
    setIsOptionSelected(true);
    dispatchMessage(optionText);
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !isOptionSelected || typingStatus !== 'none') return;
    dispatchMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoadingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#080808', color: '#fff' }}>
        <AnimatedDots text="Loading chat" />
      </div>
    );
  }

  if (!businessId) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#fff', background: '#080808', height: '100vh' }}>
        Invalid or expired chat session.
      </div>
    );
  }

  return (
    <div className="public-chat-layout">
      <PublicChatSidebar onNewChat={handleClearChat} />

      {/* Main Chat Area */}
      <main className="public-chat-main">
        <div className="chat-messages-container">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {typingStatus === 'just_a_sec...' && (
            <div className="chat-message-row ai loading">
              <div className="chat-bubble">
                <AnimatedDots text="Just a sec" />
              </div>
            </div>
          )}
          {typingStatus === 'typing' && (
            <div className="chat-message-row ai loading">
              <div className="chat-bubble">
                <AnimatedDots text="Typing" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-container">
          {/* Quick-action initial options before user selects */}
          {!isOptionSelected && options.length > 0 && (
            <div className="chat-initial-options" id="chat-initial-options">
              {options.map((opt, idx) => (
                <button
                  key={idx}
                  id={`initial-option-${idx}`}
                  type="button"
                  className="option-pill-btn"
                  onClick={() => handleSelectOption(opt)}
                  disabled={typingStatus !== 'none'}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          <div className={`chat-input-wrapper ${!isOptionSelected ? 'disabled' : ''}`}>
            <input
              ref={inputRef}
              type="text"
              placeholder={isOptionSelected ? "Type your message..." : "Please select an option above to begin..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!isOptionSelected || typingStatus !== 'none'}
              autoComplete="off"
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!isOptionSelected || !input.trim() || typingStatus !== 'none'}
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
