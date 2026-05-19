import type { NextConfig } from "next";

const apiTarget = process.env.API_PROXY_TARGET ?? "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: "/dashboard/customers", destination: "/dashboard/tenants", permanent: true },
      { source: "/dashboard/sales", destination: "/dashboard/leases", permanent: true },
      { source: "/dashboard/finance", destination: "/dashboard/payments", permanent: true },
      { source: "/dashboard/rent", destination: "/dashboard/portal/pay", permanent: true },
      { source: "/dashboard/taxes", destination: "/dashboard/tax", permanent: true },
    ];
  },
};

export default nextConfig;
