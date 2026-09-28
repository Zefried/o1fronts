import { useState, useEffect, useRef, useCallback } from "react";
import api from "../../../api/axios";
import { sendMessage, type ChatMessage, type ChatContext } from "../../../api/chatService";
import "./Styles/Playground.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlatCategory {
  id: number;
  name: string;
  label: string;
  depth: number;
}

interface ServiceOption {
  id: number;
  name: string;
  category_id: number | null;
}

interface AttributeOption {
  id: number;
  name: string;
  category_id: number | null;
}

interface ContextRecord {
  id: number;
  business_id: string;
  service_name: string;
  attribute_definition: string;
  context: string;
  prompt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hey! 👋 let's talk about your requirement",
  timestamp: new Date(),
};

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator = () => (
  <div className="pg-msg pg-msg--ai">
    <div className="pg-avatar">AI</div>
    <div className="pg-bubble pg-bubble--ai pg-bubble--typing">
      <span className="pg-dot" />
      <span className="pg-dot" />
      <span className="pg-dot" />
    </div>
  </div>
);

// ─── Message Bubble ───────────────────────────────────────────────────────────

const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`pg-msg ${isUser ? "pg-msg--user" : "pg-msg--ai"}`}>
      {!isUser && <div className="pg-avatar">AI</div>}
      <div className={`pg-bubble-wrap ${isUser ? "pg-bubble-wrap--user" : ""}`}>
        <div className={`pg-bubble ${isUser ? "pg-bubble--user" : "pg-bubble--ai"}`}>
          {msg.content.split("\n").map((line, i) => (
            <span key={i}>
              {line}
              {i < msg.content.split("\n").length - 1 && <br />}
            </span>
          ))}
        </div>
        <span className={`pg-time ${isUser ? "pg-time--right" : ""}`}>
          {formatTime(msg.timestamp)}
        </span>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const Playground = () => {
  // Options
  const [categories, setCategories] = useState<FlatCategory[]>([]);
  const [mode, setMode] = useState<"general" | "context">("general");
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [attributes, setAttributes] = useState<AttributeOption[]>([]);

  // Selection
  const [categoryId, setCategoryId] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedAttribute, setSelectedAttribute] = useState("");

  // Context Data
  const [activeContext, setActiveContext] = useState<ContextRecord | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDebug, setShowDebug] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Load option lists ──
  useEffect(() => {
    const load = async () => {
      try {
        const [catRes, svcRes, attrRes] = await Promise.all([
          api.get("/admin/categories/flat"),
          api.get("/admin/services"),
          api.get("/admin/attributes"),
        ]);
        if (catRes.data.status) setCategories(catRes.data.data);
        if (svcRes.data.status) setServices(svcRes.data.data);
        if (attrRes.data.status) setAttributes(attrRes.data.data);
      } catch {
        // silent
      }
    };
    load();
  }, []);

  // ── Filter dropdowns ──
  const filteredServices = categoryId
    ? services.filter((s) => s.category_id === Number(categoryId))
    : services;

  const filteredAttributes = categoryId
    ? attributes.filter((a) => a.category_id === Number(categoryId))
    : attributes;

  const handleCategoryChange = (val: string) => {
    setCategoryId(val);
    setSelectedService("");
    setSelectedAttribute("");
    setActiveContext(null);
  };

  // ── Fetch Context ──
  useEffect(() => {
    if (!selectedService || !selectedAttribute) {
      setActiveContext(null);
      return;
    }

    const fetchContext = async () => {
      setLoadingContext(true);
      try {
        const res = await api.get("/admin/ai-contexts", {
          params: {
            service_name: selectedService,
            attribute_definition: selectedAttribute,
          },
        });
        if (res.data.status && res.data.data.length > 0) {
          setActiveContext(res.data.data[0]);
        } else {
          setActiveContext(null);
        }
      } catch {
        setActiveContext(null);
      } finally {
        setLoadingContext(false);
      }
    };

    fetchContext();
  }, [selectedService, selectedAttribute]);

  // ── Auto-scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send ──
  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    inputRef.current?.focus();

    try {
      const context: ChatContext = {
        mode,
        service: selectedService,
        attribute: selectedAttribute,
        contextText: activeContext?.context,
        promptText: activeContext?.prompt,
      };

      const reply = await sendMessage(text, messages, context);

      const aiMsg: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "Something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }, [input, isTyping, messages, selectedService, selectedAttribute, activeContext, mode]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        ...WELCOME_MESSAGE,
        id: generateId(),
        timestamp: new Date(),
      },
    ]);
    inputRef.current?.focus();
  };

  return (
    <div className="pg">
      {/* ── Left: Chat Area ───────────────────────────────────── */}
      <div className="pg-main">
        {/* Top Bar (minimal now) */}
        <div className="pg-top">
          <div className="pg-top__left"></div>
          <div className="pg-top__right">
            <button
              id="pg-debug-toggle"
              className={`pg-top-btn ${showDebug ? "pg-top-btn--active" : ""}`}
              onClick={() => setShowDebug((v) => !v)}
              title="Toggle debug panel"
            >
              🐞 Debug
            </button>
            <button
              id="pg-new-chat"
              className="pg-top-btn pg-top-btn--clear"
              onClick={handleClearChat}
              title="Start new chat"
            >
              ✦ New Chat
            </button>
          </div>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="pg-debug">
            <span className="pg-debug__label">Active Context:</span>
            <span className="pg-debug__chip">
              service: <strong>{selectedService || "none"}</strong>
            </span>
            <span className="pg-debug__chip">
              attribute: <strong>{selectedAttribute || "none"}</strong>
            </span>
            <span className="pg-debug__chip">
              context ID: <strong>{activeContext ? activeContext.id : "none"}</strong>
            </span>
            <span className="pg-debug__note">⚠️ sendMessage() is mocked</span>
          </div>
        )}

        {/* Messages */}
        <div className="pg-messages">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar (no mic) */}
        <div className="pg-input-bar">
          <div className="pg-input-pill">
            <button id="pg-plus" className="pg-icon-btn pg-icon-btn--plus" title="Attach">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>

            <input
              ref={inputRef}
              id="pg-input"
              type="text"
              className="pg-input"
              placeholder="Ask anything…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              autoComplete="off"
            />

            <button
              id="pg-send"
              className={`pg-send-btn ${input.trim() ? "pg-send-btn--active" : ""}`}
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              title="Send"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Sidebar Context Selector ───────────────────── */}
      <div className="pg-sidebar">
        <h3 className="pg-sidebar__title">AI Configuration</h3>

        <div className="pg-mode-toggle">
          <button
            className={`pg-mode-btn ${mode === "general" ? "pg-mode-btn--active" : ""}`}
            onClick={() => setMode("general")}
          >
            General Mode
          </button>
          <button
            className={`pg-mode-btn ${mode === "context" ? "pg-mode-btn--active" : ""}`}
            onClick={() => setMode("context")}
          >
            Context Mode
          </button>
        </div>

        <p className="pg-sidebar__subtitle">
          {mode === "general"
            ? "Chatting naturally without specific business context constraints."
            : "Select a service and attribute to test that specific context."}
        </p>

        <div className={`pg-sidebar__form ${mode === "general" ? "pg-sidebar__form--disabled" : ""}`}>
          {/* Category */}
          <div className="pg-selector-wrap">
            <label className="pg-selector-label">1. Category</label>
            <select
              className="pg-selector"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="">— Select Category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Service */}
          <div className="pg-selector-wrap">
            <label className="pg-selector-label">2. Service Name</label>
            <select
              className={`pg-selector ${!categoryId ? "pg-selector--dim" : ""}`}
              value={selectedService}
              onChange={(e) => { setSelectedService(e.target.value); setActiveContext(null); }}
              disabled={!categoryId}
            >
              <option value="">
                {!categoryId ? "— Select category first" : filteredServices.length === 0 ? "— No services" : "— Select service"}
              </option>
              {filteredServices.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Attribute */}
          <div className="pg-selector-wrap">
            <label className="pg-selector-label">3. Attribute</label>
            <select
              className={`pg-selector ${!categoryId ? "pg-selector--dim" : ""}`}
              value={selectedAttribute}
              onChange={(e) => { setSelectedAttribute(e.target.value); setActiveContext(null); }}
              disabled={!categoryId}
            >
              <option value="">
                {!categoryId ? "— Select category first" : filteredAttributes.length === 0 ? "— No attributes" : "— Select attribute"}
              </option>
              {filteredAttributes.map((a) => (
                <option key={a.id} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <hr className="pg-divider" />

        {/* Display Fetched Context */}
        <div className="pg-context-display">
          <h4 className="pg-sidebar__label">Loaded Context Data</h4>

          {loadingContext ? (
            <div className="pg-context-msg">Fetching from DB...</div>
          ) : !selectedService || !selectedAttribute ? (
            <div className="pg-context-msg">Select a service and attribute to load context.</div>
          ) : !activeContext ? (
            <div className="pg-context-msg pg-context-msg--empty">No context record found in DB for this combination.</div>
          ) : (
            <div className="pg-context-cards">
              <div className="pg-ctx-card">
                <div className="pg-ctx-header">Context</div>
                <div className="pg-ctx-body">{activeContext.context}</div>
              </div>
              <div className="pg-ctx-card">
                <div className="pg-ctx-header">Prompt</div>
                <div className="pg-ctx-body">{activeContext.prompt}</div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
