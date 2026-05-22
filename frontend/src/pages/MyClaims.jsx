import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiPackage, FiClock, FiCheckCircle, FiXCircle } from "react-icons/fi";
import API from "../services/api";

const statusLabel = {
  pending: "Pending OTP",
  verified: "Waiting for finder",
  awaiting_final: "Awaiting final handover",
  approved: "Approved",
  rejected: "Rejected",
};

function MyClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/claims/my")
      .then((res) => setClaims(res.data || []))
      .catch(() => {
        toast.error("Failed to load your claims");
        setClaims([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/40 to-black text-white px-6 pt-28 pb-20">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-300 to-teal-400 bg-clip-text text-transparent mb-2">
          My Claims
        </h1>
        <p className="text-gray-400 text-sm mb-10">Track ownership claims you submitted on found items.</p>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : claims.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <FiPackage className="text-4xl text-cyan-400 mx-auto mb-4 opacity-70" />
            <p className="text-gray-400">You have not submitted any claims yet.</p>
            <Link to="/found-items" className="inline-block mt-4 text-cyan-400 hover:underline font-medium">
              Browse found items
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => {
              const item = claim.item || {};
              const st = claim.status || "pending";
              return (
                <div
                  key={claim._id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="font-bold text-white">{item.title || "Item"}</h3>
                    <p className="text-sm text-gray-400 mt-1">{item.location}</p>
                    <p className="text-xs text-cyan-400/80 mt-2 flex items-center gap-1">
                      {st === "approved" ? <FiCheckCircle /> : st === "rejected" ? <FiXCircle /> : <FiClock />}
                      {statusLabel[st] || st}
                    </p>
                  </div>
                  {item._id && (
                    <Link
                      to={`/item/${item._id}`}
                      className="text-sm font-bold text-cyan-400 hover:text-cyan-300 shrink-0"
                    >
                      View item →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyClaims;
