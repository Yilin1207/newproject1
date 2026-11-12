import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Support the loopback URL used when opening the game from the IDE.
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
