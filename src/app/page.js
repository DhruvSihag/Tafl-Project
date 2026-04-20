"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const SUPS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'];

// ─── Built-in languages ────────────────────────────────────────────────────
const BUILTIN_LANGS = {
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
      const ones  = (s.match(/1/g) || []).length;
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
  },
};

const SEG = {
  x: { border: "#3d3a7a", text: "#9d9fff", bg: "#12102a", line: "#3d3a7a" },
  y: { border: "#7c3d10", text: "#ff9a52", bg: "#1f1006", line: "#7c3d10" },
  z: { border: "#2a2a2a", text: "#888",    bg: "#161616", line: "#2a2a2a" },
};

// ─── Regex helpers ─────────────────────────────────────────────────────────
function isValidRegex(pattern) {
  if (!pattern.trim()) return false;
  try { new RegExp(`^(?:${pattern})$`); return true; }
  catch { return false; }
}
function makeRegexCheck(pattern) {
  try {
    const re = new RegExp(`^(?:${pattern})$`);
    return (s) => re.test(s);
  } catch { return () => false; }
}
function decomposeGeneric(s, p) {
  const xLen = Math.max(0, Math.min(1, s.length));
  const yLen = Math.max(1, Math.min(2, p - xLen, s.length - xLen));
  return {
    x: s.slice(0, xLen),
    y: s.slice(xLen, xLen + yLen),
    z: s.slice(xLen + yLen),
  };
}

const REGEX_PRESETS = [
  { label: "a*b*",     pattern: "a*b*",     sample: "aaabbb"  },
  { label: "(ab)+",    pattern: "(ab)+",     sample: "ababab"  },
  { label: "a{2,4}b+", pattern: "a{2,4}b+", sample: "aaabb"   },
  { label: "0*1*0*",   pattern: "0*1*0*",   sample: "001100"  },
  { label: "(a|b)+",   pattern: "(a|b)+",   sample: "aabba"   },
];

export default function Home() {
  const [langKey,    setLangKey]    = useState("anbn");
  const [p,          setP]          = useState(3);
  const [i,          setI]          = useState(2);
  const [parts,      setParts]      = useState({ x: "", y: "", z: "", baseStr: "" });

  // Custom string
  const [customMode,  setCustomMode]  = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");

  // Custom regex
  const [regexPattern, setRegexPattern] = useState("a+b+");
  const [regexSample,  setRegexSample]  = useState("aaabbb");
  const [regexPatErr,  setRegexPatErr]  = useState("");
  const [regexSamErr,  setRegexSamErr]  = useState("");
  const [regexApplied, setRegexApplied] = useState({ pattern: "a+b+", sample: "aaabbb" });

  const isCustomRegex = langKey === "customRegex";

  // ── Effective lang ─────────────────────────────────────────────────────
  const getLang = useCallback(() => {
    if (!isCustomRegex) return BUILTIN_LANGS[langKey];
    const { pattern, sample } = regexApplied;
    const checkFn = makeRegexCheck(pattern);
    return {
      label:     `/${pattern}/`,
      cat:       "CUSTOM",
      gen:       () => sample,
      decompose: (s, pp) => decomposeGeneric(s, pp),
      pump:      (x, y, z, ii) => x + y.repeat(ii) + z,
      check:     checkFn,
      condition: `matches /${pattern}/`,
    };
  }, [langKey, regexApplied, isCustomRegex]);

  const lang = getLang();

  // ── Recompute parts ────────────────────────────────────────────────────
  useEffect(() => {
    if (customMode) return;
    const l   = getLang();
    const str = l.gen(p);
    if (!str || str.length < 2) return;
    const { x, y, z } = isCustomRegex
      ? decomposeGeneric(str, p)
      : l.decompose(str, p);
    setParts({ x, y, z, baseStr: str });
  }, [langKey, p, customMode, regexApplied, isCustomRegex]);

  // ── Derived ────────────────────────────────────────────────────────────
  const { x, y, z, baseStr } = parts;
  const pumpedY         = y.repeat(i);
  const pumped          = x + pumpedY + z;
  const isValid         = lang.check(pumped);
  const initialXYLength = x.length + y.length;
  const isDecompValid   = initialXYLength <= p && y.length >= 1;

  // ── Custom string ──────────────────────────────────────────────────────
  const handleToggleCustom = () => {
    if (!customMode) {
      setCustomInput(parts.baseStr);
      setCustomError("");
      const { x, y, z } = decomposeGeneric(parts.baseStr, p);
      setParts(prev => ({ ...prev, x, y, z }));
    } else {
      const l = getLang();
      const str = l.gen(p);
      const { x, y, z } = isCustomRegex ? decomposeGeneric(str, p) : l.decompose(str, p);
      setParts({ x, y, z, baseStr: str });
      setCustomError("");
    }
    setCustomMode(prev => !prev);
  };
  const handleCustomApply = () => {
    const s = customInput.trim();
    if (!s)           { setCustomError("String cannot be empty.");                    return; }
    if (s.length < 2) { setCustomError("String must be at least 2 characters.");     return; }
    if (s.length < p) { setCustomError(`Length (${s.length}) must be ≥ p (${p}).`); return; }
    setCustomError("");
    const { x, y, z } = decomposeGeneric(s, p);
    setParts({ x, y, z, baseStr: s });
  };

  // ── Custom regex ───────────────────────────────────────────────────────
  const handleRegexApply = () => {
    let ok = true;
    if (!isValidRegex(regexPattern)) {
      setRegexPatErr("Invalid regular expression syntax."); ok = false;
    } else { setRegexPatErr(""); }
    const s = regexSample.trim();
    if (!s || s.length < 2) {
      setRegexSamErr("Sample must be at least 2 characters."); ok = false;
    } else if (s.length < p) {
      setRegexSamErr(`Length (${s.length}) must be ≥ p (${p}).`); ok = false;
    } else if (!makeRegexCheck(regexPattern)(s)) {
      setRegexSamErr("Sample does not match the pattern."); ok = false;
    } else { setRegexSamErr(""); }
    if (!ok) return;
    setRegexApplied({ pattern: regexPattern, sample: s });
    setCustomMode(false);
  };

  const patternValid      = isValidRegex(regexPattern);
  const sampleMatchesRx   = patternValid && makeRegexCheck(regexPattern)(regexSample.trim());
  const regexIsApplied    = isCustomRegex
    && regexApplied.pattern === regexPattern
    && regexApplied.sample  === regexSample;

  // ── Node component ─────────────────────────────────────────────────────
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
                border:     `1px solid ${SEG[seg].border}`,
                background: SEG[seg].bg,
                color:      SEG[seg].text,
              }}
            >{char}</div>
          ))
        )}
      </div>
      <div style={{ width: "100%", height: 2, background: SEG[seg].line, borderRadius: 9999 }} />
      <span className="node-label" style={{ color: SEG[seg].text }}>{label}</span>
    </div>
  );

  // ── Pump table ─────────────────────────────────────────────────────────
  const PumpTable = () => (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 5px", fontSize: 12 }}>
        <thead>
          <tr>
            {["i", "xyⁱz", "Length", "In L?"].map((h, idx) => (
              <th key={idx} style={{
                textAlign: idx === 0 ? "center" : "left", paddingBottom: 8,
                color: "#555", fontWeight: 700, fontSize: 10,
                textTransform: "uppercase", letterSpacing: "0.1em",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4].map((ii) => {
            const str = x + y.repeat(ii) + z;
            const ok  = lang.check(str);
            return (
              <tr key={ii}>
                <td style={{ textAlign: "center", paddingRight: 10 }}>
                  <span style={{
                    display: "inline-block", width: 26, height: 26, borderRadius: "50%",
                    background: ii === i ? "#1a1835" : "#161616",
                    border: `1px solid ${ii === i ? "#7b78e0" : "#2a2a2a"}`,
                    color: ii === i ? "#9d9fff" : "#555",
                    fontWeight: 800, fontSize: 12, lineHeight: "26px", textAlign: "center",
                  }}>{ii}</span>
                </td>
                <td style={{ fontFamily: "monospace", color: "#777", fontSize: 11,
                  maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  paddingRight: 8 }}>
                  {str || "∅"}
                </td>
                <td style={{ color: "#555", fontWeight: 600, paddingRight: 8 }}>{str.length}</td>
                <td>
                  <span style={{
                    display: "inline-block", padding: "2px 9px", borderRadius: 9999,
                    fontSize: 10, fontWeight: 800, letterSpacing: "0.05em",
                    background: ok ? "#071510" : "#150707",
                    color:      ok ? "#44d488" : "#ff6060",
                    border: `1px solid ${ok ? "#1a5c36" : "#7c1a1a"}`,
                  }}>{ok ? "YES" : "NO"}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#e8e8e8", fontFamily: "system-ui, sans-serif" }}>
      <style>{`
        @keyframes energeticBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-14px) scale(1.05); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-energetic-bounce { animation: energeticBounce 2.2s ease-in-out infinite; }
        .anim-in { animation: fadeSlideIn 0.22s ease; }
        input[type=range]::-webkit-slider-thumb { accent-color: #7b78e0; }
        select option { background: #1c1c1c; color: #e8e8e8; }

        .node-group { display: flex; flex-direction: column; align-items: center; gap: 20px; }
        .node-row   { display: flex; gap: 6px; min-height: 70px; align-items: center; }
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

        /* Inputs */
        .field-input {
          width: 100%; padding: 10px 14px; border-radius: 12px;
          background: #0d0d0d; border: 1px solid #2a2a2a; color: #e8e8e8;
          font-size: 13px; font-family: monospace; font-weight: 600; outline: none;
          box-sizing: border-box; letter-spacing: 0.04em; transition: border-color 0.15s;
        }
        .field-input:focus   { border-color: #7b78e0; }
        .field-input.valid   { border-color: #1a7a40; }
        .field-input.invalid { border-color: #7c1a1a; }

        .regex-wrap   { position: relative; display: flex; align-items: center; }
        .regex-adorn  { position: absolute; font-size: 15px; color: #555; font-family: monospace;
                        pointer-events: none; top: 50%; transform: translateY(-50%); }
        .regex-adorn-l { left: 12px; }
        .regex-adorn-r { right: 12px; }
        .regex-field {
          width: 100%; padding: 10px 22px; border-radius: 12px;
          background: #0d0d0d; border: 1px solid #2a2a2a; color: #c4c2ff;
          font-size: 13px; font-family: monospace; font-weight: 700; outline: none;
          box-sizing: border-box; letter-spacing: 0.05em; transition: border-color 0.15s;
        }
        .regex-field:focus   { border-color: #7b78e0; }
        .regex-field.valid   { border-color: #1a7a40; }
        .regex-field.invalid { border-color: #7c1a1a; }

        .err-msg { font-size: 11px; color: #ff6060; margin: 5px 0 0; font-weight: 600; }
        .ok-msg  { font-size: 11px; color: #44d488; margin: 5px 0 0; font-weight: 600; }
        .section-lbl {
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em;
          color: #555; font-weight: 700; display: block; margin-bottom: 6px;
        }

        /* Buttons */
        .btn {
          padding: 10px 18px; border-radius: 9999px; width: 100%;
          font-size: 11px; font-weight: 800; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer; outline: none;
          transition: all 0.16s ease; border: 1px solid; display: block;
        }
        .btn-primary { background: #12102a; border-color: #7b78e0; color: #9d9fff; }
        .btn-primary:hover  { background: #1a1835; color: #c4c2ff; }
        .btn-primary:active { transform: scale(0.97); }
        .btn-ghost   { background: #161616; border-color: #2a2a2a; color: #666; }
        .btn-ghost:hover    { border-color: #7b78e0; color: #9d9fff; }
        .btn-danger  { background: #150707; border-color: #7c1a1a; color: #ff6060; }
        .btn-danger:hover   { background: #200a0a; }

        .preset-pill {
          padding: 4px 11px; border-radius: 9999px; font-size: 10px; font-weight: 700;
          font-family: monospace; cursor: pointer; outline: none; letter-spacing: 0.04em;
          background: #161616; border: 1px solid #2a2a2a; color: #777;
          transition: all 0.14s ease;
        }
        .preset-pill:hover { border-color: #7b78e0; color: #9d9fff; background: #1a1835; }

        .badge {
          display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
          border-radius: 9999px; font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
        }
        .badge-blue   { background: #1a1835; border: 1px solid #3d3a7a; color: #9d9fff; }
        .badge-green  { background: #071510; border: 1px solid #1a5c36; color: #44d488; }
        .badge-orange { background: #1f1006; border: 1px solid #7c3d10; color: #ff9a52; }
        .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .dot-green  { background: #44d488; }
        .dot-orange { background: #ff9a52; }
        .dot-blue   { background: #9d9fff; }

        /* Layout */
        .page-nav {
          position: fixed; top: 16px; left: 16px; right: 16px; z-index: 50;
          display: flex; justify-content: space-between; align-items: center;
          padding: 0 28px; height: 56px;
          background: #161616; border: 1px solid #2a2a2a; border-radius: 9999px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.6);
        }
        .nav-title { font-size: 15px; font-weight: 800; color: #7b78e0;
          letter-spacing: 0.15em; text-transform: uppercase; }
        .page-main {
          padding-top: 96px; padding-bottom: 32px;
          padding-left: 16px; padding-right: 16px;
          display: flex; flex-direction: row; gap: 24px;
          max-width: 1400px; margin: 0 auto; flex-wrap: wrap;
        }
        .sidebar { width: 300px; display: flex; flex-direction: column; gap: 16px; flex-shrink: 0; }
        .card { background: #1c1c1c; border: 1px solid #2a2a2a; border-radius: 24px; padding: 24px; }
        .card-section { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
        .bottom-grid  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, minmax(80px, 1fr)); gap: 12px; }
        .decomp-scroll { overflow-x: auto; padding: 12px 0 6px; }
        .decomp-inner  { display: flex; align-items: flex-end; gap: 40px; width: max-content; padding: 0 32px; }
        .divider { height: 1px; background: #2a2a2a; border-radius: 9999px; }

        @media (max-width: 900px) {
          .page-main { flex-direction: column; }
          .sidebar { width: 100%; }
          .metrics-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .page-nav { top:8px; left:8px; right:8px; height:48px; padding:0 16px; }
          .nav-title { font-size:11px; letter-spacing:0.08em; }
          .page-main { padding-top:76px; padding-left:10px; padding-right:10px; gap:12px; }
          .card { padding:16px; border-radius:16px; }
          .node-circle { width:36px; height:36px; font-size:15px; }
          .node-empty  { width:36px; height:36px; }
          .node-row    { min-height:52px; gap:4px; }
          .node-group  { gap:12px; }
          .decomp-inner { gap:24px; padding:0 16px; }
          .bottom-grid  { grid-template-columns:1fr; }
          .metrics-grid { grid-template-columns:repeat(2,1fr); gap:8px; }
          .iter-row { flex-direction:column; gap:16px; }
        }
        @media (max-width: 380px) {
          .nav-title   { font-size:10px; letter-spacing:0.05em; }
          .node-circle { width:30px; height:30px; font-size:12px; }
          .node-label  { font-size:9px; padding:3px 8px; }
        }
      `}</style>

      {/* ── Nav ── */}
      <nav className="page-nav">
        <span className="nav-title">Pumping Lemma Visualizer</span>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {isCustomRegex && (
            <span className="badge badge-orange">
              <span className="dot dot-orange" />
              /{regexApplied.pattern}/
            </span>
          )}
          {customMode && (
            <span className="badge badge-blue">
              <span className="dot dot-blue" />Custom String
            </span>
          )}
        </div>
      </nav>

      <main className="page-main">

        {/* ══════════════════════════ SIDEBAR ══════════════════════════ */}
        <aside className="sidebar">

          {/* Parameters */}
          <div className="card" style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <h2 style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase",
              color:"#7b78e0", fontWeight:700, margin:0 }}>Parameters</h2>

            <div>
              <label className="section-lbl">Language</label>
              <select value={langKey}
                onChange={e => { setLangKey(e.target.value); setCustomMode(false); setCustomError(""); }}
                style={{ background:"#161616", border:"1px solid #2a2a2a", borderRadius:9999,
                  padding:"10px 18px", fontSize:13, fontWeight:600, color:"#e8e8e8",
                  outline:"none", cursor:"pointer", width:"100%" }}>
                {Object.entries(BUILTIN_LANGS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
                <option value="customRegex">✎  Custom Regex…</option>
              </select>
            </div>

            <div>
              <label className="section-lbl">Pumping Length (p)</label>
              <input type="number" value={p}
                onChange={e => setP(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ background:"#161616", border:"1px solid #2a2a2a", borderRadius:9999,
                  padding:"10px 18px", fontSize:13, fontWeight:700, color:"#e8e8e8",
                  outline:"none", width:"100%", boxSizing:"border-box" }} />
            </div>

            <div style={{ background:"#161616", border:"1px solid #2a2a2a", borderRadius:16, padding:16 }}>
              <label style={{ fontSize:10, textTransform:"uppercase", color:"#7b78e0",
                fontWeight:700, letterSpacing:"0.1em", display:"block", marginBottom:8 }}>Base String</label>
              <div style={{ fontSize:16, fontWeight:700, fontFamily:"monospace",
                color:"#9d9fff", wordBreak:"break-all" }}>{baseStr || "—"}</div>
            </div>
          </div>

          {/* ── Custom Regex Card ── */}
          <div className="card" style={{
            display:"flex", flexDirection:"column", gap:16,
            border: isCustomRegex ? "1px solid #7c3d10" : "1px solid #2a2a2a",
            transition: "border-color 0.2s",
          }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <h2 style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase",
                color: isCustomRegex ? "#ff9a52" : "#7b78e0", fontWeight:700, margin:0,
                transition:"color 0.2s" }}>Custom Regex</h2>
              {isCustomRegex && regexIsApplied && (
                <span className="badge badge-green">
                  <span className="dot dot-green" />Applied
                </span>
              )}
            </div>

            {/* Pattern */}
            <div>
              <label className="section-lbl">Pattern</label>
              <div className="regex-wrap">
                <span className="regex-adorn regex-adorn-l">/</span>
                <input
                  type="text"
                  value={regexPattern}
                  placeholder="a+b+"
                  onChange={e => { setRegexPattern(e.target.value); setRegexPatErr(""); }}
                  onKeyDown={e => { if (e.key === "Enter") handleRegexApply(); }}
                  className={`regex-field${
                    regexPattern ? (patternValid ? " valid" : " invalid") : ""
                  }`}
                />
                <span className="regex-adorn regex-adorn-r">/</span>
              </div>
              {regexPatErr
                ? <p className="err-msg">⚠ {regexPatErr}</p>
                : regexPattern && (
                  <p className={patternValid ? "ok-msg" : "err-msg"}>
                    {patternValid ? "✓ Valid syntax" : "✕ Invalid regex syntax"}
                  </p>
                )
              }
            </div>

            {/* Sample string */}
            <div>
              <label className="section-lbl">
                Sample String&nbsp;
                <span style={{ color:"#333", fontWeight:600 }}>(must match · length ≥ p)</span>
              </label>
              <input
                type="text"
                value={regexSample}
                placeholder="e.g. aaabbb"
                onChange={e => { setRegexSample(e.target.value); setRegexSamErr(""); }}
                onKeyDown={e => { if (e.key === "Enter") handleRegexApply(); }}
                className={`field-input${
                  regexSample && patternValid
                    ? sampleMatchesRx ? " valid" : " invalid"
                    : ""
                }`}
              />
              {regexSamErr
                ? <p className="err-msg">⚠ {regexSamErr}</p>
                : regexSample && patternValid && (
                  <p className={sampleMatchesRx ? "ok-msg" : "err-msg"}>
                    {sampleMatchesRx ? "✓ Matches pattern" : "✕ Does not match"}
                  </p>
                )
              }
            </div>

            {/* Presets */}
            <div>
              <label className="section-lbl">Quick Presets</label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {REGEX_PRESETS.map(pr => (
                  <button key={pr.label} className="preset-pill"
                    onClick={() => {
                      setRegexPattern(pr.pattern);
                      setRegexSample(pr.sample);
                      setRegexPatErr("");
                      setRegexSamErr("");
                    }}>
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleRegexApply}>
              ↵ Apply Regex
            </button>

            {/* Pump preview table — only when regex is active */}
            {isCustomRegex && parts.baseStr && (
              <div className="anim-in" style={{ borderTop:"1px solid #2a2a2a", paddingTop:16 }}>
                <label className="section-lbl" style={{ marginBottom:10 }}>Pump Preview (i = 0–4)</label>
                <PumpTable />
              </div>
            )}
          </div>

          {/* ── Custom String Box ── */}
          <div className="card" style={{
            display:"flex", flexDirection:"column", gap:16,
            border: customMode ? "1px solid #3d3a7a" : "1px solid #2a2a2a",
            transition:"border-color 0.2s",
          }}>
            <h2 style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase",
              color: customMode ? "#9d9fff" : "#7b78e0", fontWeight:700, margin:0 }}>
              Custom Example
            </h2>
            <p style={{ fontSize:11, color:"#555", margin:0, lineHeight:1.6, fontWeight:500 }}>
              Test any specific string against the selected language.
            </p>
            <button className={`btn ${customMode ? "btn-danger" : "btn-ghost"}`}
              onClick={handleToggleCustom}>
              {customMode ? "✕  Disable Custom Input" : "✎  Enable Custom Input"}
            </button>

            {customMode && (
              <div className="anim-in" style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div className="divider" />
                <div>
                  <label className="section-lbl">Your String</label>
                  <input
                    type="text"
                    value={customInput}
                    onChange={e => { setCustomInput(e.target.value); setCustomError(""); }}
                    onKeyDown={e => { if (e.key === "Enter") handleCustomApply(); }}
                    placeholder={`min length ${p}`}
                    className={`field-input${customError ? " invalid" : ""}`}
                    spellCheck={false}
                    autoComplete="off"
                  />
                  {customError && <p className="err-msg">⚠ {customError}</p>}
                </div>
                <div>
                  <label className="section-lbl">Quick Fill</label>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {[
                      { label:"Valid",   val: lang.gen(p) },
                      { label:"Longer",  val: lang.gen(p + 2) },
                      { label:"Invalid", val:"a".repeat(p + 1) + "b".repeat(p > 1 ? p - 1 : p) },
                    ].map(s => (
                      <button key={s.label} className="preset-pill"
                        onClick={() => { setCustomInput(s.val); setCustomError(""); }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleCustomApply}>
                  ↵ Apply String
                </button>
                {customInput.trim() && !customError && (
                  <div style={{
                    padding:"10px 14px", borderRadius:12, fontSize:11, fontWeight:700,
                    background: lang.check(customInput.trim()) ? "#071510" : "#150707",
                    border: `1px solid ${lang.check(customInput.trim()) ? "#1a5c36" : "#7c1a1a"}`,
                    color:  lang.check(customInput.trim()) ? "#44d488" : "#ff6060",
                  }}>
                    Raw string: {lang.check(customInput.trim()) ? "✓ valid" : "✕ invalid"} in {lang.label}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Checklist */}
          <div className="card">
            <h2 style={{ fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase",
              color:"#7b78e0", fontWeight:700, margin:"0 0 20px" }}>Lemma Checklist</h2>
            <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:16 }}>
              {[
                { label:"|y| ≥ 1 (Non-empty)",                   ok: true },
                { label:`|xy| ≤ p (${initialXYLength} ≤ ${p})`, ok: isDecompValid },
                { label:"xyⁱz ∈ L (Valid String)",               ok: isValid },
              ].map((item, idx) => (
                <li key={idx} style={{ display:"flex", alignItems:"center", gap:10,
                  fontSize:12, fontWeight:700, color: item.ok ? "#44d488" : "#ff6060" }}>
                  <span style={{
                    width:20, height:20, borderRadius:"50%", flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:10,
                    background: item.ok ? "#1a5c36" : "#7c1a1a",
                    color:      item.ok ? "#44d488" : "#ff6060",
                    border: `1px solid ${item.ok ? "#2a9a5a" : "#cc3333"}`,
                  }}>{item.ok ? "✓" : "✕"}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ══════════════════════════ MAIN ══════════════════════════ */}
        <section className="card-section">

          {/* Decomposition */}
          <div className="card">
            <h1 style={{ fontSize:20, fontWeight:800, margin:"0 0 4px", color:"#e8e8e8" }}>
              String Decomposition
            </h1>
            <p style={{ fontSize:11, color:"#555", textTransform:"uppercase",
              letterSpacing:"0.08em", margin:"0 0 32px", fontWeight:600 }}>
              Split:&nbsp;
              <span style={{ color:"#9d9fff" }}>x</span>&nbsp;+&nbsp;
              <span style={{ color:"#ff9a52" }}>yⁱ</span>&nbsp;+&nbsp;
              <span style={{ color:"#888"    }}>z</span>
              {isCustomRegex && (
                <span style={{ marginLeft:10, color:"#7c3d10", fontWeight:800 }}>
                  · /{regexApplied.pattern}/
                </span>
              )}
              {customMode && (
                <span style={{ marginLeft:10, color:"#3d3a7a", fontWeight:800 }}>· CUSTOM STRING</span>
              )}
            </p>
            <div className="decomp-scroll">
              <div className="decomp-inner">
                <NodeGroup chars={x.split('')}       label="X (PREFIX)"                 seg="x" />
                <NodeGroup chars={pumpedY.split('')} label={`Y${SUPS[i] ?? i} (PUMPED)`} seg="y" delayStart={x.length} />
                <NodeGroup chars={z.split('')}       label="Z (SUFFIX)"                 seg="z" delayStart={x.length + pumpedY.length} />
              </div>
            </div>
          </div>

          {/* Iteration */}
          <div className="card">
            <div className="iter-row" style={{ display:"flex", flexWrap:"wrap", gap:32, alignItems:"center" }}>
              <div style={{ flex:1, minWidth:180 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                  <h3 style={{ fontWeight:700, fontSize:18, margin:0, color:"#e8e8e8" }}>Iteration Control</h3>
                  <span style={{ color:"#7b78e0", fontWeight:800, fontSize:36, lineHeight:1 }}>i = {i}</span>
                </div>
                <input type="range" min="0" max="5" value={i}
                  onChange={e => setI(parseInt(e.target.value))}
                  style={{ width:"100%", accentColor:"#7b78e0", cursor:"pointer" }} />
              </div>
              <div className="metrics-grid">
                {[
                  { label:"Length",    val:pumped.length,           ok:null },
                  { label:"P Val",     val:p,                        ok:null },
                  { label:"|xy|≤p",    val:isDecompValid?"YES":"NO", ok:isDecompValid },
                  { label:"Valid in L", val:isValid?"YES":"NO",      ok:isValid },
                ].map((m, idx) => (
                  <div key={idx} style={{
                    padding:"14px 12px", borderRadius:16, textAlign:"center", fontWeight:700,
                    background: m.ok===null?"#161616":m.ok?"#071510":"#150707",
                    border: `1px solid ${m.ok===null?"#2a2a2a":m.ok?"#1a5c36":"#7c1a1a"}`,
                    color:  m.ok===null?"#e8e8e8":m.ok?"#44d488":"#ff6060",
                  }}>
                    <div style={{ fontSize:9, textTransform:"uppercase", letterSpacing:"0.08em",
                      marginBottom:4, opacity:0.7 }}>{m.label}</div>
                    <div style={{ fontSize:20, fontWeight:800 }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom row */}
          <div className="bottom-grid">

            <div style={{
              background:"#1c1c1c", borderRadius:24, padding:28,
              borderLeft:`6px solid ${isValid?"#1a5c36":"#7c1a1a"}`,
              border:"1px solid #2a2a2a",
              display:"flex", flexDirection:"column", justifyContent:"space-between",
            }}>
              <div>
                <h4 style={{ fontWeight:700, fontSize:18, margin:"0 0 20px", color:"#e8e8e8" }}>
                  Dynamic Analysis
                </h4>
                <p style={{ fontSize:13, fontWeight:500, color:"#888", marginBottom:12 }}>
                  The resulting string is{" "}
                  <span style={{ fontFamily:"monospace", fontWeight:700, color:"#9d9fff",
                    background:"#12102a", padding:"2px 8px", borderRadius:6, wordBreak:"break-all" }}>
                    '{pumped}'
                  </span>.
                </p>
                <p style={{ fontSize:13, fontWeight:500, color:"#888", lineHeight:1.7 }}>
                  {isValid
                    ? `This string satisfies the condition. The condition for ${lang.label} is currently maintained.`
                    : <span>
                        This string{" "}
                        <span style={{ fontWeight:800, color:"#ff6060", textTransform:"uppercase" }}>Violates</span>
                        {" "}the condition.
                        {!isCustomRegex && (
                          <span> This proves the language is{" "}
                            <span style={{ fontWeight:800, color:"#ff6060", fontSize:15 }}>NOT regular</span>.
                          </span>
                        )}
                      </span>
                  }
                </p>
              </div>
              <div style={{ marginTop:28 }}>
                <span style={{
                  display:"inline-block", padding:"6px 18px", borderRadius:9999,
                  fontSize:10, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.1em",
                  background: isValid?"#071510":"#150707",
                  color:      isValid?"#44d488":"#ff6060",
                  border: `1px solid ${isValid?"#1a5c36":"#7c1a1a"}`,
                }}>
                  {isValid ? "Condition Maintained" : "Pumping Lemma Disproved"}
                </span>
              </div>
            </div>

            <div style={{
              background:"#1c1c1c", borderRadius:24, padding:28,
              borderLeft:"6px solid #3d3a7a", border:"1px solid #2a2a2a",
            }}>
              <h4 style={{ fontWeight:700, fontSize:18, margin:"0 0 16px", color:"#e8e8e8" }}>
                Formal Theorem
              </h4>
              <p style={{ fontSize:13, color:"#888", lineHeight:1.7, fontWeight:500 }}>
                For any regular language <em>L</em>, there exists a pumping length <em>p</em> such that
                any string <em>w</em> in <em>L</em> (where <em>|w| ≥ p</em>) can be divided into{" "}
                <span style={{ fontWeight:700, color:"#9d9fff" }}>w = xyz</span> satisfying:
              </p>
              <ol style={{ paddingLeft:18, marginTop:20, display:"flex", flexDirection:"column", gap:12 }}>
                {[
                  "|y| ≥ 1 (The middle cannot be empty)",
                  "|xy| ≤ p (Prefix and pump fall within p)",
                  "xyⁱz ∈ L for all i ≥ 0 (Can be pumped)",
                ].map((t, idx) => (
                  <li key={idx} style={{ fontSize:13, fontWeight:700, color:"#888" }}>
                    <span style={{ color:"#7b78e0", fontSize:16 }}>{t.split(" ")[0]}</span>{" "}
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
