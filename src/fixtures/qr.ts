const cells = Array.from({ length: 21 * 21 }, (_, i) => {
  const x = i % 21;
  const y = Math.floor(i / 21);
  const finder = (cx: number, cy: number) => x >= cx && x < cx + 7 && y >= cy && y < cy + 7 && !(x > cx && x < cx + 6 && y > cy && y < cy + 6 && !(x > cx + 1 && x < cx + 5 && y > cy + 1 && y < cy + 5));
  const on = finder(0, 0) || finder(14, 0) || finder(0, 14) || (x > 7 && y > 7 && (x * 7 + y * 13) % 3 === 0);
  return on ? `<rect x="${x}" y="${y}" width="1" height="1"/>` : "";
}).join("");

export const sampleQrImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 25 25" shape-rendering="crispEdges"><rect x="-2" y="-2" width="25" height="25" fill="white"/><g fill="black">${cells}</g></svg>`,
)}`;
