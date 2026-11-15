export type GuestEntryError = "invalid_name" | "rate_limited";

export type GuestEntryState = { error: GuestEntryError | null };

export type GuestEntryAction = (state: GuestEntryState, form: FormData) => Promise<GuestEntryState>;
