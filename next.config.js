module.exports = {
  async headers() {
    return [
      {
        // The widget runs iframe.umd.js as a module inside an srcdoc iframe.
        // Self-hosted sites normally use a different origin, so browsers need
        // an explicit CORS response for these public embed assets.
        source: '/js/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/doc',
        destination: '/doc/index.html'
      }
    ]
  }
}
