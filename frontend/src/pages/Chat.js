import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { differenceInHours } from "date-fns";
import Header from "./Header";
import "../css/Chat.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";

const Chat = () => {
  const { relationshipId } = useParams();
  const { user: currentUser } = useSelector((state) => state.user);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (editingMessage && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessage]);

  useEffect(() => {
    // --- FIX: Added the fetchMessages function back ---
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/chat/${relationshipId}`,
          {
            credentials: "include",
          }
        );
        const data = await response.json();
        if (response.ok && Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        setMessages([]);
      }
    };

    fetchMessages(); // This call was missing

    const socket = io("http://localhost:5000", { withCredentials: true });
    socketRef.current = socket;

    socket.emit("joinRoom", relationshipId);
    socket.on("receiveMessage", (receivedMessage) =>
      setMessages((prev) => [...prev, receivedMessage])
    );

    socket.on("messageUpdated", (updatedMessage) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        )
      );
    });

    socket.on("actionError", ({ message }) => alert(message));

    return () => socket.disconnect();
  }, [relationshipId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socketRef.current.emit("sendMessage", {
        relationshipId,
        content: newMessage,
      });
      setNewMessage("");
    }
  };

  const handleDelete = (messageId) => {
    socketRef.current.emit("deleteMessage", { messageId });
  };

  const handleSaveEdit = () => {
    if (editingMessage.content.trim()) {
      socketRef.current.emit("editMessage", {
        messageId: editingMessage._id,
        newContent: editingMessage.content,
      });
    }
    setEditingMessage(null);
  };

  const canPerformAction = (message) => {
    if (message.sender._id !== currentUser._id || message.deleted) {
      return false;
    }
    return differenceInHours(new Date(), new Date(message.createdAt)) < 1;
  };

  const renderMessageContent = (msg) => {
    if (editingMessage?._id === msg._id) {
      return (
        <div className="edit-container">
          <input
            ref={editInputRef}
            type="text"
            value={editingMessage.content}
            onChange={(e) =>
              setEditingMessage({ ...editingMessage, content: e.target.value })
            }
            onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
          />
          <button onClick={handleSaveEdit}>Save</button>
          <button onClick={() => setEditingMessage(null)}>Cancel</button>
        </div>
      );
    }
    if (msg.deleted) {
      return <p className="deleted-text">{msg.content}</p>;
    }
    return (
      <p>
        {msg.content}{" "}
        {msg.edited && <span className="edited-tag">(edited)</span>}
      </p>
    );
  };

  return (
    <div className="page-container">
      <Header />
      <div className="chat-page-content">
        <div className="chat-container">
          <div className="messages-list">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`message-wrapper ${
                  msg.sender._id === currentUser._id ? "sent" : "received"
                }`}
                onMouseEnter={() => setHoveredMessageId(msg._id)}
                onMouseLeave={() => setHoveredMessageId(null)}
              >
                <div
                  className={`message-bubble ${msg.deleted ? "deleted" : ""}`}
                >
                  {!msg.deleted && <strong>{msg.sender.name}</strong>}
                  {renderMessageContent(msg)}
                  <span className="timestamp">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {hoveredMessageId === msg._id && canPerformAction(msg) && (
                  <div className="message-actions">
                    <FontAwesomeIcon
                      icon={faEdit}
                      onClick={() => setEditingMessage(msg)}
                    />
                    <FontAwesomeIcon
                      icon={faTrash}
                      onClick={() => handleDelete(msg._id)}
                    />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="message-form">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button type="submit" className="send-button">
              <FontAwesomeIcon icon={faPaperPlane} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;
