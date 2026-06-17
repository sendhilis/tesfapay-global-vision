/*!
 * BankGPT Embed Loader
 * --------------------
 * Tiny vanilla-JS bundle that the bank's host app (e.g.
 * https://abxmobilebanking.techurate.world) drops in via a single <script>
 * tag. It reads its own data-* attributes, mounts a Shadow-DOM widget
 * (bubble | inline | fullscreen), and talks to the BankGPT agent backend.
 *
 * Usage on the host page:
 *
 *   <script async
 *     src="https://abxwallet.techurate.world/embed/bankgpt.js"
 *     data-agent="ag_retail_01"
 *     data-tenant="abx"
 *     data-style="bubble"
 *     data-surfaces="home,wallet"
 *     data-api="https://sgjfidsnyxhjxkevjgje.supabase.co"
 *     data-key="<anon-key>"
 *     data-token="<optional bank-issued JWT>"
 *     data-bank-name="ABX Bank"
 *     data-agent-name="ABX Assistant"
 *     data-tagline="Your banking copilot"
 *     data-language="en"
 *     data-mount="#bankgpt-inline-slot"  // inline/fullscreen only
 *   ></script>
 *
 * No dependencies. Safe to load multiple times (idempotent per agent id).
 */
(function () {
  "use strict";
  if (typeof window === "undefined") return;
  var WIDGET_VERSION = "2026.06.17-directdata";
  try { console.info("[BankGPT] widget loader v" + WIDGET_VERSION); } catch (_) {}
  window.__BANKGPT_WIDGET_VERSION__ = WIDGET_VERSION;


  // ─── locate our own <script> tag ─────────────────────────────────────────
  var script =
    document.currentScript ||
    (function () {
      var s = document.getElementsByTagName("script");
      for (var i = s.length - 1; i >= 0; i--) {
        if ((s[i].src || "").indexOf("bankgpt.js") !== -1) return s[i];
      }
      return null;
    })();
  if (!script) {
    console.warn("[BankGPT] Could not locate loader <script> tag.");
    return;
  }

  var ds = script.dataset || {};
  var cfg = {
    agentId: ds.agent || "default",
    tenant: ds.tenant || "default",
    style: (ds.style || "bubble").toLowerCase(), // bubble | inline | fullscreen
    surfaces: (ds.surfaces || "").split(",").map(trim).filter(Boolean),
    api: (ds.api || "https://sgjfidsnyxhjxkevjgje.supabase.co").replace(/\/$/, ""),
    key: ds.key || "",
    token: ds.token || "",
    bankName: ds.bankName || "Bank",
    agentName: ds.agentName || "BankGPT Assistant",
    tagline: ds.tagline || "How can I help you today?",
    // Optional override; normally the server-side registry persona is used.
    systemPromptOverride: ds.systemPrompt || "",
    language: (ds.language || "en").toLowerCase() === "am" ? "am" : "en",
    voice: (ds.voice || "on").toLowerCase() !== "off",
    autoSpeak: (ds.autospeak || ds.autoSpeak || "on").toLowerCase() !== "off",
    mount: ds.mount || null,
    primary: ds.primary || "#D4AF37", // gold
    accent: ds.accent || "#0B3D2E", // deep green
  };

  // de-dupe per agent id
  var instanceKey = "__bankgpt_" + cfg.agentId;
  if (window[instanceKey]) return;
  window[instanceKey] = true;

  function trim(s) { return (s || "").trim(); }

  var AMARA_FALLBACK_CUSTOMER = {
    customerId: "CDP-CUST-001",
    fullName: "Selam Tadesse",
    firstName: "Selam",
    primaryLanguage: "am",
    city: "Addis Ababa",
    occupation: "Nurse · Black Lion Hospital",
    currency: "ETB",
    accounts: [
      { id: "ACC-1", name: "Primary Savings", type: "savings", provider: "ABX Bank", balance: 64320 },
      { id: "ACC-2", name: "Current Account", type: "current", provider: "ABX Bank", balance: 12480 },
      { id: "ACC-3", name: "Telebirr Wallet", type: "wallet", provider: "Telebirr", balance: 3850 }
    ],
    spend: {
      monthlyTotal: 19400,
      topCategory: "Groceries",
      weeklyByDay: [
        { name: "Mon", value: 560 }, { name: "Tue", value: 720 }, { name: "Wed", value: 640 },
        { name: "Thu", value: 810 }, { name: "Fri", value: 690 }, { name: "Sat", value: 1180 }, { name: "Sun", value: 1040 }
      ],
      categoryBreakdown: [
        { name: "Groceries", value: 4200 }, { name: "Transport", value: 2850 }, { name: "Utilities", value: 2200 },
        { name: "Remittance", value: 1500 }, { name: "Food", value: 1380 }, { name: "Airtime", value: 760 }
      ]
    },
    recentTransactions: [
      { date: "Today 11:02", direction: "debit", amount: 850, category: "Transport", counterparty: "Ride ET", channel: "MNO wallet" },
      { date: "Yesterday", direction: "debit", amount: 3200, category: "Groceries", counterparty: "Shoa Supermarket", channel: "Card" },
      { date: "Yesterday", direction: "debit", amount: 400, category: "Airtime", counterparty: "Ethio Telecom", channel: "Telebirr" },
      { date: "2 days ago", direction: "debit", amount: 1500, category: "Remittance", counterparty: "Mother (Bahir Dar)", channel: "P2P" },
      { date: "3 days ago", direction: "debit", amount: 2200, category: "Utilities", counterparty: "EEU electricity", channel: "Biller" },
      { date: "5 days ago", direction: "debit", amount: 780, category: "Food", counterparty: "Kategna Restaurant", channel: "Card" }
    ]
  };

  function resolveCustomerProfile() {
    if (ds.customer) {
      try { return JSON.parse(ds.customer); } catch (e) { console.warn("[BankGPT] invalid data-customer JSON", e); }
    }
    if (window.BankGPTCustomer && typeof window.BankGPTCustomer === "object") return window.BankGPTCustomer;
    if (window.ABX_CDP_CUSTOMER && typeof window.ABX_CDP_CUSTOMER === "object") return window.ABX_CDP_CUSTOMER;
    return AMARA_FALLBACK_CUSTOMER;
  }

  // ─── helpers ─────────────────────────────────────────────────────────────
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "style" && typeof attrs[k] === "object") {
          for (var sk in attrs[k]) node.style[sk] = attrs[k][sk];
        } else if (k === "html") {
          node.innerHTML = attrs[k];
        } else if (k.indexOf("on") === 0 && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (attrs[k] != null) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function mdLite(s) {
    // very small markdown subset for assistant replies
    var h = escapeHtml(s);
    h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
    h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    h = h.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    h = h.replace(/\n/g, "<br/>");
    return h;
  }

  function extractEmbeddedBlocks(text) {
    var charts = [], actions = [], voiceSummary = "";
    var stripped = String(text || "").replace(/```([a-zA-Z0-9_-]*)\s*([\s\S]*?)```/g, function (_m, tag, body) {
      var lower = String(tag || "").toLowerCase();
      var raw = String(body || "").trim();
      if (lower === "voice") {
        if (!voiceSummary) voiceSummary = raw.replace(/\s+/g, " ").trim();
        return "";
      }
      try {
        var parsed = JSON.parse(raw);
        var t = parsed && parsed.type;
        if ((t === "pie" || t === "donut" || t === "bar" || t === "line") && Array.isArray(parsed.data)) charts.push(parsed);
        else if (t) actions.push(parsed);
      } catch (_) {}
      return "";
    }).replace(/\n{3,}/g, "\n\n").trim();
    return { text: stripped, charts: charts, actions: actions, voiceSummary: voiceSummary };
  }

  // ─── chart / action renderers (inline SVG, no external deps) ─────────────
  var CHART_PALETTE = ["#0B3D2E", "#D4AF37", "#1d4ed8", "#dc2626", "#0891b2", "#7c3aed", "#ea580c", "#16a34a"];

  function fmtCurrency(v, ccy) {
    var n = Number(v) || 0;
    try {
      return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n) + (ccy ? " " + ccy : "");
    } catch (_) { return String(n) + (ccy ? " " + ccy : ""); }
  }

  function pointName(d, fallback) {
    return String((d && (d.name || d.label || d.category || d.day || d.date || d.merchant || d.counterparty)) || fallback || "");
  }

  function pointValue(d) {
    var raw = d && (d.value != null ? d.value : d.amount != null ? d.amount : d.total != null ? d.total : d.debit);
    return Math.abs(Number(String(raw == null ? 0 : raw).replace(/[^0-9.-]/g, ""))) || 0;
  }

  function chartSVG(chart) {
    var type = (chart && chart.type) || "bar";
    var data = Array.isArray(chart && chart.data) ? chart.data.slice(0, 12) : [];
    if (!data.length) return "";
    var ccy = chart.currency || "";
    var W = 320, H = 180, pad = 24;
    if (type === "pie" || type === "donut") {
      var total = data.reduce(function (s, d) { return s + pointValue(d); }, 0) || 1;
      var cx = W / 2, cy = H / 2, r = 70, ir = type === "donut" ? 38 : 0;
      var ang = -Math.PI / 2, paths = "";
      data.forEach(function (d, i) {
        var v = pointValue(d);
        var slice = (v / total) * Math.PI * 2;
        if (slice >= Math.PI * 2 - 0.0001) slice = Math.PI * 2 - 0.0001;
        var a2 = ang + slice;
        var large = slice > Math.PI ? 1 : 0;
        var x1 = cx + r * Math.cos(ang), y1 = cy + r * Math.sin(ang);
        var x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
        var color = CHART_PALETTE[i % CHART_PALETTE.length];
        if (ir > 0) {
          var ix1 = cx + ir * Math.cos(a2), iy1 = cy + ir * Math.sin(a2);
          var ix2 = cx + ir * Math.cos(ang), iy2 = cy + ir * Math.sin(ang);
          paths += '<path d="M ' + x1 + ' ' + y1 +
            ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 +
            ' L ' + ix1 + ' ' + iy1 +
            ' A ' + ir + ' ' + ir + ' 0 ' + large + ' 0 ' + ix2 + ' ' + iy2 +
            ' Z" fill="' + color + '"/>';
        } else {
          paths += '<path d="M ' + cx + ' ' + cy + ' L ' + x1 + ' ' + y1 +
            ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2 + ' Z" fill="' + color + '"/>';
        }
        ang = a2;
      });
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' + paths + '</svg>';
    }
    var max = data.reduce(function (m, d) { var v = pointValue(d); return v > m ? v : m; }, 0) || 1;
    var innerW = W - pad * 2, innerH = H - pad * 2;
    if (type === "line") {
      var step = data.length > 1 ? innerW / (data.length - 1) : 0;
      var pts = data.map(function (d, i) {
        var v = pointValue(d);
        var x = pad + i * step;
        var y = pad + innerH - (v / max) * innerH;
        return x + "," + y;
      }).join(" ");
      var ticks = "";
      data.forEach(function (d, i) {
        var x = pad + i * step;
        ticks += '<text x="' + x + '" y="' + (H - 6) + '" font-size="9" text-anchor="middle" fill="#64748b">' +
          escapeHtml(pointName(d, "").slice(0, 6)) + '</text>';
      });
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img">' +
        '<polyline fill="none" stroke="' + CHART_PALETTE[0] + '" stroke-width="2.5" points="' + pts + '"/>' +
        ticks + '</svg>';
    }
    // bar
    var bw = innerW / data.length;
    var bars = "";
    data.forEach(function (d, i) {
      var v = pointValue(d);
      var h = (v / max) * innerH;
      var x = pad + i * bw + 2;
      var y = pad + innerH - h;
      var color = CHART_PALETTE[i % CHART_PALETTE.length];
      bars += '<rect x="' + x + '" y="' + y + '" width="' + (bw - 4) + '" height="' + h +
        '" rx="3" fill="' + color + '"/>' +
        '<text x="' + (x + (bw - 4) / 2) + '" y="' + (H - 6) +
        '" font-size="9" text-anchor="middle" fill="#64748b">' +
        escapeHtml(pointName(d, "").slice(0, 8)) + '</text>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + escapeHtml(chart.title || "") + '">' +
      bars + '</svg>';
  }

  function chartLegend(chart) {
    var data = Array.isArray(chart && chart.data) ? chart.data.slice(0, 12) : [];
    if (!data.length) return "";
    var ccy = chart.currency || "";
    return data.map(function (d, i) {
      var color = CHART_PALETTE[i % CHART_PALETTE.length];
      return '<span><i style="background:' + color + '"></i>' +
        escapeHtml(pointName(d, "")) + ' · ' +
        escapeHtml(fmtCurrency(pointValue(d), ccy)) + '</span>';
    }).join("");
  }

  function chartNode(chart) {
    var card = el("div", { class: "bgpt-chart" });
    var html = "";
    if (chart && chart.title) html += '<div class="bgpt-chart-title">' + escapeHtml(chart.title) + "</div>";
    html += chartSVG(chart);
    html += '<div class="bgpt-chart-legend">' + chartLegend(chart) + "</div>";
    card.innerHTML = html;
    return card;
  }

  function actionLabel(t) {
    return ({
      transfer_bank_to_bank: "Bank transfer",
      transfer_bank_to_mno: "Wallet transfer",
      transfer_p2p: "Send to contact",
      savings_deposit: "Savings deposit",
      savings_withdraw: "Savings withdrawal",
      tbill_purchase: "T-Bill purchase",
      loan_repay: "Loan repayment",
      transfer: "Transfer",
    })[t] || "Action";
  }

  function actionNode(action, onConfirm) {
    var rows = [
      ["Amount", action.amount != null ? fmtCurrency(action.amount, action.currency || "ETB") : null],
      ["From", action.fromAccount],
      ["To bank", action.toBank],
      ["To account", action.toAccount],
      ["To wallet", action.toWallet],
      ["To MSISDN", action.toMsisdn],
      ["To contact", action.toContact],
      ["Memo", action.memo],
    ].filter(function (r) { return r[1]; });
    var card = el("div", { class: "bgpt-action" });
    var html = '<div class="bgpt-action-h">' + escapeHtml(actionLabel(action.type)) + "</div>";
    rows.forEach(function (r) {
      html += '<div class="bgpt-action-row"><span>' + escapeHtml(r[0]) +
        '</span><span class="v">' + escapeHtml(String(r[1])) + "</span></div>";
    });
    html += '<div class="bgpt-action-cta">' +
      '<button data-bgpt-action="confirm">Confirm</button>' +
      '<button class="sec" data-bgpt-action="cancel">Cancel</button></div>';
    card.innerHTML = html;
    card.querySelectorAll("[data-bgpt-action]").forEach(function (b) {
      b.addEventListener("click", function () {
        var kind = b.getAttribute("data-bgpt-action");
        if (onConfirm) onConfirm(kind, action);
        b.parentNode.innerHTML = kind === "confirm"
          ? '<span style="font-size:11px;color:#16a34a;font-weight:600">✓ Confirmed (simulated)</span>'
          : '<span style="font-size:11px;color:#94a3b8">Cancelled</span>';
      });
    });
    return card;
  }


  // ─── styles (scoped to Shadow DOM) ───────────────────────────────────────
  var CSS = "\n" +
"*,*::before,*::after{box-sizing:border-box}\n" +
":host{all:initial;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0f172a}\n" +
".bgpt-dock{position:fixed;right:20px;bottom:20px;z-index:2147483646;display:flex;flex-direction:column;align-items:center;gap:6px;touch-action:none;user-select:none;-webkit-user-select:none}\n" +
".bgpt-dock.bgpt-dragging .bgpt-launcher{cursor:grabbing;transform:scale(1.08)}\n" +
".bgpt-launcher{width:60px;height:60px;border-radius:9999px;background:var(--bgpt-accent);color:var(--bgpt-primary);box-shadow:0 10px 30px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;cursor:grab;border:2px solid var(--bgpt-primary);transition:transform .15s ease}\n" +
".bgpt-launcher:hover{transform:scale(1.05)}\n" +
".bgpt-launcher svg{width:28px;height:28px;pointer-events:none}\n" +
".bgpt-label{font-size:11px;font-weight:700;letter-spacing:.06em;color:#fff;background:var(--bgpt-accent);padding:3px 8px;border-radius:9999px;border:1px solid var(--bgpt-primary);box-shadow:0 4px 12px rgba(0,0,0,.2);white-space:nowrap;pointer-events:none}\n" +
".bgpt-panel{position:fixed;right:20px;bottom:92px;width:380px;max-width:calc(100vw - 32px);height:560px;max-height:calc(100vh - 120px);background:#fff;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden;z-index:2147483646;border:1px solid rgba(0,0,0,.06)}\n" +
".bgpt-panel.bgpt-hidden{display:none}\n" +
".bgpt-inline{width:100%;height:100%;min-height:480px;background:#fff;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(0,0,0,.08)}\n" +
".bgpt-fullscreen{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:24px}\n" +
".bgpt-fullscreen .bgpt-panel{position:static;width:min(720px,100%);height:min(80vh,720px)}\n" +
".bgpt-header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bgpt-accent);color:#fff}\n" +
".bgpt-avatar{width:32px;height:32px;border-radius:9999px;background:var(--bgpt-primary);color:var(--bgpt-accent);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}\n" +
".bgpt-title{font-size:14px;font-weight:600;line-height:1.1}\n" +
".bgpt-sub{font-size:11px;opacity:.8;margin-top:2px}\n" +
".bgpt-close{margin-left:auto;background:transparent;border:0;color:#fff;cursor:pointer;padding:6px;border-radius:6px;opacity:.85}\n" +
".bgpt-close:hover{opacity:1;background:rgba(255,255,255,.12)}\n" +
".bgpt-body{flex:1;overflow-y:auto;padding:14px;background:#f8fafc}\n" +
".bgpt-msg{display:flex;margin-bottom:10px;animation:bgpt-in .18s ease}\n" +
".bgpt-msg.bgpt-user{justify-content:flex-end}\n" +
".bgpt-bubble{max-width:82%;padding:9px 12px;border-radius:14px;font-size:13.5px;line-height:1.45;word-wrap:break-word}\n" +
".bgpt-msg.bgpt-user .bgpt-bubble{background:var(--bgpt-accent);color:#fff;border-bottom-right-radius:4px}\n" +
".bgpt-msg.bgpt-bot .bgpt-bubble{background:#fff;color:#0f172a;border:1px solid rgba(0,0,0,.06);border-bottom-left-radius:4px}\n" +
".bgpt-bubble code{background:rgba(0,0,0,.06);padding:1px 4px;border-radius:4px;font-size:12px}\n" +
".bgpt-typing{display:inline-flex;gap:4px;padding:10px 12px}\n" +
".bgpt-typing span{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:bgpt-blink 1.2s infinite}\n" +
".bgpt-typing span:nth-child(2){animation-delay:.2s}.bgpt-typing span:nth-child(3){animation-delay:.4s}\n" +
"@keyframes bgpt-blink{0%,80%,100%{opacity:.3}40%{opacity:1}}\n" +
"@keyframes bgpt-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}\n" +
".bgpt-input{display:flex;gap:6px;padding:10px;border-top:1px solid rgba(0,0,0,.06);background:#fff;align-items:flex-end}\n" +
".bgpt-input textarea{flex:1;resize:none;border:1px solid rgba(0,0,0,.12);border-radius:10px;padding:9px 11px;font:inherit;font-size:13.5px;outline:none;max-height:120px;line-height:1.4}\n" +
".bgpt-input textarea:focus{border-color:var(--bgpt-accent)}\n" +
".bgpt-iconbtn{background:#f1f5f9;color:var(--bgpt-accent);border:0;border-radius:10px;width:38px;height:38px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}\n" +
".bgpt-iconbtn:hover{background:#e2e8f0}\n" +
".bgpt-iconbtn.bgpt-active{background:var(--bgpt-accent);color:#fff}\n" +
".bgpt-iconbtn.bgpt-rec{background:#dc2626;color:#fff;animation:bgpt-pulse 1s infinite}\n" +
".bgpt-iconbtn svg{width:18px;height:18px}\n" +
".bgpt-iconbtn:disabled{opacity:.5;cursor:not-allowed}\n" +
"@keyframes bgpt-pulse{0%,100%{opacity:1}50%{opacity:.55}}\n" +
".bgpt-hdrbtn{background:rgba(255,255,255,.15);color:#fff;border:0;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:11px;font-weight:600;margin-left:6px}\n" +
".bgpt-hdrbtn:hover{background:rgba(255,255,255,.25)}\n" +
".bgpt-hdrbtn.bgpt-active{background:var(--bgpt-primary);color:var(--bgpt-accent)}\n" +
".bgpt-input textarea:focus{border-color:var(--bgpt-accent)}\n" +
".bgpt-send{background:var(--bgpt-accent);color:#fff;border:0;border-radius:10px;padding:0 14px;cursor:pointer;font-weight:600;font-size:13px}\n" +
".bgpt-send:disabled{opacity:.5;cursor:not-allowed}\n" +
".bgpt-foot{padding:6px 12px 8px;font-size:10px;text-align:center;color:#94a3b8;background:#fff;border-top:1px solid rgba(0,0,0,.04)}\n" +
".bgpt-audit{position:absolute;top:56px;right:8px;width:300px;max-height:340px;overflow-y:auto;background:#0f172a;color:#e2e8f0;border-radius:10px;box-shadow:0 12px 32px rgba(0,0,0,.35);padding:10px;z-index:10;font-size:11px}\n" +
".bgpt-audit.bgpt-hidden{display:none}\n" +
".bgpt-audit h4{margin:0 0 6px;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8}\n" +
".bgpt-audit-row{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,.06)}\n" +
".bgpt-audit-row:last-child{border-bottom:0}\n" +
".bgpt-audit-row .k{color:#94a3b8}\n" +
".bgpt-audit-row .v{color:#fbbf24;font-weight:600;text-align:right}\n" +
".bgpt-audit-row .v.on{color:#34d399}\n" +
".bgpt-audit-row .v.off{color:#64748b}\n" +
".bgpt-audit-evt{display:flex;align-items:flex-start;gap:6px;padding:6px;margin-top:4px;border-radius:6px;background:rgba(220,38,38,.18);border-left:3px solid #ef4444}\n" +
".bgpt-audit-evt.ok{background:rgba(16,185,129,.14);border-left-color:#10b981}\n" +
".bgpt-audit-evt .t{font-size:9px;color:#94a3b8;margin-bottom:2px}\n" +
".bgpt-audit-dot{position:absolute;top:6px;right:6px;width:8px;height:8px;border-radius:50%;background:#ef4444;border:2px solid var(--bgpt-accent)}\n" +
".bgpt-audit-empty{color:#64748b;font-style:italic;padding:4px 0}\n" +
".bgpt-chart{margin:6px 0 4px;padding:10px;background:#fff;border:1px solid rgba(0,0,0,.08);border-radius:12px;max-width:100%}\n" +
".bgpt-chart-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#475569;margin-bottom:6px}\n" +
".bgpt-chart svg{display:block;width:100%;height:auto;overflow:visible}\n" +
".bgpt-chart-legend{display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:8px;font-size:11px;color:#334155}\n" +
".bgpt-chart-legend i{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;vertical-align:middle}\n" +
".bgpt-action{margin:6px 0 4px;padding:10px 12px;background:#fff;border:1px solid rgba(0,0,0,.08);border-left:3px solid var(--bgpt-primary);border-radius:10px;font-size:12.5px}\n" +
".bgpt-action-h{font-weight:700;color:var(--bgpt-accent);margin-bottom:4px;font-size:12px}\n" +
".bgpt-action-row{display:flex;justify-content:space-between;gap:8px;padding:1px 0;color:#475569}\n" +
".bgpt-action-row .v{color:#0f172a;font-weight:600;text-align:right}\n" +
".bgpt-action-cta{margin-top:8px;display:flex;gap:6px}\n" +
".bgpt-action-cta button{flex:1;background:var(--bgpt-accent);color:#fff;border:0;border-radius:8px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer}\n" +
".bgpt-action-cta button.sec{background:#f1f5f9;color:#0f172a}\n" +
".bgpt-quick{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 4px;border-top:1px solid rgba(0,0,0,.06);background:linear-gradient(180deg,rgba(248,250,252,.6),rgba(255,255,255,0))}\n" +
".bgpt-quick-label{width:100%;font-size:10.5px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:2px}\n" +
".bgpt-chip{display:inline-flex;align-items:center;gap:5px;background:#fff;border:1px solid rgba(15,23,42,.12);color:#0f172a;border-radius:999px;padding:6px 11px;font-size:12px;font-weight:500;cursor:pointer;transition:all .15s ease;white-space:nowrap}\n" +
".bgpt-chip:hover{border-color:var(--bgpt-primary);color:var(--bgpt-primary);background:rgba(59,130,246,.06);transform:translateY(-1px)}\n" +
".bgpt-chip:active{transform:translateY(0)}\n" +
".bgpt-chip svg{width:12px;height:12px}\n" +
"@media (max-width:480px){.bgpt-panel{right:8px;left:8px;width:auto;bottom:84px;height:70vh}.bgpt-audit{width:calc(100% - 16px);right:8px}}\n";

  // ─── Widget class ────────────────────────────────────────────────────────
  function Widget(cfg) {
    this.cfg = cfg;
    this.messages = [];
    this.pending = false;
    this.host = null;
    this.shadow = null;
    this.panel = null;
    this.bodyEl = null;
    this.textareaEl = null;
    this.sendBtn = null;
    this.open = cfg.style !== "bubble"; // inline + fullscreen open by default
  }

  Widget.prototype.mount = function () {
    // pick a host element
    var hostTarget;
    if (this.cfg.style === "inline") {
      hostTarget = this.cfg.mount ? document.querySelector(this.cfg.mount) : null;
      if (!hostTarget) {
        // fall back to inserting next to the <script> tag
        hostTarget = el("div", { "data-bankgpt-inline": "" });
        script.parentNode.insertBefore(hostTarget, script.nextSibling);
      }
    } else {
      hostTarget = el("div", { "data-bankgpt-root": "" });
      document.body.appendChild(hostTarget);
    }
    this.host = hostTarget;
    this.shadow = hostTarget.attachShadow({ mode: "open" });

    var styleEl = el("style");
    styleEl.textContent =
      ":host{--bgpt-primary:" + this.cfg.primary + ";--bgpt-accent:" + this.cfg.accent + "}" + CSS;
    this.shadow.appendChild(styleEl);

    if (this.cfg.style === "bubble") this.renderBubble();
    else if (this.cfg.style === "fullscreen") this.renderFullscreen();
    else this.renderInline();
  };

  Widget.prototype.headerNode = function (withClose) {
    var initials = (this.cfg.agentName || "AI")
      .split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase();
    var self = this;

    // language toggle
    this.langBtn = el("button", {
      class: "bgpt-hdrbtn",
      type: "button",
      title: "Toggle language",
      onClick: function () { self.toggleLanguage(); },
    }, [self.cfg.language === "am" ? "አማ" : "EN"]);

    // speaker toggle (TTS auto-play)
    this.speakerBtn = this.cfg.voice ? el("button", {
      class: "bgpt-hdrbtn" + (self.cfg.autoSpeak ? " bgpt-active" : ""),
      type: "button",
      title: "Toggle voice replies",
      onClick: function () { self.unlockAudio(); self.toggleSpeaker(); },
      html: self.cfg.autoSpeak
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    }) : null;

    // audit / guardrail status toggle
    this.auditBtn = el("button", {
      class: "bgpt-hdrbtn",
      type: "button",
      title: "Guardrail audit",
      style: { position: "relative" },
      onClick: function () { self.toggleAudit(); },
      html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z"/></svg>',
    });
    this.auditDot = el("span", { class: "bgpt-audit-dot", style: { display: "none" } });
    this.auditBtn.appendChild(this.auditDot);

    var closeBtn = withClose
      ? el("button", { class: "bgpt-close", "aria-label": "Close",
          onClick: function () { self.toggle(false); },
          html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' })
      : null;

    var controls = el("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center" } }, [
      this.langBtn, this.speakerBtn, this.auditBtn, closeBtn,
    ]);

    return el("div", { class: "bgpt-header" }, [
      el("div", { class: "bgpt-avatar" }, [initials]),
      el("div", {}, [
        el("div", { class: "bgpt-title" }, [this.cfg.agentName]),
        el("div", { class: "bgpt-sub" }, [this.cfg.tagline]),
      ]),
      controls,
    ]);
  };

  Widget.prototype.auditNode = function () {
    this.auditEvents = this.auditEvents || [];
    this.auditPanel = el("div", { class: "bgpt-audit bgpt-hidden", role: "region", "aria-label": "Guardrail audit" });
    this.renderAudit();
    return this.auditPanel;
  };

  Widget.prototype.toggleAudit = function (force) {
    if (!this.auditPanel) return;
    var show = typeof force === "boolean" ? force : this.auditPanel.classList.contains("bgpt-hidden");
    this.auditPanel.classList[show ? "remove" : "add"]("bgpt-hidden");
    if (show && this.auditDot) this.auditDot.style.display = "none";
  };

  Widget.prototype.logGuardrail = function (evt) {
    this.auditEvents = this.auditEvents || [];
    this.auditEvents.unshift({ ts: new Date(), kind: evt.kind, detail: evt.detail || "", level: evt.level || "warn" });
    this.auditEvents = this.auditEvents.slice(0, 20);
    if (this.auditPanel && this.auditPanel.classList.contains("bgpt-hidden") && evt.level !== "ok" && this.auditDot) {
      this.auditDot.style.display = "block";
    }
    this.renderAudit();
  };

  Widget.prototype.renderAudit = function () {
    if (!this.auditPanel) return;
    var g = this.enforcedGuardrails || {};
    var rows = [
      ["PII redaction",       g.piiRedaction],
      ["Profanity filter",    g.profanityFilter],
      ["Jailbreak detection", g.jailbreakDetection],
      ["Blocked topics",      typeof g.blockedTopics === "number" ? g.blockedTopics : "—"],
      ["Allowed languages",   Array.isArray(g.allowedLanguages) && g.allowedLanguages.length ? g.allowedLanguages.join(", ") : "any"],
      ["Max tokens / reply",  g.maxTokensPerReply || "—"],
      ["Max turns / session", g.maxTurnsPerSession || "—"],
      ["Rate limit / min",    g.rateLimitPerMinute || "—"],
    ];
    var html = '<h4>Enforced guardrails</h4>';
    rows.forEach(function (r) {
      var v = r[1];
      var cls = v === true ? "on" : v === false ? "off" : "";
      var disp = v === true ? "ON" : v === false ? "OFF" : String(v);
      html += '<div class="bgpt-audit-row"><span class="k">' + r[0] + '</span><span class="v ' + cls + '">' + disp + "</span></div>";
    });
    html += '<h4 style="margin-top:10px">Recent events</h4>';
    if (!this.auditEvents || !this.auditEvents.length) {
      html += '<div class="bgpt-audit-empty">No guardrail activity yet.</div>';
    } else {
      this.auditEvents.forEach(function (e) {
        var t = e.ts.toLocaleTimeString();
        var safe = String(e.detail || "").replace(/[<>&]/g, function (c) { return { "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]; });
        html += '<div class="bgpt-audit-evt ' + (e.level === "ok" ? "ok" : "") + '">' +
          '<div><div class="t">' + t + '</div><div><b>' + e.kind + '</b>' + (safe ? ' — ' + safe : "") + '</div></div></div>';
      });
    }
    this.auditPanel.innerHTML = html;
  };

  Widget.prototype.bodyNode = function () {
    this.bodyEl = el("div", { class: "bgpt-body", role: "log", "aria-live": "polite" });
    this.pushBot(this.cfg.tagline, true);
    return this.bodyEl;
  };

  Widget.prototype.inputNode = function () {
    var self = this;
    this.textareaEl = el("textarea", {
      rows: 1,
      placeholder: self.cfg.language === "am" ? "መልዕክት ይጻፉ…" : "Type a message…",
      onKeydown: function (e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          self.send();
        }
      },
      onInput: function (e) {
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
      },
    });

    this.micBtn = this.cfg.voice ? el("button", {
      class: "bgpt-iconbtn",
      type: "button",
      title: "Hold to talk",
      onClick: function () { self.unlockAudio(); self.toggleMic(); },
      html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    }) : null;

    this.sendBtn = el("button", {
      class: "bgpt-send",
      type: "button",
      onClick: function () { self.unlockAudio(); self.send(); },
    }, [self.cfg.language === "am" ? "ላክ" : "Send"]);

    return el("div", {}, [
      this.quickActionsNode(),
      el("div", { class: "bgpt-input" }, [this.textareaEl, this.micBtn, this.sendBtn]),
      el("div", { class: "bgpt-foot" }, [
        "Powered by BankGPT · " + escapeHtml(this.cfg.bankName),
      ]),
    ]);
  };

  Widget.prototype.quickActionsNode = function () {
    var self = this;
    var am = this.cfg.language === "am";
    var presets = [
      { en: "Check my balance",        am: "ቀሪ ሂሳቤን ይመልከቱ",      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>' },
      { en: "Last week's spend",       am: "ያለፈው ሳምንት ወጪ",       icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-6"/></svg>' },
      { en: "Spending breakdown",      am: "የወጪ ምድብ",             icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9v9z"/><path d="M21 12A9 9 0 0 0 12 3v9z"/></svg>' },
      { en: "Loan eligibility",        am: "የብድር ብቁነት",          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' },
      { en: "Recent transactions",     am: "የቅርብ ግብይቶች",         icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' },
      { en: "Transfer money",          am: "ገንዘብ ያስተላልፉ",        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' },
    ];
    var chips = [
      el("div", { class: "bgpt-quick-label" }, [am ? "በፍጥነት ይጀምሩ" : "Quick actions"]),
    ];
    presets.forEach(function (p) {
      var label = am ? p.am : p.en;
      chips.push(el("button", {
        class: "bgpt-chip",
        type: "button",
        title: label,
        onClick: function () { self.unlockAudio(); self.sendPreset(label); },
        html: p.icon + '<span>' + escapeHtml(label) + '</span>',
      }));
    });
    this.quickEl = el("div", { class: "bgpt-quick" }, chips);
    return this.quickEl;
  };

  Widget.prototype.sendPreset = function (text) {
    if (this.pending || !text) return;
    if (this.textareaEl) { this.textareaEl.value = ""; this.textareaEl.style.height = "auto"; }
    this.pushUser(text);
    this.messages.push({ role: "user", content: text });
    this.callBackend();
  };

  Widget.prototype.toggleLanguage = function () {
    this.cfg.language = this.cfg.language === "am" ? "en" : "am";
    if (this.langBtn) this.langBtn.textContent = this.cfg.language === "am" ? "አማ" : "EN";
    if (this.textareaEl) this.textareaEl.placeholder = this.cfg.language === "am" ? "መልዕክት ይጻፉ…" : "Type a message…";
    if (this.sendBtn) this.sendBtn.textContent = this.cfg.language === "am" ? "ላክ" : "Send";
  };

  Widget.prototype.toggleSpeaker = function () {
    this.cfg.autoSpeak = !this.cfg.autoSpeak;
    if (this.speakerBtn) {
      this.speakerBtn.classList.toggle("bgpt-active", this.cfg.autoSpeak);
      this.speakerBtn.innerHTML = this.cfg.autoSpeak
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
    }
    if (!this.cfg.autoSpeak) this.stopAudio();
  };

  Widget.prototype.toggleMic = function () {
    var self = this;
    if (this.recording) { this.stopMic(); return; }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.pushBot("⚠️ Microphone not supported in this browser.");
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      var mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus" : "audio/webm";
      var rec = new MediaRecorder(stream, { mimeType: mimeType });
      var chunks = [];
      rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        var blob = new Blob(chunks, { type: "audio/webm" });
        self.recording = false;
        if (self.micBtn) self.micBtn.classList.remove("bgpt-rec");
        self.transcribeAndSend(blob);
      };
      self.recorder = rec;
      self.recording = true;
      if (self.micBtn) self.micBtn.classList.add("bgpt-rec");
      rec.start();
    }).catch(function (err) {
      console.warn("[BankGPT] mic error", err);
      self.pushBot("⚠️ Microphone permission denied.");
    });
  };

  Widget.prototype.stopMic = function () {
    try { this.recorder && this.recorder.stop(); } catch (_) {}
  };

  Widget.prototype.transcribeAndSend = function (blob) {
    var self = this;
    var typingEl = this.pushTyping();
    var form = new FormData();
    form.append("audio", blob, "clip.webm");
    form.append("language", this.cfg.language === "am" ? "amh" : "eng");
    fetch(this.cfg.api + "/functions/v1/elevenlabs-stt", {
      method: "POST",
      headers: { apikey: this.cfg.key, Authorization: "Bearer " + (this.cfg.token || this.cfg.key) },
      body: form,
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
      var text = (j && j.text || "").trim();
      if (!text) { self.pushBot(self.cfg.language === "am" ? "ምንም አልሰማሁም።" : "Didn't catch that — please try again."); return; }
      self.textareaEl.value = text;
      self.send();
    }).catch(function (err) {
      if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
      console.warn("[BankGPT] stt failed", err);
      self.pushBot("⚠️ Voice transcription failed.");
    });
  };

  // Unlock audio playback inside the user-gesture (required by Safari / mobile
  // browsers when the host page is cross-origin). Call from click handlers.
  Widget.prototype.unlockAudio = function () {
    if (this.audioEl && this.audioUnlocked) return;
    try {
      if (!this.audioEl) {
        var a = document.createElement("audio");
        a.setAttribute("playsinline", "");
        a.setAttribute("webkit-playsinline", "");
        a.preload = "auto";
        a.crossOrigin = "anonymous";
        this.audioEl = a;
      }
      // 1-frame silent mp3 to satisfy the autoplay gesture requirement.
      var silent = "data:audio/mpeg;base64,/+MYxAAAAANIAAAAAExBTUUzLjk4LjIAAAAAAAAAAAAAACQCQAAAAAAAAAAUgJAUHQQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      this.audioEl.src = silent;
      var p = this.audioEl.play();
      var self = this;
      if (p && p.then) {
        p.then(function () { self.audioUnlocked = true; })
         .catch(function () { /* will retry next gesture */ });
      } else {
        this.audioUnlocked = true;
      }
    } catch (_) {}
  };

  Widget.prototype.speak = function (text) {
    var self = this;
    if (!text) return;
    this.stopAudio();
    fetch(this.cfg.api + "/functions/v1/elevenlabs-tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: this.cfg.key,
        Authorization: "Bearer " + (this.cfg.token || this.cfg.key),
      },
      body: JSON.stringify({ text: text, lang: this.cfg.language }),
    }).then(function (r) {
      var ctype = r.headers.get("Content-Type") || "";
      if (!r.ok || ctype.indexOf("audio") !== 0) {
        console.warn("[BankGPT] tts non-audio response", r.status, ctype);
        return null;
      }
      return r.arrayBuffer();
    }).then(function (buf) {
      if (!buf) return;
      var blob = new Blob([buf], { type: "audio/mpeg" });
      var url = URL.createObjectURL(blob);
      // Reuse the gesture-unlocked element so Safari / Chrome don't block
      // playback when the request resolves outside the original click.
      if (!self.audioEl) {
        self.audioEl = document.createElement("audio");
        self.audioEl.setAttribute("playsinline", "");
        self.audioEl.preload = "auto";
      }
      var audio = self.audioEl;
      if (self.currentUrl) { try { URL.revokeObjectURL(self.currentUrl); } catch (_) {} }
      self.currentUrl = url;
      audio.src = url;
      audio.onended = function () {
        try { URL.revokeObjectURL(url); } catch (_) {}
        if (self.currentUrl === url) self.currentUrl = null;
      };
      var p = audio.play();
      if (p && p.catch) p.catch(function (e) {
        console.warn("[BankGPT] audio play blocked — tap the speaker icon once to enable voice", e);
      });
    }).catch(function (e) { console.warn("[BankGPT] tts failed", e); });
  };

  Widget.prototype.stopAudio = function () {
    if (this.audioEl) {
      try { this.audioEl.pause(); } catch (_) {}
    }
    if (this.currentUrl) {
      try { URL.revokeObjectURL(this.currentUrl); } catch (_) {}
      this.currentUrl = null;
    }
  };


  Widget.prototype.renderBubble = function () {
    var self = this;
    var launcher = el("button", {
      class: "bgpt-launcher",
      "aria-label": "Open " + this.cfg.agentName,
      html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    });
    var label = el("div", { class: "bgpt-label" }, ["ABX AI"]);
    var dock = el("div", { class: "bgpt-dock" }, [launcher, label]);
    this.dock = dock;
    this.launcher = launcher;
    this.panel = el("div", { class: "bgpt-panel bgpt-hidden" }, [
      this.headerNode(true), this.auditNode(), this.bodyNode(), this.inputNode(),
    ]);
    this.shadow.appendChild(this.panel);
    this.shadow.appendChild(dock);
    this.restoreDockPosition();
    this.enableDrag(dock, launcher);
    this.repositionPanel();
  };

  Widget.prototype.restoreDockPosition = function () {
    try {
      var saved = JSON.parse(localStorage.getItem("bgpt_dock_pos_" + this.cfg.agentId) || "null");
      if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
        this.setDockPosition(saved.left, saved.top);
      }
    } catch (_) {}
  };

  Widget.prototype.setDockPosition = function (left, top) {
    var d = this.dock; if (!d) return;
    var rect = d.getBoundingClientRect();
    var w = rect.width || 80, h = rect.height || 80;
    left = Math.max(8, Math.min(window.innerWidth - w - 8, left));
    top = Math.max(8, Math.min(window.innerHeight - h - 8, top));
    d.style.left = left + "px";
    d.style.top = top + "px";
    d.style.right = "auto";
    d.style.bottom = "auto";
    this.dockPos = { left: left, top: top };
    this.repositionPanel();
  };

  Widget.prototype.repositionPanel = function () {
    if (!this.panel || !this.dock) return;
    var d = this.dock.getBoundingClientRect();
    var pw = 380, ph = 560;
    // place panel above the dock, aligned to its right edge
    var right = Math.max(8, window.innerWidth - d.right);
    var bottom = Math.max(8, window.innerHeight - d.top + 12);
    // if not enough vertical room above, place below
    if (d.top < ph + 20) {
      bottom = Math.max(8, window.innerHeight - (d.bottom + ph + 12));
    }
    this.panel.style.right = right + "px";
    this.panel.style.bottom = bottom + "px";
    this.panel.style.left = "auto";
    this.panel.style.top = "auto";
  };

  Widget.prototype.enableDrag = function (dock, handle) {
    var self = this;
    var dragging = false, moved = false, startX = 0, startY = 0, origLeft = 0, origTop = 0;
    function onDown(e) {
      var pt = e.touches ? e.touches[0] : e;
      dragging = true; moved = false;
      var r = dock.getBoundingClientRect();
      origLeft = r.left; origTop = r.top;
      startX = pt.clientX; startY = pt.clientY;
      dock.classList.add("bgpt-dragging");
      if (e.cancelable) e.preventDefault();
    }
    function onMove(e) {
      if (!dragging) return;
      var pt = e.touches ? e.touches[0] : e;
      var dx = pt.clientX - startX, dy = pt.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
      self.setDockPosition(origLeft + dx, origTop + dy);
    }
    function onUp() {
      if (!dragging) return;
      dragging = false;
      dock.classList.remove("bgpt-dragging");
      if (moved && self.dockPos) {
        try { localStorage.setItem("bgpt_dock_pos_" + self.cfg.agentId, JSON.stringify(self.dockPos)); } catch (_) {}
      } else {
        self.toggle();
      }
    }
    handle.addEventListener("mousedown", onDown);
    handle.addEventListener("touchstart", onDown, { passive: false });
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("resize", function () { self.repositionPanel(); });
  };


  Widget.prototype.renderInline = function () {
    this.panel = el("div", { class: "bgpt-inline", style: { position: "relative" } }, [
      this.headerNode(false), this.auditNode(), this.bodyNode(), this.inputNode(),
    ]);
    this.shadow.appendChild(this.panel);
  };

  Widget.prototype.renderFullscreen = function () {
    var self = this;
    var backdrop = el("div", {
      class: "bgpt-fullscreen",
      onClick: function (e) { if (e.target === backdrop) self.toggle(false); },
    }, [
      el("div", { class: "bgpt-panel", style: { position: "relative" } }, [
        this.headerNode(true), this.auditNode(), this.bodyNode(), this.inputNode(),
      ]),
    ]);
    this.panel = backdrop;
    this.shadow.appendChild(backdrop);
  };

  Widget.prototype.toggle = function (force) {
    if (!this.panel) return;
    // Any open/close click is a user gesture — use it to unlock audio
    // playback for cross-origin embedded contexts (Safari, mobile Chrome).
    try { this.unlockAudio(); } catch (_) {}
    if (this.cfg.style === "bubble") {
      var willOpen = typeof force === "boolean" ? force : this.panel.classList.contains("bgpt-hidden");
      if (willOpen && this.repositionPanel) this.repositionPanel();
      this.panel.classList.toggle("bgpt-hidden", !willOpen);
      if (willOpen) setTimeout(this.focusInput.bind(this), 50);
    } else if (this.cfg.style === "fullscreen") {
      this.panel.style.display = force === false ? "none" : "flex";
    }
  };

  Widget.prototype.focusInput = function () {
    try { this.textareaEl && this.textareaEl.focus(); } catch (_) {}
  };

  Widget.prototype.pushUser = function (text) {
    var node = el("div", { class: "bgpt-msg bgpt-user" }, [
      el("div", { class: "bgpt-bubble", html: mdLite(text) }),
    ]);
    this.bodyEl.appendChild(node);
    this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
  };

  Widget.prototype.pushBot = function (text, skipHistory, extras) {
    extras = extras || {};
    var embedded = extractEmbeddedBlocks(text);
    if (!Array.isArray(extras.charts) || !extras.charts.length) extras.charts = embedded.charts;
    if (!Array.isArray(extras.actions) || !extras.actions.length) extras.actions = embedded.actions;
    if (!extras.voiceSummary) extras.voiceSummary = embedded.voiceSummary;
    text = embedded.text || text;

    var bubble = el("div", { class: "bgpt-bubble", html: mdLite(text) });
    var wrap = el("div", { class: "bgpt-msg bgpt-bot" }, [bubble]);
    this.bodyEl.appendChild(wrap);

    var charts = Array.isArray(extras.charts) ? extras.charts : [];
    var actions = Array.isArray(extras.actions) ? extras.actions : [];
    var self = this;
    charts.forEach(function (c) {
      var holder = el("div", { class: "bgpt-msg bgpt-bot" }, [chartNode(c)]);
      self.bodyEl.appendChild(holder);
    });
    actions.forEach(function (a) {
      var holder = el("div", { class: "bgpt-msg bgpt-bot" }, [
        actionNode(a, function (kind) {
          self.logGuardrail({ kind: "Action " + kind, detail: a.type, level: kind === "confirm" ? "ok" : "warn" });
        }),
      ]);
      self.bodyEl.appendChild(holder);
    });

    this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
    if (!skipHistory) {
      this.messages.push({ role: "assistant", content: text });
      if (this.cfg.voice && this.cfg.autoSpeak && text && text.indexOf("⚠️") !== 0) {
        var spoken = (extras.voiceSummary && String(extras.voiceSummary).trim()) || text;
        try { this.speak(spoken); } catch (_) {}
      }
    }
  };

  Widget.prototype.pushTyping = function () {
    var node = el("div", { class: "bgpt-msg bgpt-bot", "data-typing": "1" }, [
      el("div", { class: "bgpt-bubble" }, [
        (function () {
          var t = el("div", { class: "bgpt-typing" });
          t.innerHTML = "<span></span><span></span><span></span>";
          return t;
        })(),
      ]),
    ]);
    this.bodyEl.appendChild(node);
    this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
    return node;
  };

  Widget.prototype.send = function () {
    if (this.pending) return;
    var text = (this.textareaEl.value || "").trim();
    if (!text) return;
    this.textareaEl.value = "";
    this.textareaEl.style.height = "auto";
    this.pushUser(text);
    this.messages.push({ role: "user", content: text });
    this.callBackend();
  };

  Widget.prototype.callBackend = function () {
    var self = this;
    if (!this.cfg.key) {
      this.pushBot("⚠️ Missing `data-key` on loader script — cannot reach the agent backend.");
      return;
    }
    this.pending = true;
    this.sendBtn.disabled = true;
    var typingEl = this.pushTyping();

    // Server-side resolution: backend looks up persona / KB / tools from
    // public.bankgpt_agents using agentId. Inline overrides allowed for
    // host-specific tagline tweaks (rare).
    if (!this.sessionId) {
      try {
        var sk = "bgpt_session_" + this.cfg.agentId;
        this.sessionId = sessionStorage.getItem(sk);
        if (!this.sessionId) {
          this.sessionId = "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
          sessionStorage.setItem(sk, this.sessionId);
        }
      } catch (_) {
        this.sessionId = "s_" + Date.now().toString(36);
      }
    }
    var body = {
      agentId: this.cfg.agentId,
      sessionId: this.sessionId,
      messages: this.messages.slice(-12),
      language: this.cfg.language,
      customer: resolveCustomerProfile(),
    };
    if (this.cfg.systemPromptOverride) {
      body.agent = {
        name: this.cfg.agentName,
        tagline: this.cfg.tagline,
        systemPrompt: this.cfg.systemPromptOverride,
        tone: { formal_casual: 40, terse_verbose: 40, reserved_expressive: 50 },
        usesEmoji: false,
        bankName: this.cfg.bankName,
      };
    }

    var headers = {
      "Content-Type": "application/json",
      apikey: this.cfg.key,
      Authorization: "Bearer " + (this.cfg.token || this.cfg.key),
    };

    fetch(this.cfg.api + "/functions/v1/agent-sandbox-chat", {
      method: "POST", headers: headers, body: JSON.stringify(body),
    })
      .then(function (r) {
        return r.text().then(function (txt) {
          var j = {}; try { j = txt ? JSON.parse(txt) : {}; } catch (_) { j = { error: txt }; }
          return { ok: r.ok, status: r.status, j: j };
        });
      })
      .then(function (res) {
        if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
        var j = res.j || {};
        if (j.enforcedGuardrails) {
          self.enforcedGuardrails = j.enforcedGuardrails;
          self.renderAudit();
        }
        if (j.blockedBy) {
          var kind = String(j.blockedBy).split(":")[0];
          var labelMap = { profanity: "Profanity blocked", jailbreak: "Jailbreak attempt blocked",
            blocked_topic: "Blocked topic", language: "Language not allowed",
            rate_limit: "Rate limit hit", max_turns: "Max turns reached" };
          self.logGuardrail({ kind: labelMap[kind] || "Refused", detail: j.blockedBy, level: "warn" });
        } else if (j.enforcedGuardrails && j.enforcedGuardrails.piiRedaction && /\[REDACTED_/.test(j.reply || "")) {
          self.logGuardrail({ kind: "PII redacted", detail: "Output scrubbed before reply", level: "warn" });
        } else if (res.ok && !j.error) {
          self.logGuardrail({ kind: "Reply OK", detail: (j.groundedCitations || 0) + " grounding source(s)", level: "ok" });
        }
        if (!res.ok || j.error) {
          var detail = j.error || j.message || ("HTTP " + res.status);
          self.pushBot("⚠️ " + detail);
          console.warn("[BankGPT] backend error", res.status, j);
        } else {
          self.pushBot(j.reply || "(no response)", false, {
            charts: j.charts || [],
            actions: j.actions || [],
            voiceSummary: j.voiceSummary || "",
          });
        }
      })
      .catch(function (err) {
        if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
        self.pushBot("Network error — please try again.");
        console.warn("[BankGPT] fetch failed", err);
      })
      .then(function () {
        self.pending = false;
        self.sendBtn.disabled = false;
        self.focusInput();
      });
  };

  // ─── boot ────────────────────────────────────────────────────────────────
  function boot() {
    try {
      var w = new Widget(cfg);
      w.mount();
      window.BankGPT = window.BankGPT || {};
      window.BankGPT[cfg.agentId] = {
        open: function () { w.toggle(true); },
        close: function () { w.toggle(false); },
        toggle: function () { w.toggle(); },
        send: function (msg) {
          if (!msg) return;
          w.textareaEl.value = msg;
          w.send();
        },
        config: cfg,
      };
    } catch (err) {
      console.error("[BankGPT] mount failed", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
