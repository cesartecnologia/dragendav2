const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      }
    ]
  },
  async redirects() {
    return [
      { source: "/dashboard", destination: "/painel", permanent: false },
      { source: "/dashboard/:path*", destination: "/painel/:path*", permanent: false },
      { source: "/appointments", destination: "/agendamentos", permanent: false },
      { source: "/appointments/:path*", destination: "/agendamentos/:path*", permanent: false },
      { source: "/patients", destination: "/pacientes", permanent: false },
      { source: "/patients/new", destination: "/pacientes/novo", permanent: false },
      { source: "/patients/:id/edit", destination: "/pacientes/:id/editar", permanent: false },
      { source: "/patients/:path*", destination: "/pacientes/:path*", permanent: false },
      { source: "/doctors", destination: "/medicos", permanent: false },
      { source: "/doctors/new", destination: "/medicos/novo", permanent: false },
      { source: "/doctors/:id/edit", destination: "/medicos/:id/editar", permanent: false },
      { source: "/doctors/:id/schedule", destination: "/medicos/:id/agenda", permanent: false },
      { source: "/doctors/:path*", destination: "/medicos/:path*", permanent: false },
      { source: "/financial", destination: "/financeiro", permanent: false },
      { source: "/reports", destination: "/relatorios", permanent: false },
      { source: "/users", destination: "/funcionarios", permanent: false },
      { source: "/settings", destination: "/configuracoes/clinica", permanent: false },
      { source: "/settings/company", destination: "/configuracoes/clinica", permanent: false },
      { source: "/settings/exams", destination: "/configuracoes/exames", permanent: false },
      { source: "/settings/insurances", destination: "/configuracoes/convenios", permanent: false },
      { source: "/settings/specialties", destination: "/configuracoes/especialidades", permanent: false },
      { source: "/settings/whatsapp", destination: "/configuracoes/whatsapp", permanent: false },
      { source: "/settings/billing", destination: "/configuracoes/cobranca", permanent: false },
      { source: "/settings/users", destination: "/funcionarios", permanent: false },
      { source: "/subscription", destination: "/minha-assinatura", permanent: false },
    ];
  },
  async rewrites() {
    return [
      { source: "/painel", destination: "/dashboard" },
      { source: "/painel/:path*", destination: "/dashboard/:path*" },
      { source: "/agendamentos", destination: "/appointments" },
      { source: "/agendamentos/:path*", destination: "/appointments/:path*" },
      { source: "/pacientes", destination: "/patients" },
      { source: "/pacientes/novo", destination: "/patients/new" },
      { source: "/pacientes/:id/editar", destination: "/patients/:id/edit" },
      { source: "/pacientes/:path*", destination: "/patients/:path*" },
      { source: "/medicos", destination: "/doctors" },
      { source: "/medicos/novo", destination: "/doctors/new" },
      { source: "/medicos/:id/editar", destination: "/doctors/:id/edit" },
      { source: "/medicos/:id/agenda", destination: "/doctors/:id/schedule" },
      { source: "/medicos/:path*", destination: "/doctors/:path*" },
      { source: "/financeiro", destination: "/financial" },
      { source: "/financeiro/:path*", destination: "/financial/:path*" },
      { source: "/relatorios", destination: "/reports" },
      { source: "/relatorios/:path*", destination: "/reports/:path*" },
      { source: "/funcionarios", destination: "/users" },
      { source: "/funcionarios/:path*", destination: "/users/:path*" },
      { source: "/configuracoes", destination: "/settings" },
      { source: "/configuracoes/clinica", destination: "/settings/company" },
      { source: "/configuracoes/exames", destination: "/settings/exams" },
      { source: "/configuracoes/convenios", destination: "/settings/insurances" },
      { source: "/configuracoes/especialidades", destination: "/settings/specialties" },
      { source: "/configuracoes/whatsapp", destination: "/settings/whatsapp" },
      { source: "/configuracoes/cobranca", destination: "/settings/billing" },
      { source: "/minha-assinatura", destination: "/subscription" },
    ];
  },
};

export default nextConfig;
