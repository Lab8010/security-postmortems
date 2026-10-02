/* テーマ切替（自動 → ライト → ダーク）。選択は localStorage に保存し、自動のときは OS 設定に従う */
(function () {
  var KEY = "theme";
  var MODES = ["auto", "light", "dark"];
  var LABELS = { auto: "表示：自動", light: "表示：ライト", dark: "表示：ダーク" };
  var root = document.documentElement;

  function load() {
    try { var v = localStorage.getItem(KEY); if (MODES.indexOf(v) >= 0) return v; } catch (e) {}
    return "auto";
  }
  function apply(mode) {
    if (mode === "auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", mode);
  }

  var mode = load();
  apply(mode); // 描画前に適用してちらつきを防ぐ

  document.addEventListener("DOMContentLoaded", function () {
    var nav = document.querySelector(".site-nav");
    if (!nav) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "theme-toggle";
    function render() {
      b.textContent = LABELS[mode];
      b.setAttribute("aria-label", "表示テーマを切り替える（現在: " + LABELS[mode].replace("表示：", "") + "）");
    }
    b.addEventListener("click", function () {
      mode = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
      apply(mode);
      try { if (mode === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, mode); } catch (e) {}
      render();
    });
    render();
    nav.appendChild(b);
  });
})();
