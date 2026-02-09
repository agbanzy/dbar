/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Security headers configured in firebase.json (static export doesn't support headers())
};

export default nextConfig;
