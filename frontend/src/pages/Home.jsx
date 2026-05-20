import { Link } from "react-router-dom";
import { FiPackage, FiAlertTriangle } from "react-icons/fi";

function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/40 to-black text-white overflow-hidden relative">

      {/* Background Glow with Animations */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-500/20 blur-[120px] rounded-full animate-float pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 blur-[150px] rounded-full animate-float-delayed pointer-events-none"></div>
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] bg-purple-500/10 blur-[100px] rounded-full animate-float pointer-events-none"></div>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 animate-fade-in-up z-10">

        <div className="max-w-7xl mx-auto text-center">

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
            Campus
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent inline-block animate-fade-in-up-delay-1 px-3">
              Lost & Found
            </span>
            Network
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up-delay-1 mb-12">
            A smart, secure, and intuitive platform helping students reconnect
            with their lost belongings across the campus quickly and safely.
          </p>

          {/* Explore Button */}
          <div className="max-w-2xl mx-auto mb-14 animate-fade-in-up-delay-2 relative group flex justify-center">
             <Link
               to="/items"
               className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold px-10 py-4 rounded-full backdrop-blur-md shadow-xl transition-all duration-300 hover:shadow-cyan-500/20"
             >
               Explore All Items
             </Link>
          </div>

          {/* Post found & report lost */}
          <div className="flex flex-wrap justify-center gap-6 animate-fade-in-up-delay-2">
            <Link
              to="/post-item"
              className="group flex items-center gap-3 border-2 border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white px-8 py-4 rounded-full font-semibold shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <FiPackage className="text-xl text-cyan-400 group-hover:scale-110 transition-transform duration-300" aria-hidden />
              <span>Post Found Item</span>
            </Link>

            <Link
              to="/report-lost"
              className="group flex items-center gap-3 border-2 border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white px-8 py-4 rounded-full font-semibold shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <FiAlertTriangle className="text-xl text-amber-400 group-hover:scale-110 transition-transform duration-300" aria-hidden />
              <span>Report Lost Item</span>
            </Link>
          </div>
        </div>
      </section>



      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-black/50 backdrop-blur-xl py-12 mt-20 z-10">
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