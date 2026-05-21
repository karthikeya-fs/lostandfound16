import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiPackage, FiAlertTriangle, FiTrendingUp, FiUsers, FiCheckCircle } from "react-icons/fi";
import RhythmicRipplesBackground from "@/components/ui/rhythmic-ripples-background";
import API from "../services/api";

const fadeUpVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.25,
      duration: 0.9,
      ease: [0.4, 0.0, 0.2, 1],
    },
  }),
};

function Home() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get("/stats/public")
      .then((res) => setStats(res.data))
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="text-white">
      <RhythmicRipplesBackground
        backgroundColor="#030303"
        rippleColor="rgba(99, 179, 237, 0.25)"
        rippleCount={20}
        rippleSpeed={0.5}
      >
        <div className="max-w-4xl mx-auto px-4 pt-24 text-center">
          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={0}
            className="mb-6 inline-flex items-center justify-center rounded-full border border-white/10 bg-black/10 px-5 py-2 text-sm text-white/70 backdrop-blur-sm"
          >
            Campus Lost & Found Network
          </motion.div>

          <motion.h1
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={1}
            className="text-5xl font-bold tracking-tighter sm:text-7xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
          >
            Reconnect with what you lost
          </motion.h1>

          <motion.p
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={2}
            className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-white/50"
          >
            A smart, secure platform helping students find lost belongings
            across campus quickly and safely.
          </motion.p>

          {stats && (
            <motion.div
              variants={fadeUpVariants}
              initial="hidden"
              animate="visible"
              custom={2.5}
              className="mx-auto mt-10 max-w-3xl rounded-2xl border border-white/10 bg-black/20 px-6 py-6 backdrop-blur-md"
            >
              <p className="text-lg font-semibold text-cyan-300 flex items-center justify-center gap-2">
                <FiTrendingUp />
                {stats.headline}
              </p>
              <p className="mt-2 text-sm text-white/50">{stats.encouragement}</p>
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                    <FiCheckCircle className="text-emerald-400" />
                    {stats.itemsReturned}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Returned</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.totalItems}</p>
                  <p className="text-xs text-gray-400 mt-1">Total posts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stats.openItems}</p>
                  <p className="text-xs text-gray-400 mt-1">Still open</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                    <FiUsers className="text-cyan-400" />
                    {stats.totalUsers}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Community</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={3}
            className="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row"
          >
            <Link
              to="/items"
              className="rounded-full bg-indigo-500 px-7 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:scale-105"
            >
              Explore All Items
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            custom={4}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link
              to="/post-item"
              className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
            >
              <FiPackage
                className="text-xl text-cyan-400 transition-transform group-hover:scale-110"
                aria-hidden
              />
              <span>Post Found Item</span>
            </Link>

            <Link
              to="/report-lost"
              className="group flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-semibold backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
            >
              <FiAlertTriangle
                className="text-xl text-amber-400 transition-transform group-hover:scale-110"
                aria-hidden
              />
              <span>Report Lost Item</span>
            </Link>
          </motion.div>
        </div>
      </RhythmicRipplesBackground>

      <footer className="relative border-t border-white/10 bg-black/80 py-12 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Lost<span className="text-cyan-400"> & </span>Found
            </h2>
            <p className="mt-2 text-gray-400 text-sm">
              Making campuses smarter, safer, and more connected.
            </p>
          </div>
          <p className="text-sm text-gray-500 font-medium">
            © 2026 Campus Lost & Found Network. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
