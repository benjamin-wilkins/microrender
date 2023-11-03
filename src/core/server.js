class Renderer {
  // eslint-disable-next-line no-undef
  rewriter = new HTMLRewriter();

  constructor(fragment) {
    this.fragment = fragment;
    this.fragment.js(this.select);
  }

  select = (selector) => {
    const handler = new ElementHandler();
    this.rewriter.on(selector, handler);
    return handler;
  };

  render = async (responseOptions) => {
    const response = new Response(this.fragment.html, responseOptions);
    return this.rewriter.transform(response);
  };
}

class ElementHandler {
  #transforms = []

  do = (transform) => {
    this.#transforms.push(transform);
  };

  element = async (rewriterElement) => {
    const element = new Element(rewriterElement);

    await Promise.all(this.#transforms.map(async (transform) => {
      await transform(element);
    }));
  };
}

class Element {
  constructor(rewriterElement) {
    this.rewriterElement = rewriterElement
  }

  getAttribute = (attr) => {return this.rewriterElement.getAttribute(attr)};
  hasAttribute = (attr) => {return this.rewriterElement.hasAttribute(attr)};
  setAttribute = (attr, value) => {this.rewriterElement.setAttribute(attr, value)};
  removeAttribute = (attr) => {return this.rewriterElement.removeAttribute(attr)};

  setContent = (content) => {this.rewriterElement.setInnerContent(content, {html: true})};
  setTextContent = (content) => {this.rewriterElement.setInnerContent(content, {html: false})};
}

export default Renderer;