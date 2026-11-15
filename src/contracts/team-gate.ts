export type TeamGateError = "invalid_name" | "rate_limited";

export type TeamGateState = { error: TeamGateError | null };

export type TeamGateAction = (state: TeamGateState, form: FormData) => Promise<TeamGateState>;
