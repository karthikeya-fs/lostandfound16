import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import API, { assetUrl } from "../services/api";
import { getStoredUserId } from "../utils/authStorage";
import ClaimChatbot from "../components/ClaimChatbot";
import ClaimChatPanel from "../components/ClaimChatPanel";
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
  const [busy, setBusy] = useState(false);
  const [claims, setClaims] = useState([]);
  const [myClaim, setMyClaim] = useState(null);
  const [showClaimBot, setShowClaimBot] = useState(false);
  const [finalOtp, setFinalOtp] = useState("");
  const [finalClaimId, setFinalClaimId] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  useEffect(() => {
    if (item) fetchClaims();
  }, [id, item?._id, item?.postedBy]);

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

      const myId = getStoredUserId();
      const ownerId = item?.postedBy?._id || item?.postedBy;
      const isOwner =
        myId && ownerId && String(ownerId) === String(myId);

      if (isOwner) {
        const res = await API.get(`/claims/item/${id}`);
        setClaims(res.data);
        const mine = res.data.find(
          (c) =>
            String(c.claimant?._id || c.claimant || c.claimantUserId?._id || c.claimantUserId) ===
            String(myId)
        );
        setMyClaim(mine || null);
      } else {
        const res = await API.get("/claims/my");
        const mine = (res.data || []).find(
          (c) => String(c.item?._id || c.item) === String(id)
        );
        setMyClaim(mine || null);
        setClaims([]);
      }
    } catch (err) {
      console.error("Error fetching claims:", err);
    }
  };

  const openClaimFlow = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to submit a claim.");
      return navigate("/login");
    }
    setShowClaimBot(true);
  };

  const handleApproveClaim = async (claimId) => {
    try {
      setBusy(true);
      await API.patch(`/claims/${claimId}/approve`);
      toast.success("Claim approved. Request final OTP next.");
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || "Approve failed");
    } finally {
      setBusy(false);
    }
  };

  const handleRejectClaim = async (claimId) => {
    try {
      setBusy(true);
      await API.patch(`/claims/${claimId}/reject`);
      toast.success("Claim rejected");
      fetchClaims();
    } catch (error) {
      toast.error(error.response?.data?.message || "Reject failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSendFinalOtp = async (claimId) => {
    try {
      setBusy(true);
      const res = await API.post(`/claims/${claimId}/final-otp`);
      setFinalClaimId(claimId);
      toast.success(res.data.message || "Final OTP sent");
      if (res.data.otp) toast(`Dev OTP: ${res.data.otp}`, { icon: "🔑" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send final OTP");
    } finally {
      setBusy(false);
    }
  };

  const handleFinalConfirm = async (e) => {
    e.preventDefault();
    if (!finalClaimId || !finalOtp.trim()) {
      toast.error("Enter final OTP");
      return;
    }
    try {
      setBusy(true);
      await API.post(`/claims/${finalClaimId}/final-confirm`, { otp: finalOtp.trim() });
      toast.success("Claim approved. Item resolved. Chat unlocked.");
      setFinalOtp("");
      setFinalClaimId(null);
      fetchClaims();
      fetchItem();
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
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
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                            <FiInfo className="text-cyan-400" />
                            Your Ownership Claim Status
                          </h4>
                          <p className="text-gray-400 text-xs leading-relaxed">
                            Status: {myClaim.status === "verified" ? "Waiting for finder approval" : myClaim.status}
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {(myClaim.status === "pending" || myClaim.status === "verified") && (
                            <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full uppercase">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                              {myClaim.status === "pending" ? "Pending OTP" : "Waiting for finder"}
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

                      {(myClaim.answers || myClaim.securityAnswers)?.length > 0 && (
                        <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2 mt-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Your verification answers:</span>
                          {(myClaim.answers || myClaim.securityAnswers).map((ans, aIdx) => (
                            <div key={aIdx} className="text-xs">
                              <p className="text-gray-500">Q: {ans.question}</p>
                              <p className="text-gray-300 italic mt-0.5">A: {ans.answer}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {myClaim.status === "approved" && (
                        <ClaimChatPanel claimId={myClaim._id} />
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-900/40 border border-dashed border-white/10 rounded-2xl gap-4">
                      <div className="text-center max-w-md">
                        <h4 className="font-bold text-white text-base mb-1">Do you own this found item?</h4>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          Answer step-by-step verification questions to prove ownership. OTP will be sent to your email.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={openClaimFlow}
                        className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
                      >
                        <FiCheckCircle className="text-black text-sm" />
                        This is mine
                      </button>
                    </div>
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
                            <span className="font-bold text-white text-sm">
                              {claim.claimant?.name || claim.claimantName}
                            </span>
                            <span className="text-[10px] bg-white/5 border border-white/10 text-gray-400 px-2 py-0.5 rounded">
                              {claim.claimant?.email || claim.claimantEmail}
                            </span>
                          </div>
                          {(claim.answers || claim.securityAnswers)?.length > 0 && (
                            <div className="mt-2.5 bg-cyan-950/20 border border-cyan-500/10 rounded-xl p-4 space-y-2 text-left">
                              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">Verification answers:</span>
                              {(claim.answers || claim.securityAnswers).map((ans, aIdx) => (
                                <div key={aIdx} className="text-xs">
                                  <p className="text-gray-400 font-medium">Q: {ans.question}</p>
                                  <p className="text-white mt-0.5 bg-black/30 px-3 py-2 rounded-lg border border-white/5">
                                    A: <span className="italic font-medium text-gray-200">{ans.answer}</span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                          <span className="text-[10px] text-gray-500 block">
                            Submitted on {new Date(claim.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {claim.status === "verified" && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleApproveClaim(claim._id)}
                                disabled={busy}
                                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-lg flex items-center gap-1"
                              >
                                <FiCheck /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectClaim(claim._id)}
                                disabled={busy}
                                className="px-3.5 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-bold rounded-lg flex items-center gap-1"
                              >
                                <FiX /> Reject
                              </button>
                            </div>
                          )}
                          {claim.status === "awaiting_final" && (
                            <div className="flex flex-col gap-2 items-end">
                              <button
                                type="button"
                                onClick={() => handleSendFinalOtp(claim._id)}
                                disabled={busy}
                                className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 text-xs font-bold rounded-lg"
                              >
                                Send final OTP
                              </button>
                              {finalClaimId === claim._id && (
                                <form onSubmit={handleFinalConfirm} className="flex gap-2">
                                  <input
                                    value={finalOtp}
                                    onChange={(e) => setFinalOtp(e.target.value.replace(/\D/g, ""))}
                                    maxLength={6}
                                    placeholder="OTP"
                                    className="w-24 px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-white text-xs text-center"
                                  />
                                  <button type="submit" disabled={busy} className="px-2 py-1 bg-emerald-500 text-black text-xs font-bold rounded-lg">
                                    Confirm
                                  </button>
                                </form>
                              )}
                            </div>
                          )}
                          {claim.status === "approved" && (
                            <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                              Approved
                            </span>
                          )}
                          {claim.status === "rejected" && (
                            <span className="text-[10px] font-black uppercase text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full">
                              Rejected
                            </span>
                          )}
                          {claim.status === "pending" && (
                            <span className="text-[10px] text-amber-400">Awaiting claimant OTP</span>
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
<ClaimChatbot
  itemId={id}
  itemTitle={item.title}
  open={showClaimBot}
  onClose={() => {
    setShowClaimBot(false);
    fetchClaims();
  }}
  onClaimSubmitted={() => {
    setShowClaimBot(false);

    toast.success("Claim submitted successfully");

    fetchClaims();

    fetchItem();
  }}
/>
    </div>
  );
}

export default ItemDetails;
