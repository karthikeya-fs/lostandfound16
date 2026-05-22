/**
 * Frees the backend port before dev (Windows-friendly).
 * Usage: node scripts/free-port.js [port]
 */
const { execSync } = require("child_process");

const port = Number(process.argv[2] || process.env.PORT || 5000);

function freePortWindows(targetPort) {
  try {
    const out = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "ignore"],
    });

    const pids = new Set();
    for (const line of out.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`✅ Freed port ${targetPort} (stopped PID ${pid})`);
      } catch {
        console.warn(`⚠️ Could not stop PID ${pid}`);
      }
    }

    if (pids.size === 0) {
      console.log(`✅ Port ${targetPort} is already free`);
    }
  } catch {
    console.log(`✅ Port ${targetPort} is already free`);
  }
}

freePortWindows(port);
