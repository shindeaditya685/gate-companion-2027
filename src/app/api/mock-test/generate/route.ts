import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback, MODELS } from '@/lib/nvidia-fallback';

const MOCK_MODELS = MODELS.filter((m) =>
  ['deepseek-ai/deepseek-v4-pro', 'mistralai/mistral-medium-3.5-128b', 'minimaxai/minimax-m2.7', 'google/diffusiongemma-26b-a4b-it'].includes(m.name)
);

const FALLBACK_QUESTIONS: MockQJson[] = [
  { id: 'mt-1', type: 'mcq', section: 'ga', subject: 'Verbal', marks: 1, question: 'Choose the correct word: "The manager asked the team to ______ the project deadline."', options: ['expedite', 'expiate', 'expatriate', 'exonerate'], correct: 0, explanation: '"Expedite" means to speed up, which fits asking to meet a deadline.' },
  { id: 'mt-2', type: 'mcq', section: 'ga', subject: 'Numerical', marks: 2, question: 'In how many ways can 5 boys and 3 girls be seated in a row such that no two girls sit together?', options: ['14400', '28800', '57600', '7200'], correct: 0, explanation: 'Arrange 5 boys: 5! = 120. There are 6 gaps for 3 girls: P(6,3) = 120. Total = 120 × 120 = 14400.' },
  { id: 'mt-3', type: 'nat', section: 'ga', subject: 'Numerical', marks: 1, question: 'A train 300 m long is running at 72 km/h. How many seconds will it take to cross a platform 200 m long?', correct: '25', explanation: 'Speed = 72 km/h = 72 × 5/18 = 20 m/s. Total distance = 300 + 200 = 500 m. Time = 500/20 = 25 seconds.' },
  { id: 'mt-4', type: 'nat', section: 'tech', subject: 'Algorithms', marks: 2, question: 'How many comparisons are needed in the worst case to find the largest and second largest elements from an array of 8 elements using the tournament method?', correct: '9', explanation: 'Tournament method: first find max with n-1 = 7 comparisons. The second largest must be among the log n opponents of the max. For n=8, log₂8=3, so 3-1=2 more comparisons. Total = 7 + 2 = 9.' },
  { id: 'mt-5', type: 'msq', section: 'tech', subject: 'Data Structures', marks: 2, question: 'Which of the following data structures support(s) insertion and deletion in O(1) average time? (Select all that apply.)', options: ['Hash Table', 'Stack (array-based)', 'Queue (linked-list)', 'Binary Search Tree', 'Heap'], correct: [0, 1, 2], explanation: 'Hash table has O(1) average insert/delete. Stack has O(1) push/pop. Queue with linked list has O(1) enqueue/dequeue. BST and Heap have O(log n) average.' },
  { id: 'mt-6', type: 'msq', section: 'tech', subject: 'Computer Networks', marks: 1, question: 'Which of the following is/are valid MAC addresses? (Select all that apply.)', options: ['00:1A:2B:3C:4D:5E', '192.168.1.1', 'FF:FF:FF:FF:FF:FF', 'AB:CD:EF:GH:IJ:KL'], correct: [0, 2], explanation: 'MAC addresses are 12 hex digits (48 bits). 00:1A:2B:3C:4D:5E is valid. FF:FF:FF:FF:FF:FF is the broadcast address. 192.168.1.1 is an IP address. GH is not a valid hex digit.' },
  { id: 'mt-7', type: 'mcq', section: 'tech', subject: 'DBMS', marks: 2, question: 'In a relational database, which of the following is TRUE about BCNF?', options: ['Every BCNF schema is in 3NF', 'Every 3NF schema is in BCNF', 'BCNF guarantees dependency preservation', 'BCNF always eliminates all redundancies'], correct: 0, explanation: 'BCNF is stricter than 3NF — every BCNF schema is in 3NF, but not vice versa. BCNF does not guarantee dependency preservation (some FDs may be lost). BCNF reduces redundancy but may not eliminate all forms (e.g., multi-valued dependencies).' },
  { id: 'mt-8', type: 'mcq', section: 'tech', subject: 'Theory of Computation', marks: 1, question: 'Which of the following problems is undecidable?', options: ['Membership problem for regular languages', 'Emptiness problem for context-free grammars', 'Equivalence problem for context-free grammars', 'Membership problem for context-free grammars'], correct: 2, explanation: 'The equivalence of two context-free grammars (whether they generate the same language) is undecidable. Membership and emptiness for both regular languages and CFGs are decidable.' },
  { id: 'mt-9', type: 'nat', section: 'tech', subject: 'Operating Systems', marks: 2, question: 'A system uses paging with a TLB hit ratio of 80%. TLB access time is 20 ns and memory access time is 100 ns. What is the effective memory access time in ns?', correct: '140', explanation: 'EMAT = TLB_hit × (TLB + memory) + TLB_miss × (TLB + 2×memory) = 0.8 × (20+100) + 0.2 × (20+200) = 0.8×120 + 0.2×220 = 96 + 44 = 140 ns.' },
  { id: 'mt-10', type: 'msq', section: 'tech', subject: 'Digital Logic', marks: 1, question: 'Which of the following Boolean expressions is/are equivalent to A ⊕ B (XOR)? (Select all that apply.)', options: ["A'B + AB'", '(A+B)(A\'+B\')', 'A\'B\' + AB', 'A ⊕ B\'', '(A ⊕ B)\''], correct: [0, 1], explanation: 'A ⊕ B = A\'B + AB\' (option 0). (A+B)(A\'+B\') = AA\'+AB\'+A\'B+BB\' = AB\'+A\'B (option 1). A\'B\'+AB = A ⊕ B\' = XNOR (option 2). A ⊕ B\' = XNOR (option 3). (A ⊕ B)\' = XNOR (option 4).' },
];

interface MockQJson {
  id: string;
  type: 'mcq' | 'nat' | 'msq';
  section: 'ga' | 'tech';
  subject?: string;
  marks?: number;
  question: string;
  options?: string[];
  correct: number | number[] | string;
  explanation: string;
}

export async function POST(req: NextRequest) {
  try {
    const { subject, count = 10 } = await req.json();
    const qCount = Math.min(Math.max(5, count), 65);

    const subjectFilter = subject
      ? `Focus the technical questions on ${subject}.`
      : 'Cover General Aptitude (Verbal, Numerical, Reasoning) and core CSE subjects (Data Structures, Algorithms, CO, OS, Networks, DBMS, TOC, CD, Digital Logic, Discrete Math).';

    const prompt = `You are a GATE CSE exam expert who has analyzed every GATE PYQ from the last 15 years. Generate exactly ${qCount} questions that match the EXACT style, difficulty, and pattern of actual GATE CSE exam questions.

GATE EXAM FORMAT (follow this exactly):
- Question types: MCQ (single correct), NAT (numerical answer type — typed number), MSQ (multiple select — 2-3 correct options)
- Marks: 1-mark or 2-mark questions
- Negative marking only for MCQs (not for NAT/MSQ)
- Difficulty: match actual GATE PYQs — conceptual, not trivial, but not overly complex either
- Include a realistic mix: ~50% MCQ, ~30% NAT, ~20% MSQ

${subjectFilter}

Rules per type:
1. MCQ: "type":"mcq", exactly 4 options with "correct" as the 0-indexed integer of the right option.
2. NAT: "type":"nat", NO options field, "correct" is the numeric answer as a string (e.g., "25"). Must require a calculation or derivation.
3. MSQ: "type":"msq", 4-6 options with "correct" as an array of 0-indexed integers (e.g., [0,2]). The correct answer set should have 2 or 3 options.

IMPORTANT:
- Each question must feel like it could be from a real GATE paper — use standard GATE phrasing, notation, and concepts.
- NAT questions must have answers that are integers or simple decimals (no fractions).
- MSQ questions: make sure exactly 2-3 options are correct (not 1, not 4+).
- Every question must have a clear, exam-style explanation.

Return ONLY valid JSON — no markdown, no code fences, no trailing commas:
{"questions":[
  {"id":"mt-1","type":"mcq","section":"ga","subject":"Verbal","marks":1,"question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"mt-2","type":"nat","section":"tech","subject":"Algorithms","marks":2,"question":"...","correct":"42","explanation":"..."},
  {"id":"mt-3","type":"msq","section":"tech","subject":"DBMS","marks":2,"question":"...","options":["A","B","C","D","E"],"correct":[0,2,3],"explanation":"..."}
]}`;

    try {
      const result = await Promise.race([
        generateWithFallback(prompt, MOCK_MODELS),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 90000)),
      ]);
      const questions: MockQJson[] = (result?.questions || []).slice(0, qCount);

      if (questions.length >= Math.min(5, qCount)) {
        return NextResponse.json({ questions, generatedAt: new Date().toISOString() });
      }
    } catch {
      // All AI models failed or timed out
    }

    return NextResponse.json({
      questions: FALLBACK_QUESTIONS.slice(0, qCount),
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({
      questions: FALLBACK_QUESTIONS.slice(0, 10),
      generatedAt: new Date().toISOString(),
    });
  }
}
