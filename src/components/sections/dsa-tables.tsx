'use client';

const SORTING = [
  ['Bubble Sort', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'T(n)=T(n-1)+(n-1)', '✅', '✅', 'Adaptive with flag'],
  ['Selection Sort', 'O(n²)', 'O(n²)', 'O(n²)', 'O(1)', 'T(n)=n(n-1)/2', '❌', '✅', 'Minimum swaps'],
  ['Insertion Sort', 'O(n)', 'O(n²)', 'O(n²)', 'O(1)', 'T(n)=T(n-1)+n', '✅', '✅', 'Best for nearly sorted arrays'],
  ['Merge Sort', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(n)', 'T(n)=2T(n/2)+n', '✅', '❌', 'Divide & Conquer'],
  ['Quick Sort', 'O(n log n)', 'O(n log n)', 'O(n²)', 'O(log n)', 'T(n)=T(k)+T(n-k-1)+n', '❌', '✅', 'Worst when pivot is smallest/largest'],
  ['Heap Sort', 'O(n log n)', 'O(n log n)', 'O(n log n)', 'O(1)', 'Build Heap + n·Heapify', '❌', '✅', 'Uses Binary Heap'],
  ['Counting Sort', 'O(n+k)', 'O(n+k)', 'O(n+k)', 'O(k)', 'T(n)=n+k', '✅', '❌', 'Only integers'],
  ['Radix Sort', 'O(d(n+k))', 'O(d(n+k))', 'O(d(n+k))', 'O(n+k)', 'd passes of Counting Sort', '✅', '❌', 'Digit-wise'],
  ['Bucket Sort', 'O(n+k)', 'O(n+k)', 'O(n²)', 'O(n+k)', 'Distribution + Sort Buckets', 'Depends', '❌', 'Uniform distribution'],
];

const SEARCHING = [
  ['Linear Search', 'O(1)', 'O(n)', 'O(n)', 'O(1)', 'Sequential search', 'Works on unsorted array'],
  ['Binary Search', 'O(1)', 'O(log n)', 'O(log n)', 'O(1)', 'T(n)=T(n/2)+1', 'Sorted array required'],
  ['Jump Search', 'O(1)', 'O(√n)', 'O(√n)', 'O(1)', 'Jump √n blocks', 'Sorted array'],
  ['Interpolation Search', 'O(1)', 'O(log log n)', 'O(n)', 'O(1)', 'Interpolation formula', 'Uniform distribution'],
  ['Exponential Search', 'O(1)', 'O(log n)', 'O(log n)', 'O(1)', 'Double index + Binary Search', 'Infinite / unbounded arrays'],
];

const GRAPH = [
  ['BFS', 'O(V+E)', 'O(V+E)', 'O(V+E)', 'O(V)', 'Queue', 'Unweighted shortest path'],
  ['DFS', 'O(V+E)', 'O(V+E)', 'O(V+E)', 'O(V)', 'Stack / Recursion', 'Cycle detection'],
  ['Dijkstra', 'O((V+E)log V)', 'Same', 'Same', 'O(V)', 'Priority Queue', 'Positive weights only'],
  ['Bellman-Ford', 'O(VE)', 'O(VE)', 'O(VE)', 'O(V)', 'Relax V−1 times', 'Handles negative weights'],
  ['Floyd-Warshall', 'O(V³)', 'O(V³)', 'O(V³)', 'O(V²)', 'DP', 'All-pairs shortest path'],
  ['Prim', 'O(E log V)', 'Same', 'Same', 'O(V)', 'Greedy / MST', ''],
  ['Kruskal', 'O(E log E)', 'Same', 'Same', 'O(V)', 'Union-Find / MST', ''],
  ['Topological Sort', 'O(V+E)', 'Same', 'Same', 'O(V)', 'DFS / Kahn', 'DAG only'],
  ['Kosaraju SCC', 'O(V+E)', 'Same', 'Same', 'O(V)', 'Two DFS passes', 'Strongly Connected Components'],
  ['Tarjan SCC', 'O(V+E)', 'Same', 'Same', 'O(V)', 'Single DFS', 'Low values'],
  ['Tarjan Bridges', 'O(V+E)', 'Same', 'Same', 'O(V)', 'Low values', 'Bridge detection'],
  ['Tarjan Articulation Points', 'O(V+E)', 'Same', 'Same', 'O(V)', 'Low values', 'Cut vertices'],
];

const DP = [
  ['Fibonacci DP', 'O(n)', 'O(n)', 'dp[i]=dp[i-1]+dp[i-2]', 'Memoization / Tabulation'],
  ['0/1 Knapsack', 'O(nW)', 'O(nW)', 'dp[w]=max(dp[w], dp[w-wᵢ]+vᵢ)', 'Very common in GATE'],
  ['Matrix Chain Multiplication', 'O(n³)', 'O(n²)', 'dp[i][j]=min(dp[i][k]+dp[k+1][j]+pᵢ₋₁pₖpⱼ)', 'Parenthesization'],
  ['Longest Common Subsequence', 'O(mn)', 'O(mn)', 'dp[i][j]=1+dp[i-1][j-1] if match else max(...)', 'String problems'],
  ['Longest Increasing Subsequence', 'O(n log n)', 'O(n)', 'Binary Search on tails', 'Frequently asked'],
  ['Edit Distance', 'O(mn)', 'O(mn)', 'min(insert, delete, substitute)', 'String conversion'],
  ['Coin Change', 'O(n·amount)', 'O(amount)', 'dp[a]=min(dp[a], dp[a-coin]+1)', 'Unbounded'],
  ['Rod Cutting', 'O(n²)', 'O(n)', 'dp[i]=max(dp[i], price[j]+dp[i-j-1])', 'Revenue maximization'],
];

const GREEDY = [
  ['Activity Selection', 'O(n log n)', 'O(1)', 'Sort by finish time'],
  ['Huffman Coding', 'O(n log n)', 'O(n)', 'Min Heap'],
  ['Fractional Knapsack', 'O(n log n)', 'O(1)', 'Ratio sorting'],
  ['Job Sequencing', 'O(n log n)', 'O(n)', 'Profit maximization'],
  ['Prim', 'O(E log V)', 'O(V)', 'MST'],
  ['Kruskal', 'O(E log E)', 'O(V)', 'MST'],
];

const STRING = [
  ['Naive Pattern Matching', 'O(nm)', 'O(1)', 'Brute force'],
  ['KMP', 'O(n+m)', 'O(m)', 'LPS Array. No backtracking'],
  ['Rabin-Karp', 'O(n+m) Avg / O(nm) Worst', 'O(1)', 'Rolling Hash'],
  ['Boyer-Moore', 'O(n/m) Avg', 'O(m)', 'Fast practical'],
  ['Z Algorithm', 'O(n)', 'O(n)', 'Pattern matching'],
  ['Trie Search', 'O(L)', 'O(ALPHABET×N)', 'Prefix search'],
];

const HEAP = [
  ['Build Heap', 'O(n)', '', ''],
  ['Insert', 'O(log n)', '', ''],
  ['Delete', 'O(log n)', '', ''],
  ['Extract Min/Max', 'O(log n)', '', ''],
  ['Heapify', 'O(log n)', '', ''],
  ['Peek', 'O(1)', '', ''],
];

const BST = [
  ['Search', 'O(log n)', 'O(log n)', 'O(n)'],
  ['Insert', 'O(log n)', 'O(log n)', 'O(n)'],
  ['Delete', 'O(log n)', 'O(log n)', 'O(n)'],
];

const TREES = [
  ['AVL Tree', 'O(log n)', 'O(log n)', 'O(log n)', 'O(1) rotations'],
  ['Red-Black Tree', 'O(log n)', 'O(log n)', 'O(log n)', ''],
];

const UNION_FIND = [
  ['Find', 'O(α(n))', 'α(n) = Inverse Ackermann (effectively constant). Path Compression + Union by Rank'],
  ['Union', 'O(α(n))', ''],
];

const D_C = [
  ['Merge Sort', 'O(n log n)'],
  ['Quick Sort', 'Avg O(n log n), Worst O(n²)'],
  ['Binary Search', 'O(log n)'],
  ['Closest Pair of Points', 'O(n log n)'],
  ['Strassen Matrix Multiplication', 'O(n^2.807)'],
];

const BACKTRACKING = [
  ['N Queens', 'O(n!)'],
  ['Sudoku Solver', 'Exponential'],
  ['Rat in Maze', 'O(2^(nm))'],
  ['Hamiltonian Cycle', 'O(n!)'],
  ['Graph Coloring', 'O(m^V)'],
];

const MISC = [
  ['Euclid GCD', 'O(log(min(a,b)))', 'Number Theory'],
  ['Fast Exponentiation', 'O(log n)', 'Binary Exponentiation'],
  ['Sieve of Eratosthenes', 'O(n log log n)', 'Prime numbers'],
  ['Prefix Sum', 'O(n) preprocess / O(1) query', 'Range queries'],
  ['Kadane\'s Algorithm', 'O(n)', 'Maximum subarray'],
  ['Moore\'s Voting', 'O(n)', 'Majority element'],
  ['Two Pointers', 'O(n)', 'Sorted arrays'],
  ['Sliding Window', 'O(n)', 'Subarray problems'],
];

const RECURRENCES: [string, string][] = [
  ['Binary Search', 'T(n)=T(n/2)+1'],
  ['Merge Sort', 'T(n)=2T(n/2)+n'],
  ['Quick Sort (Avg)', 'T(n)=2T(n/2)+n'],
  ['Quick Sort (Worst)', 'T(n)=T(n-1)+n'],
  ['Heap Sort', 'Build Heap + n·Heapify'],
  ['Matrix Chain Multiplication', 'DP Recurrence'],
  ['Floyd-Warshall', 'dp[k][i][j]=min(dp[k-1][i][j], dp[k-1][i][k]+dp[k-1][k][j])'],
  ['Bellman-Ford', 'Relax all edges (V-1) times'],
  ['Dijkstra', 'Greedy + Priority Queue'],
  ['BFS / DFS', 'O(V+E)'],
];

const PRIORITY: [string, string][] = [
  ['⭐⭐⭐⭐⭐', 'Merge Sort, Quick Sort, Heap Sort, Binary Search, BFS, DFS, Dijkstra, Kruskal, Prim, Topological Sort, LCS, Knapsack, Matrix Chain Multiplication'],
  ['⭐⭐⭐⭐', 'KMP, Rabin-Karp, Trie, AVL Tree, Red-Black Tree, Union-Find, Bellman-Ford, Floyd-Warshall'],
  ['⭐⭐⭐', 'Bucket Sort, Radix Sort, Counting Sort, Exponential Search, Fibonacci Search, Activity Selection, Huffman Coding'],
  ['⭐⭐', 'Tarjan, Kosaraju, Closest Pair, Strassen Matrix Multiplication'],
  ['⭐', 'Specialized or less frequent algorithms'],
];

function Table({ title, headers, rows, colSpans }: {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  colSpans?: number[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
        {title}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/50">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                  <span className={ci === 0 ? 'font-semibold text-slate-900 dark:text-slate-50' : ''}>
                    {cell}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DSATables() {
  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-500 dark:text-slate-400">
        GATE CSE Algorithms + Data Structures reference tables.
      </div>

      <Table title="1. Sorting Algorithms" headers={['Algorithm', 'Best', 'Average', 'Worst', 'Space', 'Equation', 'Stable', 'In-place', 'Notes']} rows={SORTING} />
      <Table title="2. Searching Algorithms" headers={['Algorithm', 'Best', 'Average', 'Worst', 'Space', 'Equation', 'Notes']} rows={SEARCHING} />
      <Table title="3. Graph Algorithms" headers={['Algorithm', 'Best', 'Average', 'Worst', 'Space', 'Complexity', 'Notes']} rows={GRAPH} />
      <Table title="4. Dynamic Programming" headers={['Algorithm', 'Time', 'Space', 'Equation', 'Notes']} rows={DP} />
      <Table title="5. Greedy Algorithms" headers={['Algorithm', 'Time', 'Space', 'Notes']} rows={GREEDY} />
      <Table title="6. String Algorithms" headers={['Algorithm', 'Time', 'Space', 'Notes']} rows={STRING} />
      <Table title="7. Heap Operations" headers={['Operation', 'Time']} rows={HEAP.map((r) => [r[0], r[1]])} />
      <Table title="8. BST Operations" headers={['Operation', 'Best', 'Average', 'Worst']} rows={BST} />
      <Table title="9. Balanced Trees" headers={['Tree', 'Search', 'Insert', 'Delete', 'Notes']} rows={TREES} />
      <Table title="10. Hashing" headers={['Operation', 'Average', 'Worst']} rows={[['Search', 'O(1)', 'O(n)'], ['Insert', 'O(1)', 'O(n)'], ['Delete', 'O(1)', 'O(n)']]} />
      <Table title="11. Union-Find (Disjoint Set)" headers={['Operation', 'Complexity', 'Notes']} rows={UNION_FIND} />
      <Table title="12. Divide & Conquer" headers={['Algorithm', 'Time']} rows={D_C} />
      <Table title="13. Backtracking" headers={['Algorithm', 'Worst Case']} rows={BACKTRACKING} />
      <Table title="14. Miscellaneous Algorithms" headers={['Algorithm', 'Complexity', 'Notes']} rows={MISC} />

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          ⭐ Key Recurrence Relations
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50">
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Algorithm</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Recurrence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {RECURRENCES.map(([algo, rec], i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-50 whitespace-nowrap">{algo}</td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300 font-mono">{rec}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <div className="bg-slate-100 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          ⭐ GATE Exam Priority
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50">
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Priority</th>
              <th className="px-3 py-2 text-left font-semibold text-slate-500">Topics</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {PRIORITY.map(([p, topics], i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <td className="px-3 py-2 font-semibold text-slate-900 dark:text-slate-50 whitespace-nowrap">{p}</td>
                <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{topics}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
