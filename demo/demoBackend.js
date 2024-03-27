// Demo backend worker for MicroRender

// Run locally using `npx wrangler dev ./demo/demoBackend.js --name demo-backend`

export default {
  async fetch(request, env, ctx) {
    return new Response('Hello World!');
  },
};