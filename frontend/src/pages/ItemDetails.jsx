import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import API, { assetUrl } from "../services/api";
import { getStoredUserId } from "../utils/authStorage";
import {
  FiEyeOff,
  FiCheck,
  FiX,
  FiMessageSquare,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiMapPin,
  FiTag,
  FiDollarSign,
  FiPhone,
  FiLock,
  FiInfo,
} from "react-icons/fi";

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [claimMessage, setClaimMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [claims, setClaims] = useState([]);
  const [myClaim, setMyClaim] = useState(null);

  useEffect(() => {
    fetchItem();
    fetchClaims();
  }, [id]);

  const fetchItem = async () => {
    try {
      const res = await API.get(`/items/${id}`);
      setItem(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load item details");
    }
  };

  const fetchClaims = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await API.get(`/claims/item/${id}`);
      setClaims(res.data);
      // Find my claim
      const myId = getStoredUserId();
      const mine = res.data.find(
        (c) => String(c.claimantUserId?._id || c.claimantUserId) === String(myId)
      );
      setMyClaim(mine || null);
    } catch (err) {
      console.error("Error fetching claims:", err);
    }
  };

  const handleClaim = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to submit a claim.");
      return navigate("/login");
    }
    if (!claimMessage.trim()) {
      toast.error("Please describe why this item is yours.");
      return;
    }
    try {
      setBusy(true);
      await API.post("/claims/create", {
        itemId: id,
        message: claimMessage.trim(),
      });
      toast.success("Claim submitted successfully!");
      setClaimMessage("");
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || "Claim failed");
    } finally {
      setBusy(false);
    }
  };

  const handleReviewClaim = async (claimId, newStatus) => {
    try {
      setBusy(true);
      await API.put(`/claims/${claimId}`, { status: newStatus });
      toast.success(`Claim has been ${newStatus}!`);
      fetchClaims();
      fetchItem();
    } catch (error) {
      toast.error(error.response?.data?.message || "Review action failed");
    } finally {
      setBusy(false);
    }
  };

  const openChat = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to open chat.");
      return navigate("/login");
    }
    try {
      setBusy(true);
      const res = await API.post("/chat/create-room", { itemId: id });
      const roomId = res.data?.room?._id;
      if (roomId) {
        navigate(`/messages/${roomId}`);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Chat is only available between the item owner and the approved claimant."
      );
    } finally {
      setBusy(false);
    }
  };

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const cover = item.images?.[0] ? assetUrl(item.images[0]) : "";
  const myId = getStoredUserId();
  const ownerId = item.postedBy?._id || item.postedBy;
  const isOwner = myId && ownerId && String(ownerId) === String(myId);

  // Check if image should be blurred
  const isClaimApproved = myClaim && myClaim.status === "approved";
  const shouldBlur = item.blurImage && !isOwner && !isClaimApproved;

  // Format date elegantly
  const dateFormatted = item.date
    ? new Date(item.date).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-black px-6 pt-28 pb-16 text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-[10%] right-[-10%] w-[350px] h-[350px] bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="max-w-4xl mx-auto z-10 relative">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Main Cover with Smart Blur */}
          {cover ? (
            <div className="relative overflow-hidden aspect-video max-h-96 w-full bg-slate-950 flex items-center justify-center border-b border-white/10 shadow-inner group">
              <img
                src={cover}
                alt=""
                className={`w-full h-full object-cover transition-all duration-700 ${
                  shouldBlur ? "blur-2xl scale-110 opacity-50 select-none pointer-events-none" : "group-hover:scale-101"
                }`}
              />
              {shouldBlur && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-center gap-3">
                  <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <FiLock className="text-red-400 text-xl" />
                  </div>
                  <h3 className="text-white font-bold text-lg tracking-wide uppercase">Sensitive Item Details Blurred</h3>
                  <p className="text-gray-300 text-xs max-w-md leading-relaxed">
                    This item has been flagged for privacy protection. To inspect the full, clear image, please submit an ownership claim below describing unique identifiers (e.g. your name on ID card, specific keychains).
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full aspect-video max-h-56 bg-slate-950/60 flex flex-col items-center justify-center border-b border-white/10 gap-2">
              <FiEyeOff className="text-gray-600 text-3xl" />
              <span className="text-gray-400 text-sm italic">No image provided</span>
            </div>
          )}

          {/* Details Content */}
          <div className="p-8 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                  item.type === "lost"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                }`}
              >
                {item.type}
              </span>
              <span className="text-xs text-gray-500">
                Posted by {isOwner ? "You" : item.postedBy?.name || "Anonymous Finder"}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 text-white">
              {item.title}
            </h1>
            
            <p className="text-gray-300 leading-relaxed text-sm md:text-base mb-8 bg-white/5 border border-white/5 p-4 rounded-xl">
              {item.description}
            </p>

            {/* Quick Specs Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8 bg-slate-900/40 border border-white/5 p-6 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-cyan-400 shrink-0">
                  <FiMapPin />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Location</p>
                  <p className="text-xs text-white font-medium">{item.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-cyan-400 shrink-0">
                  <FiCalendar />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date & Time</p>
                  <p className="text-xs text-white font-medium">{dateFormatted}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/5 rounded-lg flex items-center justify-center text-cyan-400 shrink-0">
                  <FiTag />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Category</p>
                  <p className="text-xs text-white font-medium capitalize">{item.category}</p>
                </div>
              </div>

              {item.reward && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-400 shrink-0">
                    <FiDollarSign />
                  </div>
                  <div>
                    <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Reward</p>
                    <p className="text-xs text-amber-300 font-extrabold">{item.reward}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Communication Controls */}
            <div className="flex flex-col gap-6 border-t border-white/10 pt-8">
              
              {/* Claimant Claims Status or Claim Submit Form */}
              {!isOwner ? (
                <div>
                  {myClaim ? (
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                          <FiInfo className="text-cyan-400" />
                          Your Ownership Claim Status
                        </h4>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          Your verification message: <span className="italic text-gray-300">"{myClaim.message}"</span>
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {myClaim.status === "pending" && (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            Pending Approval
                          </span>
                        )}
                        {myClaim.status === "approved" && (
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase">
                            <FiCheckCircle />
                            Claim Approved
                          </span>
                        )}
                        {myClaim.status === "rejected" && (
                          <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full uppercase">
                            <FiAlertCircle />
                            Claim Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleClaim} className="flex flex-col gap-3 bg-slate-900/40 border border-white/5 p-6 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-white text-sm mb-1">Claim this item</h4>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          Describe distinct details of this item (marks, content, case labels) to verify your ownership.
                        </p>
                      </div>
                      <textarea
                        value={claimMessage}
                        onChange={(e) => setClaimMessage(e.target.value)}
                        placeholder="e.g. My wallet has a student ID card with name Mahesh Naidu and a metro pass inside..."
                        rows={3}
                        required
                        className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={busy}
                        className="form-btn-primary py-3 font-semibold"
                      >
                        Submit Ownership Claim
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/30 border border-white/5 p-4 rounded-xl text-center text-xs text-gray-400">
                  <FiInfo className="inline-block text-cyan-400 mr-1.5 text-sm" />
                  You posted this item. You can review pending student claims below.
                </div>
              )}

              {/* Chat action button */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-2xl p-5">
                <div className="text-center sm:text-left">
                  <h4 className="text-white font-bold text-sm">Secure Campus Chat</h4>
                  <p className="text-gray-400 text-xs">
                    Connect directly with the finder or claimant. Locked until a claim is verified.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={openChat}
                  disabled={busy || (!isOwner && (!myClaim || myClaim.status !== "approved"))}
                  className="px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:-translate-y-0 text-xs uppercase tracking-wider shrink-0"
                >
                  <FiMessageSquare className="inline-block mr-1.5 text-sm" />
                  Open Secure Chat
                </button>
              </div>
            </div>

            {/* OWNER REVIEW CONSOLE */}
            {isOwner && (
              <div className="mt-10 border-t border-white/10 pt-10 text-left">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FiCheckCircle className="text-cyan-400" />
                  Claims Verification Console
                </h3>
                
                {claims.length === 0 ? (
                  <div className="bg-slate-900/20 border border-dashed border-white/10 rounded-xl p-8 text-center text-gray-500 text-xs">
                    No claims have been submitted for this item yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {claims.map((claim) => (
                      <div
                        key={claim._id}
                        className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 transition-all hover:bg-slate-900/75"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-white text-sm">{claim.claimantName}</span>
                            <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded">
                              {claim.claimantEmail}
                            </span>
                          </div>
                          <p className="text-gray-300 text-xs bg-black/40 border border-white/5 p-3 rounded-lg leading-relaxed italic">
                            "{claim.message}"
                          </p>
                          <span className="text-[10px] text-gray-500 block">
                            Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {claim.status === "pending" ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleReviewClaim(claim._id, "approved")}
                                disabled={busy}
                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                              >
                                <FiCheck /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewClaim(claim._id, "rejected")}
                                disabled={busy}
                                className="px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                              >
                                <FiX /> Reject
                              </button>
                            </div>
                          ) : (
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                                claim.status === "approved"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-red-500/10 text-red-400 border-red-500/20"
                              }`}
                            >
                              {claim.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 border-t border-white/10 pt-6">
              <Link to="/items" className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline text-sm font-semibold transition-colors">
                ← Back to items
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ItemDetails;
