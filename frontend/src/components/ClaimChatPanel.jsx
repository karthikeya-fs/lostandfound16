import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import API from "../services/api";
import { getStoredUserId } from "../utils/authStorage";

function ClaimChatPanel({ claimId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const myId = getStoredUserId();

  const loadMessages = async () => {
    try {
      const res = await API.get(`/claims/messages/${claimId}`);
      setMessages(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not load messages");
    }
  };

  useEffect(() => {
    if (claimId) loadMessages();
  }, [claimId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      setLoading(true);
      await API.post("/claims/message", { claimId, message: text.trim() });
      setText("");
      await loadMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 bg-slate-900/50 border border-white/10 rounded-2xl p-4">
      <h4 className="text-sm font-bold text-cyan-400 mb-3">Secure claim chat</h4>
      <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-500">No messages yet. Say hello to coordinate pickup.</p>
        ) : (
          messages.map((m) => {
            const sid = m.sender?._id || m.sender;
            const mine = String(sid) === String(myId);
            return (
              <div
                key={m._id}
                className={`text-sm px-3 py-2 rounded-xl max-w-[85%] ${
                  mine
                    ? "ml-auto bg-cyan-500/20 text-cyan-100"
                    : "mr-auto bg-white/10 text-gray-200"
                }`}
              >
                <span className="text-[10px] opacity-60 block mb-0.5">
                  {m.sender?.name || "User"}
                </span>
                {m.message}
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message (no phone numbers)..."
          className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-cyan-500 text-black font-bold rounded-xl text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default ClaimChatPanel;
