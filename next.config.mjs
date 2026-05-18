const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'play-lh.googleusercontent.com' },
      { protocol: 'https', hostname: '**' }, // ← เพิ่มบรรทัดนี้
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}
export default nextConfig