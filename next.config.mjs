/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_TASKS_API_ENDPOINT: process.env.TASKS_API_ENDPOINT,
    NEXT_PUBLIC_TASKS_API_KEY: process.env.TASKS_API_KEY,
  },
};

export default nextConfig;
