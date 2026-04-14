"use client";
import { useState, useEffect } from "react";

const SUPS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

const LANGS = {
  anbn: {
    label: "aⁿbⁿ", cat: "CLASSIC",
    gen: (p) => 'a'.repeat(p) + 'b'.repeat(p),
    decompose: (s, p) => ({ x: 'a', y: 'a'.repeat(Math.min(2, p)), z: s.slice(1 + Math.min(2, p)) }),
    pump: (x, y, z, i) => x + y.repeat(i) + z,
    check: (s) => {
      if (s.length % 2 !== 0) return false;
      const h = s.length / 2;
      return [...s.slice(0, h)].every(c => c === 'a') && [...s.slice(h)].every(c => c === 'b');
    },
    condition: "aⁿbⁿ (equal a's and b's)",
  },
  zeroOne: {
    label: "0ⁿ11ⁿ", cat: "BINARY",
    gen: (p) => '0'.repeat(p) + '1' + '1'.repeat(p),
    decompose: (s, p) => ({ x: '0', y: '0'.repeat(Math.min(2, p)), z: s.slice(1 + Math.min(2, p)) }),
    pump: (x, y, z, i) => x + y.repeat(i) + z,
    check: (s) => {
      if (!/^0+1+$/.test(s)) return false;
      const zeros = (s.match(/0/g) || []).length;
      const ones = (s.match(/1/g) || []).length;
      return ones === zeros + 1;
    },
    condition: "0ⁿ11ⁿ (one more '1' than '0')",
  },
  anbmck: {
    label: "aⁿbᵐcᵏ", cat: "COMPLEX",
    gen: (p) => 'a'.repeat(p) + 'b'.repeat(p) + 'c'.repeat(p + 1),
    decompose: (s, p) => ({ x: 'a', y: 'a'.repeat(Math.min(2, p)), z: s.slice(1 + Math.min(2, p)) }),
    pump: (x, y, z, i) => x + y.repeat(i) + z,
    check: (s) => {
      let ia = 0, ib = 0, ic = 0;
      for (const c of s) { if (c === 'a') ia++; else if (c === 'b') ib++; else if (c === 'c') ic++; }
      return ia === ib || ib <= ic;
    },
    condition: "n=m or m≤k",
  },
  palindrome: {
    label: "wwᴿ (Palindrome)", cat: "PATTERN",
    gen: (p) => 'a'.repeat(p) + 'b' + 'b' + 'a'.repeat(p),
    decompose: (s, p) => ({ x: 'a', y: 'a'.repeat(Math.min(2, p)), z: s.slice(1 + Math.min(2, p)) }),
    pump: (x, y, z, i) => x + y.repeat(i) + z,
    check: (s) => {
      if (s.length % 2 !== 0) return false;
      const h = s.length / 2;
      return s.slice(0, h) === s.slice(h).split('').reverse().join('');
    },
    condition: "wwᴿ (symmetric palindrome)",
  },
  perfectSquare: {
    label: "a^(n²)", cat: "MATH",
    gen: (p) => 'a'.repeat(p * p),
    decompose: (s, p) => ({ x: 'a', y: 'a'.repeat(Math.min(2, p)), z: s.slice(1 + Math.min(2, p)) }),
    pump: (x, y, z, i) => x + y.repeat(i) + z,
    check: (s) => {
      if (!/^a+$/.test(s)) return false;
      const root = Math.sqrt(s.length);
      return root === Math.floor(root);
    },
    condition: "length is a perfect square",
  }
};

const SEG = {
  x: { border: "#3d3a7a", text: "#9d9fff", bg: "#12102a", line: "#3d3a7a" },
  y: { border: "#7c3d10", text: "#ff9a52", bg: "#1f1006", line: "#7c3d10" },
  z: { border: "#2a2a2a", text: "#888",    bg: "#161616", line: "#2a2a2a" },
};

export default function Home() {
  const [langKey, setLangKey] = useState("anbn");
  const [p, setP] = useState(3);
  const [i, setI] = useState(2);
  const [parts, setParts] = useState({ x: "", y: "", z: "", baseStr: "" });

  useEffect(() => {
    const lang = LANGS[langKey];
    const baseStr = lang.gen(p);
    const { x, y, z } = lang.decompose(baseStr, p);
    setParts({ x, y, z, baseStr });
  }, [langKey, p]);

  const lang = LANGS[langKey];
  const { x, y, z, baseStr } = parts;
  const pumpedY = y.repeat(i);
  const pumped = x + pumpedY + z;
  const isValid = lang.check(pumped);
  const initialXYLength = x.length + y.length;
  const isDecompositionValid = initialXYLength <= p && y.length >= 1;

  const NodeGroup = ({ chars, label, seg, delayStart = 0 }) => (
    <div className="flex flex-col items-center gap-5">
      <div className="flex gap-1.5 min-h-[70px] items-center">
        {chars.length === 0 ? (
          <div style={{ width: 48, height: 48, borderRadius: "50%", border: "1px dashed #333",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#555" }}>∅</div>
        ) : (
          chars.map((char, idx) => (
            <div key={`${char}-${idx}`}
              style={{
                animationDelay: `${(delayStart + idx) * 0.08}s`,
                width: 48, height: 48, borderRadius: "50%",
                border: `1px solid ${SEG[seg].border}`,
                background: SEG[seg].bg,
                color: SEG[seg].text,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 700, fontFamily: "monospace",
              }}
              className="animate-energetic-bounce shrink-0"
            >{char}</div>
          ))
        )}
      </div>
      <div style={{ width: "100%", height: 2, background: SEG[seg].line, borderRadius: 9999 }} />
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase",
        whiteSpace: "nowrap", padding: "4px 12px",
        background: "#1c1c1c", border: "1px solid #2a2a2a",
        borderRadius: 9999, color: SEG[seg].text,
      }}>{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#e8e8e8",
      fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes energeticBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-14px) scale(1.05); }
        }
        .animate-energetic-bounce { animation: energeticBounce 2.2s ease-in-out infinite; }
        input[type=range]::-webkit-slider-thumb { accent-color: #7b78e0; }
        select option { background: #1c1c1c; color: #e8e8e8; }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 16, left: 16, right: 16, zIndex: 50,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 28px", height: 56,
        background: "#161616", border: "1px solid #2a2a2a", borderRadius: 9999,
        boxShadow: "0 4px 24px rgba(0,0,0,0.6)",
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: "#7b78e0",
          letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Pumping Lemma Visualizer
        </span>
      </nav>

      <main style={{
        paddingTop: 96, paddingBottom: 32, paddingLeft: 16, paddingRight: 16,
        display: "flex", flexDirection: "row", gap: 24,
        maxWidth: 1400, margin: "0 auto", flexWrap: "wrap",
      }}>

        {/* Sidebar */}
        <aside style={{ width: 280, display: "flex", flexDirection: "column", gap: 16, flexShrink: 0 }}>

          {/* Parameters card */}
          <div style={{ background: "#1c1c1c", border: "1px solid #2a2a2a",
            borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#7b78e0", fontWeight: 700, margin: 0 }}>Parameters</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
                color: "#555", fontWeight: 700 }}>Language</label>
              <select value={langKey} onChange={e => setLangKey(e.target.value)} style={{
                background: "#161616", border: "1px solid #2a2a2a", borderRadius: 9999,
                padding: "10px 18px", fontSize: 13, fontWeight: 600, color: "#e8e8e8",
                outline: "none", cursor: "pointer",
              }}>
                {Object.entries(LANGS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
                color: "#555", fontWeight: 700 }}>Pumping Length (p)</label>
              <input type="number" value={p}
                onChange={e => setP(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 9999,
                  padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#e8e8e8",
                  outline: "none" }} />
            </div>

            <div style={{ background: "#161616", border: "1px solid #2a2a2a",
              borderRadius: 16, padding: 16 }}>
              <label style={{ fontSize: 10, textTransform: "uppercase", color: "#7b78e0",
                fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Base String</label>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace",
                color: "#9d9fff", wordBreak: "break-all" }}>{baseStr}</div>
            </div>
          </div>

          {/* Checklist card */}
          <div style={{ background: "#1c1c1c", border: "1px solid #2a2a2a",
            borderRadius: 24, padding: 24 }}>
            <h2 style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#7b78e0", fontWeight: 700, margin: "0 0 20px" }}>Lemma Checklist</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "|y| ≥ 1 (Non-empty)", ok: true },
                { label: `|xy| ≤ p (${initialXYLength} ≤ ${p})`, ok: isDecompositionValid },
                { label: "xyⁱz ∈ L (Valid String)", ok: isValid },
              ].map((item, idx) => (
                <li key={idx} style={{ display: "flex", alignItems: "center", gap: 10,
                  fontSize: 12, fontWeight: 700, color: item.ok ? "#44d488" : "#ff6060" }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 10,
                    background: item.ok ? "#1a5c36" : "#7c1a1a",
                    color: item.ok ? "#44d488" : "#ff6060",
                    border: `1px solid ${item.ok ? "#2a9a5a" : "#cc3333"}`,
                  }}>{item.ok ? "✓" : "✕"}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main section */}
        <section style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* String decomposition */}
          <div style={{ background: "#1c1c1c", border: "1px solid #2a2a2a",
            borderRadius: 24, padding: 32 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#e8e8e8" }}>
              String Decomposition
            </h1>
            <p style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
              letterSpacing: "0.08em", margin: "0 0 32px", fontWeight: 600 }}>
              Split: <span style={{ color: "#9d9fff" }}>x</span> + <span style={{ color: "#ff9a52" }}>yⁱ</span> + <span style={{ color: "#888" }}>z</span>
            </p>
            <div style={{ overflowX: "auto", padding: "12px 0 6px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 40,
                width: "max-content", padding: "0 32px" }}>
                <NodeGroup chars={x.split('')} label="X (PREFIX)" seg="x" />
                <NodeGroup chars={pumpedY.split('')} label={`Y${SUPS[i] || i} (PUMPED)`} seg="y" delayStart={x.length} />
                <NodeGroup chars={z.split('')} label="Z (SUFFIX)" seg="z" delayStart={x.length + pumpedY.length} />
              </div>
            </div>
          </div>

          {/* Iteration control */}
          <div style={{ background: "#1c1c1c", border: "1px solid #2a2a2a",
            borderRadius: 24, padding: 32 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0, color: "#e8e8e8" }}>Iteration Control</h3>
                  <span style={{ color: "#7b78e0", fontWeight: 800, fontSize: 36, lineHeight: 1 }}>i = {i}</span>
                </div>
                <input type="range" min="0" max="5" value={i}
                  onChange={e => setI(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#7b78e0", cursor: "pointer" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(80px,1fr))", gap: 12 }}>
                {[
                  { label: "Length", val: pumped.length, ok: null },
                  { label: "P Val", val: p, ok: null },
                  { label: "|xy|≤p", val: isDecompositionValid ? "YES" : "NO", ok: isDecompositionValid },
                  { label: "Valid in L", val: isValid ? "YES" : "NO", ok: isValid },
                ].map((m, idx) => (
                  <div key={idx} style={{
                    padding: "14px 16px", borderRadius: 16, textAlign: "center", fontWeight: 700,
                    background: m.ok === null ? "#161616" : m.ok ? "#071510" : "#150707",
                    border: `1px solid ${m.ok === null ? "#2a2a2a" : m.ok ? "#1a5c36" : "#7c1a1a"}`,
                    color: m.ok === null ? "#e8e8e8" : m.ok ? "#44d488" : "#ff6060",
                  }}>
                    <div style={{ fontSize: 9, textTransform: "uppercase",
                      letterSpacing: "0.08em", marginBottom: 4, opacity: 0.7 }}>{m.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom 2 cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

            {/* Dynamic analysis */}
            <div style={{
              background: "#1c1c1c", borderRadius: 24, padding: 32,
              borderLeft: `6px solid ${isValid ? "#1a5c36" : "#7c1a1a"}`,
              border: `1px solid #2a2a2a`,
              display: "flex", flexDirection: "column", justifyContent: "space-between",
            }}>
              <div>
                <h4 style={{ fontWeight: 700, fontSize: 18, margin: "0 0 20px", color: "#e8e8e8" }}>
                  Dynamic Analysis
                </h4>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#888", marginBottom: 12 }}>
                  The resulting string is{" "}
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#9d9fff",
                    background: "#12102a", padding: "2px 8px", borderRadius: 6 }}>'{pumped}'</span>.
                </p>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#888", lineHeight: 1.7 }}>
                  {isValid
                    ? `This string satisfies the condition. The condition for ${lang.label} is currently maintained.`
                    : <span>This string <span style={{ fontWeight: 800, color: "#ff6060",
                        textTransform: "uppercase" }}>Violates</span> the condition. This proves the language is <span style={{ fontWeight: 800, color: "#ff6060", fontSize: 15 }}>NOT regular</span>.</span>}
                </p>
              </div>
              <div style={{ marginTop: 28 }}>
                <span style={{
                  display: "inline-block", padding: "6px 18px", borderRadius: 9999,
                  fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
                  background: isValid ? "#071510" : "#150707",
                  color: isValid ? "#44d488" : "#ff6060",
                  border: `1px solid ${isValid ? "#1a5c36" : "#7c1a1a"}`,
                }}>
                  {isValid ? "Condition Maintained" : "Pumping Lemma Disproved"}
                </span>
              </div>
            </div>

            {/* Formal theorem */}
            <div style={{
              background: "#1c1c1c", borderRadius: 24, padding: 32,
              borderLeft: "6px solid #3d3a7a", border: "1px solid #2a2a2a",
            }}>
              <h4 style={{ fontWeight: 700, fontSize: 18, margin: "0 0 16px", color: "#e8e8e8" }}>
                Formal Theorem
              </h4>
              <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, fontWeight: 500 }}>
                For any regular language <em>L</em>, there exists a pumping length <em>p</em> such that
                any string <em>w</em> in <em>L</em> (where <em>|w| ≥ p</em>) can be divided into{" "}
                <span style={{ fontWeight: 700, color: "#9d9fff" }}>w = xyz</span> satisfying:
              </p>
              <ol style={{ paddingLeft: 18, marginTop: 20, display: "flex",
                flexDirection: "column", gap: 12 }}>
                {[
                  "|y| ≥ 1 (The middle cannot be empty)",
                  "|xy| ≤ p (Prefix and pump fall within p)",
                  "xyⁱz ∈ L for all i ≥ 0 (Can be pumped)",
                ].map((t, idx) => (
                  <li key={idx} style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>
                    <span style={{ color: "#7b78e0", fontSize: 16 }}>{t.split(" ")[0]}</span>{" "}
                    <span>{t.split(" ").slice(1).join(" ")}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}