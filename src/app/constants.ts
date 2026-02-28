export const K = {
  EXT: "eic_ext",
  RAP: "eic_rap",
  SES: "eic_ses",
  LOGO: "eic_logo",
  SET: "eic_set",
  SEED: "eic_seeded",
} as const;

export type Devise = { c: string; s: string };

export const DEVISES: Devise[] = [
  { c: "EUR", s: "€" },
  { c: "USD", s: "$" },
  { c: "GBP", s: "£" },
  { c: "CDF", s: "FC" },
  { c: "XAF", s: "FCFA" },
  { c: "XOF", s: "CFA" },
  { c: "NGN", s: "₦" },
  { c: "ZAR", s: "R" },
  { c: "KES", s: "KSh" },
  { c: "GHS", s: "GH₵" },
  { c: "TZS", s: "TSh" },
  { c: "UGX", s: "USh" },
  { c: "RWF", s: "RF" },
  { c: "CHF", s: "CHF" },
  { c: "CAD", s: "CA$" },
  { c: "TRY", s: "₺" },
];

export type Extension = {
  id: string;
  nom: string;
  couleur: string;
  ville: string;
  pays: string;
  adresse: string;
  dateCreation: string;
  pasteur: { nom: string; email: string; tel: string };
  coordinateur: string;
  secretaire: string;
  tresorier: string;
  password: string;
  devise: string;
  symbole: string;
};

export const DEF_EXTS: Extension[] = [
  {
    id: "ext_nic",
    nom: "Nicosie Centre",
    couleur: "#8B5CF6",
    ville: "Nicosie",
    pays: "Chypre",
    adresse: "12 Avenue de la Paix, Nicosie",
    dateCreation: "2018-03-15",
    pasteur: {
      nom: "Pasteur Emmanuel Kabila",
      email: "e.kabila@eic.cy",
      tel: "+357 99 123 456",
    },
    coordinateur: "Frère David Mutombo",
    secretaire: "Sœur Rachel Lukusa",
    tresorier: "Frère Jean-Paul Ngoy",
    password: "nic123",
    devise: "EUR",
    symbole: "€",
  },
  {
    id: "ext_lim",
    nom: "Limassol Sud",
    couleur: "#059669",
    ville: "Limassol",
    pays: "Chypre",
    adresse: "45 Rue des Flamboyants, Limassol",
    dateCreation: "2019-07-20",
    pasteur: {
      nom: "Pasteur Pierre Kabasele",
      email: "p.kabasele@eic.cy",
      tel: "+357 99 654 321",
    },
    coordinateur: "Frère Samuel Banza",
    secretaire: "Sœur Esther Mwamba",
    tresorier: "Frère Isaac Tshimanga",
    password: "lim123",
    devise: "EUR",
    symbole: "€",
  },
  {
    id: "ext_lar",
    nom: "Larnaca Est",
    couleur: "#DC2626",
    ville: "Larnaca",
    pays: "Chypre",
    adresse: "8 Boulevard du Lac, Larnaca",
    dateCreation: "2020-01-10",
    pasteur: {
      nom: "Pasteur Daniel Nzamba",
      email: "d.nzamba@eic.cy",
      tel: "+357 99 789 012",
    },
    coordinateur: "Frère Caleb Mbombo",
    secretaire: "Sœur Miriam Kavula",
    tresorier: "Frère Thomas Luzolo",
    password: "lar123",
    devise: "EUR",
    symbole: "€",
  },
];

export type NavGroup = {
  g: string;
  items: { icon: string; lbl: string; path: string }[];
};

export const ADMIN_NAV: NavGroup[] = [
  {
    g: "Général",
    items: [
      { icon: "dashboard", lbl: "Tableau de Bord", path: "/admin/dashboard" },
      { icon: "building", lbl: "Extensions", path: "/admin/extensions" },
      { icon: "fileText", lbl: "Tous les Rapports", path: "/admin/rapports" },
      { icon: "chartBar", lbl: "Bilans Comparatifs", path: "/admin/bilans" },
      { icon: "users", lbl: "Nouveaux Convertis", path: "/admin/convertis" },
    ],
  },
  { g: "Administration", items: [{ icon: "settings", lbl: "Paramètres", path: "/admin/settings" }] },
];

export const EXT_NAV: NavGroup[] = [
  {
    g: "Mon Extension",
    items: [
      { icon: "dashboard", lbl: "Tableau de Bord", path: "/ext/dashboard" },
      { icon: "plus", lbl: "Nouveau Rapport", path: "/ext/new" },
      { icon: "fileText", lbl: "Mes Rapports", path: "/ext/rapports" },
      { icon: "chartBar", lbl: "Bilans", path: "/ext/bilans" },
      { icon: "users", lbl: "Convertis", path: "/ext/convertis" },
    ],
  },
];

export const STEPS = ["Culte", "Effectif", "Offrandes", "Dépenses", "Convertis", "Signature"] as const;

