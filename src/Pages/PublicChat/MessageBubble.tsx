import React from "react";
import { formatTime, type ChatMessage } from "./PublicChat";

export const MessageBubble = ({ msg }: { msg: ChatMessage }) => {
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
