/* 影響ずかん：業界フィルター。カード内の業種タグ（.zukan-industries）から業界を判定して絞り込む */
(function () {
  var INDUSTRIES = ["小売・EC", "製造業", "食品・飲料", "物流", "交通・インフラ", "不動産", "医療", "レジャー・サービス", "金融・保険", "IT・通信"];

  // 業種タグの文言 → フィルターの業界名（「業種を問わず」系は null = どの業界を選んでも表示）
  function normalize(label) {
    if (/業種を問わず|業種全般/.test(label)) return null;
    if (/生活インフラ|交通/.test(label)) return "交通・インフラ";
    if (/小売|EC/.test(label)) return "小売・EC";
    if (/食品|飲料/.test(label)) return "食品・飲料";
    if (/不動産/.test(label)) return "不動産";
    if (/製造/.test(label)) return "製造業";
    if (/物流/.test(label)) return "物流";
    if (/医療/.test(label)) return "医療";
    if (/レジャー|サービス業/.test(label)) return "レジャー・サービス";
    if (/金融|保険/.test(label)) return "金融・保険";
    if (/IT|通信/.test(label)) return "IT・通信";
    return null;
  }

  var cards = Array.prototype.slice.call(document.querySelectorAll(".zukan-card"));
  var bar = document.getElementById("industry-filter");
  if (!bar || !cards.length) return;

  cards.forEach(function (card) {
    var set = [];
    Array.prototype.forEach.call(card.querySelectorAll(".zukan-industries .chip"), function (chip) {
      var name = normalize(chip.textContent);
      if (name && set.indexOf(name) < 0) set.push(name);
    });
    card._industries = set;
    card._generic = !!card.querySelector(".zukan-industries .industry-generic");
  });

  var status = document.getElementById("industry-status");
  var buttons = [];

  function apply(selected) {
    var shown = 0;
    cards.forEach(function (card) {
      var match = !selected || card._generic || card._industries.indexOf(selected) >= 0;
      card.hidden = !match;
      if (match) shown++;
    });
    Array.prototype.forEach.call(document.querySelectorAll(".zukan-section"), function (sec) {
      var visible = sec.querySelector(".zukan-card:not([hidden])");
      sec.hidden = !visible;
      var link = document.querySelector('.zukan-legend a[href="#' + sec.id + '"]');
      if (link) link.parentNode.hidden = !visible;
    });
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", String((b.dataset.industry || "") === (selected || "")));
    });
    status.textContent = selected
      ? "「" + selected + "」で " + shown + " 件を表示中（「業種を問わず」のカードを含む）"
      : "すべての影響（" + shown + " 件）を表示中";
    try {
      var url = new URL(location.href);
      if (selected) url.searchParams.set("industry", selected); else url.searchParams.delete("industry");
      history.replaceState(null, "", url);
    } catch (e) {}
  }

  ["すべて"].concat(INDUSTRIES).forEach(function (name, i) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "industry-btn";
    b.textContent = name;
    b.dataset.industry = i === 0 ? "" : name;
    b.addEventListener("click", function () { apply(b.dataset.industry || null); });
    bar.appendChild(b);
    buttons.push(b);
  });

  var initial = null;
  try { initial = new URL(location.href).searchParams.get("industry"); } catch (e) {}
  apply(INDUSTRIES.indexOf(initial) >= 0 ? initial : null);
})();
