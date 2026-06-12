// Agent Sandbox Chat — bilingual (English / Amharic) single-agent endpoint
// used by the BankGPT Agent Builder Sandbox tab.
//
// Real lightweight RAG: any KB doc with an http(s) `source` (or type:"url")
// is fetched at request time, strips the source page to text, discovers
// same-site card/product URLs, then injects those pages as authoritative
// grounding context. Fetched pages are cached in-memory per isolate.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

type Tone = { formal_casual: number; terse_verbose: number; reserved_expressive: number };
type KbDoc = { name: string; type: string; status: string; enabled: boolean; source?: string };
type Tool = { id: string; label: string; approval: string; dailyLimit?: number };
type Page = { url: string; finalUrl: string; html: string; text: string };

type AgentDef = {
  name: string;
  tagline: string;
  systemPrompt: string;
  tone: Tone;
  usesEmoji: boolean;
  bankName?: string;
};

type Body = {
  // EITHER: inline (sandbox preview from the wizard)
  agent?: AgentDef;
  kb?: { docs: KbDoc[]; topK: number };
  tools?: Tool[];
  // OR: just an agentId — config is loaded server-side from public.bankgpt_agents
  // (used by the embedded /embed/bankgpt.js loader on the bank's host app).
  agentId?: string;
  messages: { role: "user" | "assistant"; content: string }[];
  language?: "en" | "am";
  model?: string;
};

async function loadPublishedAgent(agentId: string): Promise<
  { agent: AgentDef; kb: { docs: KbDoc[]; topK: number }; tools: Tool[] } | null
> {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  const supa = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await supa
    .from("bankgpt_agents")
    .select("agent_id, bank_name, name, tagline, system_prompt, tone, uses_emoji, kb, tools, published")
    .eq("agent_id", agentId)
    .eq("published", true)
    .maybeSingle();
  if (error || !data) {
    if (error) console.warn("loadPublishedAgent error", error.message);
    return null;
  }
  return {
    agent: {
      name: data.name,
      tagline: data.tagline ?? "",
      systemPrompt: data.system_prompt ?? "",
      tone: data.tone as Tone,
      usesEmoji: !!data.uses_emoji,
      bankName: data.bank_name ?? undefined,
    },
    kb: { docs: (data.kb?.docs ?? []) as KbDoc[], topK: data.kb?.topK ?? 4 },
    tools: (data.tools ?? []) as Tool[],
  };
}

function describeTone(t: Tone, usesEmoji: boolean) {
  const reg = t.formal_casual < 33 ? "formal" : t.formal_casual > 66 ? "casual" : "neutral";
  const len = t.terse_verbose < 33 ? "terse (1-2 short sentences)" : t.terse_verbose > 66 ? "verbose (4-6 sentences)" : "medium (2-3 sentences)";
  const exp = t.reserved_expressive < 33 ? "reserved" : t.reserved_expressive > 66 ? "expressive" : "balanced";
  return `Register: ${reg}. Length: ${len}. Expressiveness: ${exp}. ${usesEmoji ? "May use 1 relevant emoji." : "Do not use emojis."}`;
}

/* ───────────── Lightweight URL → text RAG ───────────── */

const PAGE_CACHE = new Map<string, { page: Page; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_CHARS_PER_DOC = 6000;
const MAX_TOTAL_CHARS = 14000;
const MAX_DISCOVERED_PAGES_PER_DOC = 5;
const CARD_LINK_RE = /\b(card|cards|visa|mastercard|credit|debit|travel|prepaid|atm|pos|ካርድ|ቪዛ)\b/i;

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(raw: string, base?: string): string | null {
  try {
    const u = new URL(raw, base);
    if (!/^https?:$/.test(u.protocol)) return null;
    u.hash = "";
    return u.toString();
  } catch { return null; }
}

function sameSite(a: string, b: string): boolean {
  try {
    const ah = new URL(a).hostname.replace(/^www\./, "");
    const bh = new URL(b).hostname.replace(/^www\./, "");
    return ah === bh || ah.endsWith(`.${bh}`) || bh.endsWith(`.${ah}`);
  } catch { return false; }
}

function extractCardLinks(html: string, baseUrl: string): string[] {
  const links: { url: string; score: number }[] = [];
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const href = normalizeUrl(m[1], baseUrl);
    if (!href || !sameSite(href, baseUrl)) continue;
    const anchor = htmlToText(m[2] || "");
    const haystack = `${href} ${anchor}`;
    if (!CARD_LINK_RE.test(haystack)) continue;
    const score = (/(card|cards|ካርድ)/i.test(haystack) ? 4 : 0)
      + (/(credit|debit|visa|mastercard|travel|prepaid|ቪዛ)/i.test(haystack) ? 3 : 0)
      + (/(fee|charge|apply|application|limit)/i.test(haystack) ? 1 : 0);
    links.push({ url: href, score });
  }
  return [...new Map(links.sort((a, b) => b.score - a.score).map((l) => [l.url, l.url])).values()]
    .slice(0, MAX_DISCOVERED_PAGES_PER_DOC);
}

async function fetchUrlPage(url: string): Promise<Page | null> {
  try {
    const normalized = normalizeUrl(url);
    if (!normalized) return null;
    const cached = PAGE_CACHE.get(normalized);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.page;

    const ctl = AbortSignal.timeout(8000);
    const res = await fetch(normalized, {
      signal: ctl,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ABX-BankGPT-Sandbox/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      console.warn("KB fetch failed", normalized, res.status);
      return null;
    }
    const html = await res.text();
    const page = { url: normalized, finalUrl: res.url || normalized, html, text: htmlToText(html).slice(0, MAX_CHARS_PER_DOC) };
    PAGE_CACHE.set(normalized, { page, fetchedAt: Date.now() });
    return page;
  } catch (e) {
    console.warn("KB fetch error", url, e instanceof Error ? e.message : e);
    return null;
  }
}

function bankNameFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const label = host.split(".")[0]
      .replace(/[-_]+/g, " ")
      .replace(/([a-z])bank\b/i, "$1 bank")
      .replace(/\s+/g, " ")
      .trim();
    if (!label) return null;
    return label.split(" ").map((w) => w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  } catch { return null; }
}

async function buildLiveSources(urlDocs: KbDoc[]) {
  const seen = new Set<string>();
  const sources: { url: string; name: string; text: string }[] = [];

  await Promise.all(urlDocs.slice(0, 4).map(async (d) => {
    const seed = d.source && /^https?:\/\//i.test(d.source) ? d.source : d.name;
    const primary = await fetchUrlPage(seed);
    if (!primary) return;

    const candidates = [primary.finalUrl, ...extractCardLinks(primary.html, primary.finalUrl)];
    const pages = await Promise.all(candidates.map(async (candidate) => {
      if (seen.has(candidate)) return null;
      seen.add(candidate);
      return candidate === primary.finalUrl ? primary : await fetchUrlPage(candidate);
    }));

    for (const page of pages) {
      if (page?.text) sources.push({ url: page.finalUrl, name: d.name, text: page.text });
    }
  }));

  return sources;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const language = body.language ?? "en";
    const messages = body.messages;

    if (!messages?.length) {
      return new Response(JSON.stringify({ error: "Missing messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve agent/kb/tools — inline body wins; otherwise look up by agentId.
    let agent = body.agent;
    let kb = body.kb;
    let tools = body.tools;

    if ((!agent || !agent.name) && body.agentId) {
      const resolved = await loadPublishedAgent(body.agentId);
      if (!resolved) {
        return new Response(JSON.stringify({
          error: `Agent "${body.agentId}" is not published. Open the Agent Builder → Widget step and click "Publish for embed".`,
        }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      agent = resolved.agent;
      kb = kb ?? resolved.kb;
      tools = tools ?? resolved.tools;
    }

    if (!agent?.name) {
      return new Response(JSON.stringify({ error: "Missing agent (pass `agent` inline or `agentId`)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enabledDocs = (kb?.docs ?? []).filter((d) => d.enabled && d.status === "indexed");

    // 1) Live URL-backed docs — fetched & extracted on each request.
    const urlDocs = enabledDocs.filter(
      (d) => (d.type === "url") || (d.source && /^https?:\/\//i.test(d.source)),
    );
    const liveSources = await buildLiveSources(urlDocs);

    // 2) Uploaded file docs (PDF/DOCX/MD/TXT) — extracted text was stored at
    //    ingest time in `bankgpt_kb_contents`. Pull those by doc id.
    const uploadedDocIds = enabledDocs
      .filter((d) => !urlDocs.includes(d) && (d as any).id)
      .map((d) => (d as any).id as string);
    let uploadedSources: { url: string; name: string; text: string }[] = [];
    if (uploadedDocIds.length) {
      try {
        const supaUrl = Deno.env.get("SUPABASE_URL");
        const supaKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (supaUrl && supaKey) {
          const supa = createClient(supaUrl, supaKey, { auth: { persistSession: false } });
          const { data, error } = await supa
            .from("bankgpt_kb_contents")
            .select("doc_id, name, content, char_count")
            .in("doc_id", uploadedDocIds);
          if (error) {
            console.warn("kb contents fetch failed", error.message);
          } else if (data) {
            uploadedSources = data
              .filter((r: any) => r.content && r.char_count > 0)
              .map((r: any) => ({ url: `kb://${r.doc_id}`, name: r.name, text: r.content as string }));
          }
        }
      } catch (e) {
        console.warn("kb contents fetch error", e instanceof Error ? e.message : e);
      }
    }

    const allSources = [...liveSources, ...uploadedSources];

    // Prefer the live KB URL's bank name over the platform's current bank config;
    // otherwise a demo created under Awash Bank keeps answering as Awash.
    const derivedBank = liveSources.length ? bankNameFromUrl(liveSources[0].url) : null;
    const bankName = derivedBank || agent.bankName || "the bank";

    let totalChars = 0;
    const groundingBlocks = allSources.map((s, i) => {
      const remaining = Math.max(0, MAX_TOTAL_CHARS - totalChars);
      const slice = s.text.slice(0, remaining);
      totalChars += slice.length;
      const label = s.url.startsWith("kb://") ? `Uploaded: ${s.name}` : s.url;
      return `[Source ${i + 1}] ${label}\n${slice}`;
    }).filter((b) => b.length > 0);

    const ungroundedDocs = enabledDocs.filter(
      (d) => !urlDocs.includes(d) && !uploadedSources.some((u) => u.name === d.name),
    );

    const kbBlock = (groundingBlocks.length || ungroundedDocs.length)
      ? `KNOWLEDGE BASE — authoritative grounding. Answer ONLY using facts found below. If a specific number, fee, product, or policy is not in these sources, say so plainly and offer to escalate. Do NOT invent product names, fees, limits, or competing-bank info.

${groundingBlocks.join("\n\n---\n\n")}${ungroundedDocs.length ? `\n\nAdditional attached docs (names only, no text available): ${ungroundedDocs.map((d) => d.name).join(", ")}` : ""}`
      : `KNOWLEDGE BASE: (none successfully fetched — be transparent that you have no bank-specific source and only offer general guidance).`;


    const toolBlock = tools?.length
      ? `AVAILABLE ACTIONS (simulate — describe what you would do, do NOT actually execute):
${tools.map((t) => `  • ${t.label} [policy: ${t.approval}${t.dailyLimit ? `, daily limit ETB ${t.dailyLimit}` : ""}]`).join("\n")}`
      : "";

    const langLine = language === "am"
      ? `CRITICAL: Reply ONLY in Amharic (አማርኛ). Keep numbers, currency codes (ETB) and product/brand names (VISA, Mastercard) in Latin script. This is a spoken demo — keep replies under 3 short sentences.`
      : `Reply in clear, natural, conversational English. This is a spoken demo — keep replies under 3 short sentences.`;

    const system = [
      `You are ${agent.name}, an AI specialist agent for ${bankName}.`,
      `Role: ${agent.tagline}`,
      agent.systemPrompt,
      `You must ground every factual claim in the KNOWLEDGE BASE below (the bank's own published content from ${bankName}). Never name or quote any other bank, even if the platform profile or previous session used another bank name. If the user asks about a product or fee that is not in the KB, reply that you don't have that specific information for ${bankName} and offer to connect them with a human agent.`,
      `For task requests like apply for card, block card, dispute, replacement or limit change: use AVAILABLE ACTIONS as simulated backend tasks, ask for confirmation when policy says confirm, and never claim a task completed unless it is safe to simulate.`,
      describeTone(agent.tone, agent.usesEmoji),
      langLine,
      kbBlock,
      toolBlock,
      `Be concrete, warm, helpful. Never say "as an AI". Never mention OpenAI, Google or Gemini. Never output JSON or code fences.`,
    ].filter(Boolean).join("\n\n");

    const recent = messages.slice(-10).map((m) => ({ role: m.role, content: m.content }));

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: body.model || "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, ...recent],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit — try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI gateway error", details: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const reply = data?.choices?.[0]?.message?.content?.trim()
      ?.replace(/```[\s\S]*?```/g, "")
      ?.trim() || "(no reply)";

    return new Response(JSON.stringify({
      reply,
      groundedCitations: allSources.length,
      groundedSources: allSources.map((s) => s.url),
      derivedBank: derivedBank,
      language,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("agent-sandbox-chat error", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
