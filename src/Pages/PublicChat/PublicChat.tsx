import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Send } from "lucide-react";
import { PublicChatSidebar } from "./Layout/Sidebar/PublicChatSidebar";
import api from "../../api/axios";
import "./Styles/PublicChat.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Sure! I can help you find the best services. Let me know what you are looking for.",
  timestamp: new Date(),
};

const AnimatedDots = ({ text }: { text: string }) => {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <span>{text}{dots}</span>;
};

const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`chat-message-row ${isUser ? "user" : "ai"}`}>
      <div className="chat-bubble">
        {msg.content.split("\n").map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < msg.content.split("\n").length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
      <span className="chat-timestamp">{formatTime(msg.timestamp)}</span>
    </div>
  );
};

export const PublicChat = () => {
  const { token } = useParams<{ token: string }>();
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [typingStatus, setTypingStatus] = useState<'none' | 'just_a_sec...' | 'typing'>('none');
  const [contextState, setContextState] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) {
      try {
        const decoded = atob(token);
        const parts = decoded.split("||");
        const id = parts[0];
        setBusinessId(id);
        
        const storedContext = localStorage.getItem(`chat_context_${id}`);
        if (storedContext) {
          setContextState(JSON.parse(storedContext));
        }
      } catch (e) {
        console.error("Invalid token");
      }
    }
  }, [token]);

  // Sync context state to local storage
  useEffect(() => {
    if (businessId && contextState) {
      localStorage.setItem(`chat_context_${businessId}`, JSON.stringify(contextState));
    }
  }, [contextState, businessId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingStatus]);

  // Initial request when component mounts and businessId is ready
  useEffect(() => {
    if (businessId) {
      const fetchInitialGreeting = async () => {
        setTypingStatus('just_a_sec...');
          try {
          const res = await api.post('/public/chat', {
            // We send an initial trigger message so the AI can greet us
            message: "Hello",
            chat: [],
            business_id: businessId,
            campaign_link: window.location.href,
            context_state: contextState
          });

          if (res.data.status && res.data.data?.reply) {
            setMessages([
              {
                id: generateId(),
                role: "assistant",
                content: res.data.data.reply,
                timestamp: new Date(),
              }
            ]);
            
            if (res.data.data.context_state) {
              setContextState(res.data.data.context_state);
              
              const demand = res.data.data.context_state.businessContext?.backendData?.UserServiceDemand;
              if (demand) {
                localStorage.setItem('userDemandService', demand);
              }
            }
          }
        } catch (err) {
          console.error("Failed to fetch initial greeting", err);
        } finally {
          setTypingStatus('none');
        }
      };

      fetchInitialGreeting();
    }
  }, [businessId]);

  const handleClearChat = () => {
    setMessages([
      {
        ...WELCOME_MESSAGE,
        id: generateId(),
        timestamp: new Date(),
      },
    ]);
    setContextState(null);
    if (businessId) {
      localStorage.removeItem(`chat_context_${businessId}`);
    }
    inputRef.current?.focus();
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || typingStatus !== 'none' || !businessId) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTypingStatus('just_a_sec...');
    inputRef.current?.focus();

    const timerId = setTimeout(() => {
      setTypingStatus(prev => prev === 'just_a_sec...' ? 'typing' : prev);
    }, 2000);

    try {
      const res = await api.post('/public/chat', {
        message: text,
        chat: messages.map(m => ({ role: m.role, content: m.content })),
        business_id: businessId,
        campaign_link: window.location.href,
        context_state: contextState
      });
      const data = res.data;

      let replyContent = "Sorry, I am unable to fulfill that request right now.";
      if (data.status && data.data?.reply) {
        replyContent = data.data.reply;
        if (data.data.context_state) {
          setContextState(data.data.context_state);
        }
      }

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: replyContent,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "Network error. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      clearTimeout(timerId);
      setTypingStatus('none');
    }
  }, [input, typingStatus, messages, businessId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!businessId) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#fff', background: '#000', height: '100vh' }}>Invalid Chat Session.</div>;
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
          <div className="chat-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={typingStatus !== 'none'}
              autoComplete="off"
            />
            <button
              className="send-btn"
              onClick={handleSend}
              disabled={!input.trim() || typingStatus !== 'none'}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
