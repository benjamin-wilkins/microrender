class Renderer {
  #handlers = new Map();

  constructor(fragment) {
    this.fragment = fragment;
    this.fragment.js(this.select);
  }

  select = (selector) => {
    const handler = new ElementHandler();
    this.#handlers.set(selector, handler);
    return handler;
  };

  render = async () => {
    for (let [selector, handler] of this.#handlers) {
      let domElements = this.fragment.root.querySelectorAll(selector);
      
      await Promise.all([...domElements].map(async (domElement) => {
        await handler.element(domElement);
      }));
    }
  };
}

class ElementHandler {
  #transforms = []

  do = (transform) => {
    this.#transforms.push(transform);
  };

  element = async (domElement) => {
    const element = new Element(domElement);

    await Promise.all(this.#transforms.map(async (transform) => {
      await transform(element);
    }));
  };
}

class Element {
  constructor(domElement) {
    this.domElement = domElement;
  }

  getAttribute = (attr) => {return this.domElement.getAttribute(attr)};
  hasAttribute = (attr) => {return this.domElement.hasAttribute(attr)};
  setAttribute = (attr, value) => {this.domElement.setAttribute(attr, value)};
  removeAttribute = (attr) => {return this.domElement.removeAttribute(attr)};

  setContent = (content) => {this.domElement.innerHTML = content};
  setTextContent = (content) => {this.domElement.textContent = content};
}

export default Renderer;