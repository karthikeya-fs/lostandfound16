/**
 * WhatsApp-style bubble. Text is rendered as plain text (React escapes HTML → XSS-safe).
 */
function formatTime(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function DeliveryTicks({ isOwn, deliveryStatus }) {
  if (!isOwn) return null;
  if (deliveryStatus === "read") {
    return <span className="text-sky-200 ml-1 text-xs" aria-label="Read">✓✓</span>;
  }
  if (deliveryStatus === "delivered") {
    return <span className="text-white/70 ml-1 text-xs" aria-label="Delivered">✓✓</span>;
  }
  return <span className="text-white/50 ml-1 text-xs" aria-label="Sent">✓</span>;
}

export default function MessageBubble({ message, isOwn }) {
  const name = message.sender?.name || "User";
  const time = formatTime(message.timestamp || message.createdAt);

  return (
    <div className={`flex w-full mb-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-3 py-2 shadow-md ${
          isOwn
            ? "bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-br-md"
            : "bg-[var(--surface-elevated)] text-[var(--text)] border border-[var(--border)] rounded-bl-md"
        }`}
      >
        {!isOwn ? (
          <p className="text-[11px] font-semibold text-cyan-500 mb-0.5">{name}</p>
        ) : null}
        <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isOwn ? "text-emerald-100/90" : "text-[var(--text-muted)]"}`}>
          <span>{time}</span>
          <DeliveryTicks isOwn={isOwn} deliveryStatus={message.deliveryStatus} />
        </div>
      </div>
    </div>
  );
}
