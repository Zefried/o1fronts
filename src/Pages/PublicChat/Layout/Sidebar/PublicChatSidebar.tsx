import React from 'react';
import { Menu, Plus, MessageSquare, Compass, Bookmark, User } from "lucide-react";
import "./Styles/PublicChatSidebar.css";

interface PublicChatSidebarProps {
  onNewChat: () => void;
}

export const PublicChatSidebar: React.FC<PublicChatSidebarProps> = ({ onNewChat }) => {
  return (
    <aside className="public-chat-sidebar">
      <div className="sidebar-header">
        <Menu className="sidebar-menu-icon" size={24} />
        <h1 className="sidebar-logo">JustAsk<span>.</span></h1>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <Plus size={18} /> New Chat
      </button>

      <nav className="sidebar-nav">
        <div className="nav-item active"><MessageSquare size={18} /> Chats</div>
        <div className="nav-item"><Compass size={18} /> Explore</div>
        <div className="nav-item"><Bookmark size={18} /> Saved</div>
        <div className="nav-item"><User size={18} /> Profile</div>
      </nav>
    </aside>
  );
};
