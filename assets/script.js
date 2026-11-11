document.addEventListener("DOMContentLoaded", function () {
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  var dividers = document.querySelectorAll(".divider");
  dividers.forEach(function (el, i) {
    if (i % 2 === 1) el.classList.add("flip");
  });

  if ("IntersectionObserver" in window) {
    var dividerObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    dividers.forEach(function (el) {
      dividerObserver.observe(el);
    });
  } else {
    dividers.forEach(function (el) {
      el.classList.add("in-view");
    });
  }
});


(function () {
  var BG_SPEED = 0.2;
  var ASPECT = 9720 / 1920;
  var ticking = false;
  function updateScrollVar() {
    var imageHeight = window.innerWidth * ASPECT;
    var maxOffset = Math.max(0, imageHeight - window.innerHeight);
    var offset = Math.min(Math.max(window.scrollY, 0) * BG_SPEED, maxOffset);
    document.documentElement.style.setProperty("--bg-y", -offset + "px");
    ticking = false;
  }
  window.addEventListener(
    "scroll",
    function () {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollVar);
        ticking = true;
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", updateScrollVar);
  updateScrollVar();
})();


(function () {
  var KEY = "mw-a11y";
  var root = document.documentElement;
  var groups = [
    { key: "theme", label: "Colour theme", def: "dark", options: [
      ["dark", "Dark"], ["light", "Light"], ["hc-dark", "High contrast dark"], ["hc-light", "High contrast light"] ] },
    { key: "text", label: "Text size", def: "normal", options: [
      ["normal", "Default"], ["lg", "Large"], ["xl", "Extra large"] ] },
    { key: "spacing", label: "Line spacing", def: "normal", options: [
      ["normal", "Default"], ["relaxed", "Increased"], ["loose", "Extra"] ] },
    { key: "font", label: "Font", def: "default", options: [
      ["default", "Default"], ["dyslexic", "OpenDyslexic"] ] },
    { key: "motion", label: "Animations", def: "full", options: [
      ["full", "On"], ["reduce", "Reduced"] ] }
  ];

  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { state = {}; }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {  }
  }
  function matches(q) {
    try { return window.matchMedia(q).matches; } catch (e) { return false; }
  }

  function defaultFor(group) {
    if (group.key === "motion") {
      return matches("(prefers-reduced-motion: reduce)") ? "reduce" : "full";
    }
    return group.def;
  }

  function apply(group, value) {
    if (value === defaultFor(group)) {
      delete state[group.key];
    } else {
      state[group.key] = value;
    }
    if (group.key === "motion" || group.key === "theme") {
      root.setAttribute("data-" + group.key, value);
    } else if (value === group.def) {
      root.removeAttribute("data-" + group.key);
    } else {
      root.setAttribute("data-" + group.key, value);
    }
  }

  function build() {
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "a11y-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "a11y-panel");
    toggle.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="7.5" r="1"/>' +
      '<path d="M7 10.5l5 1 5-1M12 11.5v3.5M9.5 19l2.5-4 2.5 4"/></svg>' +
      "<span>Accessibility</span>";

    var panel = document.createElement("div");
    panel.id = "a11y-panel";
    panel.className = "a11y-panel";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-labelledby", "a11y-title");
    panel.hidden = true;

    var html = '<h2 id="a11y-title">Accessibility options</h2>';
    groups.forEach(function (g) {
      var current = state[g.key] || defaultFor(g);
      html += '<fieldset><legend>' + g.label + '</legend><div class="a11y-options">';
      g.options.forEach(function (o) {
        html += '<label><input type="radio" name="a11y-' + g.key + '" value="' + o[0] + '"' +
          (o[0] === current ? " checked" : "") + "><span>" + o[1] + "</span></label>";
      });
      html += "</div></fieldset>";
    });
    html += '<div class="a11y-actions"><button type="button" data-a11y="reset">Reset all</button>' +
      '<button type="button" data-a11y="close">Close</button></div>';
    panel.innerHTML = html;

    document.body.appendChild(panel);
    document.body.appendChild(toggle);

    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var first = panel.querySelector("input:checked");
        if (first) first.focus();
      } else {
        toggle.focus();
      }
    }

    toggle.addEventListener("click", function () { setOpen(panel.hidden); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) setOpen(false);
    });
    panel.addEventListener("change", function (e) {
      var input = e.target;
      if (input.type !== "radio") return;
      var g = groups.filter(function (x) { return "a11y-" + x.key === input.name; })[0];
      if (g) { apply(g, input.value); save(); }
    });
    panel.addEventListener("click", function (e) {
      var action = e.target.getAttribute && e.target.getAttribute("data-a11y");
      if (action === "close") setOpen(false);
      if (action === "reset") {
        groups.forEach(function (g) {
          apply(g, defaultFor(g));
          var radio = panel.querySelector('input[name="a11y-' + g.key + '"][value="' + defaultFor(g) + '"]');
          if (radio) radio.checked = true;
        });
        save();
      }
    });


    var mq;
    try { mq = window.matchMedia("(prefers-reduced-motion: reduce)"); } catch (e) { mq = null; }
    if (mq) {
      var onChange = function () {
        if (state.motion) return;
        var m = mq.matches ? "reduce" : "full";
        root.setAttribute("data-motion", m);
        var radio = panel.querySelector('input[name="a11y-motion"][value="' + m + '"]');
        if (radio) radio.checked = true;
      };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  if (document.body) build();
  else document.addEventListener("DOMContentLoaded", build);
})();


(function () {
  var root = document.getElementById("intersections");
  if (!root) return;
  var list = root.querySelector(".int-list");
  var items = Array.prototype.slice.call(root.querySelectorAll(".int-item"));
  if (!list || items.length < 2) return;

  root.classList.add("enhanced");
  list.setAttribute("role", "presentation");

  var tablist = document.createElement("div");
  tablist.className = "int-tabs";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", "Where information design and instructional design overlap");
  var instruction = document.getElementById("int-instruction");
  if (instruction) {
    instruction.hidden = false;
    tablist.setAttribute("aria-describedby", "int-instruction");
  }

  var tabs = items.map(function (li, i) {
    var tab = document.createElement("button");
    tab.type = "button";
    tab.className = "int-tab";
    tab.id = "int-tab-" + i;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", "int-panel-" + i);
    tab.innerHTML = li.getAttribute("data-tab") || li.querySelector("h4").innerHTML;
    li.id = "int-panel-" + i;
    li.setAttribute("role", "tabpanel");
    li.setAttribute("aria-labelledby", tab.id);
    li.tabIndex = 0;
    tablist.appendChild(tab);
    tab.addEventListener("click", function () { select(i, false); });
    return tab;
  });
  root.insertBefore(tablist, list);

  function select(index, moveFocus) {
    items.forEach(function (li, n) {
      var on = n === index;
      li.hidden = !on;
      tabs[n].setAttribute("aria-selected", on ? "true" : "false");
      tabs[n].tabIndex = on ? 0 : -1;
    });
    if (moveFocus) tabs[index].focus();
  }

  tablist.addEventListener("keydown", function (e) {
    var i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    var target = null;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") target = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") target = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") target = 0;
    else if (e.key === "End") target = tabs.length - 1;
    if (target === null) return;
    e.preventDefault();
    select(target, true);
  });

  select(0, false);
})();


(function () {
  var dlg, imgEl, countEl, prevBtn, nextBtn, closeBtn;
  var group = [], index = 0, opener = null;


  function zoomable(img) {
    return !img.closest("a") &&
      !img.closest(".hero") &&
      !img.classList.contains("tile-icon") &&
      !img.classList.contains("no-zoom") &&
      (img.getAttribute("alt") || "").trim() !== "";
  }

  function build() {
    dlg = document.createElement("dialog");
    dlg.className = "lightbox";
    dlg.innerHTML =
      '<button type="button" class="lightbox-close" aria-label="Close enlarged image">Close \u2715</button>' +
      '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous image">\u2039</button>' +
      '<img class="lightbox-img" alt="">' +
      '<button type="button" class="lightbox-nav lightbox-next" aria-label="Next image">\u203A</button>' +
      '<p class="lightbox-count" aria-live="polite"></p>';
    document.body.appendChild(dlg);
    imgEl = dlg.querySelector(".lightbox-img");
    countEl = dlg.querySelector(".lightbox-count");
    prevBtn = dlg.querySelector(".lightbox-prev");
    nextBtn = dlg.querySelector(".lightbox-next");
    closeBtn = dlg.querySelector(".lightbox-close");

    closeBtn.addEventListener("click", closeDialog);
    prevBtn.addEventListener("click", function () { show(index - 1); });
    nextBtn.addEventListener("click", function () { show(index + 1); });

    dlg.addEventListener("click", function (e) {
      if (e.target !== imgEl && !e.target.closest("button")) closeDialog();
    });
    dlg.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
    });

    dlg.addEventListener("close", cleanup);
  }

  function cleanup() {
    document.documentElement.classList.remove("lightbox-open");
    if (opener) { opener.focus(); opener = null; }
  }

  function closeDialog() {
    if (dlg.open) dlg.close();
    cleanup();
  }

  function show(i) {
    if (!group.length) return;
    index = (i + group.length) % group.length;
    var src = group[index];
    imgEl.src = src.currentSrc || src.src;
    imgEl.alt = src.alt;
    var panel = src.closest(".logo-card-img");
    imgEl.classList.toggle("lightbox-img-light", !!panel && !panel.classList.contains("dark"));
    dlg.setAttribute("aria-label", src.alt + " (enlarged)");
    var many = group.length > 1;
    prevBtn.hidden = nextBtn.hidden = countEl.hidden = !many;
    countEl.textContent = many ? (index + 1) + " of " + group.length : "";
  }

  function open(img) {
    if (!dlg) build();
    var grid = img.closest(".image-grid, .carousel-track");
    group = grid ? Array.prototype.filter.call(grid.querySelectorAll("img"), zoomable) : [img];
    opener = img;
    show(Math.max(0, group.indexOf(img)));
    document.documentElement.classList.add("lightbox-open");
    dlg.showModal();
    closeBtn.focus();
  }

  var imgs = Array.prototype.filter.call(document.querySelectorAll("main img"), zoomable);
  imgs.forEach(function (img) {
    img.classList.add("zoomable");
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", img.alt + " (opens enlarged view)");
    img.addEventListener("click", function () { open(img); });
    img.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(img); }
    });
  });
})();


(function () {
  var tips = document.querySelectorAll('.tip');
  if (!tips.length) return;
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    tips.forEach(function (t) { t.classList.add('tip-dismissed'); });
  });
  tips.forEach(function (t) {
    ['mouseenter', 'focus'].forEach(function (ev) {
      t.addEventListener(ev, function () { t.classList.remove('tip-dismissed'); });
    });
  });
})();


(function () {
  var dividers = document.querySelectorAll('.divider');
  var seed = location.pathname.length;
  dividers.forEach(function (d, i) {
    var n = ((i * 8 + seed) % 21) + 1;
    d.style.setProperty('--divider-shape', 'url("i-like-shapes/Shape%20' + n + '.svg")');
  });
})();


(function () {
  var grids = document.querySelectorAll('.cv-grid');
  if (!grids.length) return;
  var GAP = 16;
  function layout(grid) {
    var n = grid.children.length;
    if (n === 1) { grid.style.gridTemplateColumns = 'minmax(0, 520px)'; return; }
    var min = grid.classList.contains('wide') ? 320 : 250;
    var maxCols = Math.max(1, Math.floor((grid.clientWidth + GAP) / (min + GAP)));
    var best = 1;
    for (var d = 1; d <= Math.min(maxCols, n); d++) if (n % d === 0) best = d;
    grid.style.gridTemplateColumns = 'repeat(' + best + ', minmax(0, 1fr))';
  }
  function all() { grids.forEach(layout); }
  all();
  window.addEventListener('resize', all);
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(all);
    grids.forEach(function (g) { ro.observe(g); });
  }
})();


(function () {
  document.querySelectorAll('.carousel').forEach(function (c) {
    var track = c.querySelector('.carousel-track');
    var slides = c.querySelectorAll('.carousel-slide');
    var dots = c.querySelectorAll('.carousel-dot input');
    var n = slides.length, cur = 0;
    function render() {
      slides.forEach(function (s, k) {
        var d = ((k - cur + n + Math.floor(n / 2)) % n) - Math.floor(n / 2);
        s.classList.toggle('pos-0', d === 0);
        s.classList.toggle('pos-l', d === -1);
        s.classList.toggle('pos-r', d === 1);
        s.setAttribute('aria-hidden', d === 0 ? 'false' : (Math.abs(d) === 1 ? 'false' : 'true'));
      });
      dots[cur].checked = true;
    }
    function go(i) { cur = (i + n) % n; render(); }
    c.querySelector('.carousel-prev').addEventListener('click', function () { go(cur - 1); });
    c.querySelector('.carousel-next').addEventListener('click', function () { go(cur + 1); });
    dots.forEach(function (d, i) { d.addEventListener('change', function () { go(i); }); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    });
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    slides.forEach(function (s, k) {
      s.addEventListener('click', function (e) { if (!s.classList.contains('pos-0')) { e.stopPropagation(); go(k); } }, true);
    });
    render();
  });
})();
