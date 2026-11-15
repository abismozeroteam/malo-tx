export const routes = {
  home: "/",
  signIn: "/entrar",
  debts: "/cobros",
  newDebt: "/cobros/nuevo",
  debt: (ref: string) => `/cobros/${ref}`,
  debtor: (token: string) => `/c/${token}`,
  debtorQr: (token: string, version: number) => `/c/${token}/qr?v=${version}`,
  profile: "/perfil",
};

export const PRIVATE_PATHS = ["/c", routes.debts, routes.signIn, routes.profile, "/dev"];
