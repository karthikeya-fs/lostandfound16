import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API, { assetUrl } from "../services/api";

function ItemDetails() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    const res = await API.get(`/items/${id}`);
    setItem(res.data);
  };

  const handleClaim = async () => {
    try {
      await API.post("/claims/create", {
        itemId: id,
        claimantName: "Keerthana",
        claimantEmail: "keerthana@gmail.com",
        message: "This item belongs to me",
      });

      alert("Claim submitted successfully");
    } catch (error) {
      console.log(error);
    }
  };

  if (!item) return <h2>Loading...</h2>;

  const cover = item.images?.[0] ? assetUrl(item.images[0]) : "";

  return (
    <div className="min-h-screen theme-bg px-6 pt-28 pb-16">
      <div className="max-w-3xl mx-auto theme-surface border theme-border rounded-2xl overflow-hidden shadow-lg">
        {cover ? (
          <img src={cover} alt="" className="w-full max-h-80 object-cover" />
        ) : null}
        <div className="p-8">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-500 mb-2">{item.type}</p>
          <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
          <p className="text-[var(--text-muted)] mb-4">{item.description}</p>
          <p className="mb-2">
            <span className="font-semibold">Location:</span> {item.location}
          </p>
          {item.reward ? (
            <p className="mb-2">
              <span className="font-semibold">Reward:</span> {item.reward}
            </p>
          ) : null}
          {item.contact ? (
            <p className="mb-6">
              <span className="font-semibold">Contact:</span> {item.contact}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleClaim}
            className="px-6 py-3 rounded-xl font-semibold bg-[var(--accent)] text-[var(--bg)] hover:opacity-90 transition-opacity"
          >
            Claim item
          </button>
        </div>
      </div>
    </div>
  );
}

export default ItemDetails;
