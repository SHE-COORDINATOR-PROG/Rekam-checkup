/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs-dist mereferensikan modul 'canvas' untuk mode Node.js, padahal
    // kita hanya memakainya di browser. Tanpa baris ini, build gagal karena
    // webpack mencoba resolve modul 'canvas' yang tidak terpasang.
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
