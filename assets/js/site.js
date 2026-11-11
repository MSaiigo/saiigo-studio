/* Saiigo Studio — render del sitio a partir de content.js. No hace falta editar este archivo para cambiar textos. */
(function () {
  "use strict";

  var C = window.SAIIGO;
  var IMG = window.SAIIGO_IMG || {};
  var params = new URLSearchParams(location.search);
  var host = location.hostname;
  var PREVIEW =
    location.protocol === "file:" ||
    host === "localhost" || host === "127.0.0.1" || host === "[::1]" ||
    params.has("preview");
  var PREVIEW_QS = params.has("preview") ? "&preview" : "";
  var page = document.body.getAttribute("data-page");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function visibleProjects() {
    return C.projects.filter(function (p) { return p.status === "published" || PREVIEW; });
  }
  // En la versión publicada (tools/build.js) cada proyecto tiene su propia página con título y vista previa.
  function projectHref(p) {
    return C.built ? p.slug + ".html" : "project.html?p=" + encodeURIComponent(p.slug) + PREVIEW_QS;
  }
  function mailto() {
    return "mailto:" + C.site.email + "?subject=" + encodeURIComponent(C.site.emailSubject);
  }
  // Solo ofrece al navegador los anchos que existen de verdad (ver tools/resize-images.sh).
  function srcset(file) {
    var real = IMG[file] || 2400;
    var out = [];
    [800, 1600, 2400].forEach(function (w) {
      if (w < real) out.push("images/" + file + "-" + w + ".jpg " + w + "w");
    });
    var top = real < 800 ? 800 : real < 1600 ? 1600 : 2400;
    out.push("images/" + file + "-" + top + ".jpg " + Math.min(real, 2400) + "w");
    return out.join(", ");
  }

  /** Imagen responsive, video, o marcador identificado si falta el archivo. */
  function media(img, opts) {
    opts = opts || {};
    var cls = "media" + (opts.className ? " " + opts.className : "");
    var sizes = opts.sizes || "100vw";
    if (img && img.video) {
      var poster = img.poster ? ' poster="images/' + esc(img.poster) + '-1600.jpg"' : "";
      // Se reproduce en silencio solo cuando está en pantalla; controles para activar el sonido.
      return '<div class="' + cls + '"><video class="media__el" src="' + esc(img.video) + '"' + poster +
        ' muted loop playsinline controls preload="none"' + (reduceMotion ? "" : " data-inview-play") +
        ' aria-label="' + esc(img.alt) + '"></video></div>';
    }
    if (!img || !img.file) {
      var label = img && img.placeholder ? img.placeholder : "Image";
      return '<div class="' + cls + ' media--placeholder" role="img" aria-label="' + esc((img && img.alt) || label) + '">' +
        (PREVIEW ? '<span class="placeholder-tag"><b>Placeholder</b>' + esc(label) + "</span>" : "") + "</div>";
    }
    var pos = img.position || "50% 50%";
    var mpos = img.mobilePosition || pos;
    var mobile = img.mobileFile
      ? '<source media="(max-width: 767px)" srcset="' + srcset(img.mobileFile) + '" sizes="100vw">' : "";
    return '<div class="' + cls + '" style="--pos:' + esc(pos) + ";--pos-m:" + esc(mpos) + '">' +
      "<picture>" + mobile +
      '<img class="media__el" src="images/' + esc(img.file) + '-1600.jpg" srcset="' + srcset(img.file) +
      '" sizes="' + sizes + '" alt="' + esc(img.alt) + '"' +
      (opts.eager ? ' loading="eager" fetchpriority="high" decoding="async"' : ' loading="lazy" decoding="async"') +
      "></picture></div>";
  }

  function wordmark(stacked) {
    return '<span class="wordmark' + (stacked ? " wordmark--stacked" : "") + '">' +
      (stacked ? "<span>SAIIGO</span><span>STUDIO</span>" : "SAIIGO STUDIO") + "</span>";
  }

  function joinMeta(parts) {
    return parts.filter(Boolean).map(esc).join('<span class="sep" aria-hidden="true">·</span>');
  }

  /* ---------- header + menu ---------- */
  function renderHeader() {
    var base = page === "home" ? "" : "index.html" + (params.has("preview") ? "?preview" : "");
    var links = C.site.nav.map(function (n) {
      return '<li><a href="' + base + n.href + '">' + esc(n.label) + "</a></li>";
    }).join("");
    var el = document.getElementById("site-header");
    el.innerHTML =
      '<div class="header__inner">' +
        '<a class="header__logo" href="' + (base || "#top") + '" aria-label="Saiigo Studio, home">' + wordmark(false) + "</a>" +
        '<nav class="header__nav" aria-label="Main"><ul>' + links + "</ul></nav>" +
        '<button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu">' +
          '<span class="menu-btn__label">Menu</span><span class="menu-btn__icon" aria-hidden="true"></span></button>' +
      "</div>" +
      '<div class="mobile-menu" id="mobile-menu" hidden>' +
        '<nav aria-label="Main mobile"><ul>' + links + "</ul></nav>" +
        '<div class="mobile-menu__foot"><a href="' + mailto() + '">' + esc(C.site.email) + "</a>" +
        '<a href="' + esc(C.site.instagram.url) + '" target="_blank" rel="noopener">Instagram ' + esc(C.site.instagram.handle) + "</a></div>" +
      "</div>";

    var btn = el.querySelector(".menu-btn");
    var menu = el.querySelector(".mobile-menu");
    function setOpen(open) {
      btn.setAttribute("aria-expanded", String(open));
      btn.querySelector(".menu-btn__label").textContent = open ? "Close" : "Menu";
      document.documentElement.classList.toggle("menu-open", open);
      if (open) {
        menu.hidden = false;
        void menu.offsetHeight; // forzar reflow para que la transición arranque
        menu.classList.add("is-open");
        var first = menu.querySelector("a"); if (first) first.focus();
      } else {
        menu.classList.remove("is-open");
        setTimeout(function () { if (btn.getAttribute("aria-expanded") === "false") menu.hidden = true; }, reduceMotion ? 0 : 220);
      }
    }
    btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") { setOpen(false); btn.focus(); }
      // Mantener el foco dentro del menú abierto
      if (e.key === "Tab" && btn.getAttribute("aria-expanded") === "true") {
        var f = [btn].concat([].slice.call(menu.querySelectorAll("a")));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.matchMedia("(min-width: 900px)").addEventListener("change", function (m) { if (m.matches) setOpen(false); });

    // Header transparente sobre la portada, sólido al bajar
    var sentinel = document.querySelector("[data-header-sentinel]");
    if (sentinel && "IntersectionObserver" in window) {
      el.classList.add("is-over-media");
      new IntersectionObserver(function (entries) {
        el.classList.toggle("is-over-media", entries[0].isIntersecting);
      }, { rootMargin: "-64px 0px 0px 0px" }).observe(sentinel);
    }
  }

  function contactBlock() {
    return '<section class="contact" id="contact" aria-labelledby="contact-title"><div class="wrap">' +
      '<h2 class="contact__title" id="contact-title">' + esc(C.contact.title) + "</h2>" +
      '<p class="contact__text">' + esc(C.contact.text) + "</p>" +
      '<a class="btn btn--light" href="' + mailto() + '">' + esc(C.contact.button) + '<span aria-hidden="true">→</span></a>' +
      '<p class="contact__email"><a href="' + mailto() + '">' + esc(C.site.email) + "</a></p>" +
      '<div class="contact__foot"><span>' + esc(C.site.city) + "</span>" +
      '<a href="' + esc(C.site.instagram.url) + '" target="_blank" rel="noopener">Instagram ' + esc(C.site.instagram.handle) + "</a>" +
      "<span>© " + new Date().getFullYear() + " " + esc(C.site.name) + "</span></div>" +
      '<div class="contact__mark" aria-hidden="true">' + wordmark(true) + "</div>" +
      "</div></section>";
  }

  function previewBar() {
    if (!PREVIEW) return "";
    return '<div class="preview-bar mono" role="note">Preview · drafts visible</div>';
  }

  /* ---------- home ---------- */
  function renderHome() {
    var h = C.hero;
    var heroMedia = h.video
      ? '<div class="media hero__media"><video class="media__el" src="' + esc(h.video.mp4) + '" muted loop playsinline ' +
        (reduceMotion ? "" : "autoplay ") + (h.image.file ? 'poster="images/' + esc(h.image.file) + '-1600.jpg"' : "") +
        ' aria-hidden="true"></video></div>'
      : media(h.image, { className: "hero__media", eager: true, sizes: "100vw" });

    var projects = visibleProjects();
    var workHtml = projects.length
      ? '<div class="work-grid">' + projects.map(function (p, i) {
          return '<article class="work-card work-card--' + (i % 2 ? "b" : "a") + '">' +
            '<a class="work-card__link" href="' + projectHref(p) + '">' +
              '<div class="work-card__frame">' + media(p.cover, { sizes: "(min-width: 900px) 58vw, 100vw" }) +
              (p.status === "draft" ? '<span class="draft-tag mono">Draft</span>' : "") + "</div>" +
              '<h3 class="work-card__title">' + (p.client ? '<span class="work-card__client">' + esc(p.client) + "</span> " : "") + esc(p.title) + "</h3>" +
              '<p class="meta mono">' + joinMeta([p.type, p.city]) + "</p>" +
              '<p class="work-card__summary">' + esc(p.summary) + "</p>" +
              '<span class="text-link">View project<span aria-hidden="true"> →</span></span>' +
            "</a></article>";
        }).join("") + "</div>"
      : '<p class="work-empty">' + esc(C.work.emptyText) + ' <a class="text-link" href="#contact">Get in touch</a></p>';

    var services = C.services.items.map(function (s) {
      return '<li class="service">' +
        '<h3 class="service__title">' + esc(s.title) + "</h3>" +
        '<div class="service__body"><p>' + esc(s.text) + "</p>" +
        '<p class="service__examples"><span class="visually-hidden">Examples: </span>' +
          s.examples.map(esc).join('<span class="sep" aria-hidden="true"> · </span>') + "</p>" +
        "</div></li>";
    }).join("");

    var a = C.about;
    document.getElementById("main").innerHTML =
      previewBar() +
      '<section class="hero" aria-labelledby="hero-title">' + heroMedia +
        '<div class="hero__shade" aria-hidden="true"></div>' +
        '<div class="hero__content wrap">' +
          '<div class="hero__head"><h1 class="hero__title" id="hero-title">' + esc(h.title) + "</h1></div>" +
          '<div class="hero__body"><p class="hero__text">' + esc(h.text) + "</p>" +
          '<div class="hero__actions">' +
            '<a class="btn btn--light" href="' + h.primary.href + '">' + esc(h.primary.label) + "</a>" +
            '<a class="btn btn--ghost" href="' + h.secondary.href + '">' + esc(h.secondary.label) + "</a>" +
          "</div></div></div>" +
        '<span class="hero__sentinel" data-header-sentinel aria-hidden="true"></span>' +
      "</section>" +

      '<section class="section work" id="work" aria-labelledby="work-title"><div class="wrap">' +
        '<header class="section__head"><h2 class="section__title" id="work-title">' + esc(C.work.title) + "</h2>" +
        (C.work.intro ? '<p class="section__intro">' + esc(C.work.intro) + "</p>" : "") + "</header>" +
        workHtml + "</div></section>" +

      '<section class="section services" id="services" aria-labelledby="services-title"><div class="wrap">' +
        '<header class="section__head"><h2 class="section__title" id="services-title">' + esc(C.services.title) + "</h2>" +
        (C.services.intro ? '<p class="section__intro">' + esc(C.services.intro) + "</p>" : "") + "</header>" +
        '<ul class="service-list">' + services + "</ul></div></section>" +

      '<section class="section about" id="about" aria-labelledby="about-title"><div class="wrap about__grid">' +
        '<div class="about__media">' + media(a.image, { sizes: "(min-width: 900px) 42vw, 100vw" }) + "</div>" +
        '<div class="about__text">' +
          '<h2 class="section__title" id="about-title">' + esc(a.title) + "</h2>" +
          a.paragraphs.map(function (t, i) { return '<p' + (i === 0 ? ' class="about__lead"' : "") + ">" + esc(t) + "</p>"; }).join("") +
          '<p class="about__ig"><a class="text-link" href="' + esc(C.site.instagram.url) + '" target="_blank" rel="noopener">' +
          "Follow Saiigo on Instagram " + esc(C.site.instagram.handle) + '<span aria-hidden="true"> ↗</span></a></p>' +
        "</div></div></section>" +
      contactBlock();
  }

  /* ---------- ficha de proyecto ---------- */
  function draftChecklist(p) {
    var missing = [];
    if (!p.cover.file) missing.push("Cover image");
    var g = p.gallery.filter(function (x) { return !x.file && !x.video; }).length;
    if (g) missing.push(g + " gallery image(s)/video(s)");
    if (!p.year) missing.push("Year / dates");
    if (!p.deliverables.length) missing.push("Deliverables");
    if (!p.credits.length) missing.push("Credits");
    missing.push("Confirm context, role and alt text");
    return '<aside class="draft-box" aria-label="Draft checklist"><p class="mono"><b>Draft — not public.</b> To publish, set status to "published" once these are ready:</p><ul>' +
      missing.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></aside>";
  }

  function projectName(p) { return (p.client ? p.client + " — " : "") + p.title; }

  function renderProject() {
    var slug = document.body.getAttribute("data-slug") || params.get("p");
    var list = visibleProjects();
    var p = list.filter(function (x) { return x.slug === slug; })[0];
    var main = document.getElementById("main");

    if (!p) {
      document.title = "Project not found | Saiigo Studio";
      main.innerHTML = previewBar() + '<section class="section notfound"><div class="wrap">' +
        '<h1 class="section__title">This project isn’t online.</h1>' +
        '<p class="notfound__text">It may have moved or not be public yet. Here is the work that is:</p>' +
        '<ul class="notfound__list">' + list.map(function (x) {
          return '<li><a class="text-link" href="' + projectHref(x) + '">' + esc(projectName(x)) + "</a></li>";
        }).join("") + "</ul></div></section>" + contactBlock();
      return;
    }

    document.title = projectName(p) + " | Saiigo Studio";
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", p.summary);

    var idx = list.indexOf(p);
    var next = list[(idx + 1) % list.length];

    var facts = [
      ["Client", p.client], ["Location", p.location], ["Year", p.year], ["Type", p.type]
    ].filter(function (f) { return f[1]; }).map(function (f) {
      return '<div><dt class="mono">' + f[0] + "</dt><dd>" + esc(f[1]) + "</dd></div>";
    }).join("");

    var highlight = p.highlight
      ? '<p class="case-highlight"><span class="case-highlight__value">' + esc(p.highlight.value) + "</span> " + esc(p.highlight.text) + "</p>"
      : "";

    var metrics = p.metrics.length
      ? '<ul class="metrics">' + p.metrics.map(function (m) {
          return '<li><span class="metrics__value">' + esc(m.value) + '</span><span class="mono">' + esc(m.label) + "</span></li>";
        }).join("") + "</ul>" : "";

    // La portada ya abre la ficha: no la repetimos en la galería.
    var gallery = p.gallery.filter(function (g) { return !(g.file && p.cover && g.file === p.cover.file); }).map(function (g) {
      return '<figure class="gallery__item gallery__item--' + esc(g.size || "large") + '">' +
        media(g, { sizes: g.size === "wide" ? "100vw" : g.size === "large" ? "(min-width: 900px) 66vw, 100vw" : "(min-width: 900px) 33vw, 100vw" }) +
        (g.caption ? "<figcaption>" + esc(g.caption) + "</figcaption>" : "") + "</figure>";
    }).join("");

    var deliverables = p.deliverables.length
      ? "<ul>" + p.deliverables.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>"
      : (PREVIEW ? '<p class="pending mono">To confirm</p>' : "");
    var credits = p.credits.length
      ? '<dl class="credits">' + p.credits.map(function (c) {
          return '<div><dt class="mono">' + esc(c.role) + "</dt><dd>" + esc(c.name) + "</dd></div>";
        }).join("") + "</dl>"
      : (PREVIEW ? '<p class="pending mono">To confirm</p>' : "");

    main.innerHTML = previewBar() +
      '<section class="case-hero" aria-labelledby="case-title">' +
        media(p.cover, { className: "case-hero__media", eager: true, sizes: "100vw" }) +
        '<div class="hero__shade" aria-hidden="true"></div>' +
        '<div class="case-hero__content wrap">' +
          '<h1 class="case-hero__title" id="case-title">' + (p.client ? "<span>" + esc(p.client) + "</span> " : "") + esc(p.title) + "</h1>" +
          '<p class="meta mono">' + joinMeta([p.type, p.city, p.year]) + "</p>" +
        "</div>" +
        '<span class="hero__sentinel" data-header-sentinel aria-hidden="true"></span>' +
      "</section>" +

      '<div class="wrap case-back"><a class="text-link" href="index.html' + (params.has("preview") ? "?preview" : "") + '#work">← Selected work</a></div>' +
      (p.status === "draft" && PREVIEW ? '<div class="wrap">' + draftChecklist(p) + "</div>" : "") +

      '<section class="section case-intro"><div class="wrap case-intro__grid">' +
        '<dl class="facts">' + facts + "</dl>" +
        '<div class="case-intro__text">' + highlight + '<p class="lead">' + esc(p.context) + "</p>" + metrics + "</div>" +
      "</div></section>" +

      (gallery ? '<section class="gallery wrap" aria-label="Project images">' + gallery + "</section>" : "") +

      '<section class="section case-details"><div class="wrap case-details__grid">' +
        '<div><h2 class="case-details__title">What we did</h2><p>' + esc(p.role) + "</p></div>" +
        (deliverables ? '<div><h2 class="case-details__title">Delivered</h2>' + deliverables + "</div>" : "") +
        (credits ? '<div><h2 class="case-details__title">Credits</h2>' + credits + "</div>" : "") +
      "</div></section>" +

      (next && next !== p
        ? '<nav class="wrap next-project" aria-label="Next project"><a href="' + projectHref(next) + '">' +
          '<span class="next-project__label">Next project</span><span class="next-project__title">' + esc(projectName(next)) + ' <span aria-hidden="true">→</span></span></a></nav>'
        : "") +
      contactBlock();
  }

  /* ---------- init ---------- */
  if (page === "project") renderProject(); else renderHome();
  renderHeader(); // después del contenido, para engancharse a la portada

  // Videos de galería: play al entrar en pantalla, pausa al salir
  var vids = document.querySelectorAll("video[data-inview-play]");
  if (vids.length && "IntersectionObserver" in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { var pr = e.target.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else e.target.pause();
      });
    }, { threshold: 0.35 });
    [].forEach.call(vids, function (v) { vio.observe(v); });
  }

  // Fundido suave al cargar cada imagen
  [].forEach.call(document.querySelectorAll("img.media__el"), function (img) {
    if (img.complete) img.classList.add("is-loaded");
    else {
      img.addEventListener("load", function () { img.classList.add("is-loaded"); });
      img.addEventListener("error", function () {
        // Si el archivo aún no existe, mostramos el marcador
        var box = img.closest(".media"); if (box) { box.classList.add("media--placeholder"); img.remove(); }
      });
    }
  });

  // Si llegamos con un ancla (#contact desde una ficha), saltar después del render
  if (location.hash) {
    var t = document.querySelector(location.hash);
    if (t) t.scrollIntoView();
  }
})();
