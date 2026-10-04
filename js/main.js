(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const qrRows = [
    "11111110101011111",
    "10000010100110001",
    "10111010011110111",
    "10111010100010111",
    "10111010010110111",
    "10000010111010001",
    "11111110101011111",
    "00000000101100000",
    "11011011110101101",
    "01001010001010010",
    "10110101110100111",
    "00000000110110000",
    "11111110101101101",
    "10000010010011011",
    "10111010101100001",
    "10111010011110101",
    "11111110101011111",
  ];

  function buildQR() {
    const host = document.querySelector(".qr");
    if (!host || host.childElementCount) return;
    host.style.gridTemplateColumns = "repeat(" + qrRows[0].length + ", 1fr)";
    qrRows.forEach(function (row) {
      row.split("").forEach(function (bit) {
        const cell = document.createElement("i");
        if (bit === "1") cell.className = "on";
        host.appendChild(cell);
      });
    });
  }

  function bindMail() {
    const toast = document.querySelector(".toast");
    let timer = 0;
    document.querySelectorAll("[data-email]").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        const email = el.getAttribute("data-email");
        const show = function (message) {
          if (!toast) return;
          toast.textContent = message;
          toast.classList.add("is-on");
          clearTimeout(timer);
          timer = setTimeout(function () {
            toast.classList.remove("is-on");
          }, 2600);
        };
        const write = navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard.writeText(email)
          : Promise.reject();
        write.then(function () {
          show("Copied " + email);
        }).catch(function () {
          show(email);
        });
        window.open(
          "https://mail.google.com/mail/?view=cm&fs=1&to=" + encodeURIComponent(email),
          "_blank",
          "noopener,noreferrer"
        );
      });
    });
  }

  function release() {
    root.classList.remove("is-loading");
    root.classList.add("is-ready");
  }

  buildQR();
  bindMail();

  if (reduce || !window.gsap || !window.ScrollTrigger || !window.Lenis) {
    showBars();
    release();
    return;
  }

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  function playCount(el, delay) {
    if (!el || el.dataset.played === "1") return;
    el.dataset.played = "1";
    const target = Number(el.dataset.target);
    const suffix = el.dataset.suffix || "";
    const counter = { value: 0 };
    el.textContent = "0" + suffix;
    gsap.to(counter, {
      value: target,
      duration: 1.25,
      delay: delay || 0,
      ease: "power2.out",
      onUpdate: function () {
        el.textContent = Math.round(counter.value) + suffix;
      },
    });
  }

  function showBars() {
    document.querySelectorAll(".status i[data-fill]").forEach(function (bar) {
      bar.style.setProperty("--w", bar.getAttribute("data-fill") || "70%");
    });
  }

  let lenis;
  try {
    lenis = new window.Lenis({
      duration: 1.05,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
    });
    lenis.on("scroll", function () {
      ScrollTrigger.update();
      const progress = document.querySelector(".progress span");
      if (progress) progress.style.transform = "scaleX(" + lenis.progress + ")";
      const mark = window.innerHeight * 0.33;
      let active = "";
      document.querySelectorAll("main section[id]").forEach(function (section) {
        const box = section.getBoundingClientRect();
        if (box.top <= mark && box.bottom > mark) active = section.id;
      });
      document.querySelectorAll(".hud-links a").forEach(function (link) {
        link.classList.toggle("is-active", link.getAttribute("href") === "#" + active);
      });
    });
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (event) {
        const id = anchor.getAttribute("href");
        if (!id || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -20, duration: 1.1 });
      });
    });

    gsap.utils.toArray(".stage, .loadout article, .rank > div, .work-head, .about").forEach(function (el) {
      gsap.from(el, {
        y: 36,
        autoAlpha: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 84%" },
      });
    });

    document.querySelectorAll(".net line").forEach(function (line) {
      const length = line.getTotalLength();
      gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
    });
    gsap.to(".net line", {
      strokeDashoffset: 0,
      duration: 1.2,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: { trigger: ".net", start: "top 75%" },
    });

    const big = document.querySelector(".big [data-target]");
    ScrollTrigger.create({
      trigger: ".big",
      start: "top 80%",
      once: true,
      onEnter: function () { playCount(big); },
    });

    gsap.set(".hero .line > span", { yPercent: 110 });
    gsap.set(".hud", { autoAlpha: 0, y: -10 });
    gsap.set(".hero-fade, .jp, .roles, .dek", { autoAlpha: 0, y: 16 });

    const intro = gsap.timeline({
      defaults: { ease: "power4.out" },
      onComplete: function () {
        const loader = document.querySelector(".loader");
        if (loader) loader.style.visibility = "hidden";
      },
    });
    intro
      .to(".loader-bar span", { scaleX: 1, duration: 0.7, ease: "power2.inOut" })
      .to(".loader", {
        yPercent: -100,
        duration: 0.8,
        ease: "power4.inOut",
        onStart: function () {
          const loader = document.querySelector(".loader");
          if (loader) loader.style.pointerEvents = "none";
          root.classList.remove("is-loading");
          root.classList.add("is-open");
          lenis.start();
        },
      })
      .to(".hud", { autoAlpha: 1, y: 0, duration: 0.6 }, "-=0.5")
      .to(".hero .line > span", { yPercent: 0, duration: 0.95, stagger: 0.08 }, "-=0.65")
      .to(".jp, .roles, .dek, .hero-fade", { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06 }, "-=0.6")
      .add(function () {
        document.querySelectorAll(".status [data-target]").forEach(function (el, index) {
          playCount(el, index * 0.06);
        });
        showBars();
      }, "<");

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  } catch (error) {
    console.error(error);
    release();
    if (lenis) lenis.start();
  }
})();
