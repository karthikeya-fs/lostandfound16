import { Link } from "react-router-dom";
import { assetUrl } from "../services/api";
import { getStoredUserId } from "../utils/authStorage";
import { FiEyeOff } from "react-icons/fi";

function ItemCard({ item }) {
  const img = item.images?.length ? assetUrl(item.images[0]) : "";
  const myId = getStoredUserId();
  const ownerId = item.postedBy?._id || item.postedBy;
  const isOwner = myId && ownerId && String(ownerId) === String(myId);
  const shouldBlur = item.blurImage && !isOwner;

  return (
    <Link to={`/item/${item._id}`} className="group block h-full">
      <article className="h-full flex flex-col rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-lg transition-all duration-300 hover:border-cyan-400/40 hover:bg-white/[0.07] hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(6,182,212,0.25)]">
        <div className="aspect-[4/3] bg-white/5 relative overflow-hidden">
          {img ? (
            <img
              src={img}
              alt=""
              className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${
                shouldBlur ? "blur-md scale-110 opacity-70 select-none pointer-events-none" : ""
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              No photo
            </div>
          )}

          {/* Privacy Overlay */}
          {shouldBlur && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center gap-1 p-3 text-center">
              <FiEyeOff className="text-red-400 text-lg" />
              <span className="text-[9px] font-black text-white uppercase tracking-wider bg-red-600/90 px-2 py-0.5 rounded-full border border-red-500/20 shadow-md">
                🔒 Sensitive Item
              </span>
            </div>
          )}

          <span
            className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
              item.type === "lost"
                ? "bg-amber-500/90 text-black"
                : "bg-cyan-500/90 text-black"
            }`}
          >
            {item.type}
          </span>
        </div>
        <div className="p-4 flex flex-col flex-1 gap-1">
          <h3 className="font-bold text-white text-lg leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
            {item.title}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-2">{item.description}</p>
          <p className="text-cyan-400/80 text-xs mt-auto pt-2">{item.location}</p>
          {item.type === "lost" && item.reward ? (
            <p className="text-amber-400/90 text-xs font-medium">Reward: {item.reward}</p>
          ) : null}
        </div>
      </article>
    </Link>
  );
}

export default ItemCard;
