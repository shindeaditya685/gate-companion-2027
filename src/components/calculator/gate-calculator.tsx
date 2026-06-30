'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

function toRad(deg: number) { return deg * (Math.PI / 180); }
function toDeg(rad: number) { return rad * (180 / Math.PI); }

function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) return NaN;
  if (n > 170) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function withDeg(expr: string, deg: boolean): string {
  if (!deg) return expr;
  return expr
    .replace(/\bsin\(/g, 'Math.sin(toRad(')
    .replace(/\bcos\(/g, 'Math.cos(toRad(')
    .replace(/\btan\(/g, 'Math.tan(toRad(')
    .replace(/\basin\(/g, 'toDeg(Math.asin(')
    .replace(/\bacos\(/g, 'toDeg(Math.acos(')
    .replace(/\batan\(/g, 'toDeg(Math.atan(');
}

function transformExpr(expr: string, deg: boolean): string {
  let e = expr;
  // Replace display symbols with JS
  e = e.replace(/×/g, '*');
  e = e.replace(/÷/g, '/');
  e = e.replace(/−/g, '-');
  e = e.replace(/π/g, 'Math.PI');
  e = e.replace(/\be\b(?!xp|\(|d)/g, 'Math.E');
  e = e.replace(/mod/g, '%');
  e = e.replace(/log₂\(/g, 'Math.log2(');
  e = e.replace(/log\(/g, 'Math.log10(');
  e = e.replace(/ln\(/g, 'Math.log(');
  e = e.replace(/√\(/g, 'Math.sqrt(');
  e = e.replace(/∛\(/g, 'Math.cbrt(');
  e = e.replace(/sin⁻¹\(/g, 'asin(');
  e = e.replace(/cos⁻¹\(/g, 'acos(');
  e = e.replace(/tan⁻¹\(/g, 'atan(');
  e = e.replace(/sinh⁻¹\(/g, 'Math.asinh(');
  e = e.replace(/cosh⁻¹\(/g, 'Math.acosh(');
  e = e.replace(/tanh⁻¹\(/g, 'Math.atanh(');
  e = e.replace(/sinh\(/g, 'Math.sinh(');
  e = e.replace(/cosh\(/g, 'Math.cosh(');
  e = e.replace(/tanh\(/g, 'Math.tanh(');
  e = e.replace(/sin\(/g, 'Math.sin(');
  e = e.replace(/cos\(/g, 'Math.cos(');
  e = e.replace(/tan\(/g, 'Math.tan(');
  e = e.replace(/eˣ\(/g, 'Math.exp(');
  e = e.replace(/10ˣ\(/g, 'Math.pow(10,');
  e = e.replace(/Exp\(/g, 'Math.exp(');
  e = e.replace(/\|x\|\(/g, 'Math.abs(');
  e = e.replace(/log_y_x\(/g, 'Math.log('); // handled differently
  e = e.replace(/ʸ√x\(/g, ''); // handled differently

  // Postfix operators: wrap the last number
  e = e.replace(/(\d+)!/g, 'factorial($1)');
  e = e.replace(/([\d.]+)²/g, 'Math.pow($1,2)');
  e = e.replace(/([\d.]+)³/g, 'Math.pow($1,3)');
  e = e.replace(/([\d.]+)⁻¹/g, '1/$1');

  // Absolute value
  e = e.replace(/\|([^|]+)\|/g, 'Math.abs($1)');

  // log_y_x: log_{y}(x) → Math.log(x)/Math.log(y)
  e = e.replace(/log_(\d+)\(/g, 'Math.log($1)/Math.log(');

  // ʸ√x: root_y(x) → Math.pow(x,1/y)
  e = e.replace(/root_(\d+)\(/g, 'Math.pow(1/$1,');

  e = withDeg(e, deg);
  return e;
}

type CalcButton = {
  label: string;
  action: string;
  wide?: number;
  variant?: 'num' | 'op' | 'func' | 'mem' | 'eq';
};

const BUTTONS: CalcButton[][] = [
  [
    { label: '', action: 'blank' },
    { label: 'DEG', action: 'deg', variant: 'mem' },
    { label: 'π', action: 'pi', variant: 'func' },
    { label: 'e', action: 'econst', variant: 'func' },
    { label: 'MC', action: 'mc', variant: 'mem' },
    { label: 'MR', action: 'mr', variant: 'mem' },
  ],
  [
    { label: 'MS', action: 'ms', variant: 'mem' },
    { label: 'M+', action: 'mplus', variant: 'mem' },
    { label: 'M-', action: 'mminus', variant: 'mem' },
    { label: 'Exp', action: 'exp', variant: 'func' },
    { label: 'mod', action: 'mod', variant: 'op' },
    { label: '(', action: '(', variant: 'op' },
  ],
  [
    { label: ')', action: ')', variant: 'op' },
    { label: '←', action: 'backspace', variant: 'mem' },
    { label: 'C', action: 'clear', variant: 'mem' },
    { label: '+/-', action: 'negate', variant: 'mem' },
    { label: '√', action: 'sqrt', variant: 'func' },
    { label: 'x²', action: 'sq', variant: 'func' },
  ],
  [
    { label: 'x³', action: 'cube', variant: 'func' },
    { label: 'x⁻¹', action: 'inv', variant: 'func' },
    { label: 'sinh', action: 'sinh', variant: 'func' },
    { label: 'cosh', action: 'cosh', variant: 'func' },
    { label: 'tanh', action: 'tanh', variant: 'func' },
    { label: 'log₂', action: 'log2', variant: 'func' },
  ],
  [
    { label: 'ln', action: 'ln', variant: 'func' },
    { label: 'log', action: 'log', variant: 'func' },
    { label: 'sin⁻¹', action: 'asin', variant: 'func' },
    { label: 'cos⁻¹', action: 'acos', variant: 'func' },
    { label: 'tan⁻¹', action: 'atan', variant: 'func' },
    { label: 'n!', action: 'fact', variant: 'func' },
  ],
  [
    { label: '7', action: '7', variant: 'num' },
    { label: '8', action: '8', variant: 'num' },
    { label: '9', action: '9', variant: 'num' },
    { label: '÷', action: '/', variant: 'op' },
    { label: '%', action: '%', variant: 'op' },
    { label: 'eˣ', action: 'expfn', variant: 'func' },
  ],
  [
    { label: '4', action: '4', variant: 'num' },
    { label: '5', action: '5', variant: 'num' },
    { label: '6', action: '6', variant: 'num' },
    { label: '×', action: '*', variant: 'op' },
    { label: 'x^y', action: 'pow', variant: 'op' },
    { label: '|x|', action: 'abs', variant: 'func' },
  ],
  [
    { label: '1', action: '1', variant: 'num' },
    { label: '2', action: '2', variant: 'num' },
    { label: '3', action: '3', variant: 'num' },
    { label: '−', action: '-', variant: 'op' },
    { label: 'ʸ√x', action: 'root', variant: 'func' },
    { label: '∛', action: 'cbrt', variant: 'func' },
  ],
  [
    { label: '0', action: '0', variant: 'num', wide: 2 },
    { label: '.', action: '.', variant: 'num' },
    { label: '+', action: '+', variant: 'op' },
    { label: '10ˣ', action: 'pow10', variant: 'func' },
    { label: '=', action: '=', variant: 'eq', wide: 2 },
  ],
];

export function GateCalculator({ onClose }: { onClose: () => void }) {
  const [expr, setExpr] = useState('0');
  const [result, setResult] = useState<string | null>(null);
  const [memory, setMemory] = useState(0);
  const [degMode, setDegMode] = useState(true);
  const [hasError, setHasError] = useState(false);
  const exprRef = useRef(expr);
  exprRef.current = expr;
  const justEvalRef = useRef(false);

  const lastAnswer = useRef(0);
  const lastResult = useRef<string | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, string> = {
        '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
        '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
        '+': '+', '-': '-', '*': '*', '/': '/',
        '.': '.', '%': '%', '(': '(', ')': ')',
        'Enter': '=', 'Backspace': 'backspace', 'Delete': 'clear',
        'Escape': 'clear',
      };
      const action = map[e.key];
      if (action) {
        e.preventDefault();
        handleAction(action);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  const append = useCallback((s: string) => {
    setExpr((prev) => {
      if (justEvalRef.current && !isNaN(Number(s))) {
        justEvalRef.current = false;
        return s;
      }
      if (prev === '0' && s !== '.' && !isNaN(Number(s))) return s;
      return prev + s;
    });
    setResult(null);
    setHasError(false);
    if (!isNaN(Number(s))) justEvalRef.current = false;
  }, []);

  const prefixFn = useCallback((display: string) => {
    setExpr((prev) => {
      if (justEvalRef.current) { justEvalRef.current = false; return display; }
      const base = prev === '0' ? '' : prev;
      return base + display;
    });
    setResult(null);
    setHasError(false);
  }, []);

  const postfixOp = useCallback((transform: (last: string) => string) => {
    setExpr((prev) => {
      // Extract the last number in the expression
      const match = prev.match(/([\d.]+)$/);
      if (!match) return prev;
      const before = prev.slice(0, -match[1].length);
      return before + transform(match[1]);
    });
    setResult(null);
    setHasError(false);
  }, []);

  const handleAction = useCallback((action: string) => {
    if (hasError && action !== 'clear') return;

    switch (action) {
      case '0': case '1': case '2': case '3': case '4':
      case '5': case '6': case '7': case '8': case '9':
      case '.': append(action); break;
      case '+': case '-': case '*': case '/': case '%':
        append(` ${action} `); break;
      case '(': append('('); break;
      case ')': append(')'); break;
      case 'pi': prefixFn('π'); break;
      case 'econst': prefixFn('e'); break;
      case 'sin': prefixFn('sin('); break;
      case 'cos': prefixFn('cos('); break;
      case 'tan': prefixFn('tan('); break;
      case 'asin': prefixFn('sin⁻¹('); break;
      case 'acos': prefixFn('cos⁻¹('); break;
      case 'atan': prefixFn('tan⁻¹('); break;
      case 'sinh': prefixFn('sinh('); break;
      case 'cosh': prefixFn('cosh('); break;
      case 'tanh': prefixFn('tanh('); break;
      case 'log': prefixFn('log('); break;
      case 'ln': prefixFn('ln('); break;
      case 'log2': prefixFn('log₂('); break;
      case 'sqrt': prefixFn('√('); break;
      case 'cbrt': prefixFn('∛('); break;
      case 'expfn': prefixFn('eˣ('); break;
      case 'pow10': prefixFn('10ˣ('); break;
      case 'abs': prefixFn('|x|('); break;
      case 'exp': prefixFn('Exp('); break;
      case 'mod': append(' mod '); break;
      case 'pow': append(' ^ '); break;
      case 'root': prefixFn('ʸ√x('); break;
      case 'sq': postfixOp((n) => `${n}²`); break;
      case 'cube': postfixOp((n) => `${n}³`); break;
      case 'inv': postfixOp((n) => `${n}⁻¹`); break;
      case 'fact': postfixOp((n) => `${n}!`); break;
      case 'negate': {
        setExpr((prev) => {
          if (prev === '0') return prev;
          const match = prev.match(/([\d.]+)$/);
          if (!match) return prev;
          const before = prev.slice(0, -match[1].length);
          const num = parseFloat(match[1]);
          return before + String(-num);
        });
        break;
      }
      case 'clear':
        setExpr('0'); setResult(null); setHasError(false); break;
      case 'backspace':
        setExpr((prev) => {
          if (prev.length <= 1) return '0';
          return prev.trim().slice(0, -1).trim() || '0';
        });
        setResult(null); setHasError(false); break;
      case 'mc': setMemory(0); break;
      case 'mr': append(String(memory)); break;
      case 'ms': setMemory(parseFloat(exprRef.current) || 0); break;
      case 'mplus': setMemory((m) => m + (parseFloat(exprRef.current) || 0)); break;
      case 'mminus': setMemory((m) => m - (parseFloat(exprRef.current) || 0)); break;
      case 'deg':
        setDegMode((d) => !d); break;
      case 'blank': break;
      case '=':
        try {
          const raw = exprRef.current;
          const transformed = transformExpr(raw, degMode);
          const fn = new Function(
            'Math', 'factorial', 'toRad', 'toDeg',
            `return (${transformed});`
          );
          const val = fn(Math, factorial, toRad, toDeg);
          if (!isFinite(val) || isNaN(val)) {
            setHasError(true); setResult('Error');
          } else {
            const str = Number.isInteger(val) ? String(val) : String(parseFloat(val.toFixed(10)));
            lastAnswer.current = val;
            lastResult.current = str;
            setResult(str);
            setExpr(str);
            justEvalRef.current = true;
          }
        } catch {
          setHasError(true); setResult('Error');
        }
        break;
    }
  }, [append, prefixFn, postfixOp, memory, degMode, hasError]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-100 to-white border-b border-slate-200 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Scientific Calculator
          </span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Display */}
        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="min-h-[2rem] text-right text-sm text-slate-400 font-mono break-all">
            {expr}
          </div>
          <div className="min-h-[2.5rem] text-right text-3xl font-bold tabular-nums text-slate-900 break-all">
            {result ?? expr}
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>{degMode ? 'DEG' : 'RAD'}</span>
            <span>{memory !== 0 ? `M=${memory}` : ''}</span>
          </div>
        </div>

        {/* Button grid */}
        <div className="p-2 bg-slate-50/80">
          {BUTTONS.map((row, ri) => (
            <div key={ri} className="flex gap-1 mb-1">
              {row.map((btn, ci) => {
                if (btn.action === 'blank') {
                  return <div key={ci} style={{ flex: btn.wide ?? 1 }} />;
                }
                const base = 'flex items-center justify-center rounded-lg text-[11px] font-semibold transition-all active:scale-95 select-none h-9 border';
                let variantClasses = '';
                switch (btn.variant) {
                  case 'num':
                    variantClasses = 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm';
                    break;
                  case 'op':
                    variantClasses = 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100';
                    break;
                  case 'func':
                    variantClasses = 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100';
                    break;
                  case 'mem':
                    variantClasses = 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100';
                    break;
                  case 'eq':
                    variantClasses = 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-transparent shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500';
                    break;
                  default:
                    variantClasses = 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50';
                }
                return (
                  <button
                    key={ci}
                    onClick={() => handleAction(btn.action)}
                    className={`${base} ${variantClasses}`}
                    style={{ flex: btn.wide ?? 1 }}
                  >
                    {btn.action === 'deg' ? (degMode ? 'DEG' : 'RAD') : btn.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
