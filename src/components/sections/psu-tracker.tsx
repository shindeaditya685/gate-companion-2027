'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ExternalLink, Calendar, FileText, Clock, AlertCircle, BookOpen, Award } from 'lucide-react';
import { PSU_EXAMS } from '@/lib/data';

export function PSUTrackerView() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            PSU Exam Tracker
          </CardTitle>
          <CardDescription className="mt-1">
            Four parallel targets. GATE is your anchor &mdash; ISRO, BARC, NIC remain live even if GATE underperforms.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Exam cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {PSU_EXAMS.map((exam) => (
          <Card key={exam.id} className={`border-2 ${exam.color}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-lg">{exam.name}</CardTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exam.conductingBody}</p>
                </div>
                <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                  <a href={exam.officialSite} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-start gap-1.5">
                  <Calendar className="h-3.5 w-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Notification</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{exam.notificationMonth}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <FileText className="h-3.5 w-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Exam</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{exam.examMonth}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <Clock className="h-3.5 w-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Duration</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{exam.duration}</p>
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <Award className="h-3.5 w-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Interview Weight</p>
                    <p className="text-slate-800 dark:text-slate-200 font-medium">{exam.interviewWeight}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Pattern</p>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{exam.totalQuestions} Q · {exam.maxMarks} marks</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Neg: {exam.negativeMarking}</p>
                </div>
                <div>
                  <p className="text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Entry</p>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{exam.entryRoute}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Syllabus: {exam.syllabusDelta}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exam-specific strategies */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" /> BARC Interview (80% weight)
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <p>The interview decides your offer. 60-90 minutes, 4-6 senior scientists.</p>
            <p><strong>Prepare:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>10-min B.Tech project walkthrough (architecture, design, alternatives)</li>
              <li>10-min M.Tech thesis walkthrough</li>
              <li>4 core CS subjects in depth (recommend: Algo + OS + DBMS + CN)</li>
              <li>20 likely interview questions per subject, rehearse answers aloud</li>
            </ul>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 font-medium">
              If you don&rsquo;t know an answer, say so &mdash; bluffing is immediately detected.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" /> ISRO Speed Strategy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <p>80 questions in 90 min = 67 sec/question. Skip long numericals in pass 1.</p>
            <p><strong>Post-GATE prep (4-5 weeks):</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Solve last 10 years ISRO PYQs</li>
              <li>8 full-length mocks under 90-min constraint</li>
              <li>Re-revise Digital Logic, COA, Math short notes</li>
              <li>Target: 65+ attempted with 85%+ accuracy</li>
            </ul>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-2 font-medium">
              Higher weight on DL/COA/Math &mdash; do not skip these.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-violet-700 dark:text-violet-400">
              <AlertCircle className="h-4 w-4" /> NIC Syllabus Delta
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <p>NIC extends GATE CS with extra topics. 6-8 weeks post-GATE prep needed.</p>
            <p><strong>New topics to learn:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Software Engineering (SDLC, agile, testing) &mdash; 8-10 Q</li>
              <li>Web Technologies (HTML, CSS, JS, frameworks) &mdash; 5-7 Q</li>
              <li>Cloud + emerging tech (AI/ML basics, IoT, blockchain)</li>
              <li>Information systems / IT governance (ITIL basics)</li>
              <li>Aptitude section: 20 marks &mdash; do not skip!</li>
            </ul>
            <p className="text-xs text-violet-700 dark:text-violet-400 mt-2 font-medium">
              Read up on Aadhaar, UPI, DigiLocker, eHospital &mdash; NIC flagship projects.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notification watchlist */}
      <Card className="bg-slate-50 dark:bg-slate-900/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-600" /> Notification Watchlist
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 dark:text-slate-300">
          <p className="mb-3">
            Set up email alerts on <a href="https://www.freejobalert.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline inline-flex items-center gap-0.5">FreeJobAlert.com <ExternalLink className="h-3 w-3" /></a> and subscribe to the official sites above. Missing a notification is the single most common reason eligible candidates do not appear.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {PSU_EXAMS.map((e) => (
              <div key={e.id} className="p-2.5 rounded-md bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{e.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Watch: {e.notificationMonth}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
