import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallback, MODELS } from '@/lib/nvidia-fallback';

const DAILY_MODELS = MODELS.filter((m) =>
  ['meta/llama-3.1-8b-instruct', 'mistralai/mistral-medium-3.5-128b', 'minimaxai/minimax-m2.7', 'google/diffusiongemma-26b-a4b-it'].includes(m.name)
);

const GA_PROMPT = `You are a GATE exam expert. Generate exactly 5 General Aptitude questions at GATE difficulty level.

Cover each sub-type exactly once:
1. Verbal Ability: sentence equivalence, critical reasoning, or vocabulary-in-context
2. Numerical Ability: percentages, profit-loss, time-work, time-speed-distance, ratios
3. Reasoning: syllogisms, blood relations, directions, seating arrangement, or coding-decoding
4. Data Interpretation: table, bar graph, pie chart, or line graph based
5. Mixed: probability, permutations-combinations, mixtures, or number system

Each question must be exam-hard level — not trivial. Include a numeric answer option where relevant.
Each must have exactly 4 options (A/B/C/D), exactly one correct answer (0-indexed), and a clear step-by-step explanation.

Return ONLY valid JSON — no markdown, no code fences:
{"questions":[
  {"id":"ga-1","type":"mcq","section":"ga","subtype":"verbal","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"ga-2","type":"mcq","section":"ga","subtype":"numerical","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"ga-3","type":"mcq","section":"ga","subtype":"reasoning","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"ga-4","type":"mcq","section":"ga","subtype":"data-interpretation","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"ga-5","type":"mcq","section":"ga","subtype":"mixed","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}
]}`;

const TECH_PROMPT = (weakSubjects: string[]) =>
  `You are a GATE CSE exam expert. Generate exactly 5 technical questions at GATE exam difficulty level.

Subjects to cover (pick 5 different ones, prioritising these weak areas): ${weakSubjects.join(', ') || 'Data Structures, Algorithms, Computer Organization, Operating Systems, Computer Networks, DBMS, Theory of Computation, Compiler Design, Digital Logic, Discrete Mathematics'}.

Each question must be at actual GATE difficulty — requires conceptual clarity, not rote recall.
Include at least one question that involves a small calculation or trace.
Each must have exactly 4 options, exactly one correct answer (0-indexed), a subject tag, and a detailed explanation.

Return ONLY valid JSON — no markdown, no code fences:
{"questions":[
  {"id":"tech-1","type":"mcq","section":"tech","subject":"Data Structures","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"tech-2","type":"mcq","section":"tech","subject":"Algorithms","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"tech-3","type":"mcq","section":"tech","subject":"Computer Networks","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"tech-4","type":"mcq","section":"tech","subject":"Operating Systems","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"tech-5","type":"mcq","section":"tech","subject":"DBMS","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}
]}`;

const FALLBACK_QUESTIONS = [
  { id: 'ga-1', type: 'mcq', section: 'ga', subtype: 'verbal', question: 'In the following sentence, choose the most appropriate word to fill the blank: "The professor\'s ______ remarks during the lecture left the students thoroughly confused about the core concept."', options: ['lucid', 'ambiguous', 'perspicuous', 'eloquent'], correct: 1, explanation: '"Ambiguous" means unclear or having multiple interpretations, which matches the context of students being confused. Lucid and perspicuous both mean clear, which would have the opposite effect.' },
  { id: 'ga-2', type: 'mcq', section: 'ga', subtype: 'numerical', question: 'A and B together can complete a work in 12 days. B and C together can complete it in 15 days. A and C together can complete it in 20 days. In how many days will A alone complete the work?', options: ['20', '30', '24', '25'], correct: 1, explanation: 'Let total work = LCM(12,15,20) = 60 units. A+B = 5 units/day, B+C = 4 units/day, A+C = 3 units/day. Adding: 2(A+B+C) = 12 → A+B+C = 6 units/day. A = (A+B+C) - (B+C) = 6 - 4 = 2 units/day. So A alone takes 60/2 = 30 days.' },
  { id: 'ga-3', type: 'mcq', section: 'ga', subtype: 'reasoning', question: 'In a certain code language, if "GATE" is written as "HZSD" and "CSE" is written as "DRF", then how will "EXAM" be written in that code?', options: ['FWBL', 'DWBK', 'FZBL', 'DZBN'], correct: 0, explanation: 'The pattern is alternating +1, -1 on each letter: G→H(+1), A→Z(-1), T→U(+1), E→D(-1) gives HZSD. Likewise C→D(+1), S→R(-1), E→F(+1) gives DRF. Applying to EXAM: E→F(+1), X→W(-1), A→B(+1), M→L(-1) = FWBL.' },
  { id: 'ga-4', type: 'mcq', section: 'ga', subtype: 'data-interpretation', question: 'A pie chart shows the expenditure of a family: Food 30%, Education 25%, Rent 20%, Transport 15%, Others 10%. If the total monthly expenditure is ₹60,000 and the family\'s income is ₹75,000, what percentage of income is saved?', options: ['15%', '20%', '25%', '10%'], correct: 1, explanation: 'Total expenditure = 100% of ₹60,000 = ₹60,000. Savings = ₹75,000 - ₹60,000 = ₹15,000. Percentage saved = (15000/75000) × 100 = 20%.' },
  { id: 'ga-5', type: 'mcq', section: 'ga', subtype: 'mixed', question: 'How many 3-digit numbers are divisible by both 6 and 9?', options: ['16', '17', '18', '50'], correct: 3, explanation: 'A number divisible by both 6 and 9 must be divisible by LCM(6,9) = 18. Smallest 3-digit multiple of 18: 18×6 = 108. Largest: 18×55 = 990. Count = 55 - 6 + 1 = 50.' },
  { id: 'tech-1', type: 'mcq', section: 'tech', subject: 'Data Structures', question: 'What is the minimum number of nodes in a complete binary tree of height h (where height of root is 0)?', options: ['2^h', '2^{h+1} - 1', '2h + 1', '2^h - 1'], correct: 0, explanation: 'A complete binary tree of height h has all levels fully filled except possibly the last. The minimum nodes occur when the last level has exactly 1 node. Levels 0 to h-1 are full = 2^h - 1 nodes. Plus 1 node on level h = 2^h. Maximum is 2^{h+1} - 1.' },
  { id: 'tech-2', type: 'mcq', section: 'tech', subject: 'Algorithms', question: 'Let T(n) = 2T(n/2) + n log n. What is the asymptotic solution for T(n)?', options: ['Θ(n log n)', 'Θ(n log² n)', 'Θ(n²)', 'Θ(n)'], correct: 1, explanation: 'Using Master Theorem: a=2, b=2, f(n)=n log n. n^{log_b a} = n^{log₂2} = n¹ = n. f(n) = n log n = Θ(n^{log_b a} log^k n) where k=1. So T(n) = Θ(n log^{k+1} n) = Θ(n log² n).' },
  { id: 'tech-3', type: 'mcq', section: 'tech', subject: 'Computer Networks', question: 'In the TCP/IP model, which layer is responsible for routing packets across different networks?', options: ['Application Layer', 'Transport Layer', 'Network Layer', 'Data Link Layer'], correct: 2, explanation: 'The Network Layer (Internet Layer in TCP/IP) handles routing of packets across networks using IP addresses. Transport Layer handles end-to-end delivery (TCP/UDP). Data Link Layer handles frame delivery on the same network.' },
  { id: 'tech-4', type: 'mcq', section: 'tech', subject: 'Operating Systems', question: 'A system uses demand paging with a TLB hit ratio of 90%. TLB access time is 20 ns and main memory access time is 100 ns. What is the effective memory access time?', options: ['120 ns', '128 ns', '130 ns', '140 ns'], correct: 2, explanation: 'EMAT = TLB_hit × (TLB_time + memory_time) + TLB_miss × (TLB_time + 2 × memory_time) = 0.9 × (20 + 100) + 0.1 × (20 + 200) = 0.9 × 120 + 0.1 × 220 = 108 + 22 = 130 ns.' },
  { id: 'tech-5', type: 'mcq', section: 'tech', subject: 'DBMS', question: 'In a relational database, which normal form requires that every non-prime attribute is fully functionally dependent on the primary key?', options: ['1NF', '2NF', '3NF', 'BCNF'], correct: 1, explanation: '2NF requires 1NF plus every non-prime attribute must be fully functionally dependent on the primary key (no partial dependencies). 3NF requires 2NF plus no transitive dependencies. BCNF is a stricter version of 3NF.' },
];

const isServerless = !!process.env.NETLIFY || !!process.env.DEPLOY;

export async function POST(req: NextRequest) {
  try {
    const { weakSubjects } = await req.json();

    // Skip AI on serverless (Netlify 10s timeout). Use static fallback.
    if (isServerless) {
      return NextResponse.json({ questions: FALLBACK_QUESTIONS });
    }

    try {
      const timeout = <T>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), ms))]);
      const results = await Promise.allSettled([
        timeout(generateWithFallback(GA_PROMPT, DAILY_MODELS), 60000),
        timeout(generateWithFallback(TECH_PROMPT(weakSubjects || []), DAILY_MODELS), 60000),
      ]);

      const gaData = results[0].status === 'fulfilled' ? results[0].value : null;
      const techData = results[1].status === 'fulfilled' ? results[1].value : null;

      const gaQuestions = (gaData?.questions || []).slice(0, 5);
      const techQuestions = (techData?.questions || []).slice(0, 5);

      if (gaQuestions.length === 5 && techQuestions.length === 5) {
        return NextResponse.json({ questions: [...gaQuestions, ...techQuestions] });
      }
    } catch {
      // All models failed
    }

    return NextResponse.json({ questions: FALLBACK_QUESTIONS });
  } catch {
    return NextResponse.json({ questions: FALLBACK_QUESTIONS });
  }
}
