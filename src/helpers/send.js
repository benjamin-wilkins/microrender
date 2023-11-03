export default {
  async init(renderer, selector="script#send-fragment-js") {
    const js = `var fragmentJS = ${renderer.fragment.js.toString()}`;

    renderer.select(selector).do(e => e.setContent(js));
  }
};