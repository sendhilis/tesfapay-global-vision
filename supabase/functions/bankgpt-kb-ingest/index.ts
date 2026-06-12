// bankgpt-kb-ingest
// ──────────────────
// Accepts a base64-encoded knowledge-base file from the Agent Builder,
// stores the raw bytes in the `bankgpt-kb` Storage bucket, extracts plain
// text (PDF via unpdf, DOCX via mammoth, MD/TXT passthrough), and upserts
// the extracted content into `bankgpt_kb_contents` so the chat function
// can ground answers in it.
//
// Body:
//   {
//     agentId: string,
//     docId:   string,          // client-generated id, must match KbDoc.id
//     name:    string,          // original filename
//     mimeType:string,          // e.g. "application/pdf"
//     dataBase64: string,       // raw file bytes, base64 (no data: prefix)
//   }
//
// Response: { ok, storagePath, charCount, preview }
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";
import mammoth from "npm:mammoth@1.8.0";

const BUCKET = "bankgpt-kb";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB hard cap per file
const MAX_TEXT_CHARS = 200_000;      // keep DB rows reasonable

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",", 2)[1] : b64;
  const bin = atob(clean);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function safeName(name: string): string {
  return name.replace(/[^\w.\-]+/g, "_").slice(0, 120);
}

function looksLikePdf(bytes: Uint8Array): boolean {
  return bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46; // %PDF
}
function looksLikeDocx(bytes: Uint8Array): boolean {
  // DOCX is a ZIP — starts with PK\x03\x04
  return bytes.length > 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return (Array.isArray(text) ? text.join("\n\n") : text || "").trim();
  } catch (e) {
    console.warn("pdf extract failed", e instanceof Error ? e.message : e);
    return "";
  }
}

async function extractDocxText(bytes: Uint8Array): Promise<string> {
  try {
    const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const res = await mammoth.extractRawText({ arrayBuffer: buf });
    return (res?.value ?? "").trim();
  } catch (e) {
    console.warn("docx extract failed", e instanceof Error ? e.message : e);
    return "";
  }
}

async function extractPlainText(bytes: Uint8Array): Promise<string> {
  try {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
  } catch { return ""; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) {
      return new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(url, key, { auth: { persistSession: false } });

    const body = await req.json();
    const { agentId, docId, name, mimeType, dataBase64 } = body ?? {};
    if (!agentId || !docId || !name || !dataBase64) {
      return new Response(JSON.stringify({ error: "agentId, docId, name, dataBase64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = base64ToBytes(dataBase64);
    if (bytes.length === 0) {
      return new Response(JSON.stringify({ error: "Empty file" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (bytes.length > MAX_BYTES) {
      return new Response(JSON.stringify({ error: `File too large (${bytes.length} > ${MAX_BYTES})` }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const storagePath = `${encodeURIComponent(agentId)}/${docId}-${safeName(name)}`;

    // 1. Upload raw bytes (private bucket).
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: mimeType || "application/octet-stream",
      upsert: true,
    });
    if (upErr) {
      console.error("storage upload failed", upErr);
      return new Response(JSON.stringify({ error: `Storage upload failed: ${upErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Extract text based on detected/declared format.
    const lowerName = String(name).toLowerCase();
    let text = "";
    if (looksLikePdf(bytes) || mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
      text = await extractPdfText(bytes);
    } else if (looksLikeDocx(bytes) || mimeType?.includes("officedocument.wordprocessingml") || lowerName.endsWith(".docx")) {
      text = await extractDocxText(bytes);
    } else {
      // md, txt, csv, html, json — all decodable as UTF-8
      text = await extractPlainText(bytes);
    }

    text = (text || "").replace(/\u0000/g, " ").replace(/[ \t]+\n/g, "\n").trim();
    if (text.length > MAX_TEXT_CHARS) text = text.slice(0, MAX_TEXT_CHARS);

    // 3. Upsert extracted content.
    const { error: dbErr } = await supabase
      .from("bankgpt_kb_contents")
      .upsert({
        doc_id: docId,
        agent_id: agentId,
        name,
        storage_path: storagePath,
        mime_type: mimeType ?? null,
        content: text,
        char_count: text.length,
        updated_at: new Date().toISOString(),
      }, { onConflict: "doc_id" });

    if (dbErr) {
      console.error("db upsert failed", dbErr);
      return new Response(JSON.stringify({ error: `DB upsert failed: ${dbErr.message}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ok: true,
      storagePath,
      charCount: text.length,
      preview: text.slice(0, 240),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("bankgpt-kb-ingest error", e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
