export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    // All paths serve directly from assets
    return env.ASSETS.fetch(request);
  }
}