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

  // ─── styles (scoped to Shadow DOM) ───────────────────────────────────────
  var CSS = "\n" +
"*,*::before,*::after{box-sizing:border-box}\n" +
":host{all:initial;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#0f172a}\n" +
".bgpt-launcher{position:fixed;right:20px;bottom:20px;width:60px;height:60px;border-radius:9999px;background:var(--bgpt-accent);color:var(--bgpt-primary);box-shadow:0 10px 30px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:2147483646;border:2px solid var(--bgpt-primary);transition:transform .15s ease}\n" +
".bgpt-launcher:hover{transform:scale(1.05)}\n" +
".bgpt-launcher svg{width:28px;height:28px}\n" +
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
"@media (max-width:480px){.bgpt-panel{right:8px;left:8px;width:auto;bottom:84px;height:70vh}}\n";

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
      onClick: function () { self.toggleSpeaker(); },
      html: self.cfg.autoSpeak
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    }) : null;

    var closeBtn = withClose
      ? el("button", { class: "bgpt-close", "aria-label": "Close",
          onClick: function () { self.toggle(false); },
          html: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>' })
      : null;

    var controls = el("div", { style: { marginLeft: "auto", display: "flex", alignItems: "center" } }, [
      this.langBtn, this.speakerBtn, closeBtn,
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
      onClick: function () { self.toggleMic(); },
      html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    }) : null;

    this.sendBtn = el("button", {
      class: "bgpt-send",
      type: "button",
      onClick: function () { self.send(); },
    }, [self.cfg.language === "am" ? "ላክ" : "Send"]);

    return el("div", {}, [
      el("div", { class: "bgpt-input" }, [this.textareaEl, this.micBtn, this.sendBtn]),
      el("div", { class: "bgpt-foot" }, [
        "Powered by BankGPT · " + escapeHtml(this.cfg.bankName),
      ]),
    ]);
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
      if (!r.ok || ctype.indexOf("audio") !== 0) return null;
      return r.arrayBuffer();
    }).then(function (buf) {
      if (!buf) return;
      var blob = new Blob([buf], { type: "audio/mpeg" });
      var url = URL.createObjectURL(blob);
      var audio = new Audio(url);
      self.currentAudio = audio;
      audio.onended = function () { URL.revokeObjectURL(url); };
      audio.play().catch(function (e) { console.warn("[BankGPT] audio play failed", e); });
    }).catch(function (e) { console.warn("[BankGPT] tts failed", e); });
  };

  Widget.prototype.stopAudio = function () {
    if (this.currentAudio) {
      try { this.currentAudio.pause(); } catch (_) {}
      this.currentAudio = null;
    }
  };


  Widget.prototype.renderBubble = function () {
    var self = this;
    var launcher = el("button", {
      class: "bgpt-launcher",
      "aria-label": "Open " + this.cfg.agentName,
      onClick: function () { self.toggle(); },
      html: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    });
    this.panel = el("div", { class: "bgpt-panel bgpt-hidden" }, [
      this.headerNode(true), this.bodyNode(), this.inputNode(),
    ]);
    this.shadow.appendChild(this.panel);
    this.shadow.appendChild(launcher);
  };

  Widget.prototype.renderInline = function () {
    this.panel = el("div", { class: "bgpt-inline" }, [
      this.headerNode(false), this.bodyNode(), this.inputNode(),
    ]);
    this.shadow.appendChild(this.panel);
  };

  Widget.prototype.renderFullscreen = function () {
    var self = this;
    var backdrop = el("div", {
      class: "bgpt-fullscreen",
      onClick: function (e) { if (e.target === backdrop) self.toggle(false); },
    }, [
      el("div", { class: "bgpt-panel" }, [
        this.headerNode(true), this.bodyNode(), this.inputNode(),
      ]),
    ]);
    this.panel = backdrop;
    this.shadow.appendChild(backdrop);
  };

  Widget.prototype.toggle = function (force) {
    if (!this.panel) return;
    if (this.cfg.style === "bubble") {
      var willOpen = typeof force === "boolean" ? force : this.panel.classList.contains("bgpt-hidden");
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

  Widget.prototype.pushBot = function (text, skipHistory) {
    var node = el("div", { class: "bgpt-msg bgpt-bot" }, [
      el("div", { class: "bgpt-bubble", html: mdLite(text) }),
    ]);
    this.bodyEl.appendChild(node);
    this.bodyEl.scrollTop = this.bodyEl.scrollHeight;
    if (!skipHistory) {
      this.messages.push({ role: "assistant", content: text });
      if (this.cfg.voice && this.cfg.autoSpeak && text && text.indexOf("⚠️") !== 0) {
        try { this.speak(text); } catch (_) {}
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
    var body = {
      agentId: this.cfg.agentId,
      messages: this.messages.slice(-12),
      language: this.cfg.language,
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
        if (!res.ok || res.j.error) {
          var detail = res.j && (res.j.error || res.j.message) ? (res.j.error || res.j.message) : ("HTTP " + res.status);
          self.pushBot("⚠️ " + detail);
          console.warn("[BankGPT] backend error", res.status, res.j);
        } else {
          self.pushBot(res.j.reply || "(no response)");
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
