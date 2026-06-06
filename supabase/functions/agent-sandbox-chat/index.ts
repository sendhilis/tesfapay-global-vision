// Agent Sandbox Chat — bilingual (English / Amharic) single-agent endpoint
// used by the BankGPT Agent Builder Sandbox tab.
//
// Real lightweight RAG: any KB doc with an http(s) `source` (or type:"url")
// is fetched at request time, stripped to plain text and injected as
// authoritative grounding context. The LLM is instructed to answer ONLY
// from that context. Fetched pages are cached in-memory per isolate.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Tone = { formal_casual: number; terse_verbose: number; reserved_expressive: number };
type KbDoc = { name: string; type: string; status: string; enabled: boolean; source?: string };
type Tool = { id: string; label: string; approval: string; dailyLimit?: number };

type Body = {
  agent: {
    name: string;
    tagline: string;
    systemPrompt: string;
    tone: Tone;
    usesEmoji: boolean;
    bankName?: string;
  };
  kb: { docs: KbDoc[]; topK: number };
  tools: Tool[];
  messages: { role: "user" | "assistant"; content: string }[];
  language?: "en" | "am";
  model?: string;
};

function describeTone(t: Tone, usesEmoji: boolean) {
  const reg = t.formal_casual < 33 ? "formal" : t.formal_casual > 66 ? "casual" : "neutral";
  const len = t.terse_verbose < 33 ? "terse (1-2 short sentences)" : t.terse_verbose > 66 ? "verbose (4-6 sentences)" : "medium (2-3 sentences)";
  const exp = t.reserved_expressive < 33 ? "reserved" : t.reserved_expressive > 66 ? "expressive" : "balanced";
  return `Register: ${reg}. Length: ${len}. Expressiveness: ${exp}. ${usesEmoji ? "May use 1 relevant emoji." : "Do not use emojis."}`;
}

/* ───────────── Lightweight URL → text RAG ───────────── */

const PAGE_CACHE = new Map<string, { text: string; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 min
const MAX_CHARS_PER_DOC = 6000;
const MAX_TOTAL_CHARS = 14000;

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

async function fetchUrlText(url: string): Promise<string | null> {
  try {
    const cached = PAGE_CACHE.get(url);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.text;

    const ctl = AbortSignal.timeout(8000);
    const res = await fetch(url, {
      signal: ctl,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ABX-BankGPT-Sandbox/1.0)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) {
      console.warn("KB fetch failed", url, res.status);
      return null;
    }
    const html = await res.text();
    const text = htmlToText(html).slice(0, MAX_CHARS_PER_DOC);
    PAGE_CACHE.set(url, { text, fetchedAt: Date.now() });
    return text;
  } catch (e) {
    console.warn("KB fetch error", url, e instanceof Error ? e.message : e);
    return null;
  }
}

function bankNameFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const root = host.split(".").slice(0, -1).join(".") || host;
    return root.charAt(0).toUpperCase() + root.slice(1);
  } catch { return null; }
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
    const { agent, kb, tools, messages } = body;
    const language = body.language ?? "en";

    if (!agent?.name || !messages?.length) {
      return new Response(JSON.stringify({ error: "Missing agent or messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const enabledDocs = (kb?.docs ?? []).filter((d) => d.enabled && d.status === "indexed");

    // Fetch any URL-backed KB docs in parallel.
    const urlDocs = enabledDocs.filter(
      (d) => (d.type === "url") || (d.source && /^https?:\/\//i.test(d.source)),
    );
    const fetched = await Promise.all(
      urlDocs.slice(0, 4).map(async (d) => {
        const u = d.source && /^https?:\/\//i.test(d.source) ? d.source : d.name;
        const text = await fetchUrlText(u);
        return text ? { url: u, name: d.name, text } : null;
      }),
    );
    const liveSources = fetched.filter(Boolean) as { url: string; name: string; text: string }[];

    // Derive bank from first URL if not provided.
    const derivedBank = liveSources.length ? bankNameFromUrl(liveSources[0].url) : null;
    const bankName = agent.bankName || derivedBank || "the bank";

    let totalChars = 0;
    const groundingBlocks = liveSources.map((s, i) => {
      const remaining = Math.max(0, MAX_TOTAL_CHARS - totalChars);
      const slice = s.text.slice(0, remaining);
      totalChars += slice.length;
      return `[Source ${i + 1}] ${s.url}\n${slice}`;
    }).filter((b) => b.length > 0);

    const otherDocs = enabledDocs.filter((d) => !urlDocs.includes(d));

    const kbBlock = (groundingBlocks.length || otherDocs.length)
      ? `KNOWLEDGE BASE — authoritative grounding. Answer ONLY using facts found below. If a specific number, fee, product, or policy is not in these sources, say so plainly and offer to escalate. Do NOT invent product names, fees, limits, or competing-bank info.

${groundingBlocks.join("\n\n---\n\n")}${otherDocs.length ? `\n\nAdditional attached docs (names only): ${otherDocs.map((d) => d.name).join(", ")}` : ""}`
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
      `You must ground every factual claim in the KNOWLEDGE BASE below (the bank's own published content). Never name or quote any other bank. If the user asks about a product or fee that is not in the KB, reply that you don't have that specific information for ${bankName} and offer to connect them with a human agent.`,
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
      groundedCitations: liveSources.length,
      groundedSources: liveSources.map((s) => s.url),
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
