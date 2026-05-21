import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiSend } from "react-icons/fi";
import toast from "react-hot-toast";
import API from "../../services/api";
import { useChat } from "../../context/ChatContext";
import { getStoredUserId } from "../../utils/authStorage";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function ChatWindow({ roomId, onBackMobile, onAfterRead }) {
  const { getSocket, connected, joinRoom, leaveRoom, emitTyping, emitStopTyping } =
    useChat();
  const [meta, setMeta] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [typingName, setTypingName] = useState("");
  const bottomRef = useRef(null);
  const typingDebounce = useRef(null);
  const myId = getStoredUserId();

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const loadRoomAndMessages = useCallback(async () => {
    if (!roomId) return;
    try {
      const [roomRes, msgRes] = await Promise.all([
        API.get(`/chat/${roomId}`),
        API.get(`/chat/messages/${roomId}`),
      ]);
      setMeta(roomRes.data);
      setMessages(msgRes.data.messages || []);
      scrollToBottom();
      await API.post(`/chat/mark-read/${roomId}`);
      onAfterRead?.();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load chat");
    }
  }, [roomId, scrollToBottom, onAfterRead]);

  useEffect(() => {
    loadRoomAndMessages();
  }, [loadRoomAndMessages]);

  useEffect(() => {
    if (!roomId || !connected) return undefined;
    joinRoom(roomId);
    return () => leaveRoom(roomId);
  }, [roomId, connected, joinRoom, leaveRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingName, scrollToBottom]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !roomId) return undefined;

    const onReceive = (msg) => {
      if (msg.chatRoomId !== roomId && String(msg.chatRoomId) !== String(roomId)) return;
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      const rid = msg.receiverId || msg.receiver?._id;
      if (rid && myId && String(rid) === String(myId)) {
        socket.emit("seenMessage", { roomId, messageIds: [msg._id] });
      }
      scrollToBottom();
    };

    const onTyping = (payload) => {
      if (payload.roomId !== roomId) return;
      if (payload.userId === myId) return;
      setTypingName(payload.userName || "Someone");
    };

    const onStop = (payload) => {
      if (payload.roomId !== roomId) return;
      setTypingName("");
    };

    const onDelivered = (payload) => {
      if (String(payload.chatRoomId) !== String(roomId)) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(payload.messageId)
            ? { ...m, deliveryStatus: payload.deliveryStatus || "delivered" }
            : m
        )
      );
    };

    const onSeen = (payload) => {
      if (payload.chatRoomId !== roomId) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m.senderId) === String(myId) || m.sender?._id === myId
            ? { ...m, deliveryStatus: "read", isSeen: true }
            : m
        )
      );
    };

    socket.on("receiveMessage", onReceive);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStop);
    socket.on("messageDelivered", onDelivered);
    socket.on("messagesSeen", onSeen);

    return () => {
      socket.off("receiveMessage", onReceive);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStop);
      socket.off("messageDelivered", onDelivered);
      socket.off("messagesSeen", onSeen);
    };
  }, [getSocket, roomId, myId, scrollToBottom]);

  const send = async () => {
    const text = input.trim();
    if (!text || !roomId) return;
    setInput("");
    emitStopTyping(roomId);
    const socket = getSocket();
    if (socket && connected) {
      socket.emit("sendMessage", { roomId, text }, (ack) => {
        if (!ack?.ok) {
          toast.error(ack?.message || "Send failed");
        } else if (ack.data) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === ack.data._id)) return prev;
            return [...prev, ack.data];
          });
        }
      });
    } else {
      try {
        const res = await API.post("/chat/send", { chatRoomId: roomId, text });
        const data = res.data?.data;
        if (data) {
          setMessages((prev) => [...prev, data]);
        }
      } catch (e) {
        toast.error(e.response?.data?.message || "Send failed");
      }
    }
  };

  const onInputChange = (e) => {
    setInput(e.target.value);
    if (!roomId) return;
    emitTyping(roomId);
    if (typingDebounce.current) clearTimeout(typingDebounce.current);
    typingDebounce.current = setTimeout(() => emitStopTyping(roomId), 1200);
  };

  if (!roomId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-[var(--text-muted)] text-center">
        Select a conversation or start one from an item page.
      </div>
    );
  }

  const other = meta?.otherUser;

  return (
    <section className="flex flex-col flex-1 min-h-0 min-w-0 bg-[var(--bg)]">
      <header className="shrink-0 flex items-center gap-3 px-3 py-3 border-b border-[var(--border)] bg-[var(--surface)]">
        <button
          type="button"
          className="md:hidden p-2 rounded-xl hover:bg-white/10 text-[var(--text)]"
          onClick={onBackMobile}
          aria-label="Back to list"
        >
          <FiArrowLeft />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-[var(--text)] truncate">{other?.name || "Chat"}</h1>
          <p className="text-xs text-[var(--text-muted)] truncate">
            {meta?.item?.title || "Campus Lost & Found"}
            {!connected ? " · reconnecting…" : ""}
          </p>
        </div>
        <Link
          to={`/item/${meta?.room?.lostItemId || meta?.item?._id || ""}`}
          className="text-xs text-cyan-400 hover:underline shrink-0"
        >
          View item
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 px-3 py-4 space-y-1">
        {messages.map((m) => (
          <MessageBubble
            key={m._id}
            message={m}
            isOwn={String(m.sender?._id || m.senderId) === String(myId)}
          />
        ))}
        {typingName ? <TypingIndicator name={typingName} /> : null}
        <div ref={bottomRef} />
      </div>

      <footer className="shrink-0 p-3 border-t border-[var(--border)] bg-[var(--surface)]">
        <div className="flex gap-2 items-end max-w-4xl mx-auto">
          <textarea
            rows={1}
            value={input}
            onChange={onInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message…"
            className="flex-1 resize-none rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40 max-h-32"
          />
          <button
            type="button"
            onClick={send}
            className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-black font-bold shadow-lg hover:opacity-90 transition-opacity"
            aria-label="Send"
          >
            <FiSend />
          </button>
        </div>
      </footer>
    </section>
  );
}
