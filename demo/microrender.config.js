// Basic application config
// Supports local testing

// Run locally using `npx wrangler pages dev demo/build --port 8788 --service backend=demo-backend` 

export const local = {
  bindings: ["backend"]
};

export const staging = {
  bindings: ["backend"]
};

export const production = {
  bindings: ["backend"]
};