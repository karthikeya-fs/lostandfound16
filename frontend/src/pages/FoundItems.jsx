import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import ItemCard from "../components/ItemCard";
import SearchBar from "../components/SearchBar";
import { FiPackage } from "react-icons/fi";

function FoundItems() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchFoundItems();
  }, []);

  const fetchFoundItems = async () => {
    try {
      const res = await API.get("/items/all");
      const foundItems = res.data.filter((item) => item.type === "found");
      setItems(foundItems);
    } catch (error) {
      console.error(error);
      setItems([]);
    }
  };

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-blue-950/40 to-black text-white px-6 pt-28 pb-20 relative overflow-hidden">
      <div className="absolute top-[10%] right-[-5%] w-100 h-100 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-5 border-b border-white/10 pb-6">
          <div>
            <h2 className="text-4xl font-bold bg-linear-to-r from-cyan-300 to-teal-400 bg-clip-text text-transparent flex items-center gap-3">
              <FiPackage className="text-cyan-400 shrink-0" aria-hidden />
              Found items
            </h2>
            <p className="text-cyan-400/80 mt-2 font-medium tracking-wide text-sm uppercase">
              Browse items someone found on campus — help reunite them with owners
            </p>
          </div>

          <div className="w-full md:w-96 relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-cyan-400 to-teal-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative">
              <SearchBar search={search} setSearch={setSearch} />
            </div>
          </div>
        </div>

        <p className="text-gray-400 text-sm mb-8 max-w-2xl">
          When someone posts something they found, it appears here so others can recognize it.
          {" "}
          <Link to="/post-item" className="text-cyan-400 hover:underline font-medium">
            Post a found item
          </Link>
        </p>

        {filteredItems.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-20 text-center shadow-2xl relative overflow-hidden group mt-4">
            <div className="absolute inset-0 bg-linear-to-br from-cyan-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                <FiPackage className="text-4xl text-cyan-400 opacity-80" aria-hidden />
              </div>
              <h3 className="text-3xl font-bold text-white mb-3">No found items yet</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                {search
                  ? "No found items match your search."
                  : "When users post something they found, it will show up here."}
              </p>
              <Link
                to="/post-item"
                className="inline-flex items-center gap-2 bg-linear-to-r from-cyan-500 to-teal-600 hover:from-cyan-400 hover:to-teal-500 text-black font-bold px-6 py-3 rounded-xl transition-all"
              >
                <FiPackage aria-hidden />
                Post found item
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item, index) => (
              <div
                key={item._id}
                className="transform hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(6,182,212,0.25)]"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ItemCard item={item} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FoundItems;
