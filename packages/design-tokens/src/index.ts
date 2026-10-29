import tokens from "../tokens.json" with { type: "json" };

export const colors = tokens.color;
export const space = tokens.space;
export const motion = tokens.motion;
export const radius = tokens.radius;
export type ColorToken = keyof typeof colors;
export { tokens };
