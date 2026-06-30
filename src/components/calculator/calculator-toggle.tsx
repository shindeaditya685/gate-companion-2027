'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { GateCalculator } from './gate-calculator';

export function CalculatorToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-600/40 transition-all hover:scale-110 hover:shadow-emerald-500/50 active:scale-95"
        title="Open Scientific Calculator"
      >
        <Calculator className="h-5 w-5" />
      </button>

      {/* Calculator modal */}
      {open && <GateCalculator onClose={() => setOpen(false)} />}
    </>
  );
}
