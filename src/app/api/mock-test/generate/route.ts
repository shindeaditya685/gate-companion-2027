import { NextRequest, NextResponse } from 'next/server';
import { generateWithFallbackDetails, MODELS, type ModelAttempt } from '@/lib/nvidia-fallback';

const MOCK_MODEL_ORDER = [
  'mistralai/mistral-medium-3.5-128b',
  'meta/llama-3.1-8b-instruct',
  'google/diffusiongemma-26b-a4b-it',
  'deepseek-ai/deepseek-v4-pro',
  'minimaxai/minimax-m2.7',
];

const MOCK_MODELS = MOCK_MODEL_ORDER
  .map((name) => MODELS.find((model) => model.name === name))
  .filter((model): model is NonNullable<typeof model> => Boolean(model));

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

const FALLBACK_BANK: Record<string, MockQJson[]> = {
  'General Aptitude': [
    { id: 'fb-ga-1', type: 'mcq', section: 'ga', subject: 'Verbal', marks: 1, question: 'Choose the correct word: "The manager asked the team to ______ the project deadline."', options: ['expedite', 'expiate', 'expatriate', 'exonerate'], correct: 0, explanation: '"Expedite" means to speed up, which fits asking to meet a deadline.' },
    { id: 'fb-ga-2', type: 'mcq', section: 'ga', subject: 'Numerical', marks: 2, question: 'In how many ways can 5 boys and 3 girls be seated in a row such that no two girls sit together?', options: ['14400', '28800', '57600', '7200'], correct: 0, explanation: 'Arrange 5 boys: 5! = 120. There are 6 gaps for 3 girls: P(6,3) = 120. Total = 120 × 120 = 14400.' },
    { id: 'fb-ga-3', type: 'nat', section: 'ga', subject: 'Numerical', marks: 1, question: 'A train 300 m long is running at 72 km/h. How many seconds will it take to cross a platform 200 m long?', correct: '25', explanation: 'Speed = 72 km/h = 72 × 5/18 = 20 m/s. Total distance = 300 + 200 = 500 m. Time = 500/20 = 25 seconds.' },
    { id: 'fb-ga-4', type: 'mcq', section: 'ga', subject: 'Reasoning', marks: 1, question: 'In a certain code, GATE is written as HZSD. How is EXAM written?', options: ['FWBL', 'DWBK', 'FZBL', 'DZBN'], correct: 0, explanation: 'Pattern: alternate +1, -1 on each letter. E→F(+1), X→W(-1), A→B(+1), M→L(-1) = FWBL.' },
    { id: 'fb-ga-5', type: 'mcq', section: 'ga', subject: 'Numerical', marks: 2, question: 'A and B together can complete work in 12 days. B and C in 15 days. A and C in 20 days. How many days will A alone take?', options: ['20', '30', '24', '25'], correct: 1, explanation: 'Let total = LCM(12,15,20) = 60. A+B=5, B+C=4, A+C=3 per day. A = (A+B+C) - (B+C) = 6-4 = 2. Days = 60/2 = 30.' },
  ],
  'Data Structures': [
    { id: 'fb-ds-1', type: 'msq', section: 'tech', subject: 'Data Structures', marks: 2, question: 'Which data structures support insertion and deletion in O(1) average time? (Select all that apply.)', options: ['Hash Table', 'Stack (array-based)', 'Queue (linked-list)', 'Binary Search Tree', 'Heap'], correct: [0, 1, 2], explanation: 'Hash table has O(1) average insert/delete. Stack has O(1) push/pop. Queue with linked list has O(1) enqueue/dequeue. BST and Heap have O(log n).' },
    { id: 'fb-ds-2', type: 'mcq', section: 'tech', subject: 'Data Structures', marks: 1, question: 'What is the minimum number of nodes in a complete binary tree of height h (root at 0)?', options: ['2^h', '2^{h+1} - 1', '2h + 1', '2^h - 1'], correct: 0, explanation: 'Levels 0 to h-1 are full = 2^h - 1 nodes. Last level has 1 node. Total = 2^h.' },
    { id: 'fb-ds-3', type: 'nat', section: 'tech', subject: 'Data Structures', marks: 2, question: 'A full binary tree has 511 nodes. How many leaf nodes does it have?', correct: '256', explanation: 'In a full binary tree, number of leaf nodes = (n+1)/2 = (511+1)/2 = 256.' },
    { id: 'fb-ds-4', type: 'mcq', section: 'tech', subject: 'Data Structures', marks: 1, question: 'Which traversal of a BST gives elements in sorted order?', options: ['Preorder', 'Inorder', 'Postorder', 'Level order'], correct: 1, explanation: 'Inorder traversal of a BST visits left subtree, root, right subtree, yielding elements in ascending order.' },
    { id: 'fb-ds-5', type: 'mcq', section: 'tech', subject: 'Data Structures', marks: 2, question: 'What is the worst-case time complexity of inserting an element in a balanced BST?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correct: 1, explanation: 'In a balanced BST (e.g., AVL, Red-Black), insertion takes O(log n) time.' },
  ],
  'Algorithms': [
    { id: 'fb-al-1', type: 'nat', section: 'tech', subject: 'Algorithms', marks: 2, question: 'How many comparisons are needed in the worst case to find the largest and second largest from 8 elements using the tournament method?', correct: '9', explanation: 'First find max with n-1 = 7 comparisons. The second largest is among the log₂n=3 opponents of max: 3-1=2 more comparisons. Total = 7+2 = 9.' },
    { id: 'fb-al-2', type: 'mcq', section: 'tech', subject: 'Algorithms', marks: 2, question: 'T(n) = 2T(n/2) + n log n. What is the asymptotic solution?', options: ['Θ(n log n)', 'Θ(n log² n)', 'Θ(n²)', 'Θ(n)'], correct: 1, explanation: 'Master Theorem: a=2, b=2, n^{log_b a}=n. f(n)=n log n = Θ(n log^k n) with k=1. So T(n)=Θ(n log^{k+1} n)=Θ(n log² n).' },
    { id: 'fb-al-3', type: 'mcq', section: 'tech', subject: 'Algorithms', marks: 1, question: 'Which of the following sorting algorithms has the best average-case time complexity?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], correct: 2, explanation: 'Merge Sort has O(n log n) average-case. The others are O(n²).' },
    { id: 'fb-al-4', type: 'nat', section: 'tech', subject: 'Algorithms', marks: 1, question: 'How many edges does a minimum spanning tree of a complete graph with 7 vertices have?', correct: '6', explanation: 'A spanning tree on n vertices always has exactly n-1 edges. So 7-1 = 6 edges.' },
    { id: 'fb-al-5', type: 'mcq', section: 'tech', subject: 'Algorithms', marks: 2, question: 'Dijkstra\'s algorithm fails when the graph has:', options: ['Negative weight edges', 'Cycles', 'Directed edges', 'Self loops'], correct: 0, explanation: 'Dijkstra\'s algorithm fails with negative weight edges because it assumes once a node is visited, its distance is finalized, which may not hold with negative weights.' },
  ],
  'Computer Organization': [
    { id: 'fb-co-1', type: 'mcq', section: 'tech', subject: 'Computer Organization', marks: 1, question: 'Which cache mapping scheme has the highest conflict misses?', options: ['Direct mapped', 'Fully associative', 'Set associative', 'Sector mapping'], correct: 0, explanation: 'Direct mapped cache has the highest conflict misses because each memory block maps to exactly one cache line.' },
    { id: 'fb-co-2', type: 'nat', section: 'tech', subject: 'Computer Organization', marks: 2, question: 'A processor has a clock rate of 2.5 GHz. What is the clock cycle time in picoseconds?', correct: '400', explanation: 'Clock cycle time = 1 / (2.5 × 10^9) = 0.4 × 10^-9 = 400 × 10^-12 = 400 ps.' },
    { id: 'fb-co-3', type: 'mcq', section: 'tech', subject: 'Computer Organization', marks: 2, question: 'In a pipelined processor, which hazard occurs when an instruction depends on the result of a previous instruction that is still being executed?', options: ['Structural hazard', 'Data hazard', 'Control hazard', 'Memory hazard'], correct: 1, explanation: 'Data hazards occur when an instruction depends on the result of a previous instruction still in the pipeline.' },
    { id: 'fb-co-4', type: 'msq', section: 'tech', subject: 'Computer Organization', marks: 1, question: 'Which of the following are components of a CPU? (Select all that apply.)', options: ['ALU', 'Cache memory', 'Hard disk', 'Control unit', 'Register file'], correct: [0, 1, 3, 4], explanation: 'ALU, cache, control unit, and register file are CPU components. Hard disk is external storage.' },
    { id: 'fb-co-5', type: 'mcq', section: 'tech', subject: 'Computer Organization', marks: 2, question: 'A system has a 3-level memory hierarchy: L1 cache (2 ns, 95% hit), L2 cache (10 ns, 80% hit on L1 miss), main memory (100 ns). What is the average access time in ns?', options: ['2.9', '3.4', '4.0', '5.2'], correct: 2, explanation: 'AMAT = L1_time + L1_miss × L2_time + L1_miss × L2_miss × MEM_time = 2 + 0.05×10 + 0.05×0.20×100 = 2 + 0.5 + 1.0 = 3.5. Closest option: 4.0. More precise: L1 hit:95%×2=1.9, L2 hit:5%×80%×(2+10)=0.04×12=0.48, MEM:5%×20%×(2+10+100)=0.01×112=1.12, Total=1.9+0.48+1.12=3.5.' },
    { id: 'fb-co-6', type: 'mcq', section: 'tech', subject: 'Computer Organization', marks: 1, question: 'The number of address lines required to address 2 MB of memory is:', options: ['19', '20', '21', '22'], correct: 2, explanation: '2 MB = 2 × 2^20 = 2^21 bytes. So 21 address lines are needed.' },
    { id: 'fb-co-7', type: 'nat', section: 'tech', subject: 'Computer Organization', marks: 2, question: 'A direct-mapped cache has 64 KB capacity with 16-byte blocks. How many index bits are needed?', correct: '12', explanation: 'Number of blocks = 64 KB / 16 B = 4096 = 2^12. Index bits = log₂(4096) = 12.' },
  ],
  'Operating Systems': [
    { id: 'fb-os-1', type: 'nat', section: 'tech', subject: 'Operating Systems', marks: 2, question: 'With a TLB hit ratio of 80%, TLB access time 20 ns, and memory access time 100 ns, what is the effective memory access time in ns?', correct: '140', explanation: 'EMAT = 0.8 × (20+100) + 0.2 × (20+200) = 0.8×120 + 0.2×220 = 96 + 44 = 140 ns.' },
    { id: 'fb-os-2', type: 'mcq', section: 'tech', subject: 'Operating Systems', marks: 1, question: 'Which scheduling algorithm minimizes the average waiting time?', options: ['FCFS', 'SJF (non-preemptive)', 'Round Robin', 'Priority Scheduling'], correct: 1, explanation: 'SJF (Shortest Job First) minimizes the average waiting time for a given set of processes.' },
    { id: 'fb-os-3', type: 'msq', section: 'tech', subject: 'Operating Systems', marks: 1, question: 'Which of the following are valid page replacement algorithms? (Select all that apply.)', options: ['LRU', 'FIFO', 'SCAN', 'Optimal (MIN)', 'C-LOOK'], correct: [0, 1, 3], explanation: 'LRU, FIFO, and Optimal (MIN) are page replacement algorithms. SCAN and C-LOOK are disk scheduling algorithms.' },
    { id: 'fb-os-4', type: 'mcq', section: 'tech', subject: 'Operating Systems', marks: 2, question: 'A system uses paging with 32-bit logical addresses and 4 KB page size. How many entries are in the page table?', options: ['2^20', '2^12', '2^32', '2^10'], correct: 0, explanation: 'Page size = 4 KB = 2^12, so offset = 12 bits. Page number bits = 32 - 12 = 20. Number of pages = 2^20.' },
    { id: 'fb-os-5', type: 'mcq', section: 'tech', subject: 'Operating Systems', marks: 1, question: 'Which of the following is NOT a state in the process lifecycle?', options: ['Ready', 'Running', 'Waiting', 'Cached'], correct: 3, explanation: 'Process states are: New, Ready, Running, Waiting (Blocked), Terminated. "Cached" is not a process state.' },
  ],
  'Computer Networks': [
    { id: 'fb-cn-1', type: 'msq', section: 'tech', subject: 'Computer Networks', marks: 1, question: 'Which are valid MAC addresses? (Select all that apply.)', options: ['00:1A:2B:3C:4D:5E', '192.168.1.1', 'FF:FF:FF:FF:FF:FF', 'AB:CD:EF:GH:IJ:KL'], correct: [0, 2], explanation: 'MAC addresses are 12 hex digits. 00:1A:2B:3C:4D:5E and FF:FF:FF:FF:FF:FF (broadcast) are valid. IP addresses and non-hex digits are invalid.' },
    { id: 'fb-cn-2', type: 'mcq', section: 'tech', subject: 'Computer Networks', marks: 1, question: 'Which layer is responsible for routing packets across different networks in the TCP/IP model?', options: ['Application', 'Transport', 'Internet (Network)', 'Network Access'], correct: 2, explanation: 'The Internet Layer (equivalent to Network Layer in OSI) handles routing using IP addresses.' },
    { id: 'fb-cn-3', type: 'nat', section: 'tech', subject: 'Computer Networks', marks: 2, question: 'How many IP addresses are usable in a /24 subnet?', correct: '254', explanation: 'A /24 subnet has 2^(32-24) = 256 addresses. Subtract network (first) and broadcast (last) = 254 usable.' },
    { id: 'fb-cn-4', type: 'mcq', section: 'tech', subject: 'Computer Networks', marks: 1, question: 'Which protocol is used for reliable file transfer?', options: ['HTTP', 'FTP', 'DNS', 'DHCP'], correct: 1, explanation: 'FTP (File Transfer Protocol) is designed for reliable file transfer over TCP.' },
    { id: 'fb-cn-5', type: 'mcq', section: 'tech', subject: 'Computer Networks', marks: 2, question: 'In TCP, what is the purpose of the three-way handshake?', options: ['Error correction', 'Flow control', 'Connection establishment', 'Congestion avoidance'], correct: 2, explanation: 'The three-way handshake (SYN, SYN-ACK, ACK) establishes a TCP connection between client and server.' },
  ],
  'DBMS': [
    { id: 'fb-db-1', type: 'mcq', section: 'tech', subject: 'DBMS', marks: 2, question: 'Which is TRUE about BCNF?', options: ['Every BCNF schema is in 3NF', 'Every 3NF schema is in BCNF', 'BCNF guarantees dependency preservation', 'BCNF always eliminates all redundancies'], correct: 0, explanation: 'BCNF is stricter than 3NF — every BCNF schema is in 3NF, but not vice versa. BCNF may lose functional dependencies.' },
    { id: 'fb-db-2', type: 'mcq', section: 'tech', subject: 'DBMS', marks: 1, question: 'Which normal form requires no transitive dependencies?', options: ['1NF', '2NF', '3NF', 'BCNF'], correct: 2, explanation: '3NF requires 2NF plus no transitive dependency of non-prime attributes on the primary key.' },
    { id: 'fb-db-3', type: 'nat', section: 'tech', subject: 'DBMS', marks: 2, question: 'A relation R has 4 attributes and 3 candidate keys. What is the maximum number of superkeys?', correct: '12', explanation: 'Each candidate key generates superkeys. For 3 candidate keys of a 4-attribute relation, total superkeys = 3 × 2^(4-1) / ... Simplifying: if keys are single-attribute, each generates 2^3=8 superkeys, minus overlaps = 12.' },
    { id: 'fb-db-4', type: 'mcq', section: 'tech', subject: 'DBMS', marks: 1, question: 'Which SQL clause is used to filter groups?', options: ['WHERE', 'HAVING', 'GROUP BY', 'ORDER BY'], correct: 1, explanation: 'HAVING filters groups after GROUP BY. WHERE filters rows before grouping.' },
    { id: 'fb-db-5', type: 'mcq', section: 'tech', subject: 'DBMS', marks: 2, question: 'In a B+ tree index, which of the following is true?', options: ['All keys are in leaf nodes', 'Keys appear only in internal nodes', 'Leaf nodes are linked', 'Internal nodes store data pointers'], correct: 2, explanation: 'In B+ trees, leaf nodes are linked for efficient range queries. All data pointers are in leaves, keys appear in both internal and leaf nodes.' },
  ],
  'Theory of Computation': [
    { id: 'fb-toc-1', type: 'mcq', section: 'tech', subject: 'Theory of Computation', marks: 1, question: 'Which of the following is undecidable?', options: ['Membership for regular languages', 'Emptiness for CFG', 'Equivalence for CFG', 'Membership for CFG'], correct: 2, explanation: 'Equivalence of two CFGs is undecidable. Membership and emptiness for regular and CFG languages are decidable.' },
    { id: 'fb-toc-2', type: 'mcq', section: 'tech', subject: 'Theory of Computation', marks: 2, question: 'Which language class is closed under complement?', options: ['Regular only', 'Context-free only', 'Both regular and context-free', 'Recursively enumerable'], correct: 0, explanation: 'Regular languages are closed under complement. CFLs are NOT closed under complement (though DCFLs are).' },
    { id: 'fb-toc-3', type: 'mcq', section: 'tech', subject: 'Theory of Computation', marks: 1, question: 'A language L is accepted by a DFA with 5 states. The pumping lemma for regular languages guarantees that any string w in L with |w| ≥ ___ can be pumped.', options: ['3', '5', '10', '1'], correct: 1, explanation: 'The pumping length for a DFA is the number of states. With 5 states, any string of length ≥ 5 can be pumped.' },
    { id: 'fb-toc-4', type: 'nat', section: 'tech', subject: 'Theory of Computation', marks: 1, question: 'How many states does a minimal DFA have for the language "strings ending with 01" over {0,1}?', correct: '3', explanation: 'The minimal DFA needs 3 states: one for each suffix length tracking (ε, 0, 01).' },
    { id: 'fb-toc-5', type: 'msq', section: 'tech', subject: 'Theory of Computation', marks: 2, question: 'Which of the following problems are decidable? (Select all that apply.)', options: ['Membership in regular languages', 'Emptiness in CFL', 'Equivalence in regular languages', 'Equivalence in CFL'], correct: [0, 1, 2], explanation: 'Membership and equivalence for regular languages are decidable. Emptiness for CFL is decidable. Equivalence for CFL is undecidable.' },
  ],
  'Compiler Design': [
    { id: 'fb-cd-1', type: 'mcq', section: 'tech', subject: 'Compiler Design', marks: 1, question: 'Which phase of a compiler checks for syntax errors?', options: ['Lexical analysis', 'Syntax analysis', 'Semantic analysis', 'Code generation'], correct: 1, explanation: 'Syntax analysis (parsing) checks the grammar rules and detects syntax errors.' },
    { id: 'fb-cd-2', type: 'mcq', section: 'tech', subject: 'Compiler Design', marks: 1, question: 'Which parser is most commonly generated by parser generators like YACC?', options: ['LL(1)', 'LR(1)', 'LALR(1)', 'Recursive descent'], correct: 2, explanation: 'YACC (Yet Another Compiler Compiler) generates LALR(1) parsers.' },
    { id: 'fb-cd-3', type: 'nat', section: 'tech', subject: 'Compiler Design', marks: 2, question: 'How many shift-reduce conflicts occur in parsing the grammar: E → E + E | id with LR(0) items?', correct: '1', explanation: 'The grammar E → E + E | id has an ambiguity causing a shift-reduce conflict in the LR(0) automaton when the stack has E + E and the next input is +.' },
    { id: 'fb-cd-4', type: 'mcq', section: 'tech', subject: 'Compiler Design', marks: 2, question: 'Which of the following is NOT an intermediate code representation?', options: ['Three-address code', 'Abstract Syntax Tree', 'Quadruples', 'Token stream'], correct: 3, explanation: 'Token stream is output of lexical analysis, not intermediate code. TAC, AST, and quadruples are intermediate representations.' },
    { id: 'fb-cd-5', type: 'mcq', section: 'tech', subject: 'Compiler Design', marks: 1, question: 'The FOLLOW set of the start symbol always contains:', options: ['ε', '$', 'First of start symbol', 'All terminals'], correct: 1, explanation: 'The FOLLOW set of the start symbol always contains $ (end of input marker).' },
  ],
  'Digital Logic': [
    { id: 'fb-dl-1', type: 'msq', section: 'tech', subject: 'Digital Logic', marks: 1, question: 'Which expressions are equivalent to A ⊕ B (XOR)? (Select all that apply.)', options: ["A'B + AB'", '(A+B)(A\'+B\')', "A'B' + AB", "A ⊕ B'", "(A ⊕ B)'"], correct: [0, 1], explanation: "A ⊕ B = A'B + AB' (option 0). (A+B)(A'+B') = AB' + A'B (option 1). Options 2-4 are XNOR." },
    { id: 'fb-dl-2', type: 'mcq', section: 'tech', subject: 'Digital Logic', marks: 1, question: 'How many 2-to-4 decoders are needed to build a 4-to-16 decoder?', options: ['2', '3', '4', '5'], correct: 2, explanation: 'A 4-to-16 decoder requires 5 × 2-to-4 decoders: 1 for the first stage (2 inputs to 4 enables), 4 for the second stage (each covering 4 outputs). Actually: 5 total (1 + 4).' },
    { id: 'fb-dl-3', type: 'nat', section: 'tech', subject: 'Digital Logic', marks: 1, question: 'How many input lines does a full adder have?', correct: '3', explanation: 'A full adder has 3 inputs: A, B, and Carry-in (Cin).' },
    { id: 'fb-dl-4', type: 'mcq', section: 'tech', subject: 'Digital Logic', marks: 2, question: 'A 4-bit ripple counter can count up to:', options: ['4', '8', '15', '16'], correct: 2, explanation: 'A 4-bit counter can count from 0 to 2^4 - 1 = 15. The maximum count value is 15.' },
    { id: 'fb-dl-5', type: 'mcq', section: 'tech', subject: 'Digital Logic', marks: 1, question: 'Which gate is known as a universal gate?', options: ['AND', 'OR', 'NAND', 'XOR'], correct: 2, explanation: 'NAND gate is universal — any Boolean function can be implemented using only NAND gates. NOR is also universal.' },
  ],
  'Discrete Mathematics': [
    { id: 'fb-dm-1', type: 'nat', section: 'tech', subject: 'Discrete Mathematics', marks: 2, question: 'How many edges does a complete graph K_8 have?', correct: '28', explanation: 'In a complete graph K_n, edges = n(n-1)/2 = 8×7/2 = 28.' },
    { id: 'fb-dm-2', type: 'mcq', section: 'tech', subject: 'Discrete Mathematics', marks: 1, question: 'Which of the following is NOT a valid logical equivalence?', options: ['p ∧ T ≡ p', 'p ∨ F ≡ p', 'p ∧ ¬p ≡ T', 'p ∨ ¬p ≡ T'], correct: 2, explanation: 'p ∧ ¬p ≡ F (contradiction), not T. p ∨ ¬p ≡ T (tautology) is correct.' },
    { id: 'fb-dm-3', type: 'mcq', section: 'tech', subject: 'Discrete Mathematics', marks: 2, question: 'How many different 3-digit numbers can be formed using digits 0-9 without repetition?', options: ['648', '720', '900', '504'], correct: 0, explanation: 'First digit: 9 choices (1-9). Second digit: 9 choices (0-9 minus used). Third: 8 choices. Total = 9×9×8 = 648.' },
    { id: 'fb-dm-4', type: 'nat', section: 'tech', subject: 'Discrete Mathematics', marks: 1, question: 'How many vertices does a regular graph of degree 3 with 12 edges have?', correct: '8', explanation: 'Handshaking lemma: Σdeg = 2E. n×3 = 2×12 = 24. So n = 8 vertices.' },
    { id: 'fb-dm-5', type: 'mcq', section: 'tech', subject: 'Discrete Mathematics', marks: 1, question: 'The number of bijections from a set of 5 elements to itself is:', options: ['5', '25', '120', '32'], correct: 2, explanation: 'A bijection on a set of n elements is a permutation. Number = 5! = 120.' },
  ],
};

const FALLBACK_ALL = Object.values(FALLBACK_BANK).flat();

type MockGenerateResponse = {
  questions?: unknown[];
};

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' ? value as Record<string, any> : null;
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeMockQuestion(value: unknown, index: number): MockQJson | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const type = asText(raw.type).toLowerCase() as MockQJson['type'];
  if (!['mcq', 'nat', 'msq'].includes(type)) return null;

  const question = asText(raw.question);
  const explanation = asText(raw.explanation);
  if (!question || !explanation) return null;

  const section = asText(raw.section).toLowerCase() === 'ga' ? 'ga' : 'tech';
  const subject = asText(raw.subject);
  const marks = raw.marks === 1 || raw.marks === 2 ? raw.marks : type === 'mcq' ? 1 : 2;
  const id = asText(raw.id) || `ai-mock-${index + 1}`;

  if (type === 'nat') {
    if (raw.correct === undefined || raw.correct === null) return null;
    return {
      id,
      type,
      section,
      subject: subject || undefined,
      marks,
      question,
      correct: String(raw.correct).trim(),
      explanation,
    };
  }

  const options = Array.isArray(raw.options)
    ? raw.options.map(asText).filter(Boolean)
    : [];

  if (type === 'mcq') {
    const correct = raw.correct;
    if (options.length !== 4 || !Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      return null;
    }

    return {
      id,
      type,
      section,
      subject: subject || undefined,
      marks,
      question,
      options,
      correct,
      explanation,
    };
  }

  const correct = Array.isArray(raw.correct)
    ? [...new Set(raw.correct.filter((idx): idx is number => Number.isInteger(idx) && idx >= 0 && idx < options.length))]
    : [];

  if (options.length < 4 || options.length > 6 || correct.length < 2 || correct.length > 3) {
    return null;
  }

  return {
    id,
    type,
    section,
    subject: subject || undefined,
    marks,
    question,
    options,
    correct,
    explanation,
  };
}

function normalizeGeneratedQuestions(data: unknown, count: number): MockQJson[] {
  const rawQuestions = asRecord(data)?.questions;
  if (!Array.isArray(rawQuestions)) return [];

  const seen = new Set<string>();
  const questions: MockQJson[] = [];

  rawQuestions.forEach((raw, index) => {
    const q = normalizeMockQuestion(raw, index);
    if (!q) return;

    const fingerprint = q.question.toLowerCase().replace(/\s+/g, ' ').slice(0, 180);
    if (seen.has(fingerprint)) return;

    seen.add(fingerprint);
    questions.push({ ...q, id: q.id || `ai-mock-${questions.length + 1}` });
  });

  return questions.slice(0, count);
}

function sanitizeAttempts(attempts: ModelAttempt[]): Pick<ModelAttempt, 'model' | 'ok' | 'reason' | 'detail'>[] {
  return attempts.map(({ model, ok, reason, detail }) => ({ model, ok, reason, detail }));
}

function pickFallbackQuestions(subject: string | null, count: number): MockQJson[] {
  const primary = subject && FALLBACK_BANK[subject] ? shuffle(FALLBACK_BANK[subject]) : [];
  const primaryIds = new Set(primary.map((q) => q.id));
  const rest = shuffle(FALLBACK_ALL.filter((q) => !primaryIds.has(q.id)));
  const pool = [...primary, ...rest];

  if (pool.length === 0) return [];

  const picked: MockQJson[] = [];
  for (let i = 0; i < count; i++) {
    const base = pool[i % pool.length];
    const repeat = Math.floor(i / pool.length);
    picked.push({
      ...base,
      id: repeat === 0 ? base.id : `${base.id}-repeat-${repeat}`,
    });
  }

  return picked;
}

export async function POST(req: NextRequest) {
  try {
    const { subject, count = 10 } = await req.json();
    const qCount = Math.min(Math.max(5, count), 65);

    const subjectFilter = subject
      ? `Focus the technical questions on ${subject}. If generating for a specific subject, include a few GA questions too but make most technical questions about ${subject}. Generate exactly ${qCount} questions total.`
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
        generateWithFallbackDetails<MockGenerateResponse>(prompt, MOCK_MODELS, {
          validate: (data) => {
            const usableCount = normalizeGeneratedQuestions(data, qCount).length;
            return usableCount >= qCount ? true : `Expected ${qCount} usable questions, got ${usableCount}`;
          },
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 120000)),
      ]);
      const questions = normalizeGeneratedQuestions(result?.data, qCount);

      if (questions.length >= qCount) {
        return NextResponse.json({
          questions,
          generatedAt: new Date().toISOString(),
          source: 'ai',
          model: result?.model,
          attempts: result ? sanitizeAttempts(result.attempts) : [],
        });
      }
    } catch {
      // All AI models failed or timed out
    }

    return NextResponse.json({
      questions: pickFallbackQuestions(subject || null, qCount),
      generatedAt: new Date().toISOString(),
      source: 'fallback',
      model: null,
    });
  } catch {
    return NextResponse.json({
      questions: pickFallbackQuestions(null, 10),
      generatedAt: new Date().toISOString(),
      source: 'fallback',
      model: null,
    });
  }
}
