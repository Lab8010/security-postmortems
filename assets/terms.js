/*
 * 用語ずかん 共通スクリプト
 * - glossary.html: data/terms.json を元に用語集本体を描画する
 * - それ以外のページ: ページ内の <a class="term-link" data-term="xxx"> を見つけて、
 *   ホバー時に用語の説明を表示するツールチップを付与する（クリックすれば glossary.html に遷移）
 */
(function () {
  "use strict";

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "class") node.className = attrs[k];
      else if (k === "text") node.textContent = attrs[k];
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function fetchTerms() {
    return fetch("data/terms.json").then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  /* ---------- Tooltip for term-link hovers (shared with chart tooltips if present) ---------- */
  function ensureTooltip() {
    var tip = document.getElementById("tooltip");
    if (!tip) {
      tip = el("div", { class: "tooltip", id: "tooltip", role: "tooltip" });
      document.body.appendChild(tip);
    }
    return tip;
  }

  function attachTermHover(byId) {
    var tip = ensureTooltip();
    var links = document.querySelectorAll('[data-term]');
    links.forEach(function (node) {
      var t = byId[node.getAttribute("data-term")];
      if (!t) return;
      node.addEventListener("mouseenter", function (e) { show(e); });
      node.addEventListener("mousemove", function (e) { move(e); });
      node.addEventListener("mouseleave", hide);
      node.addEventListener("focus", function (e) { show(e); });
      node.addEventListener("blur", hide);

      function show(e) {
        tip.textContent = "";
        tip.appendChild(el("strong", { text: t.term + (t.reading ? "（" + t.reading + "）" : "") }));
        tip.appendChild(el("div", { class: "tt-note", text: t.short }));
        tip.appendChild(el("div", { class: "tt-note", style: "margin-top:4px;color:var(--accent)", text: "クリックで詳しい解説へ →" }));
        tip.classList.add("show");
        move(e);
      }
      function move(e) {
        var w = tip.offsetWidth, h = tip.offsetHeight;
        var x = e.clientX, y = e.clientY;
        if (e.type === "focus") {
          var r = node.getBoundingClientRect();
          x = r.left + r.width / 2; y = r.top;
        }
        var left = Math.min(Math.max(8, x + 14), window.innerWidth - w - 8);
        var top = y - h - 12;
        if (top < 8) top = y + 18;
        tip.style.left = left + "px";
        tip.style.top = top + "px";
      }
      function hide() { tip.classList.remove("show"); }
    });
  }

  /* ---------- Glossary page rendering ---------- */
  function renderGlossary(data) {
    var list = document.getElementById("glossary-list");
    if (!list) return;
    var order = Object.keys(data.categories);
    var byCat = {};
    order.forEach(function (c) { byCat[c] = []; });
    data.terms.slice().sort(function (a, b) { return a.term.localeCompare(b.term, "ja"); })
      .forEach(function (t) { (byCat[t.category] = byCat[t.category] || []).push(t); });

    order.forEach(function (catId, i) {
      var items = byCat[catId] || [];
      if (!items.length) return;
      var accent = "var(--cat-" + ((i % 7) + 1) + ")";
      var section = el("section", { class: "zukan-section", id: "cat-" + catId, style: "--card-accent:" + accent });
      section.appendChild(el("div", { class: "zukan-cat-head" }, [
        el("span", { class: "zukan-cat-icon", style: "background:" + accent, "aria-hidden": "true" }, [
          el("span", { style: "font-size:15px;font-weight:700;color:#fff", text: items.length })
        ]),
        el("h2", { class: "zukan-cat-title", text: data.categories[catId] })
      ]));
      var grid = el("div", { class: "glossary-grid" });
      items.forEach(function (t) {
        var card = el("article", { class: "glossary-card", id: "t-" + t.id });
        card.appendChild(el("h3", {}, [t.term, t.reading ? el("span", { class: "glossary-reading", text: "（" + t.reading + "）" }) : null]));
        card.appendChild(el("p", { class: "glossary-short", text: t.short }));
        if (t.long) card.appendChild(el("p", { class: "glossary-long", text: t.long }));
        if (t.related && t.related.length) {
          var rel = el("p", { class: "glossary-related" }, ["関連する内容：".length ? "関連する内容：" : ""]);
          t.related.forEach(function (r, idx) {
            if (idx > 0) rel.appendChild(document.createTextNode("、"));
            rel.appendChild(el("a", { href: r.href, text: r.label }));
          });
          card.appendChild(rel);
        }
        grid.appendChild(card);
      });
      section.appendChild(grid);
      list.appendChild(section);
    });

    document.getElementById("glossary-total").textContent = data.terms.length;

    /* 簡易フィルタ */
    var input = document.getElementById("glossary-search");
    if (input) {
      input.addEventListener("input", function () {
        var q = input.value.trim().toLowerCase();
        document.querySelectorAll(".glossary-card").forEach(function (card) {
          var hit = !q || card.textContent.toLowerCase().indexOf(q) !== -1;
          card.style.display = hit ? "" : "none";
        });
        document.querySelectorAll(".zukan-section").forEach(function (sec) {
          var any = Array.prototype.some.call(sec.querySelectorAll(".glossary-card"), function (c) { return c.style.display !== "none"; });
          sec.style.display = any ? "" : "none";
        });
      });
    }
  }

  fetchTerms().then(function (data) {
    var byId = {};
    data.terms.forEach(function (t) { byId[t.id] = t; });
    attachTermHover(byId);
    renderGlossary(data);
  }).catch(function (err) {
    var list = document.getElementById("glossary-list");
    if (list) list.textContent = "用語データを読み込めませんでした（" + err.message + "）。";
  });
})();
