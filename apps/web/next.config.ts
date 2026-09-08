import { join } from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  // O tracing precisa enxergar packages/shared, que é symlink do pnpm.
  outputFileTracingRoot: join(import.meta.dirname, '../..'),
  allowedDevOrigins: ['127.0.0.1'],
  transpilePackages: ['@studioemar/shared'],
  async redirects() {
    return [
      {
        source: '/treinador/agenda-recorrente',
        destination: '/treinador/configuracoes?secao=horarios',
        permanent: false,
      },
      {
        source: '/treinador/horarios',
        destination: '/treinador/configuracoes?secao=horarios',
        permanent: false,
      },
    ];
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
    };
    return config;
  },
};

export default nextConfig;
