/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: [
    'three',
    '@react-three/fiber',
    '@react-three/drei',
    '@react-three/postprocessing'
  ],
  reactStrictMode: true,
  images: {
    domains: ['localhost']
  }
};
