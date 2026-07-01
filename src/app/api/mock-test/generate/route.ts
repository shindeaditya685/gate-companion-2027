import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const nv = new OpenAI({
  apiKey: process.env.NV_DEEPSEEK_KEY || '',
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

const FALLBACK_QUESTIONS = [
  { id: 'mt-1', section: 'ga', subject: 'Verbal', question: 'Choose the correct word: "The manager asked the team to ______ the project deadline."', options: ['expedite', 'expiate', 'expatriate', 'exonerate'], correct: 0, explanation: '"Expedite" means to make something happen quickly or speed up, which fits asking to meet a deadline.' },
  { id: 'mt-2', section: 'ga', subject: 'Numerical', question: 'In how many ways can 5 boys and 3 girls be seated in a row such that no two girls sit together?', options: ['14400', '28800', '57600', '7200'], correct: 0, explanation: 'Arrange 5 boys first: 5! = 120. There are 6 gaps (including ends) for 3 girls: P(6,3) = 120. Total = 120 × 120 = 14400.' },
  { id: 'mt-3', section: 'ga', subject: 'Reasoning', question: 'In a row of students, A is 7th from the left and B is 9th from the right. When they swap positions, A becomes 13th from the left. How many students are in the row?', options: ['19', '20', '21', '22'], correct: 2, explanation: 'A is 7th from left. After swapping, A is 13th from left. This means B was originally at position 13 from left. B is 9th from right. So total = 13 + 9 - 1 = 21 students.' },
  { id: 'mt-4', section: 'tech', subject: 'Data Structures', question: 'A binary tree has 15 nodes. What is the minimum possible height of the tree? (Height of root = 0)', options: ['3', '4', '5', '6'], correct: 0, explanation: 'Minimum height occurs when the tree is as balanced as possible. A full binary tree of height 3 has 2^4-1 = 15 nodes. So minimum height = 3.' },
  { id: 'mt-5', section: 'tech', subject: 'Algorithms', question: 'The recurrence T(n) = 3T(n/4) + n² has asymptotic solution:', options: ['Θ(n²)', 'Θ(n log n)', 'Θ(n^{log₄3})', 'Θ(n³)'], correct: 0, explanation: 'Using Master Theorem: a=3, b=4, f(n)=n². n^{log_b a} = n^{log₄3} ≈ n^{0.79}. f(n) = n² = Ω(n^{0.79+ε}) where ε>0. Also check regularity: 3(n/4)² = 3n²/16 ≤ c·n² for c=3/4<1. So case 3 applies: T(n) = Θ(n²).' },
  { id: 'mt-6', section: 'tech', subject: 'Computer Networks', question: 'How many bits are in a MAC address?', options: ['32', '48', '64', '128'], correct: 1, explanation: 'A MAC address is 48 bits (6 bytes), typically represented as 12 hexadecimal digits (e.g., 00:1A:2B:3C:4D:5E).' },
  { id: 'mt-7', section: 'tech', subject: 'Operating Systems', question: 'Which scheduling algorithm minimizes average waiting time?', options: ['FCFS', 'SJF', 'Round Robin', 'Priority Scheduling'], correct: 1, explanation: 'SJF (Shortest Job First) is provably optimal for minimizing average waiting time. It schedules the process with the smallest burst time first.' },
  { id: 'mt-8', section: 'tech', subject: 'DBMS', question: 'Which isolation level prevents dirty reads but allows non-repeatable reads?', options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'], correct: 1, explanation: 'Read Committed prevents dirty reads (uncommitted data) but does not guarantee repeatable reads (data can change between reads within the same transaction).' },
  { id: 'mt-9', section: 'tech', subject: 'Theory of Computation', question: 'Which language is NOT recursively enumerable?', options: ['The halting problem', 'The complement of the halting problem', 'The set of all Turing machines that halt on empty input', 'The set of all valid C programs'], correct: 1, explanation: 'The halting problem is recursively enumerable but not recursive. Its complement is not even recursively enumerable (it is co-RE).' },
  { id: 'mt-10', section: 'tech', subject: 'Digital Logic', question: 'What is the output of a 4-to-1 multiplexer when select lines are S1=1, S0=0 and inputs are I0=0, I1=1, I2=1, I3=0?', options: ['0', '1', 'X', 'High impedance'], correct: 1, explanation: 'With S1=1, S0=0, the binary select value is 2, so output selects I2. I2=1, so output = 1.' },
];

export async function POST(req: NextRequest) {
  try {
    const { subject, count = 10 } = await req.json();
    const qCount = Math.min(Math.max(1, count), 65);

    const subjectFilter = subject
      ? `Focus on ${subject}.`
      : 'Cover a balanced mix of GA (2 Verbal, 2 Numerical, 1 Reasoning) and Technical (Data Structures, Algorithms, CO, OS, Networks, DBMS, TOC, CD, Digital Logic, Discrete Math).';

    const prompt = `You are a GATE CSE exam expert. Generate exactly ${qCount} high-quality GATE-level multiple choice questions.

${subjectFilter}

Rules:
- Each question must have exactly 4 options (A/B/C/D) with exactly one correct answer.
- Use "section":"ga" for General Aptitude, "section":"tech" for Technical.
- For tech questions include a "subject" field (e.g., "Data Structures", "Algorithms", etc.).
- Difficulty should be actual GATE exam level — requires conceptual clarity.
- Include at least 2 questions that require a small calculation or trace.
- Each must have a clear, step-by-step "explanation".

Return ONLY valid JSON — no markdown, no code fences:
{"questions":[
  {"id":"mt-1","section":"ga","subject":"Verbal","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."},
  {"id":"mt-2","section":"tech","subject":"Data Structures","question":"...","options":["A","B","C","D"],"correct":0,"explanation":"..."}
]}`;

    try {
      const completion = await nv.chat.completions.create({
        model: 'deepseek-ai/deepseek-v4-pro',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        top_p: 0.95,
        max_tokens: Math.min(qCount * 800, 16384),
        stream: false,
      });

      const raw = completion.choices?.[0]?.message?.content || '{}';
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      const questions = (parsed.questions || []).slice(0, qCount);

      if (questions.length >= Math.min(5, qCount)) {
        return NextResponse.json({ questions, generatedAt: new Date().toISOString() });
      }
    } catch {
      // AI unavailable — use fallback
    }

    const fallback = FALLBACK_QUESTIONS.slice(0, qCount);
    return NextResponse.json({ questions: fallback, generatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ questions: FALLBACK_QUESTIONS.slice(0, 10), generatedAt: new Date().toISOString() });
  }
}
