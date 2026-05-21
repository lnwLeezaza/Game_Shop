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
      { protocol: 'https', hostname: '**' },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
  async redirects() {
    return [
      {
        source: '/gacha/:path+',
        destination: '/gacha',
        permanent: false,
      },
    ]
  },
}
export default nextConfig