import React, { useMemo, useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// 名前を共通フォーマットにする関数
function normalizeName(name = "") {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

// ここに "選手名 → 画像URL" を登録していく
export const FIGHTER_IMAGES = {
  [normalizeName("井上尚弥")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_iibpbiiibpbiiibp.png",
  [normalizeName("Naoya Inoue")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_iibpbiiibpbiiibp.png",
  [normalizeName("テオフモ・ロペス")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/teofimo.png",
  [normalizeName("Teofimo Lopez")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/teofimo.png",

  [normalizeName("ラモント・ローチ")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_w6pvvhw6pvvhw6pv.png",
  [normalizeName("Lamont Roach")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_w6pvvhw6pvvhw6pv.png",

  [normalizeName("オシャキー・フォスター")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_atkvlsatkvlsatkv.png",
  [normalizeName("O'Shaquie Foster")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_w6pvvhw6pvvhw6pv.png",

  [normalizeName("フルトン")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_vrffi3vrffi3vrff.png",
  [normalizeName("Stephen Fulton")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_vrffi3vrffi3vrff.png",

  [normalizeName("ドネア")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_7gtrya7gtrya7gtr.png",
  [normalizeName("Nonito Donaire")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_7gtrya7gtrya7gtr.png",

  [normalizeName("堤聖也")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_rdtx85rdtx85rdtx.png",
  [normalizeName("seiya tsutsumi")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_rdtx85rdtx85rdtx.png",

  [normalizeName("高見亨介")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_tbw27otbw27otbw2.png",
  [normalizeName("kyosuke takami")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_tbw27otbw27otbw2.png",

  [normalizeName("レネ・サンティアゴ")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_rdyuhqrdyuhqrdyu.png",
  [normalizeName("Rene Santiago")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_rdyuhqrdyuhqrdyu.png",

  [normalizeName("中谷潤人")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_5ti435ti435ti435.png",
  [normalizeName("junto nakatani")]:
    "http://boxingdiagrams.com/wp-content/uploads/2025/12/Gemini_Generated_Image_5ti435ti435ti435.png",

    [normalizeName("テレンス・クロフォード")]:
    "http://boxingdiagrams.com/wp-content/uploads/2026/01/Gemini_Generated_Image_ow0jclow0jclow0j.png",
  [normalizeName("Terence Crawford")]:
    "http://boxingdiagrams.com/wp-content/uploads/2026/01/Gemini_Generated_Image_ow0jclow0jclow0j.png",

  [normalizeName("オレクサンドル・ウシク")]:
    "http://boxingdiagrams.com/wp-content/uploads/2026/01/Gemini_Generated_Image_y37vhfy37vhfy37v.png",
  [normalizeName("Oleksandr Usyk")]:
    "http://boxingdiagrams.com/wp-content/uploads/2026/01/Gemini_Generated_Image_y37vhfy37vhfy37v.png",

  [normalizeName("ジャーボンティ・デービス")]:
    "http://boxingdiagrams.com/wp-content/uploads/2026/01/Gemini_Generated_Image_i73fvji73fvji73f.png",
  [normalizeName("Gervonta Davis")]:
    "http://boxingdiagrams.com/wp-content/uploads/2026/01/Gemini_Generated_Image_i73fvji73fvji73f.png",
};

// 読み取りヘルパー
export function getFighterImageUrl(name) {
  return FIGHTER_IMAGES[normalizeName(name)] || null;
}

// SupabaseのEdge Function設定
const PROJECT_REF = "vzdebbptlcuwnlarqsjw"; // ←自分のプロジェクトID
const EDGE_FN = "clever-responder"; // ← supabaseの関数名
// App() 内のどこかで補助関数を用意（イベント→採点用オブジェクト）
/// 視聴プロバイダ（アフィURLに差し替えてOK）
const WATCH_PROVIDERS = {
  dazn: { label: "DAZN👆", url: "http://mentalblock.but.jp/ko/ydazn2" },
  lemino: { label: "Lemino👆", url: "http://mentalblock.but.jp/ko/lemino" },
  prime: { label: "Prime Video👆", url: "https://amzn.to/4otRkAj" },
  wowow: { label: "WOWOW👆", url: "http://mentalblock.but.jp/ko/wowow" },
  abema: {
    label: "ABEMA👆",
    url: "https://cl.link-ag.net/click/3a2eee/e7be1b89",
  },
  Netflix: {
    label: "Netflix👆",
    url: "https://www.netflix.com/jp/title/82137129",
  },
  unknown: { label: "不明", url: "https://your-info-page.com" },
};

function detectWatchPlatform(str = "") {
  const s = String(str).toLowerCase();
  if (/(dazn|ダゾーン)/i.test(s)) return "dazn";
  if (/(lemino|レミノ)/i.test(s)) return "lemino";
  if (/(prime|アマプラ|amazon)/i.test(s)) return "prime";
  if (/wowow/i.test(s)) return "wowow";
  if (/(abema|アベマ)/i.test(s)) return "abema";
  if (/(Netflix|Netflix)/i.test(s)) return "Netflix";
  if (/(unknown|不明)/i.test(s)) return "unknown";
  return null;
}

const makeFightFromEvent = (ev) => {
  const pickFighters = (title) => {
    const t = String(title || "");
    // タイトル内だけで A vs B を抜く（末尾まで貪欲にならないように両辺を最短一致）
    const m = t.match(
      /^\s*(.+?)\s*(?:vs\.?|v|ＶＳ|ｖｓ|×|x|Ｘ|対|—|－|-)\s*(.+?)\s*$/i
    );
    let a = "",
      b = "";
    if (m) {
      a = m[1].trim();
      b = m[2].trim();
    }
    // 【DAZN】や［…］、（…）などの付帯情報を削る
    const clean = (s) =>
      String(s)
        .replace(/[【\[].*?[】\]]/g, "") // 【…】や[…] を除去
        .replace(/\(.*?\)|（.*?）/g, "") // (…)や（…）を除去
        .trim();
    return { a: clean(a), b: clean(b) };
  };

  const { a, b } = pickFighters(ev.title, ev.description);
  const platform = detectWatchPlatform(
    `${ev.title || ""} ${ev.description || ""}`
  );
  const start = ev.starts_at ? new Date(ev.starts_at) : null;

  // 日付（従来仕様）
  const date = start
    ? start.toISOString().slice(0, 10) // ←あなたの既存ロジックそのまま採用
    : "";

  // 時間（新規）
  const time = start
    ? `${String(start.getHours()).padStart(2, "0")}:${String(
        start.getMinutes()
      ).padStart(2, "0")}`
    : "";

  // 日付＋時間（新規）
  const dateTimeLabel = time ? `${date} ${time}` : date;

  return {
    id: ev.uid || String(ev.id),
    date, // ←(既存) YYYY-MM-DD
    time, // ←(新規) 07:00
    dateTimeLabel, // ←(新規) 2025-11-16 07:00
    a,
    b,
    title: ev.title || "",
    location: ev.location || "",
    platform,
    platformUrl: platform ? WATCH_PROVIDERS[platform]?.url : null,
    platformLabel: platform ? WATCH_PROVIDERS[platform]?.label : null,
  };
};

// --- ICS同期関数（外側） ---
async function runIcsSync() {
  try {
    const EDGE_FN = "clever-responder";
    const res = await fetch(
      `https://${PROJECT_REF}.functions.supabase.co/${EDGE_FN}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const json = await res.json().catch(() => ({}));
    console.log("✅ ICS同期:", res.status, json);
  } catch (e) {
    console.error("❌ ICS同期エラー:", e);
  }
}

// （任意）Supabase はそのまま
const SUPABASE_URL = "https://vzdebbptlcuwnlarqsjw.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6ZGViYnB0bGN1d25sYXJxc2p3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MDI2NTAsImV4cCI6MjA3NDA3ODY1MH0.Bio3rdggTZaq6QbzXDkTRKZMg8OmF-HfE9pOvQjtLnk";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 定数
const DEFAULT_ROUNDS = 12;
const SCORE_CHOICES = [10, 9, 8, 7];
const dayMs = 24 * 60 * 60 * 1000;
// PFP結果の表示方針：true=投票したら見える / false=常に見える
const SHOW_PFP_RESULTS_ONLY_AFTER_VOTE = false;

// モックのスケジュール
const MOCK_SCHEDULE = [
  {
    id: "2023-08-26_usyk_dubois",
    date: "2023-08-26",
    a: "ウシク",
    b: "デュボア",
  },
  {
    id: "2024-05-15_井上_ネリ",
    date: "2024-05-15",
    a: "井上尚弥",
    b: "ルイス・ネリ",
  },
  {
    id: "2024-06-15_tank_martin",
    date: "2024-06-15",
    a: "タンク・デービス",
    b: "フランク・マーティン",
  },
];
const schedule = import.meta.env.DEV ? MOCK_SCHEDULE : [];
// スタイル
const TAB_H = 64;

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "#1f1f1f",
  },

  container: {
    width: "100%",
    maxWidth: 420,
    flex: 1,                 // ← これ超重要（残り高さを全部使う）
    overflowY: "auto",        // ← ここがスクロール担当
    WebkitOverflowScrolling: "touch",
    color: "#111",
    background: "#fff",
    position: "relative",
    paddingBottom: 12,        // fixedじゃなくなるので72いらない
  },

  headerBar: {
    background: "#b22222",
    color: "#fff",
    borderRadius: 12,
    padding: "10px 12px",
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: 0.6,
    textAlign: "center",
    marginBottom: 8,
  },
  card: { border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff" },
  cardContent: { padding: 6 },
  redSoft: { background: "#e0f2fe" },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1.2fr 1fr",
    alignItems: "center",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    padding: "2px 4px",
    height: 26,
    background: "#fff",
  },
  select: {
    height: 22,
    borderRadius: 6,
    border: "1px solid #cbd5e1",
    padding: "0 4px",
    textAlign: "center",
    fontSize: 10,
    width: "100%",
  },
  input: {
    height: 26,
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    padding: "0 6px",
    textAlign: "center",
    fontSize: 11,
    width: 100,
  },
  nameInput: {
    height: 24,
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    padding: "0 6px",
    textAlign: "center",
    fontSize: 10,
    width: 80,
  },
  btn: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: 10,
    padding: "6px 10px",
    fontSize: 12,
    cursor: "pointer",
  },
  btnSm: {
    border: "1px solid #cbd5e1",
    background: "#fff",
    borderRadius: 8,
    padding: "4px 8px",
    fontSize: 11,
    cursor: "pointer",
  },
  btnOnOrange: { background: "#f97316", color: "#fff", borderColor: "#f97316" },
  btnOnGreen: { background: "#16a34a", color: "#fff", borderColor: "#16a34a" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 },
  grid3: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    gap: 6,
    alignItems: "center",
    textAlign: "center",
  },
  title: { fontSize: 13, fontWeight: 700, padding: "2px 4px" },
  totalNum: { fontSize: 20, fontWeight: 800, lineHeight: 1, marginTop: 2 },
  list: { display: "grid", gap: 3 },
  avgText: { fontSize: 9, color: "#475569" },
  tag: {
    fontSize: 10,
    padding: "2px 6px",
    borderRadius: 999,
    background: "#e2e8f0",
    color: "#334155",
  },
  tagDanger: { background: "#fee2e2", color: "#991b1b" },
  tagGood: { background: "#dcfce7", color: "#166534" },
  tabBar: {
    width: "100%",
    maxWidth: 420,
    height: TAB_H,
    background: "#fff",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    flexShrink: 0,            // ← つぶれない
    zIndex: 1000,
  },
tabItem: {
  flex: 1,
  textAlign: "center",
  padding: "12px 6px",
  fontSize: 12,
  color: "#666",
  cursor: "pointer",
  userSelect: "none",
},
tabActive: {
  color: "#1a73e8",
  fontWeight: "700",
},

  nameWithAvatar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  shareRow: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
};

const Avatar = ({ name, size = 20 }) => {
  // ① name から URL を自動取得
  const url = getFighterImageUrl(name);

  const box = { width: size, height: size, borderRadius: "9999px" };

  // ② URL があれば画像表示
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ ...box, objectFit: "cover" }}
        loading="lazy"
      />
    );
  }

  // ③ URL が無ければ頭文字
  const ch = (name || "?").trim().slice(0, 1).toUpperCase();
  return (
    <div
      style={{
        ...box,
        background: "#e5e7eb",
        color: "#374151",
        fontSize: Math.max(9, Math.floor(size * 0.45)),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {ch}
    </div>
  );
};

// 合計平均を算出（avg配列の a,b を合算して小数1桁）
const totalFromAvg = (avgArr) => {
  const sumA = avgArr.reduce(
    (s, x) => s + (typeof x.a === "number" ? x.a : 0),
    0
  );
  const sumB = avgArr.reduce(
    (s, x) => s + (typeof x.b === "number" ? x.b : 0),
    0
  );
  return { a: Number(sumA.toFixed(1)), b: Number(sumB.toFixed(1)) };
};
// 小数1ケタに丸めて文字列化
function fmtAvg1(v) {
  if (v == null || Number.isNaN(v)) return "-";
  return (Math.round(v * 10) / 10).toFixed(1);
}

// avg（みんなの採点） or 自分のrounds から全体平均を出す
function computeTotalAvgForImage(avg, rounds) {
  let aAvg = null;
  let bAvg = null;

  // ① avg（DBの平均）があればそれを優先
  if (Array.isArray(avg) && avg.length) {
    let sa = 0;
    let sb = 0;
    let cnt = 0;
    for (const r of avg) {
      if (!r) continue;
      const a = typeof r.a === "number" ? r.a : null;
      const b = typeof r.b === "number" ? r.b : null;
      if (a != null && b != null) {
        sa += a;
        sb += b;
        cnt++;
      }
    }
    if (cnt > 0) {
      aAvg = sa / cnt;
      bAvg = sb / cnt;
    }
  }

  // ② avg がなければ、自分の採点 rounds から平均
  if (aAvg == null || bAvg == null) {
    let sa = 0;
    let sb = 0;
    let cnt = 0;
    for (const rd of rounds || []) {
      const aNum = rd.a === "" ? null : Number(rd.a);
      const bNum = rd.b === "" ? null : Number(rd.b);
      if (aNum != null && bNum != null) {
        sa += aNum;
        sb += bNum;
        cnt++;
      }
    }
    if (cnt > 0) {
      aAvg = sa / cnt;
      bAvg = sb / cnt;
    }
  }

  return {
    a: aAvg,
    b: bAvg,
    label: `平均 ${fmtAvg1(aAvg)} - ${fmtAvg1(bAvg)}`,
  };
}

// 縦長スマホ用スコアカード画像を作る
async function makeScoreImage({
  fightId,
  fighterA,
  fighterB,
  rounds,
  totals,
  avg,
  suspect,
  foty,
}) {
  const W = 1080; // 3:4 縦長
  const H = 1440;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");

  // ── 平均（画像用）を算出 ─────────────────
  const totalAvg = {
    a: totals.a,
    b: totals.b,
    label: `平均 ${totals.a} - ${totals.b}`,
  };

  // 共通フォント
  const baseFont =
    'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  // 背景（白ベース）
  ctx.fillStyle = "#f9fafb";
  ctx.fillRect(0, 0, W, H);

  // ── ヘッダー（赤帯） ─────────────────────
  const headerH = 110;
  ctx.fillStyle = "#b22222";
  ctx.fillRect(0, 0, W, headerH);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold 46px ${baseFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🥊 BE THE JUDGE ✊✨", W / 2, headerH / 2 + 4);

  // ── タイトル & 合計スコア ─────────────────
  const titleY = headerH + 80;
  ctx.fillStyle = "#111827";
  ctx.font = `bold 42px ${baseFont}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${fighterA}  vs  ${fighterB}`, W / 2, titleY);

  // 合計平均（ラウンド平均は廃止、合計平均だけ残す）
  const avgY = titleY + 40;
  ctx.font = `500 30px ${baseFont}`;
  ctx.fillStyle = "#4b5563";
  ctx.fillText(totalAvg.label, W / 2, avgY);

  // 合計スコア（数字をドーンと）
  const totalsY = avgY + 90;
  ctx.textBaseline = "middle";
  ctx.font = `800 130px ${baseFont}`;

  // 左：青（A）
  ctx.textAlign = "center";
  ctx.fillStyle = "#dc2626";
  ctx.fillText(String(totals.a || 0), W * 0.23, totalsY);

  // 右：赤（B）
  ctx.fillStyle = "#1d4ed8";
  ctx.fillText(String(totals.b || 0), W * 0.77, totalsY);

  // 中央 "VS"
  ctx.fillStyle = "#0f172a";
  ctx.font = `800 40px ${baseFont}`;
  ctx.fillText("VS", W / 2, totalsY);

  // ── ラウンド一覧（縦長・真ん中狭め） ─────────
  const roundsStartY = totalsY + 68;
  const rowH = 70; // 行間ちょい広め
  const leftX = W * 0.23;
  const centerX = W * 0.5;
  const rightX = W * 0.77;
  const pillW = 170;
  const pillH = 38;
  const pillRadius = 20;

  function pill(x, y, w, h, bg, border, text, color) {
    const r = pillRadius;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + r, y - h / 2);
    ctx.lineTo(x + w / 2 - r, y - h / 2);
    ctx.quadraticCurveTo(x + w / 2, y - h / 2, x + w / 2, y - h / 2 + r);
    ctx.lineTo(x + w / 2, y + h / 2 - r);
    ctx.quadraticCurveTo(x + w / 2, y + h / 2, x + w / 2 - r, y + h / 2);
    ctx.lineTo(x - w / 2 + r, y + h / 2);
    ctx.quadraticCurveTo(x - w / 2, y + h / 2, x - w / 2, y + h / 2 - r);
    ctx.lineTo(x - w / 2, y - h / 2 + r);
    ctx.quadraticCurveTo(x - w / 2, y - h / 2, x - w / 2 + r, y - h / 2);
    ctx.closePath();

    // ★ 背景がある時だけ fill
    if (bg !== "transparent") {
      ctx.fillStyle = bg;
      ctx.fill();
    }

    // ★ 枠線も透明以外の時だけ描く
    if (border !== "transparent") {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // テキスト
    ctx.fillStyle = color;
    ctx.font = `600 46px ${baseFont}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
  }

  rounds.slice(0, 12).forEach((rd, idx) => {
    const y = roundsStartY + idx * rowH;

    const aNum = rd.a === "" ? null : Number(rd.a);
    const bNum = rd.b === "" ? null : Number(rd.b);

    const aVal = aNum != null ? String(aNum) : "-";
    const bVal = bNum != null ? String(bNum) : "-";

    // 勝ち負け判定（10-9なら 10 が勝ち）
    const aWin = aNum != null && bNum != null && aNum > bNum;
    const bWin = aNum != null && bNum != null && bNum > aNum;

    // ★ A = 左 = 赤、勝ってる時だけ色付き
    const aBg = aWin ? "#fee2e2" : "transparent";
    const aBorder = aWin ? "#fecaca" : "transparent";
    const aColor = aWin ? "#b91c1c" : "#0f172a";

    // ★ B = 右 = 青、勝ってる時だけ色付き
    const bBg = bWin ? "#eff6ff" : "transparent";
    const bBorder = bWin ? "#bfdbfe" : "transparent";
    const bColor = bWin ? "#1d4ed8" : "#0f172a";

    // 左 A ピル（負けてる時は背景ナシ）
    pill(leftX, y, pillW, pillH, aBg, aBorder, aVal, aColor);

    // 右 B ピル（負けてる時は背景ナシ）
    pill(rightX, y, pillW, pillH, bBg, bBorder, bVal, bColor);

    // 中央: ラウンド番号
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#4b5563";
    ctx.font = `600 36px ${baseFont}`;
    ctx.fillText(`${rd.r || idx + 1}R`, centerX, y + 5);

    // ★ KO丸（前の「青い丸＋KO🔥」デザイン）
    if (rd.ko === "A" || rd.ko === "B") {
      const isA = rd.ko === "A";
      const radius = 54; // 大きさは好みで微調整OK

      ctx.beginPath();
      ctx.arc(centerX, y, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = isA ? "#b91c1c" : "#1d4ed8"; // A=赤, B=青
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = `700 28px ${baseFont}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("KO🔥", centerX, y + 2);
      // KO以降のラウンド空欄にする（前の仕様維持）
      return; // ←ここ重要（次のラウンド処理へ）
    }
  });

  // ── 疑惑判定 / 年間最高試合フラグ ───────────────
  let flagY = roundsStartY + rowH * 12 + 30;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 26px ${baseFont}`;

  if (suspect) {
    const text = "🤔 疑惑判定試合に認定！";
    const w = ctx.measureText(text).width + 40;
    const h = 44;
    const x = W / 2;

    // pill
    ctx.beginPath();
    const r = 22;
    ctx.moveTo(x - w / 2 + r, flagY - h / 2);
    ctx.lineTo(x + w / 2 - r, flagY - h / 2);
    ctx.quadraticCurveTo(
      x + w / 2,
      flagY - h / 2,
      x + w / 2,
      flagY - h / 2 + r
    );
    ctx.lineTo(x + w / 2, flagY + h / 2 - r);
    ctx.quadraticCurveTo(
      x + w / 2,
      flagY + h / 2,
      x + w / 2 - r,
      flagY + h / 2
    );
    ctx.lineTo(x - w / 2 + r, flagY + h / 2);
    ctx.quadraticCurveTo(
      x - w / 2,
      flagY + h / 2,
      x - w / 2,
      flagY + h / 2 - r
    );
    ctx.lineTo(x - w / 2, flagY - h / 2 + r);
    ctx.quadraticCurveTo(
      x - w / 2,
      flagY - h / 2,
      x - w / 2 + r,
      flagY - h / 2
    );
    ctx.closePath();

    ctx.fillStyle = "#fee2e2";
    ctx.fill();
    ctx.strokeStyle = "#b91c1c";
    ctx.stroke();

    ctx.fillStyle = "#b91c1c";
    ctx.fillText(text, x, flagY);

    flagY += 64;
  }

  if (foty) {
    const text = "🔥 年間最高試合候補！";
    const w = ctx.measureText(text).width + 40;
    const h = 44;
    const x = W / 2;

    const r = 22;
    ctx.beginPath();
    ctx.moveTo(x - w / 2 + r, flagY - h / 2);
    ctx.lineTo(x + w / 2 - r, flagY - h / 2);
    ctx.quadraticCurveTo(
      x + w / 2,
      flagY - h / 2,
      x + w / 2,
      flagY - h / 2 + r
    );
    ctx.lineTo(x + w / 2, flagY + h / 2 - r);
    ctx.quadraticCurveTo(
      x + w / 2,
      flagY + h / 2,
      x + w / 2 - r,
      flagY + h / 2
    );
    ctx.lineTo(x - w / 2 + r, flagY + h / 2);
    ctx.quadraticCurveTo(
      x - w / 2,
      flagY + h / 2,
      x - w / 2,
      flagY + h / 2 - r
    );
    ctx.lineTo(x - w / 2, flagY - h / 2 + r);
    ctx.quadraticCurveTo(
      x - w / 2,
      flagY - h / 2,
      x - w / 2 + r,
      flagY - h / 2
    );
    ctx.closePath();

    ctx.fillStyle = "#fef3c7";
    ctx.fill();
    ctx.strokeStyle = "#f97316";
    ctx.stroke();

    ctx.fillStyle = "#b45309";
    ctx.fillText(text, x, flagY);

    flagY += 64;
  }

  // ── フッター ─────────────────────────────
  const footerY = H - 40;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 20px ${baseFont}`;
  ctx.fillStyle = "#9ca3af";
  ctx.fillText("#boxingdiagrams scorecard", W / 2, footerY);

  // Blob を返す
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("toBlob failed"));
      },
      "image/png",
      0.95
    );
  });

  return blob;
}

/// 共有：スコア画像を生成（キャンバス描画）
async function shareScore({
  platform,
  fightId,
  fighterA,
  fighterB,
  rounds,
  totals,
  avg,
  suspect,
  foty,
}) {
  const avgForText = computeTotalAvgForImage(avg, rounds);
  const fightTag = buildFightHashtag(fighterA, fighterB);
  const text = `【個人採点】${fighterA} vs ${fighterB}
  スコア: ${totals.a} - ${totals.b}
  平均: ${totals.a} - ${totals.b}
  ${fightTag} #Boxing`;

  const blob = await makeScoreImage({
    fightId,
    fighterA,
    fighterB,
    rounds,
    totals,
    avg,
    suspect,
    foty,
  });

  const file = new File([blob], `score_${fightId}.png`, { type: "image/png" });

  // ─ Web Share API（モバイルで画像シェア可） ─
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `${fighterA} vs ${fighterB}`,
        text,
        files: [file],
      });
      return; // ここで終了 → 下の処理には行かない
    } catch (e) {
      // ユーザーがキャンセルしたりしたら普通に下の処理へフォールバック
    }
  }

  // ─ 画像をダウンロード（手動添付用） ─
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);

  // ─ 各サービスへテキスト遷移 ─
  const t = encodeURIComponent(text);
  if (platform === "x") {
    window.open(`https://twitter.com/intent/tweet?text=${t}`, "_blank");
  } else if (platform === "reddit") {
    window.open(`https://www.reddit.com/submit?title=${t}`, "_blank");
  } else if (platform === "instagram") {
    alert(
      "Instagramはブラウザからの画像付き自動投稿が制限されています。画像は保存済みなので、アプリで新規投稿に添付してテキストを貼り付けてください。"
    );
  } else if (platform === "facebook") {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?quote=${t}`,
      "_blank"
    );
  }
}

// ==== 日本語→ローマ字 & ハッシュタグ生成 ====
// 主要選手の表記ゆれ用ディクショナリ（必要に応じて追加OK）
const NAME_ROMAJI_DICT = {
  井上尚弥: "Inoue",
  中谷潤人: "Nakatani",
  寺地拳四朗: "Teraji",
  堤聖也: "Tstumi",
  ウシク: "Usyk",
  デュボア: "Dubois",
  ネリ: "Nery",
  デービス: "Davis",
  マーティン: "Martin",
  カネロ: "Canelo",
  シャクール: "Shakur",
  フルトン: "Fulton",
  ベテルビエフ: "Beterbiev",
  ビボル: "Bivol",
  ベナビデス: "Benavidez",
  クロフォード: "Crawford",
  スペンス: "Spence",
  エニス: "Ennis",
  "ジェシー・ロドリゲス": "Rodriguez",
  "テオフィモ・ロペス": "Lopez",
  エスピノサ: "Espinoza",
  ロペス: "Lopez",
  ベン: "benn",
  ユーバンク: "Eubank",
};

// カナ→ローマ字（簡易ヘボン式・拗音/濁音中心）
function kanaToRomaji(kana) {
  if (!kana) return "";
  const s = String(kana)
    .replace(/・/g, " ")
    .replace(/[ー~−–—]/g, "-");
  const table = {
    キャ: "kya",
    キュ: "kyu",
    キョ: "kyo",
    シャ: "sha",
    シュ: "shu",
    ショ: "sho",
    チャ: "cha",
    チュ: "chu",
    チョ: "cho",
    ニャ: "nya",
    ニュ: "nyu",
    ニョ: "nyo",
    ヒャ: "hya",
    ヒュ: "hyu",
    ヒョ: "hyo",
    ミャ: "mya",
    ミュ: "myu",
    ミョ: "myo",
    リャ: "rya",
    リュ: "ryu",
    リョ: "ryo",
    ギャ: "gya",
    ギュ: "gyu",
    ギョ: "gyo",
    ジャ: "ja",
    ジュ: "ju",
    ジョ: "jo",
    ビャ: "bya",
    ビュ: "byu",
    ビョ: "byo",
    ピャ: "pya",
    ピュ: "pyu",
    ピョ: "pyo",
    デュ: "dyu",
    ティ: "ti",
    ファ: "fa",
    フィ: "fi",
    フェ: "fe",
    フォ: "fo",
    ウィ: "wi",
    ウェ: "we",
    ウォ: "wo",
    ヴァ: "va",
    ヴィ: "vi",
    ヴ: "vu",
    ヴェ: "ve",
    ヴォ: "vo",
  };
  const basic = {
    ア: "a",
    イ: "i",
    ウ: "u",
    エ: "e",
    オ: "o",
    カ: "ka",
    キ: "ki",
    ク: "ku",
    ケ: "ke",
    コ: "ko",
    サ: "sa",
    シ: "shi",
    ス: "su",
    セ: "se",
    ソ: "so",
    タ: "ta",
    チ: "chi",
    ツ: "tsu",
    テ: "te",
    ト: "to",
    ナ: "na",
    ニ: "ni",
    ヌ: "nu",
    ネ: "ne",
    ノ: "no",
    ハ: "ha",
    ヒ: "hi",
    フ: "fu",
    ヘ: "he",
    ホ: "ho",
    マ: "ma",
    ミ: "mi",
    ム: "mu",
    メ: "me",
    モ: "mo",
    ヤ: "ya",
    ユ: "yu",
    ヨ: "yo",
    ラ: "ra",
    リ: "ri",
    ル: "ru",
    レ: "re",
    ロ: "ro",
    ワ: "wa",
    ヲ: "o",
    ン: "n",
    ガ: "ga",
    ギ: "gi",
    グ: "gu",
    ゲ: "ge",
    ゴ: "go",
    ザ: "za",
    ジ: "ji",
    ズ: "zu",
    ゼ: "ze",
    ゾ: "zo",
    ダ: "da",
    ヂ: "ji",
    ヅ: "zu",
    デ: "de",
    ド: "do",
    バ: "ba",
    ビ: "bi",
    ブ: "bu",
    ベ: "be",
    ボ: "bo",
    パ: "pa",
    ピ: "pi",
    プ: "pu",
    ペ: "pe",
    ポ: "po",
    ッ: "*",
    ャ: "ya",
    ュ: "yu",
    ョ: "yo",
    ー: "-",
  };
  // ひらがな→カタカナ
  const kata = s.replace(/[ぁ-ん]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60)
  );
  // 拗音を先に
  let out = kata;
  Object.keys(table).forEach((k) => {
    out = out.split(k).join(table[k]);
  });
  // 1文字ずつ
  let res = "";
  for (let i = 0; i < out.length; i++) {
    const ch = out[i];
    let rom = basic[ch] || ch;
    if (rom === "*") {
      // 促音
      const next = out[i + 1] ? basic[out[i + 1]] || out[i + 1] : "";
      const c = /^[bcdfghjklmnpqrstvwxyz]/i.test(next) ? next[0] : "";
      rom = c.toLowerCase();
    }
    res += rom;
  }
  // 長音（超ざっくり）
  res = res.replace(/-$/g, "");
  res = res
    .replace(/a-/, "aa")
    .replace(/i-/, "ii")
    .replace(/u-/, "uu")
    .replace(/e-/, "ee")
    .replace(/o-/, "oo");
  return res;
}

function toRomajiPreferDict(name) {
  if (!name) return "";
  if (NAME_ROMAJI_DICT[name]) return NAME_ROMAJI_DICT[name];
  // カタカナ/ひらがな主体なら変換
  if (/^[\p{Script=Hiragana}\p{Script=Katakana}・ー\s]+$/u.test(name))
    return kanaToRomaji(name);
  return name; // 既に英字などはそのまま
}

function buildFightHashtag(a, b) {
  const camel = (s) =>
    s
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ""))
      .join("");
  const A = camel(toRomajiPreferDict(a));
  const B = camel(toRomajiPreferDict(b));
  return `#${A}${B}`;
}
// --- タップ採点ユーティリティ ---
const TAP_SEQUENCE = ["unset", "10-9", "10-8", "10-7"]; // タップでサイクル

function toPair(winner, seq) {
  if (seq === "unset") return { a: "", b: "" };
  const [hi, lo] = seq.split("-").map(Number); // 10-9 → [10,9]
  return winner === "A" ? { a: hi, b: lo } : { a: lo, b: hi };
}

function nextSeq(currA, currB, winner) {
  const a = Number(currA || 0);
  const b = Number(currB || 0);
  // 現在の差分：A-B（負ならBリード）
  const diff = a - b;
  const ad = Math.abs(diff);

  // いまの状態を "10-9/10-8/10-7/unset" に正規化（Bリードも拾う）
  let currSeq = "unset";
  if (ad === 1) currSeq = "10-9";
  else if (ad === 2) currSeq = "10-8";
  else if (ad === 3) currSeq = "10-7";

  // 反対側がリードしている状態でその側をタップしたら、
  // サイクルを最初から（= 10-9）始めるために "unset" 扱いにする
  if ((winner === "A" && diff < 0) || (winner === "B" && diff > 0)) {
    currSeq = "unset";
  }

  const idx = TAP_SEQUENCE.indexOf(currSeq);
  return TAP_SEQUENCE[(idx + 1) % TAP_SEQUENCE.length]; // unset→10-9→10-8→10-7→unset...
}

// 目視しやすいタップエリア
const tapStyles = {
  cell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 26,
    borderRadius: 6,
    userSelect: "none",
  },
  aWin: { background: "#eff6ff", border: "1px solid #bfdbfe", fontWeight: 700 }, // 青系
  bWin: { background: "#fef2f2", border: "1px solid #fecaca", fontWeight: 700 }, // 赤系
  even: { background: "#f1f5f9", border: "1px solid #e2e8f0", fontWeight: 700 }, // グレー
  ghost: { color: "#64748b" },
};
export default function App() {
  // タブ
  const [activeTab, setActiveTab] = useState("ホーム");
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [homeView, setHomeView] = useState("list"); // list / score
  const [events, setEvents] = useState([]);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);


  const fetchEvents = useCallback(async () => {
    const now = new Date();

    // 過去30日〜未来90日から拾う
    const pastFromIso = new Date(now.getTime() - 30 * dayMs).toISOString();
    const futureToIso = new Date(now.getTime() + 90 * dayMs).toISOString();

    let { data, error } = await supabase
      .from("events")
      .select("uid,title,starts_at,ends_at,location,description")
      .gte("starts_at", pastFromIso)
      .lte("starts_at", futureToIso)
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("❌ イベント取得エラー:", error.message);
      setEvents([]);
      return;
    }

    if (!data || data.length === 0) {
      setEvents([]);
      return;
    }

    // ---- ここから振り分け ----
    const nowMs = now.getTime();
    const past = [];
    const future = [];

    for (const ev of data) {
      const t = ev.starts_at ? new Date(ev.starts_at).getTime() : null;
      if (t != null && t < nowMs) {
        past.push(ev);
      } else {
        future.push(ev);
      }
    }

    const recentPast = past.slice(-2);
    // これから6件
    const upcoming = future.slice(0, 6);

    // 過去2 + 未来6（合計最大8件）
    const selected = [...recentPast, ...upcoming].slice(0, 8);

    setEvents(selected.map(makeFightFromEvent));
  }, []);

useEffect(() => {
  fetchEvents(); // 起動時に自動取得
}, [fetchEvents]);

  // --- ICS同期を手動でも呼べるように関数化 ---
const handleSync = useCallback(async () => {
  try {
    setSyncing(true);
    await runIcsSync();
    await fetchEvents();
    setLastSyncedAt(new Date().toLocaleString());
    setHasSyncedOnce(true);
  } catch (e) {
    console.error("同期エラー:", e);
  } finally {
    setSyncing(false);
  }
}, [fetchEvents]); //

  // スコアカード状態
const [fightId, setFightId] = useState("");
const [fighterA, setFighterA] = useState("");
const [fighterB, setFighterB] = useState("");

  const [avatarA] = useState("");
  const [avatarB] = useState("");

  const [rounds, setRounds] = useState(() => {
    const map = JSON.parse(localStorage.getItem("rounds_map") || "{}");
    return (
      map[fightId] ||
      Array.from({ length: DEFAULT_ROUNDS }, (_, i) => ({
        r: i + 1,
        a: "",
        b: "",
      }))
    );
  });

useEffect(() => {
  if (!fightId) return;

  const map = JSON.parse(localStorage.getItem("rounds_map") || "{}");
  const saved = map[fightId];

  setRounds(
    saved ||
      Array.from({ length: DEFAULT_ROUNDS }, (_, i) => ({
        r: i + 1,
        a: "",
        b: "",
      }))
  );
}, [fightId]);






useEffect(() => {
  // すでに選択中なら何もしない（ユーザー操作を尊重）
  if (fightId) return;

  // eventsがあればそれを採用、なければ（DEVだけ）MOCK
   if (events.length > 0) {
    const f = events[0]; // makeFightFromEvent 済み
    setFightId(f.id);
    setFighterA(f.a);
    setFighterB(f.b);
    return;
  }
}, [events, fightId]);

  // ダミー平均（接続後はRPCで実値化）
  const EMPTY_AVG = Array.from({ length: DEFAULT_ROUNDS }, () => ({}));
  const [avg, setAvg] = useState(EMPTY_AVG);
  const [suspect, setSuspect] = useState(false);
  const [foty, setFoty] = useState(false);

  // スケジュール & MY PAGE
  // スケジュール & MY PAGE
const [schedule, setSchedule] = useState([]);
const [loadingSchedule, setLoadingSchedule] = useState(true);
const [scheduleError, setScheduleError] = useState(null);

useEffect(() => {
  let alive = true;

  (async () => {
    try {
      setLoadingSchedule(true);
      setScheduleError(null);

      const nowIso = new Date().toISOString();

      // 過去2件
      const pastReq = supabase
        .from("events")
        .select("id, title, start")
        .lt("start", nowIso)
        .order("start", { ascending: false })
        .limit(2);

      // 未来6件
      const futureReq = supabase
        .from("events")
        .select("id, title, start")
        .gte("start", nowIso)
        .order("start", { ascending: true })
        .limit(6);

      const [{ data: past, error: pastErr }, { data: future, error: futureErr }] =
        await Promise.all([pastReq, futureReq]);

      if (pastErr) throw pastErr;
      if (futureErr) throw futureErr;

      const merged = [
        ...((past ?? []).slice().reverse()),
        ...(future ?? []),
      ];

      if (alive) setSchedule(merged);
    } catch (e) {
      if (!alive) return;
      setScheduleError(e);

      // 開発中の見本はOK（取得失敗時だけ）
      if (import.meta.env.DEV) setSchedule(MOCK_SCHEDULE);
    } finally {
      if (alive) setLoadingSchedule(false);
    }
  })();

  return () => { alive = false; };
}, []);

  const [myScores, setMyScores] = useState(() =>
    JSON.parse(localStorage.getItem("my_scores") || "[]")
  );

  // PFP
  const PFP_CANDIDATES = [
    "井上尚弥",
    "ジャーボンティ・デービス",
    "オレクサンドル・ウシク",
    "サウル・アルバレス",
    "テオフィモ・ロペス",
    "シャクール・スティーブンソン",
    "アルツール・ベテルビエフ",
    "ディミトリー・ビボル",
    "デビット・ベナビデス",
    "中谷潤人",
    "寺地拳四朗",
    "ジャロン・エニス",
    "デヴィン・ヘイニー",
    "ジェシー・ロドリゲス",
  ];
  const [pfpPick, setPfpPick] = useState("");
  const [lastVoteAt, setLastVoteAt] = useState(() =>
    Number(localStorage.getItem("pfp_last_vote_at") || 0)
  );
  const canVote = () => Date.now() - lastVoteAt >= 30 * dayMs;
  const cooldownInfo = () => {
    const left = 30 * dayMs - (Date.now() - lastVoteAt);
    return left > 0 ? `${Math.ceil(left / dayMs)}日後に再投票できます` : null;
  };

  // 合計スコア
  const totals = useMemo(() => {
    const a = rounds.reduce((s, r) => s + (parseInt(r.a || 0, 10) || 0), 0);
    const b = rounds.reduce((s, r) => s + (parseInt(r.b || 0, 10) || 0), 0);
    return { a, b };
  }, [rounds]);

  const fmt1 = (x) => (x === "" || x == null ? "-" : Number(x).toFixed(1));

// スコア保存（試合ごと）
function setRoundScore(i, aVal, bVal) {
  if (!fightId) return;

  setRounds((arr) => {
    const next = [...arr];
    next[i] = { ...next[i], a: aVal, b: bVal };

    const map = JSON.parse(localStorage.getItem("rounds_map") || "{}");
    map[fightId] = next;
    localStorage.setItem("rounds_map", JSON.stringify(map));

    return next;
  });
}


  const EMPTY_ROUNDS = Array.from({ length: DEFAULT_ROUNDS }, (_, i) => ({
    r: i + 1,
    a: "",
    b: "",
  }));

  // 試合読み込み → 採点ビューへ
  const loadFight = (f) => {
    setFightId(f.id);
    setFighterA(f.a);
    setFighterB(f.b);

    const map = JSON.parse(localStorage.getItem("rounds_map") || "{}");
    setRounds(map[f.id] || EMPTY_ROUNDS);

    // ★ ここが重要：ダミー 9.8 / 9.2 はもう使わない
    //    将来 DB から avg を持ってくるなら f.avg を優先
    if (Array.isArray(f.avg) && f.avg.length) {
      setAvg(f.avg); // みんなの平均（将来用）
    } else {
      setAvg(EMPTY_AVG); // 何もなければ空
    }
    setActiveTab("ホーム");
    setHomeView("score");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveMyScore = () => {
    const totalAvgNow = totalFromAvg(avg);
    const item = {
      id: fightId,
      at: Date.now(),
      a: fighterA,
      b: fighterB,
      totalA: totals.a,
      totalB: totals.b,
      suspect,
      foty,
      // 追加分👇
      avgTotalA: totalAvgNow.a,
      avgTotalB: totalAvgNow.b,
      rounds: rounds, // その時点の自分のラウンド採点
      avgPerRound: avg, // その時点の平均（1R平均用）
    };
    const next = [item, ...myScores.filter((v) => v.id !== item.id)].slice(
      0,
      200
    );
    setMyScores(next);
    localStorage.setItem("my_scores", JSON.stringify(next));
    alert("MY PAGE に保存しました");
  };

  // Supabase（任意）
  const saveToSupabase = async () => {
    const { error } = await supabase.from("scores").insert([
      {
        fighter_a: fighterA,
        fighter_b: fighterB,
        rounds,
        suspect,
        foty,
        total_a: totals.a,
        total_b: totals.b,
      },
    ]);
    if (error)
      console.error("みんなの平均に参加（保存）エラー:", error.message, error);
    else alert("Supabaseに保存しました！");
  };
  // KOフラグをトグルする（同じボタンをもう一度押したら解除）
  const toggleKO = (roundIndex, who) => {
    setRounds((prev) => {
      const next = [...prev];
      const curr = next[roundIndex] || { r: roundIndex + 1, a: "", b: "" };

      const newKo = curr.ko === who ? undefined : who; // 同じ側をもう一度押したら解除

      next[roundIndex] = { ...curr, ko: newKo };

      // いつもの保存ロジック（rounds_map にも反映）
      const map = JSON.parse(localStorage.getItem("rounds_map") || "{}");
      map[fightId] = next;
      localStorage.setItem("rounds_map", JSON.stringify(map));

      return next;
    });
  };

  // いま開いている試合（events優先→なければMOCK）
  const currentFight = useMemo(() => {
    const fights = (events && events.length ? events : schedule) || [];
    return fights.find((x) => x.id === fightId) || {};
  }, [events, schedule, fightId]);

  // ===== スコアカード（合計の真ん中に合計平均も表示／SNSシェア付き） =====
  const ScoreCard = () => {
    return (
      <>
        <div style={styles.title}>SCORECARD</div>
        <div style={{ ...styles.card, ...styles.redSoft, marginBottom: 6 }}>
          <div style={{ ...styles.cardContent, ...styles.grid3 }}>
            {/* 左：青サイド */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar name={fighterA} size={40} />
                <input
                  value={fighterA}
                  onChange={(e) => setFighterA(e.target.value)}
                  style={styles.nameInput}
                />
              </div>
              <div style={styles.totalNum}>{totals.a}</div>
            </div>

            {/* 中央：合計（自分のスコア） */}
            <div style={{ fontWeight: 800, fontSize: 12, lineHeight: 1.2 }}>
              合計
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 10,
                  color: "#334155",
                  marginTop: 2,
                }}
              >
                {totals.a} - {totals.b}
              </div>
              {currentFight?.platformLabel && (
                <div style={{ marginTop: 6 }}>
                  {currentFight.platformUrl ? (
                    <a
                      href={currentFight.platformUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        ...styles.tag,
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      視聴：{currentFight.platformLabel}
                    </a>
                  ) : (
                    <span style={styles.tag}>
                      視聴：{currentFight.platformLabel}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 右：赤サイド */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Avatar name={fighterB} size={40} />
                <input
                  value={fighterB}
                  onChange={(e) => setFighterB(e.target.value)}
                  style={styles.nameInput}
                />
              </div>
              <div style={styles.totalNum}>{totals.b}</div>
            </div>
          </div>
        </div>
        {/* シェア */}
        <div style={{ ...styles.card, marginBottom: 6 }}>
          <div style={{ ...styles.cardContent, ...styles.shareRow }}>
            <span style={{ fontWeight: 600, fontSize: 12 }}>シェア:</span>

            {/* X */}
            <button
              aria-label="Share to X"
              title="X"
              style={styles.btnSm}
              onClick={() =>
                shareScore({
                  platform: "x", // それぞれ "instagram" / "reddit" / "facebook"
                  fightId,
                  fighterA,
                  fighterB,
                  rounds,
                  totals,
                  avg,
                  suspect,
                  foty,
                })
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                style={{ verticalAlign: "middle" }}
              >
                <path
                  d="M18.3 2h3.1l-6.8 7.8L22 22h-6.8l-4.7-6-5.4 6H2.1l7.3-8.2L2 2h7l4.3 5.6L18.3 2z"
                  fill="currentColor"
                />
              </svg>
              <span style={{ marginLeft: 6 }}>X</span>
            </button>

            {/* Instagram */}
            <button
              aria-label="Share to Instagram"
              title="Instagram"
              style={styles.btnSm}
              onClick={() =>
                shareScore({
                  platform: "instagram", // それぞれ "instagram" / "reddit" / "facebook"
                  fightId,
                  fighterA,
                  fighterB,
                  rounds,
                  totals,
                  avg,
                  suspect,
                  foty,
                })
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                style={{ verticalAlign: "middle" }}
              >
                <path
                  d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 5a5 5 0 1 0 .001 10.001A5 5 0 0 0 12 7zm0 2.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6zM18 6.5a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2z"
                  fill="currentColor"
                />
              </svg>
              <span style={{ marginLeft: 6 }}>Instagram</span>
            </button>

            {/* Reddit */}
            <button
              aria-label="Share to Reddit"
              title="Reddit"
              style={styles.btnSm}
              onClick={() =>
                shareScore({
                  platform: "reddit", // それぞれ "instagram" / "reddit" / "facebook"
                  fightId,
                  fighterA,
                  fighterB,
                  rounds,
                  totals,
                  avg,
                  suspect,
                  foty,
                })
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                style={{ verticalAlign: "middle" }}
              >
                <path
                  d="M21 12.3c0-.9-.7-1.6-1.6-1.6-.4 0-.8.2-1.1.5-1.1-.8-2.5-1.3-4.1-1.4l.7-3.2 2.2.5c0 .6.5 1.1 1.1 1.1.6 0 1.1-.5 1.1-1.1S19.9 5 19.3 5c-.4 0-.8.2-1 .5l-2.6-.6c-.2-.1-.5.1-.6.3l-.8 3.6c-1.7 0-3.2.5-4.3 1.3-.3-.3-.7-.5-1.1-.5-.9 0-1.6.7-1.6 1.6 0 .6.3 1.1.8 1.4 0 .2 0 .4.1.6 0 2.3 3 4.2 6.8 4.2s6.8-1.9 6.8-4.2v-.5c.6-.2.9-.7.9-1.3zM9.6 13.4c0-.7.6-1.3 1.3-1.3s1.3.6 1.3 1.3-.6 1.2-1.3 1.2-1.3-.6-1.3-1.2zm6.9 2.6c-.8.6-2 .9-3.4.9s-2.6-.3-3.4-.9c-.2-.1-.2-.4 0-.5.2-.2.5-.2.7 0 .6.4 1.6.7 2.7.7s2.1-.3 2.7-.7c.2-.2.5-.2.7 0 .2.1.2.4 0 .5zm.2-1.4c-.7 0-1.3-.5-1.3-1.2s.6-1.3 1.3-1.3 1.2.6 1.2 1.3-.5 1.2-1.2 1.2z"
                  fill="currentColor"
                />
              </svg>
              <span style={{ marginLeft: 6 }}>Reddit</span>
            </button>

            {/* Facebook */}
            <button
              aria-label="Share to Facebook"
              title="Facebook"
              style={styles.btnSm}
              onClick={() =>
                shareScore({
                  platform: "facebook", // それぞれ "instagram" / "reddit" / "facebook"
                  fightId,
                  fighterA,
                  fighterB,
                  rounds,
                  totals,
                  avg,
                  suspect,
                  foty,
                })
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                style={{ verticalAlign: "middle" }}
              >
                <path
                  d="M13 22v-8h3l.5-3H13V9.5c0-.9.3-1.5 1.6-1.5H17V5.2C16.6 5.1 15.6 5 14.4 5 12 5 10.4 6.5 10.4 9V11H8v3h2.4v8h2.6z"
                  fill="currentColor"
                />
              </svg>
              <span style={{ marginLeft: 6 }}>Facebook</span>
            </button>
          </div>
        </div>

        <div style={{ ...styles.grid2, marginBottom: 6 }}>
          <button
            onClick={() => setSuspect((v) => !v)}
            style={{ ...styles.btn, ...(suspect ? styles.btnOnOrange : null) }}
          >
            疑惑判定ならON
          </button>
          <button
            onClick={() => setFoty((v) => !v)}
            style={{ ...styles.btn, ...(foty ? styles.btnOnGreen : null) }}
          >
            年間最高候補ならON
          </button>
        </div>

        <div style={styles.card}>
          <div style={styles.cardContent}>
            <div style={styles.list}>
              {rounds.map((rd, i) => (
                <div key={rd.r}>
                  {/* 1段目：いつもの 3マス（A / 平均 / B） */}
                  <div style={styles.row}>
                    {/* 左：A をタップで 10-9 → 10-8 → 10-7 → クリア */}
                    <div
                      onClick={() => {
                        const seq = nextSeq(rd.a, rd.b, "A");
                        const p = toPair("A", seq);
                        setRoundScore(i, p.a, p.b);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (() => {
                          const seq = nextSeq(rd.a, rd.b, "A");
                          const p = toPair("A", seq);
                          setRoundScore(i, p.a, p.b);
                        })()
                      }
                      style={{
                        ...tapStyles.cell,
                        ...(rd.a && rd.b && Number(rd.a) > Number(rd.b)
                          ? tapStyles.aWin
                          : null),
                        ...(rd.a ? {} : tapStyles.ghost),
                      }}
                      title="タップで A側 10-9 → 10-8 → 10-7 → クリア"
                    >
                      {rd.a || (fighterA || "A").slice(0, 1)}
                    </div>

                    {/* 中央：平均表示（タップで 10-10） */}
                    <div
                      onClick={() => setRoundScore(i, 10, 10)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setRoundScore(i, 10, 10)
                      }
                      style={{
                        ...tapStyles.cell,
                        ...(rd.a && rd.b && Number(rd.a) === Number(rd.b)
                          ? tapStyles.even
                          : null),
                        margin: "0 4px",
                      }}
                      title="タップで 10-10（イーブン）"
                    >
                      <div style={styles.avgText}>
                        {(() => {
                          // DB からの平均（みんなの採点）
                          const avgA = avg[i]?.a;
                          const avgB = avg[i]?.b;

                          // 自分のスコア
                          const selfA = rd.a === "" ? null : Number(rd.a);
                          const selfB = rd.b === "" ? null : Number(rd.b);

                          let showA = null;
                          let showB = null;

                          // ① みんなの平均があればそれを優先
                          if (
                            typeof avgA === "number" &&
                            typeof avgB === "number"
                          ) {
                            showA = avgA;
                            showB = avgB;
                          }
                          // ② なければ自分のスコアから
                          else if (selfA != null && selfB != null) {
                            showA = selfA;
                            showB = selfB;
                          }

                          const left = showA == null ? "-" : fmt1(showA);
                          const right = showB == null ? "-" : fmt1(showB);

                          return `${rd.r || i + 1}R 平均: ${left} - ${right}`;
                        })()}
                      </div>
                    </div>

                    {/* 右：B をタップで 10-9 → 10-8 → 10-7 → クリア（B側勝ち） */}
                    <div
                      onClick={() => {
                        const seq = nextSeq(rd.a, rd.b, "B");
                        const p = toPair("B", seq);
                        setRoundScore(i, p.a, p.b);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (() => {
                          const seq = nextSeq(rd.a, rd.b, "B");
                          const p = toPair("B", seq);
                          setRoundScore(i, p.a, p.b);
                        })()
                      }
                      style={{
                        ...tapStyles.cell,
                        ...(rd.a && rd.b && Number(rd.b) > Number(rd.a)
                          ? tapStyles.bWin
                          : null),
                        ...(rd.b ? {} : tapStyles.ghost),
                      }}
                      title="タップで B側 10-9 → 10-8 → 10-7 → クリア"
                    >
                      {rd.b || (fighterB || "B").slice(0, 1)}
                    </div>
                  </div>

                  {/* 2段目：KO ボタン行 */}
                  <div
                    style={{
                      marginTop: 2,
                      marginBottom: 4,
                      display: "flex",
                      justifyContent: "center",
                      gap: 6,
                      fontSize: 10,
                    }}
                  >
                    <button
                      type="button"
                      style={{
                        ...styles.btnSm,
                        padding: "2px 6px",
                        ...(rd.ko === "A"
                          ? {
                              background: "#fee2e2",
                              borderColor: "#b91c1c",
                              color: "#b91c1c",
                            }
                          : {}),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKO(i, "A");
                      }}
                    >
                      A KO
                    </button>
                    <button
                      type="button"
                      style={{
                        ...styles.btnSm,
                        padding: "2px 6px",
                        ...(rd.ko === "B"
                          ? {
                              background: "#dbeafe",
                              borderColor: "#1d4ed8",
                              color: "#1d4ed8",
                            }
                          : {}),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleKO(i, "B");
                      }}
                    >
                      B KO
                    </button>

                    {rd.ko && (
                      <span style={{ color: "#64748b" }}>
                        ← {rd.ko === "A" ? "A側KO" : "B側KO"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}
        >
          <button style={styles.btn} onClick={() => setHomeView("list")}>
            ← 一覧に戻る
          </button>
          <button style={styles.btn} onClick={saveMyScore}>
            MY PAGEに保存
          </button>
          <button style={styles.btn} onClick={saveToSupabase}>
            みんなの平均に参加（保存）
          </button>
        </div>
      </>
    );
  };

  // ===== ホーム：スケジュール一覧（カード全体クリック、両側に丸顔、平均は合計平均） =====
  const HomeList = ({ onlyPast = false, pastEvents = [] } = {}) => {
    const [visibleCount, setVisibleCount] = useState(20);
    const toFightForLoad = (f) => ({
      ...f,
      // Homeと履歴でキーが違っても拾えるように
      id: f.id || f.fightId,
      a: f.a || f.fighterA,
      b: f.b || f.fighterB,
    });
    const pastArr = pastEvents || [];
    const totalPast = pastArr.length;

    const fights = useMemo(() => {
      if (onlyPast) return pastArr.slice(0, visibleCount);
      return events && events.length ? events : schedule;
    }, [onlyPast, pastArr, visibleCount, events, schedule]);
    const demoTotalAvg = { a: 0, b: 0 }; //


    // ✅ PFP集計（localStorage: "pfp_votes"）
    const pfpTop = React.useMemo(() => {
      const votes = JSON.parse(localStorage.getItem("pfp_votes") || "[]");
      const total = votes.length;
      if (!total) return null;
      const tally = new Map();
      for (const v of votes) tally.set(v.pick, (tally.get(v.pick) || 0) + 1);
      let topName = "",
        topCount = 0;
      tally.forEach((cnt, name) => {
        if (cnt > topCount) {
          topCount = cnt;
          topName = name;
        }
      });
      const percent = Math.round((topCount / total) * 1000) / 10;
      return { name: topName, percent, total };
    }, []);

    return (
      <>
        <div style={styles.headerBar}>🥊BE THE JUDGE🫵💥</div>

        {/* ─ スケジュールカード ─ */}
        <div style={{ ...styles.card, marginTop: 8 }}>
          <div style={styles.cardContent}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div style={{ fontWeight: 700 }}>スケジュール / 過去試合</div>
              <div>
                <button
                  style={styles.btnSm}
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? "同期中..." : "今すぐ同期"}
                </button>
                {lastSyncedAt && (
                  <span
                    style={{ marginLeft: 8, fontSize: 11, color: "#64748b" }}
                  >
                    最終同期: {lastSyncedAt}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {fights.map((f) => (
                <div
                  key={f.id}
                  onClick={() => loadFight(toFightForLoad(f))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" ? loadFight(toFightForLoad(f)) : null
                  }
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 10,
                    cursor: "pointer",
                  }}
                  onMouseDown={(e) =>
                    (e.currentTarget.style.transform = "scale(0.99)")
                  }
                  onMouseUp={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = "scale(1)")
                  }
                >
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {f.dateTimeLabel || f.date}
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      gap: 6,
                      alignItems: "center",
                      marginTop: 6,
                    }}
                  >
                    <div style={styles.nameWithAvatar}>
                      <Avatar name={f.a} />
                      <span style={{ fontWeight: 700 }}>{f.a}</span>
                    </div>
                    <div style={{ textAlign: "center", fontSize: 12 }}>vs</div>
                    <div style={styles.nameWithAvatar}>
                      <Avatar name={f.b} />
                      <span style={{ fontWeight: 700 }}>{f.b}</span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      gap: 6,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={styles.tag}>
                      平均 {fmt1(demoTotalAvg.a)} - {fmt1(demoTotalAvg.b)}
                    </span>
                    {f.platform && f.platformUrl && (
                      <a
                        href={f.platformUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{ ...styles.tag, textDecoration: "none" }}
                      >
                        視聴：{f.platformLabel}
                      </a>
                    )}
                    {f.id.includes("dubois") && (
                      <span style={{ ...styles.tag, ...styles.tagDanger }}>
                        疑惑判定試合に認定！
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {onlyPast && totalPast > visibleCount && (
                <div style={{ marginTop: 12, textAlign: "center" }}>
                  <button
                    style={styles.btn}
                    onClick={() => setVisibleCount((c) => c + 20)}
                  >
                    もっと見る
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─ PFP 現在の1位（チラ見せ） ─ */}
        <div style={{ ...styles.card, marginTop: 8 }}>
          <div style={styles.cardContent}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700 }}>
                みんなの投票PFP（現在の1位）
              </div>
              <button
                style={styles.btnSm}
                onClick={() => setActiveTab("PFP投票")}
              >
                もっと見る →
              </button>
            </div>

            {pfpTop ? (
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>🥇</span>
                <span style={{ fontWeight: 700 }}>{pfpTop.name}</span>
                <span style={styles.tag}>全体の {pfpTop.percent}%</span>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  （投票総数 {pfpTop.total}）
                </span>
              </div>
            ) : (
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                まだ投票がありません。
                <button
                  style={{ ...styles.btnSm, marginLeft: 6 }}
                  onClick={() => setActiveTab("PFP投票")}
                >
                  いま投票する
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };
  const History = () => {
    const now = Date.now();
    const src =
      Array.isArray(events) && events.length
        ? events
        : Array.isArray(schedule)
        ? schedule
        : [];

    const pastOnly = src
      .filter((f) => {
        const t = new Date(f.dateTime || f.date || 0).getTime();
        return Number.isFinite(t) && t < now;
      })
      .sort((a, b) => {
        const ta = new Date(a.dateTime || a.date || 0).getTime();
        const tb = new Date(b.dateTime || b.date || 0).getTime();
        return tb - ta; // 新しい順
      });

    return <HomeList onlyPast={true} pastEvents={pastOnly} />;
  };

  // MY PAGE：自分の採点一覧（平均表示＋詳細＋SNSシェア＋再編集）
  const MyPage = () => {
    const [openId, setOpenId] = useState(null); // どのカードを開いているか

    // 古い保存データでも rounds を拾えるようフォールバック
    const loadRoundsFallback = (fightId) => {
      const map = JSON.parse(localStorage.getItem("rounds_map") || "{}");
      return map[fightId] || [];
    };

    // 試合履歴から再編集 → 採点画面へ
    const reEditFight = (historyItem, roundsData, avgPerRound) => {
      // 基本情報
      setFightId(historyItem.fightId || historyItem.id);
      setFighterA(historyItem.fighterA || historyItem.a);
      setFighterB(historyItem.fighterB || historyItem.b);

      // ラウンドスコア復元
      const restoredRounds =
        roundsData && roundsData.length
          ? roundsData
          : historyItem.rounds && historyItem.rounds.length
          ? historyItem.rounds
          : Array.from({ length: DEFAULT_ROUNDS }, (_, i) => ({
              r: i + 1,
              a: "",
              b: "",
            }));

      setRounds(restoredRounds);

      // 平均スコア復元
      const restoredAvg =
        (avgPerRound && avgPerRound.length && avgPerRound) ||
        (historyItem.avg && historyItem.avg.length && historyItem.avg) ||
        EMPTY_AVG;

      setAvg(restoredAvg);

      // 画面遷移
      setActiveTab("ホーム");
      setHomeView("score");

      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
      <div style={{ ...styles.card, marginTop: 8 }}>
        <div style={styles.cardContent}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>
            MY PAGE（自分の採点）
          </div>

          {myScores.length === 0 && (
            <div style={{ fontSize: 12, color: "#64748b" }}>
              まだ採点済みの試合がありません。
            </div>
          )}

          <div style={{ display: "grid", gap: 8 }}>
            {myScores.map((h) => {
              const roundsData =
                h.rounds && h.rounds.length
                  ? h.rounds
                  : loadRoundsFallback(h.id);
              const avgPerRound = h.avgPerRound || [];

              const hasAvgTotal = h.avgTotalA != null && h.avgTotalB != null;

              const fallbackAvgTotal = avgPerRound.length
                ? totalFromAvg(avgPerRound)
                : null;

              const avgTotalA = hasAvgTotal
                ? h.avgTotalA
                : fallbackAvgTotal
                ? fallbackAvgTotal.a
                : null;

              const avgTotalB = hasAvgTotal
                ? h.avgTotalB
                : fallbackAvgTotal
                ? fallbackAvgTotal.b
                : null;

              const totalsForShare = { a: h.totalA, b: h.totalB };
              const totalAvgForShare =
                avgTotalA != null && avgTotalB != null
                  ? { a: avgTotalA, b: avgTotalB }
                  : { a: 0, b: 0 };

              return (
                <div
                  key={h.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 8,
                  }}
                >
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {new Date(h.at).toLocaleString()}
                  </div>

                  {/* 名前＆vs表示 */}
                  {h.a && h.b ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        gap: 6,
                        alignItems: "center",
                        marginTop: 6,
                      }}
                    >
                      <div style={styles.nameWithAvatar}>
                        <Avatar name={h.a} />
                        <span style={{ fontWeight: 700 }}>{h.a}</span>
                      </div>
                      <div style={{ textAlign: "center", fontSize: 12 }}>
                        vs
                      </div>
                      <div style={styles.nameWithAvatar}>
                        <Avatar name={h.b} />
                        <span style={{ fontWeight: 700 }}>{h.b}</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: 6,
                        textAlign: "center",
                        fontWeight: 700,
                      }}
                    >
                      {h.title || "(イベント名未設定)"}
                    </div>
                  )}

                  {/* 平均（合計平均）バッジ */}
                  {avgTotalA != null && avgTotalB != null && (
                    <div style={{ marginTop: 6 }}>
                      <span style={styles.tag}>
                        平均 {fmt1(avgTotalA)} - {fmt1(avgTotalB)}
                      </span>
                    </div>
                  )}

                  {/* フラグ */}
                  {h.suspect && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ ...styles.tag, ...styles.tagDanger }}>
                        疑惑判定試合に認定！
                      </span>
                    </div>
                  )}
                  {h.foty && (
                    <div style={{ marginTop: 6 }}>
                      <span style={{ ...styles.tag, ...styles.tagGood }}>
                        年間最高試合候補！
                      </span>
                    </div>
                  )}

                  {/* ボタン＆シェア */}
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    {/* 再編集ボタン */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        style={styles.btnSm}
                        onClick={() => reEditFight(h, roundsData, avgPerRound)}
                      >
                        この採点を再編集して採点画面へ →
                      </button>
                    </div>

                    {/* SNS シェア（画像＋テキスト） */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>
                        シェア:
                      </span>

                      <button
                        style={styles.btnSm}
                        aria-label="Share to X"
                        title="X"
                        onClick={() =>
                          shareScore({
                            platform: "x",
                            fightId: h.id,
                            fighterA: h.a,
                            fighterB: h.b,
                            rounds: roundsData,
                            totals: totalsForShare,
                            totalAvg: totalAvgForShare,
                            suspect: h.suspect,
                            foty: h.foty,
                          })
                        }
                      >
                        X
                      </button>

                      <button
                        style={styles.btnSm}
                        aria-label="Share to Instagram"
                        title="Instagram"
                        onClick={() =>
                          shareScore({
                            platform: "instagram",
                            fightId: h.id,
                            fighterA: h.a,
                            fighterB: h.b,
                            rounds: roundsData,
                            totals: totalsForShare,
                            totalAvg: totalAvgForShare,
                            suspect: h.suspect,
                            foty: h.foty,
                          })
                        }
                      >
                        Instagram
                      </button>

                      <button
                        style={styles.btnSm}
                        aria-label="Share to Reddit"
                        title="Reddit"
                        onClick={() =>
                          shareScore({
                            platform: "reddit",
                            fightId: h.id,
                            fighterA: h.a,
                            fighterB: h.b,
                            rounds: roundsData,
                            totals: totalsForShare,
                            totalAvg: totalAvgForShare,
                            suspect: h.suspect,
                            foty: h.foty,
                          })
                        }
                      >
                        Reddit
                      </button>

                      <button
                        style={styles.btnSm}
                        aria-label="Share to Facebook"
                        title="Facebook"
                        onClick={() =>
                          shareScore({
                            platform: "facebook",
                            fightId: h.id,
                            fighterA: h.a,
                            fighterB: h.b,
                            rounds: roundsData,
                            totals: totalsForShare,
                            totalAvg: totalAvgForShare,
                            suspect: h.suspect,
                            foty: h.foty,
                          })
                        }
                      >
                        Facebook
                      </button>
                    </div>
                  </div>

                  {/* ラウンド詳細（開いているときだけ） */}
                  <div style={{ marginTop: 8 }}>
                    <button
                      style={styles.btnSm}
                      onClick={() => setOpenId(openId === h.id ? null : h.id)}
                    >
                      {openId === h.id ? "詳細を閉じる" : "ラウンド詳細を見る"}
                    </button>

                    {openId === h.id && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "grid", gap: 4 }}>
                          {Array.from({ length: DEFAULT_ROUNDS }, (_, i) => {
                            const rd = roundsData[i] || {
                              r: i + 1,
                              a: "",
                              b: "",
                            };
                            const avr = avgPerRound[i] || {};
                            return (
                              <div
                                key={i}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr 1fr 1fr",
                                  alignItems: "center",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: 6,
                                  padding: "4px 6px",
                                  fontSize: 12,
                                }}
                              >
                                <div
                                  style={{
                                    textAlign: "center",
                                    fontWeight: 700,
                                  }}
                                >
                                  {rd.a || "-"}
                                </div>
                                <div
                                  style={{
                                    textAlign: "center",
                                    color: "#64748b",
                                  }}
                                >
                                  {rd.r}R
                                  {avr.a != null && avr.b != null
                                    ? ` 平均: ${fmt1(avr.a)} - ${fmt1(avr.b)}`
                                    : ""}
                                </div>
                                <div
                                  style={{
                                    textAlign: "center",
                                    fontWeight: 700,
                                  }}
                                >
                                  {rd.b || "-"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

// ===== 週替わりアンケ（ここだけ編集すれば差し替え可能） =====
const SURVEY_CONFIG = {
  id: "survey_2026w01", // 週ごとに必ず変える（例: survey_2026w02）
  title: "今週のアンケート",
  question: "本当のネクストモンスターは誰？？",
  options: [
    "中谷潤人",
    "村田昴",
    "坂井優太",
    "石井渡士也",
    "堤駿斗",
    "堤麗斗",
    "佐々木尽",
    "高見亨輔",
    "増田陸",
    "那須川天心",
    "坪井智也",
    "その他",
  ],
  // 期限（日本時間でOK。Dateに読める形ならOK）
  endsAt: "2026-01-19T00:00:00+09:00",
  // 結果は投票後だけ見せたいなら true
  showResultsOnlyAfterVote: true,
};


const Survey = ({ config }) => {
  const { id, title, question, options, endsAt, showResultsOnlyAfterVote } =
    config;

  const storageKey = `survey_votes_${id}`;      // 票のリスト
  const votedKey = `survey_voted_${id}`;        // 投票済みフラグ

  const now = Date.now();
  const endMs = new Date(endsAt).getTime();
  const isActive = Number.isFinite(endMs) ? now <= endMs : true;

  const [pick, setPick] = React.useState("");
  const [refresh, setRefresh] = React.useState(0);

  const votes = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]");
    } catch {
      return [];
    }
  }, [storageKey, refresh]);

  const hasVoted = localStorage.getItem(votedKey) === "1";

  const results = React.useMemo(() => {
    const total = votes.length;
    const tally = new Map();
    for (const v of votes) tally.set(v, (tally.get(v) || 0) + 1);
    const list = options.map((opt) => {
      const count = tally.get(opt) || 0;
      const percent = total ? Math.round((count / total) * 1000) / 10 : 0;
      return { opt, count, percent };
    });
    // 多い順に並べたいならここで sort
    list.sort((a, b) => b.count - a.count);
    return { total, list };
  }, [votes, options]);

  const Bar = ({ percent }) => (
    <div
      style={{
        width: "100%",
        background: "#f1f5f9",
        borderRadius: 999,
        height: 6,
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: 6,
          borderRadius: 999,
          background: "#94a3b8",
        }}
      />
    </div>
  );

  const submitVote = () => {
    if (!pick) return;
    if (!isActive) return;
    if (hasVoted) return;

    const list = [...votes, pick];
    localStorage.setItem(storageKey, JSON.stringify(list));
    localStorage.setItem(votedKey, "1");
    setRefresh((x) => x + 1);
    alert("投票ありがとう！");
  };

  // 期限切れなら表示したくない場合：ここで return null にしてOK
  // if (!isActive) return null;

  return (
    <div style={{ ...styles.card, marginTop: 8 }}>
      <div style={styles.cardContent}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 700 }}>
            🗳️ {title}
            {!isActive && (
              <span style={{ marginLeft: 8, fontSize: 11, color: "#ef4444" }}>
                （締切）
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#64748b" }}>
            期限: {new Date(endMs).toLocaleString()}
          </div>
        </div>

        <div style={{ marginTop: 8, fontWeight: 600 }}>{question}</div>

        <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
          {options.map((opt) => (
            <label
              key={opt}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                opacity: !isActive ? 0.6 : 1,
              }}
            >
              <input
                type="radio"
                name={`survey_${id}`}
                value={opt}
                checked={pick === opt}
                onChange={() => setPick(opt)}
                disabled={!isActive || hasVoted}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            style={{
              ...styles.btn,
              ...(!pick || !isActive || hasVoted
                ? { opacity: 0.5, cursor: "not-allowed" }
                : {}),
            }}
            disabled={!pick || !isActive || hasVoted}
            onClick={submitVote}
          >
            投票する
          </button>

          {hasVoted && (
            <span style={{ fontSize: 12, color: "#64748b" }}>
              ✅ この端末では投票済み
            </span>
          )}
        </div>

        {/* 結果 */}
        {results.total > 0 &&
        (!showResultsOnlyAfterVote || hasVoted || !isActive) ? (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
              票数: {results.total}
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {results.list.map((row) => (
                <div
                  key={row.opt}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <div style={{ display: "grid", gap: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      {row.opt}
                      <span style={{ marginLeft: 6, color: "#64748b" }}>
                        ({row.count})
                      </span>
                    </div>
                    <Bar percent={row.percent} />
                  </div>
                  <div style={{ width: 60, textAlign: "right" }}>
                    {row.percent}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
            {results.total === 0
              ? "まだ投票がありません。"
              : "投票すると結果が表示されます。"}
          </div>
        )}
      </div>
    </div>
  );
};


  // PFP投票（単票・16名）＋結果Top10
  const PfpVote = () => {
    // 既存 state/関数はそのまま利用（pfpPick, canVote(), cooldownInfo() など）

    // 票を読み出し＆集計
    const votes = JSON.parse(localStorage.getItem("pfp_votes") || "[]");
    const hasVoted = votes.length > 0;
    const results = React.useMemo(() => {
      const total = votes.length;
      if (!total) return { total: 0, list: [] };
      const tally = new Map();
      for (const v of votes) {
        tally.set(v.pick, (tally.get(v.pick) || 0) + 1);
      }
      const list = Array.from(tally.entries())
        .map(([name, count]) => ({
          name,
          count,
          percent: Math.round((count / total) * 1000) / 10, // 小数1桁
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      return { total, list };
    }, [votes]);

    // プログレスバー用の小コンポーネント
    const Bar = ({ percent }) => (
      <div
        style={{
          width: "100%",
          background: "#f1f5f9",
          borderRadius: 999,
          height: 6,
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: 6,
            borderRadius: 999,
            background: "#94a3b8",
          }}
        />
      </div>
    );

    // メダル絵文字
    const medal = (i) =>
      i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;

    return (
      <>
        {/* 投票カード（既存のもの） */}
        <div style={{ ...styles.card, marginTop: 8 }}>
          <div style={styles.cardContent}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
            >
              <div style={{ fontWeight: 700 }}>PFP投票（単票・30日ロック）</div>
              <button
                style={{
                  ...styles.btn,
                  ...(canVote() && pfpPick
                    ? {}
                    : { opacity: 0.5, cursor: "not-allowed" }),
                }}
                disabled={!canVote() || !pfpPick}
                onClick={() => {
                  const at = Date.now();
                  const list = JSON.parse(
                    localStorage.getItem("pfp_votes") || "[]"
                  );
                  list.unshift({ at, pick: pfpPick });
                  localStorage.setItem("pfp_votes", JSON.stringify(list));
                  setLastVoteAt(at);
                  localStorage.setItem("pfp_last_vote_at", String(at));
                  alert(
                    `「${pfpPick}」に投票しました！ 30日間は再投票できません。`
                  );
                }}
              >
                投票する
              </button>
            </div>

            {!canVote() && (
              <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 6 }}>
                {cooldownInfo()}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {PFP_CANDIDATES.map((name) => (
                <label
                  key={name}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    padding: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <input
                    type="radio"
                    name="pfp"
                    value={name}
                    checked={pfpPick === name}
                    onChange={() => setPfpPick(name)}
                  />
                  {/* 丸い顔アイコン（前ターンで追加済み想定） */}
                  <Avatar name={name} />
                  <span>{name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* 結果カード（Top10） */}
        <div style={{ ...styles.card, marginTop: 8 }}>
          <div style={styles.cardContent}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700 }}>PFP 投票結果（Top 10）</div>
              {results.total > 0 && (
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  投票総数 {results.total}
                </span>
              )}
            </div>

            {/* 表示条件：票がある && （フラグがfalse もしくは 投票済み） */}
            {results.total > 0 &&
            (!SHOW_PFP_RESULTS_ONLY_AFTER_VOTE || hasVoted) ? (
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {results.list.map((row, i) => (
                  <div
                    key={row.name}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "auto 1fr auto",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ width: 28, textAlign: "right" }}>
                      {medal(i)}
                    </div>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Avatar name={row.name} />
                        <div style={{ fontWeight: 600 }}>{row.name}</div>
                      </div>
                      <Bar percent={row.percent} />
                    </div>
                    <div
                      style={{
                        width: 70,
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {row.percent}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>
                {results.total === 0
                  ? "まだ投票がありません。まずは1票入れてください。"
                  : "あなたが投票するとランキングが表示されます。"}
              </div>
            )}
<div style={{ marginTop: 12 }}>
  <Survey config={SURVEY_CONFIG} />
</div>
          </div>
        </div>
      </>
    );
  };

  // レンダリング
  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {activeTab === "ホーム" &&
          (homeView === "list" ? <HomeList /> : <ScoreCard />)}
        {activeTab === "履歴" && <History />}
        {activeTab === "MY PAGE" && <MyPage />}
        {activeTab === "PFP投票" && <PfpVote />}
      </div>

      <div style={styles.tabBar}>
        {["ホーム", "履歴", "MY PAGE", "PFP投票"].map((tab) => (
          <div
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === "ホーム") setHomeView("list");
            }}
            style={{
              ...styles.tabItem,
              ...(activeTab === tab ? styles.tabActive : null),
            }}
          >
            {tab}
          </div>
        ))}
      </div>
    </div>
  );
}