// Terms of Service — template copy. Edit before legal review.
// Routes: /terms

import { useSeo } from '@/hooks/useSeo';

const Terms = () => {
  useSeo({
    title: 'Terms of Service — Clinical Trial Diversity Studio',
    description:
      'Terms governing use of Clinical Trial Diversity Studio — an information tool built on public ClinicalTrials.gov data.',
    canonical: '/terms',
  });

  return (
    <article className="max-w-3xl mx-auto px-6 md:px-10 py-12 prose prose-sm">
      <header className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Legal</p>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold leading-tight tracking-tight">
          Terms of Service
        </h1>
        <p className="text-[13px] text-muted-foreground mt-3">
          Last updated: April 26, 2026 · Effective immediately upon use.
        </p>
      </header>

      <section className="space-y-6 text-[14.5px] leading-relaxed text-foreground/90">
        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">1. Acceptance</h2>
          <p>
            By accessing Clinical Trial Diversity Studio (the "Service"), you agree to these Terms.
            If you do not agree, do not use the Service. We may update these Terms at any time;
            continued use after changes are posted constitutes acceptance.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">2. What this Service is</h2>
          <p>
            The Service is an independent information tool that searches and reformats data from the
            public U.S. National Library of Medicine ClinicalTrials.gov registry (the "Registry").
            We are not affiliated with, endorsed by, or operated by NIH, NLM, the U.S. government,
            or any trial sponsor. The Registry remains the authoritative source of trial information.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">3. No medical advice</h2>
          <p>
            The Service is for informational and educational purposes only. Nothing on the Service
            constitutes medical advice, diagnosis, treatment, or a recommendation to enroll or not
            enroll in any clinical trial. AI-generated plain-language summaries and eligibility
            self-checks are best-effort interpretations and may contain errors. Always consult a
            qualified healthcare professional and verify all information directly with the trial
            site and on ClinicalTrials.gov before making any health decision.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">4. Acceptable use</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Do not scrape, mirror, or resell the Service or its outputs at scale.</li>
            <li>Do not upload protected health information (PHI), names of identifiable individuals, or anything you do not have the right to share.</li>
            <li>Do not attempt to bypass rate limits or access restrictions.</li>
            <li>Do not use the Service to harm, harass, or mislead patients or trial sites.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">5. AI-generated content</h2>
          <p>
            Plain-language rewrites and document eligibility self-checks are produced by large
            language models. They may misinterpret eligibility criteria, miss exclusions, or
            paraphrase numbers inaccurately. Treat them as a starting point, never as the final
            word. Decisions about trial enrollment must be made with the trial team using the
            authoritative protocol and the original ClinicalTrials.gov record.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">6. Documents you upload</h2>
          <p>
            When you use the optional eligibility self-check, files you select are sent to our
            AI provider for analysis and discarded immediately after the response is returned.
            We do not retain your documents on our servers. Do not upload documents containing
            information you are not comfortable sending to a third-party AI provider.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">7. No warranty</h2>
          <p>
            The Service is provided "as is" without warranty of any kind, express or implied,
            including but not limited to merchantability, fitness for a particular purpose,
            non-infringement, or the accuracy, currency, or completeness of any information.
            Trial information may be out of date relative to ClinicalTrials.gov; verify timestamps.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">8. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, we shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages, or any loss of health
            outcomes, profits, or data, arising from your use of or inability to use the Service.
            Total liability for any claim shall not exceed USD 100.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">9. Third-party services</h2>
          <p>
            The Service relies on ClinicalTrials.gov, AI gateway providers, and analytics tools.
            Their availability and accuracy are outside our control. Outbound links to trial
            sponsor sites are provided for convenience and do not imply endorsement.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">10. Termination</h2>
          <p>
            We may suspend or terminate access to the Service at any time, for any reason,
            without notice.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">11. Governing law</h2>
          <p>
            These Terms are governed by the laws of the State of Delaware, USA, without regard
            to its conflict-of-laws provisions. Any dispute will be resolved in the state or
            federal courts located in Delaware.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">12. Contact</h2>
          <p>
            Questions: open an issue at the project's public repository, or reach the maintainer
            via the link in the site footer.
          </p>
        </div>

        <p className="text-[12px] text-muted-foreground italic pt-4 border-t border-border">
          This is template language drafted for an MVP information tool. It is not a substitute
          for legal counsel. Have an attorney review before scaling beyond a small audience.
        </p>
      </section>
    </article>
  );
};

export default Terms;
