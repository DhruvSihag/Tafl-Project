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
    <div className="node-group">
      <div className="node-row">
        {chars.length === 0 ? (
          <div className="node-empty">∅</div>
        ) : (
          chars.map((char, idx) => (
            <div key={`${char}-${idx}`}
              className="node-circle animate-energetic-bounce"
              style={{
                animationDelay: `${(delayStart + idx) * 0.08}s`,
                border: `1px solid ${SEG[seg].border}`,
                background: SEG[seg].bg,
                color: SEG[seg].text,
              }}
            >{char}</div>
          ))
        )}
      </div>
      <div style={{ width: "100%", height: 2, background: SEG[seg].line, borderRadius: 9999 }} />
      <span className="node-label" style={{ color: SEG[seg].text }}>{label}</span>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#e8e8e8", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes energeticBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-14px) scale(1.05); }
        }
        .animate-energetic-bounce { animation: energeticBounce 2.2s ease-in-out infinite; }
        input[type=range]::-webkit-slider-thumb { accent-color: #7b78e0; }
        select option { background: #1c1c1c; color: #e8e8e8; }

        /* Node styles */
        .node-group { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .node-row { display: flex; gap: 6px; min-height: 70px; align-items: center; }
        .node-circle {
          width: 48px; height: 48px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 20px; font-weight: 700; font-family: monospace; flex-shrink: 0;
        }
        .node-empty {
          width: 48px; height: 48px; border-radius: 50%;
          border: 1px dashed #333; display: flex; align-items: center;
          justify-content: center; font-size: 12px; color: #555;
        }
        .node-label {
          font-size: 10px; font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase; white-space: nowrap; padding: 4px 12px;
          background: #1c1c1c; border: 1px solid #2a2a2a; border-radius: 9999px;
        }

        /* Layout */
        .page-nav {
          position: fixed; top: 16px; left: 16px; right: 16px; z-index: 50;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 28px; height: 56px;
          background: #161616; border: 1px solid #2a2a2a; border-radius: 9999px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.6);
        }
        .nav-title {
          font-size: 15px; font-weight: 800; color: #7b78e0;
          letter-spacing: 0.15em; text-transform: uppercase;
        }
        .page-main {
          padding-top: 96px; padding-bottom: 32px;
          padding-left: 16px; padding-right: 16px;
          display: flex; flex-direction: row; gap: 24px;
          max-width: 1400px; margin: 0 auto; flex-wrap: wrap;
        }
        .sidebar {
          width: 280px; display: flex; flex-direction: column; gap: 16px; flex-shrink: 0;
        }
        .card {
          background: #1c1c1c; border: 1px solid #2a2a2a;
          border-radius: 24px; padding: 24px;
        }
        .card-section { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
        .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(80px, 1fr)); gap: 12px; }
        .decomp-scroll { overflow-x: auto; padding: 12px 0 6px; }
        .decomp-inner {
          display: flex; align-items: flex-end; gap: 40px;
          width: max-content; padding: 0 32px;
        }

        /* Responsive — tablet */
        @media (max-width: 900px) {
          .page-main { flex-direction: column; }
          .sidebar { width: 100%; }
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* Responsive — mobile */
        @media (max-width: 600px) {
          .page-nav { top: 8px; left: 8px; right: 8px; height: 48px; padding: 0 16px; border-radius: 9999px; }
          .nav-title { font-size: 11px; letter-spacing: 0.08em; }
          .page-main { padding-top: 76px; padding-left: 10px; padding-right: 10px; gap: 12px; }
          .card { padding: 16px; border-radius: 16px; }
          .node-circle { width: 36px; height: 36px; font-size: 15px; }
          .node-empty { width: 36px; height: 36px; }
          .node-row { min-height: 52px; gap: 4px; }
          .node-group { gap: 12px; }
          .decomp-inner { gap: 24px; padding: 0 16px; }
          .bottom-grid { grid-template-columns: 1fr; }
          .metrics-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .iter-row { flex-direction: column; gap: 16px; }
          .section-heading { font-size: 16px !important; }
          .section-subtitle { margin-bottom: 20px !important; }
        }

        /* Very small phones */
        @media (max-width: 380px) {
          .nav-title { font-size: 10px; letter-spacing: 0.05em; }
          .node-circle { width: 30px; height: 30px; font-size: 12px; }
          .node-label { font-size: 9px; padding: 3px 8px; }
        }
      `}</style>

      {/* Nav */}
      <nav className="page-nav">
        <span className="nav-title">Pumping Lemma Visualizer</span>
      </nav>

      <main className="page-main">

        {/* Sidebar */}
        <aside className="sidebar">

          {/* Parameters card */}
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h2 style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase",
              color: "#7b78e0", fontWeight: 700, margin: 0 }}>Parameters</h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em",
                color: "#555", fontWeight: 700 }}>Language</label>
              <select value={langKey} onChange={e => setLangKey(e.target.value)} style={{
                background: "#161616", border: "1px solid #2a2a2a", borderRadius: 9999,
                padding: "10px 18px", fontSize: 13, fontWeight: 600, color: "#e8e8e8",
                outline: "none", cursor: "pointer", width: "100%",
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
                style={{
                  background: "#161616", border: "1px solid #2a2a2a", borderRadius: 9999,
                  padding: "10px 18px", fontSize: 13, fontWeight: 700, color: "#e8e8e8",
                  outline: "none", width: "100%", boxSizing: "border-box",
                }} />
            </div>

            <div style={{ background: "#161616", border: "1px solid #2a2a2a", borderRadius: 16, padding: 16 }}>
              <label style={{ fontSize: 10, textTransform: "uppercase", color: "#7b78e0",
                fontWeight: 700, letterSpacing: "0.1em", display: "block", marginBottom: 8 }}>Base String</label>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "monospace",
                color: "#9d9fff", wordBreak: "break-all" }}>{baseStr}</div>
            </div>
          </div>

          {/* Checklist card */}
          <div className="card">
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
                    width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10,
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
        <section className="card-section">

          {/* String decomposition */}
          <div className="card">
            <h1 className="section-heading" style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px", color: "#e8e8e8" }}>
              String Decomposition
            </h1>
            <p className="section-subtitle" style={{ fontSize: 11, color: "#555", textTransform: "uppercase",
              letterSpacing: "0.08em", margin: "0 0 32px", fontWeight: 600 }}>
              Split: <span style={{ color: "#9d9fff" }}>x</span> + <span style={{ color: "#ff9a52" }}>yⁱ</span> + <span style={{ color: "#888" }}>z</span>
            </p>
            <div className="decomp-scroll">
              <div className="decomp-inner">
                <NodeGroup chars={x.split('')} label="X (PREFIX)" seg="x" />
                <NodeGroup chars={pumpedY.split('')} label={`Y${SUPS[i] || i} (PUMPED)`} seg="y" delayStart={x.length} />
                <NodeGroup chars={z.split('')} label="Z (SUFFIX)" seg="z" delayStart={x.length + pumpedY.length} />
              </div>
            </div>
          </div>

          {/* Iteration control */}
          <div className="card">
            <div className="iter-row" style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 16 }}>
                  <h3 style={{ fontWeight: 700, fontSize: 18, margin: 0, color: "#e8e8e8" }}>Iteration Control</h3>
                  <span style={{ color: "#7b78e0", fontWeight: 800, fontSize: 36, lineHeight: 1 }}>i = {i}</span>
                </div>
                <input type="range" min="0" max="5" value={i}
                  onChange={e => setI(parseInt(e.target.value))}
                  style={{ width: "100%", accentColor: "#7b78e0", cursor: "pointer" }} />
              </div>
              <div className="metrics-grid">
                {[
                  { label: "Length", val: pumped.length, ok: null },
                  { label: "P Val", val: p, ok: null },
                  { label: "|xy|≤p", val: isDecompositionValid ? "YES" : "NO", ok: isDecompositionValid },
                  { label: "Valid in L", val: isValid ? "YES" : "NO", ok: isValid },
                ].map((m, idx) => (
                  <div key={idx} style={{
                    padding: "14px 12px", borderRadius: 16, textAlign: "center", fontWeight: 700,
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
          <div className="bottom-grid">

            {/* Dynamic analysis */}
            <div style={{
              background: "#1c1c1c", borderRadius: 24, padding: 28,
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
                    background: "#12102a", padding: "2px 8px", borderRadius: 6,
                    wordBreak: "break-all" }}>'{pumped}'</span>.
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
              background: "#1c1c1c", borderRadius: 24, padding: 28,
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
