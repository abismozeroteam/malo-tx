export const routes = {
  home: "/",
  signIn: "/entrar",
  debts: "/cobros",
  newDebt: "/cobros/nuevo",
  debt: (ref: string) => `/cobros/${ref}`,
  profile: "/perfil",
};
