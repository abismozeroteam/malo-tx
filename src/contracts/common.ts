export type Cents = number;
export type IsoDate = string;
export type IsoDateTime = string;

export type CatalogMemeKey = "a" | "b" | "c" | "d" | "e" | "paid";

export type MemeView =
  | { kind: "catalog"; key: CatalogMemeKey; caption: string }
  | { kind: "upload"; src: string; caption: string };

export type ActionError =
  | "network"
  | "rate_limited"
  | "invalid_phone"
  | "push_failed"
  | "already_answered"
  | "not_allowed";

export type ActionResult = { ok: true } | { ok: false; error: ActionError };
