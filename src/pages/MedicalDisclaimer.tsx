// Medical Disclaimer — template copy.
// Routes: /medical-disclaimer

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

const MedicalDisclaimer = () => {
  usePageTitle('Medical Disclaimer — Clinical Trial Diversity Studio');

  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]');
    const prev = meta?.getAttribute('content') ?? '';
    meta?.setAttribute(
      'content',
      'Important: This site is informational only. It is not medical advice. Always consult a qualified healthcare professional.',
    );
    return () => { if (meta && prev) meta.setAttribute('content', prev); };
  }, []);

  return (
    <article className="max-w-3xl mx-auto px-6 md:px-10 py-12">
      <header className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Important</p>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold leading-tight tracking-tight">
          Medical Disclaimer
        </h1>
      </header>

      <div
        className="rounded-md border-2 p-5 mb-8 flex items-start gap-3"
        style={{ borderColor: 'hsl(0 70% 55% / 0.4)', backgroundColor: 'hsl(0 70% 96%)' }}
      >
        <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'hsl(0 70% 45%)' }} />
        <div>
          <p className="text-[15px] font-bold text-foreground mb-1">
            This is not medical advice.
          </p>
          <p className="text-[13.5px] leading-relaxed text-foreground/85">
            Clinical Trial Diversity Studio is an information tool that helps you find and
            understand publicly listed clinical trials. It cannot diagnose, treat, prescribe,
            recommend a specific trial, or tell you whether you are eligible. Always consult
            your physician before making any health-related decision.
          </p>
        </div>
      </div>

      <section className="space-y-6 text-[14.5px] leading-relaxed text-foreground/90">
        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">What this Service does</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Searches the public ClinicalTrials.gov registry using everyday language.</li>
            <li>Shows the same official trial information in plain English.</li>
            <li>Provides a checklist of documents commonly requested by trial sites.</li>
            <li>Optionally analyzes documents you upload to flag which eligibility criteria they may address.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">What this Service does NOT do</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Diagnose your condition.</li>
            <li>Recommend any specific clinical trial.</li>
            <li>Confirm whether you qualify for a trial — only the trial site can do that.</li>
            <li>Replace your doctor, oncologist, neurologist, or any other clinician.</li>
            <li>Guarantee that information is current — verify on ClinicalTrials.gov.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">About AI-generated content</h2>
          <p>
            Plain-language summaries and the document eligibility self-check are produced by
            large language models (AI). AI can:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Misinterpret medical eligibility criteria.</li>
            <li>Miss important exclusions.</li>
            <li>Round, paraphrase, or simplify numbers in ways that change meaning.</li>
            <li>Sound confident even when wrong.</li>
          </ul>
          <p className="mt-3">
            Use AI output as a <strong>starting point for conversation with your care team</strong>,
            never as the final word. The authoritative source is the original protocol on
            ClinicalTrials.gov and the trial site's enrollment team.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">Emergencies</h2>
          <p>
            If you are experiencing a medical emergency, call 911 (U.S.) or your local emergency
            number immediately. Do not use this Service for emergency care.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">Mental health</h2>
          <p>
            If you are in crisis, contact the 988 Suicide & Crisis Lifeline (U.S.) by dialing 988,
            or your local crisis service. This Service does not provide crisis support.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">No doctor-patient relationship</h2>
          <p>
            Use of this Service does not create a doctor-patient, therapist-patient, or any other
            professional relationship between you and the maintainers of this Service.
          </p>
        </div>

        <p className="text-[12px] text-muted-foreground italic pt-4 border-t border-border">
          Always verify trial information on{' '}
          <a className="underline" href="https://clinicaltrials.gov/" target="_blank" rel="noreferrer">
            ClinicalTrials.gov
          </a>{' '}before acting on it.
        </p>
      </section>
    </article>
  );
};

export default MedicalDisclaimer;
