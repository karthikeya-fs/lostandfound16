import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import ChatList from "../components/chat/ChatList";
import ChatWindow from "../components/chat/ChatWindow";

/**
 * In-app messaging (finder ↔ approved claimant). Routes: /messages, /messages/:roomId
 */
export default function Messages() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/chat/my-rooms");
      setRooms(res.data.rooms || []);
    } catch {
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return (
    <div className="min-h-screen theme-bg pt-20 md:pt-24 pb-6 px-3 md:px-6">
      <div className="max-w-6xl mx-auto h-[calc(100vh-5.5rem)] md:h-[calc(100vh-7rem)] flex rounded-2xl overflow-hidden border border-[var(--border)] shadow-xl bg-[var(--surface)]">
        <div className="flex flex-1 min-h-0 min-w-0">
          {/* Mobile: list OR chat; Desktop: both */}
          <div
            className={`${
              roomId ? "hidden md:flex" : "flex"
            } w-full md:w-80 shrink-0 min-h-0 flex-col border-r border-[var(--border)]`}
          >
            <ChatList rooms={rooms} loading={loading} selectedRoomId={roomId} />
          </div>
          <div
            className={`${
              !roomId ? "hidden md:flex" : "flex"
            } flex-1 min-h-0 flex-col`}
          >
            <ChatWindow
              roomId={roomId}
              onBackMobile={() => navigate("/messages")}
              onAfterRead={fetchRooms}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
