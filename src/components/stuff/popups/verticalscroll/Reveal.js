import { gsap } from "gsap";

export default class Reveal {
  constructor() {
    this.items = new Map();
    gsap.utils.toArray(".gallery__slide").forEach((slide) => {
      const wrapper = slide.querySelector(".gallery__img-wrapper");
      const caption = slide.querySelector("figcaption");

      gsap.set(wrapper, { autoAlpha: 0 });
      if (caption) gsap.set(caption, { autoAlpha: 0 });

      this.items.set(slide, { wrapper, caption });
    });
  }

  toggle(changes, immediate = false) {
    changes
      .filter((change) => change.visible)
      .sort((a, b) => a.top - b.top)
      .forEach((change, i) => this.show(change.el, i * 0.12, immediate));

    changes.filter((change) => !change.visible).forEach((change) => this.hide(change.el));
  }

  show(slide, delay, immediate = false) {
    const { wrapper, caption } = this.items.get(slide);

    if (immediate) {
      gsap.set(wrapper, { autoAlpha: 1, overwrite: true });
      if (caption) gsap.set(caption, { autoAlpha: 1, overwrite: true });
      return;
    }

    gsap.to(wrapper, { autoAlpha: 1, duration: 1, ease: "power2.out", delay, overwrite: true });
    if (caption) gsap.to(caption, { autoAlpha: 1, duration: 0.4, ease: "none", delay: delay + 0.2, overwrite: true });
  }

  hide(slide) {
    const { wrapper, caption } = this.items.get(slide);
    gsap.set(wrapper, { autoAlpha: 0, overwrite: true });
    if (caption) gsap.set(caption, { autoAlpha: 0, overwrite: true });
  }
}
