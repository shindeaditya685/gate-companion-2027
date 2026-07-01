"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { X } from "lucide-react";

function toRad(deg: number) {
  return deg * (Math.PI / 180);
}
function toDeg(rad: number) {
  return rad * (180 / Math.PI);
}

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) return NaN;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** Balance any unclosed parentheses so the user doesn't have to close them manually. */
function autoClose(expr: string): string {
  const opens = (expr.match(/\(/g) || []).length;
  const closes = (expr.match(/\)/g) || []).length;
  return expr + ")".repeat(Math.max(0, opens - closes));
}

/** Catch empty function arguments and trailing operators before JS eval. */
function validateJS(e: string): string {
  // Math.pow(10,) is a syntax error — plug a zero
  e = e.replace(/,\s*\)/g, ",0)");
  // () with nothing inside → (0)
  e = e.replace(/\(\s*\)/g, "(0)");
  // Trailing binary operator (e.g. "5 + " → "5")
  e = e.replace(/[+\-*/%^]\s*$/, "");
  return e;
}

/** Convert the human-readable display expression into a safely evaluable JS expression. */
function transformExpr(expr: string, deg: boolean): string {
  let e = autoClose(expr);

  // Display symbols -> JS operators
  e = e.replace(/×/g, "*");
  e = e.replace(/÷/g, "/");
  e = e.replace(/−/g, "-");
  e = e.replace(/\^/g, "**");
  e = e.replace(/ mod /g, "%");

  // Constants (standalone tokens only, so "5e3" style exponents are untouched)
  e = e.replace(/π/g, "Math.PI");
  e = e.replace(/\be\b/g, "Math.E");

  // Degree-aware trig (mapped to helper fns provided in the eval scope)
  if (deg) {
    e = e.replace(/\bsin⁻¹\(/g, "asinD(");
    e = e.replace(/\bcos⁻¹\(/g, "acosD(");
    e = e.replace(/\btan⁻¹\(/g, "atanD(");
    e = e.replace(/\bsin\(/g, "sinD(");
    e = e.replace(/\bcos\(/g, "cosD(");
    e = e.replace(/\btan\(/g, "tanD(");
  } else {
    e = e.replace(/\bsin⁻¹\(/g, "Math.asin(");
    e = e.replace(/\bcos⁻¹\(/g, "Math.acos(");
    e = e.replace(/\btan⁻¹\(/g, "Math.atan(");
    e = e.replace(/\bsin\(/g, "Math.sin(");
    e = e.replace(/\bcos\(/g, "Math.cos(");
    e = e.replace(/\btan\(/g, "Math.tan(");
  }

  // Hyperbolic + inverse hyperbolic
  e = e.replace(/sinh⁻¹\(/g, "Math.asinh(");
  e = e.replace(/cosh⁻¹\(/g, "Math.acosh(");
  e = e.replace(/tanh⁻¹\(/g, "Math.atanh(");
  e = e.replace(/sinh\(/g, "Math.sinh(");
  e = e.replace(/cosh\(/g, "Math.cosh(");
  e = e.replace(/tanh\(/g, "Math.tanh(");

  // Logs / roots / misc unary functions
  e = e.replace(/log₂\(/g, "Math.log2(");
  e = e.replace(/log\(/g, "Math.log10(");
  e = e.replace(/ln\(/g, "Math.log(");
  e = e.replace(/√\(/g, "Math.sqrt(");
  e = e.replace(/∛\(/g, "Math.cbrt(");
  e = e.replace(/\|x\|\(/g, "Math.abs(");
  e = e.replace(/eˣ\(/g, "Math.exp(");
  e = e.replace(/10ˣ\(/g, "Math.pow(10,");

  // Postfix operators: apply to the trailing number
  e = e.replace(/(\d+(?:\.\d+)?)!/g, "factorial($1)");
  e = e.replace(/([\d.]+)²/g, "Math.pow($1,2)");
  e = e.replace(/([\d.]+)³/g, "Math.pow($1,3)");

  return validateJS(e);
}

type CalcButton = {
  label: string;
  action: string;
  wide?: number;
  variant?: "num" | "op" | "func" | "mem" | "eq" | "danger";
  sub?: string;
  sup?: string;
};

// Left function block — mirrors the sinh/cosh/tanh ... sin⁻¹/cos⁻¹/tan⁻¹ layout
const LEFT_ROWS: CalcButton[][] = [
  [
    { label: "sinh", action: "sinh", variant: "func" },
    { label: "cosh", action: "cosh", variant: "func" },
    { label: "tanh", action: "tanh", variant: "func" },
    { label: "Exp", action: "exp", variant: "func" },
    { label: "(", action: "(", variant: "op" },
    { label: ")", action: ")", variant: "op" },
  ],
  [
    { label: "sinh⁻¹", action: "asinh", variant: "func" },
    { label: "cosh⁻¹", action: "acosh", variant: "func" },
    { label: "tanh⁻¹", action: "atanh", variant: "func" },
    { label: "log₂x", action: "log2", variant: "func" },
    { label: "ln", action: "ln", variant: "func" },
    { label: "log", action: "log", variant: "func" },
  ],
  [
    { label: "π", action: "pi", variant: "func" },
    { label: "e", action: "econst", variant: "func" },
    { label: "n!", action: "fact", variant: "func" },
    { label: "logy x", action: "logy", variant: "func" },
    { label: "eˣ", action: "expfn", variant: "func" },
    { label: "10ˣ", action: "pow10", variant: "func" },
  ],
  [
    { label: "sin", action: "sin", variant: "func" },
    { label: "cos", action: "cos", variant: "func" },
    { label: "tan", action: "tan", variant: "func" },
    { label: "x^y", action: "pow", variant: "func" },
    { label: "x³", action: "cube", variant: "func" },
    { label: "x²", action: "sq", variant: "func" },
  ],
  [
    { label: "sin⁻¹", action: "asin", variant: "func" },
    { label: "cos⁻¹", action: "acos", variant: "func" },
    { label: "tan⁻¹", action: "atan", variant: "func" },
    { label: "∛x", action: "cbrt", variant: "func" },
    { label: "y√x", action: "yroot", variant: "func" },
    { label: "|x|", action: "abs", variant: "func" },
  ],
];

// Right numeric block
const RIGHT_ROWS: CalcButton[][] = [
  [
    { label: "←", action: "backspace", variant: "danger" },
    { label: "C", action: "clear", variant: "danger" },
    { label: "+/-", action: "negate", variant: "danger" },
    { label: "√", action: "sqrt", variant: "func" },
  ],
  [
    { label: "7", action: "7", variant: "num" },
    { label: "8", action: "8", variant: "num" },
    { label: "9", action: "9", variant: "num" },
    { label: "÷", action: "/", variant: "op" },
  ],
  [
    { label: "4", action: "4", variant: "num" },
    { label: "5", action: "5", variant: "num" },
    { label: "6", action: "6", variant: "num" },
    { label: "×", action: "*", variant: "op" },
  ],
  [
    { label: "1", action: "1", variant: "num" },
    { label: "2", action: "2", variant: "num" },
    { label: "3", action: "3", variant: "num" },
    { label: "−", action: "-", variant: "op" },
  ],
  [
    { label: "0", action: "0", variant: "num", wide: 2 },
    { label: ".", action: ".", variant: "num" },
    { label: "+", action: "+", variant: "op" },
  ],
];

const PENDING_LABEL: Record<string, string> = {
  pow: "x^y",
  logy: "logy x",
  yroot: "y√x",
};

export function GateCalculator({ onClose }: { onClose: () => void }) {
  const [expr, setExpr] = useState("0");
  const [result, setResult] = useState<string | null>(null);
  const [memory, setMemory] = useState(0);
  const [degMode, setDegMode] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pendingOp, setPendingOp] = useState<"pow" | "logy" | "yroot" | null>(
    null,
  );
  const [pendingBase, setPendingBase] = useState<number | null>(null);

  const exprRef = useRef(expr);
  exprRef.current = expr;
  const justEvalRef = useRef(false);

  const evaluate = useCallback((raw: string, deg: boolean): number => {
    const transformed = transformExpr(raw, deg);
    const fn = new Function(
      "Math",
      "factorial",
      "toRad",
      "toDeg",
      "sinD",
      "cosD",
      "tanD",
      "asinD",
      "acosD",
      "atanD",
      `return (${transformed});`,
    );
    const sinD = (x: number) => Math.sin(toRad(x));
    const cosD = (x: number) => Math.cos(toRad(x));
    const tanD = (x: number) => Math.tan(toRad(x));
    const asinD = (x: number) => toDeg(Math.asin(x));
    const acosD = (x: number) => toDeg(Math.acos(x));
    const atanD = (x: number) => toDeg(Math.atan(x));
    return fn(
      Math,
      factorial,
      toRad,
      toDeg,
      sinD,
      cosD,
      tanD,
      asinD,
      acosD,
      atanD,
    );
  }, []);

  const append = useCallback((s: string) => {
    setExpr((prev) => {
      if (justEvalRef.current && !isNaN(Number(s))) {
        justEvalRef.current = false;
        return s;
      }
      if (prev === "0" && s !== "." && !isNaN(Number(s))) return s;
      return prev + s;
    });
    setResult(null);
    setHasError(false);
    if (!isNaN(Number(s))) justEvalRef.current = false;
  }, []);

  const prefixFn = useCallback((display: string) => {
    setExpr((prev) => {
      if (justEvalRef.current) {
        justEvalRef.current = false;
        return display;
      }
      const base = prev === "0" ? "" : prev;
      return base + display;
    });
    setResult(null);
    setHasError(false);
  }, []);

  const postfixOp = useCallback((transform: (last: string) => string) => {
    setExpr((prev) => {
      const match = prev.match(/([\d.]+)$/);
      if (!match) return prev;
      const before = prev.slice(0, -match[1].length);
      return before + transform(match[1]);
    });
    setResult(null);
    setHasError(false);
  }, []);

  const startPending = useCallback(
    (op: "pow" | "logy" | "yroot") => {
      try {
        const base = evaluate(exprRef.current, degMode);
        if (!isFinite(base) || isNaN(base)) {
          setHasError(true);
          setResult("Error");
          return;
        }
        setPendingBase(base);
        setPendingOp(op);
        setExpr("0");
        justEvalRef.current = false;
        setResult(null);
        setHasError(false);
      } catch {
        setHasError(true);
        setResult("Error");
      }
    },
    [evaluate, degMode],
  );

  const handleAction = useCallback(
    (action: string) => {
      if (hasError && action !== "clear") return;

      switch (action) {
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case ".":
          append(action);
          break;
        case "+":
        case "-":
        case "*":
        case "/":
        case "%":
          append(` ${action} `);
          break;
        case "(":
          append("(");
          break;
        case ")":
          append(")");
          break;
        case "pi":
          prefixFn("π");
          break;
        case "econst":
          prefixFn("e");
          break;
        case "sin":
          prefixFn("sin(");
          break;
        case "cos":
          prefixFn("cos(");
          break;
        case "tan":
          prefixFn("tan(");
          break;
        case "asin":
          prefixFn("sin⁻¹(");
          break;
        case "acos":
          prefixFn("cos⁻¹(");
          break;
        case "atan":
          prefixFn("tan⁻¹(");
          break;
        case "sinh":
          prefixFn("sinh(");
          break;
        case "cosh":
          prefixFn("cosh(");
          break;
        case "tanh":
          prefixFn("tanh(");
          break;
        case "asinh":
          prefixFn("sinh⁻¹(");
          break;
        case "acosh":
          prefixFn("cosh⁻¹(");
          break;
        case "atanh":
          prefixFn("tanh⁻¹(");
          break;
        case "log":
          prefixFn("log(");
          break;
        case "ln":
          prefixFn("ln(");
          break;
        case "log2":
          prefixFn("log₂(");
          break;
        case "sqrt":
          prefixFn("√(");
          break;
        case "cbrt":
          prefixFn("∛(");
          break;
        case "expfn":
          prefixFn("eˣ(");
          break;
        case "pow10":
          prefixFn("10ˣ(");
          break;
        case "abs":
          prefixFn("|x|(");
          break;
        case "exp":
          append("e");
          break; // scientific-notation entry, e.g. 5e3
        case "mod":
          append(" mod ");
          break;
        case "pow":
          startPending("pow");
          break;
        case "logy":
          startPending("logy");
          break;
        case "yroot":
          startPending("yroot");
          break;
        case "sq":
          postfixOp((n) => `${n}²`);
          break;
        case "cube":
          postfixOp((n) => `${n}³`);
          break;
        case "fact":
          postfixOp((n) => `${n}!`);
          break;
        case "negate": {
          setExpr((prev) => {
            if (prev === "0") return prev;
            const match = prev.match(/([\d.]+)$/);
            if (!match) return prev;
            const before = prev.slice(0, -match[1].length);
            const num = parseFloat(match[1]);
            return before + String(-num);
          });
          break;
        }
        case "clear":
          setExpr("0");
          setResult(null);
          setHasError(false);
          setPendingOp(null);
          setPendingBase(null);
          break;
        case "backspace":
          setExpr((prev) => {
            if (prev.length <= 1) return "0";
            return prev.trim().slice(0, -1).trim() || "0";
          });
          setResult(null);
          setHasError(false);
          break;
        case "mc":
          setMemory(0);
          break;
        case "mr":
          append(String(memory));
          break;
        case "ms":
          try {
            setMemory(evaluate(exprRef.current, degMode));
          } catch {
            /* ignore */
          }
          break;
        case "mplus":
          try {
            setMemory((m) => m + evaluate(exprRef.current, degMode));
          } catch {
            /* ignore */
          }
          break;
        case "mminus":
          try {
            setMemory((m) => m - evaluate(exprRef.current, degMode));
          } catch {
            /* ignore */
          }
          break;
        case "deg":
          setDegMode((d) => !d);
          break;
        case "=":
          try {
            let val: number;
            let displayExpr: string;
            if (pendingOp && pendingBase !== null) {
              const second = evaluate(exprRef.current, degMode);
              if (pendingOp === "pow") val = Math.pow(pendingBase, second);
              else if (pendingOp === "logy")
                val = Math.log(second) / Math.log(pendingBase);
              else val = Math.pow(second, 1 / pendingBase); // yroot: pendingBase-th root of second
              displayExpr = `${pendingBase} ${PENDING_LABEL[pendingOp]} ${exprRef.current}`;
              setPendingOp(null);
              setPendingBase(null);
            } else {
              val = evaluate(exprRef.current, degMode);
              displayExpr = exprRef.current;
            }
            if (!isFinite(val) || isNaN(val)) {
              setHasError(true);
              setResult("Error");
            } else {
              const str = Number.isInteger(val)
                ? String(val)
                : String(parseFloat(val.toFixed(10)));
              setExpr(displayExpr);
              setResult(str);
              justEvalRef.current = true;
            }
          } catch {
            setHasError(true);
            setResult("Error");
          }
          break;
      }
    },
    [
      append,
      prefixFn,
      postfixOp,
      startPending,
      memory,
      degMode,
      hasError,
      pendingOp,
      pendingBase,
      evaluate,
    ],
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, string> = {
        "0": "0",
        "1": "1",
        "2": "2",
        "3": "3",
        "4": "4",
        "5": "5",
        "6": "6",
        "7": "7",
        "8": "8",
        "9": "9",
        "+": "+",
        "-": "-",
        "*": "*",
        "/": "/",
        ".": ".",
        "%": "%",
        "(": "(",
        ")": ")",
        Enter: "=",
        Backspace: "backspace",
        Delete: "clear",
        Escape: "clear",
      };
      const action = map[e.key];
      if (action) {
        e.preventDefault();
        handleAction(action);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleAction]);

  const renderButton = (btn: CalcButton, key: string | number) => {
    const base =
      "flex items-center justify-center rounded-[3px] text-[12px] transition-all active:brightness-90 select-none h-8 border";
    let variantClasses = "";
    switch (btn.variant) {
      case "danger":
        variantClasses =
          "bg-gradient-to-b from-[#ff8a70] to-[#f0533a] border-[#d5462f] text-white font-bold shadow-sm";
        break;
      case "eq":
        variantClasses =
          "bg-gradient-to-b from-[#5fd07a] to-[#3aa858] border-[#2c8a44] text-white font-bold shadow-sm";
        break;
      case "num":
      case "op":
      case "func":
      case "mem":
      default:
        variantClasses =
          "bg-gradient-to-b from-white to-[#e2e2e2] border-[#a8a8a8] text-[#222] shadow-sm hover:brightness-95";
    }
    return (
      <button
        key={key}
        onClick={() => handleAction(btn.action)}
        className={`${base} ${variantClasses}`}
        style={{ flex: btn.wide ?? 1 }}
      >
        {btn.label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-[460px] rounded-sm border border-[#7a7a7a] bg-[#d9d9d9] shadow-2xl shadow-slate-900/30 overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center justify-between bg-gradient-to-b from-[#5b9bf5] to-[#2f6fe0] px-2.5 py-1.5">
          <span className="text-[13px] font-bold text-white">
            Scientific Calculator
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-[2px] bg-[#7fb8ff] px-2.5 py-0.5 text-[11px] font-semibold text-white hover:bg-[#6aa8f5]"
            >
              Help
            </button>
            <button
              type="button"
              aria-label="Minimize"
              className="px-1 text-[14px] leading-none text-white/90 hover:text-white"
            >
              &#8211;
            </button>
            <button
              onClick={onClose}
              aria-label="Close"
              className="px-1 text-[14px] leading-none text-white/90 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="p-2.5">
          {/* Display */}
          <input
            readOnly
            value={
              pendingOp && pendingBase !== null
                ? `${pendingBase} ${PENDING_LABEL[pendingOp]} ...`
                : ""
            }
            className="mb-1.5 h-6 w-full border border-[#999] bg-white px-2 text-right text-[12px] text-[#555] focus:outline-none"
          />
          <input
            readOnly
            value={result ?? expr}
            className="mb-2.5 h-9 w-full border border-[#999] bg-white px-2 text-right text-[20px] text-black focus:outline-none"
          />

          {/* Controls: mod / deg-rad / memory */}
          <div className="mb-1.5 flex items-center gap-2 text-[12px] text-[#222]">
            <button
              onClick={() => handleAction("mod")}
              className="h-7 w-12 rounded-[3px] border border-[#a8a8a8] bg-gradient-to-b from-white to-[#e2e2e2] font-medium hover:brightness-95"
            >
              mod
            </button>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                checked={degMode}
                onChange={() => !degMode && handleAction("deg")}
                className="accent-[#2f6fe0]"
              />
              Deg
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="radio"
                checked={!degMode}
                onChange={() => degMode && handleAction("deg")}
                className="accent-[#2f6fe0]"
              />
              Rad
            </label>
            <div className="flex-1" />
            {(["mc", "mr", "ms", "mplus", "mminus"] as const).map((a) => (
              <button
                key={a}
                onClick={() => handleAction(a)}
                className="h-7 w-9 rounded-[3px] border border-[#a8a8a8] bg-gradient-to-b from-white to-[#e2e2e2] text-[11px] font-medium hover:brightness-95"
              >
                {{ mc: "MC", mr: "MR", ms: "MS", mplus: "M+", mminus: "M-" }[a]}
              </button>
            ))}
          </div>

          {/* Button grid */}
          <div className="flex gap-1.5">
            <div className="flex-[6] flex flex-col gap-1">
              {LEFT_ROWS.map((row, ri) => (
                <div key={ri} className="flex gap-1">
                  {row.map((btn, ci) => renderButton(btn, `${ri}-${ci}`))}
                </div>
              ))}
            </div>
            <div className="flex-[4] flex flex-col gap-1">
              {RIGHT_ROWS.map((row, ri) => (
                <div key={ri} className="flex gap-1">
                  {row.map((btn, ci) => renderButton(btn, `${ri}-${ci}`))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex mt-1">
            {renderButton({ label: "=", action: "=", variant: "eq" }, "eq")}
          </div>
        </div>
      </div>
    </div>
  );
}
