// Privacy Policy — template copy. Edit before legal review.
// Routes: /privacy

import { useSeo } from '@/hooks/useSeo';

const Privacy = () => {
  useSeo({
    title: 'Privacy Policy — Clinical Trial Diversity Studio',
    description:
      'How Clinical Trial Diversity Studio handles search queries, uploaded documents, and anonymous usage signals.',
    canonical: '/privacy',
  });

  return (
    <article className="max-w-3xl mx-auto px-4 md:px-6 py-12">
      <header className="mb-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Legal</p>
        <h1 className="font-display text-[32px] md:text-[40px] font-bold leading-tight tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-[13px] text-muted-foreground mt-3">
          Last updated: October 27, 2026
        </p>
      </header>

      <section className="space-y-6 text-[14.5px] leading-relaxed text-foreground/90">
        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">Plain-English summary</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>We do not require an account or collect your name, email, or address.</li>
            <li>New visitor search queries, clicks, audience choices and eligibility outcomes are not saved in our application database.</li>
            <li>Trial selections and display preferences exist only while this page session is open. Reports are generated on your device and are not emailed.</li>
            <li>Documents you upload for the eligibility self-check are sent to an AI provider and discarded immediately — never stored.</li>
            <li>We share data with ClinicalTrials.gov (search forwarding) and AI providers (rewrites + checks). That's it.</li>
            <li>Do not upload anything you wouldn't paste into a public form.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">1. What we collect</h2>
          <p className="font-semibold mt-2">Automatically:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Temporary request identifiers and IP based limits help prevent abuse. They are not used to save visitor history.</li>
            <li>IP address — used only for rate limiting and discarded after the rate-limit window expires.</li>
            <li>Standard web logs (user agent, referrer, timestamp).</li>
          </ul>
          <p className="font-semibold mt-3">From you, only when you choose to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Documents uploaded to the eligibility self-check.</li>
            <li>Search queries needed to retrieve and interpret registry records, processed without application history storage.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">2. What we do with it</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Search queries</strong> are forwarded to ClinicalTrials.gov and to an AI gateway for semantic re-ranking.</li>
            <li><strong>Click and dwell collection</strong> is disabled.</li>
            <li><strong>Uploaded documents</strong> are sent to an AI provider for the requested analysis and discarded as soon as the response is returned. They are not written to durable storage.</li>
            <li><strong>Visitor feedback and eligibility outcomes</strong> are not written to application storage.</li>
            <li><strong>Earlier records</strong> have not been deleted by this change. Restricted administrator evaluation and security records remain separate.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">3. What we don't do</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Sell, rent, or trade your data.</li>
            <li>Use your data to train AI models.</li>
            <li>Track you across other websites.</li>
            <li>Run ad networks or third-party trackers (no Facebook Pixel, no Google Ads).</li>
          </ul>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">4. Subprocessors</h2>
          <p>The Service relies on:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>ClinicalTrials.gov</strong> (NIH/NLM) — receives forwarded search queries.</li>
            <li><strong>Lovable Cloud</strong> — hosts the application, public registry caches and restricted administrator records.</li>
            <li><strong>Lovable AI Gateway (Google Gemini, OpenAI)</strong> — receives queries, trial text, and uploaded documents for AI processing.</li>
          </ul>
          <p className="mt-2">
            Each service has its own privacy and logging practices. Disabling application history does not
            guarantee zero retention by hosting or AI providers. Provider retention settings have not been independently verified.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">5. Cookies & local storage</h2>
          <p>
            Audience preferences and trial selections are held in temporary page memory, not saved as visitor history.
            Closing or reloading the tab resets them. Another visitor cannot view them. Your browser may retain downloaded
            files and browsing history on your own device. Administrator access and hosting services have separate security requirements.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">6. HIPAA & PHI</h2>
          <p>
            <strong>The Service is not a HIPAA-covered entity and is not designed to receive
            Protected Health Information (PHI).</strong> Do not upload documents containing
            identifying information about another person. If you upload your own medical
            documents for the eligibility self-check, you do so at your own risk and
            acknowledge they will be transmitted to a third-party AI provider for processing
            and then discarded.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">7. Children</h2>
          <p>
            The Service is not directed to children under 13. Do not use the Service if you are
            under 13. A parent or guardian may research trials on behalf of a minor.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">8. Your rights</h2>
          <p>
            Because we don't tie data to identifiable accounts, we generally cannot locate
            "your" data to delete it. If you believe specific data should be removed (e.g., a
            testimonial you submitted), contact us via the project repository and we will
            attempt to honor the request.
          </p>
          <p className="mt-2">
            If you are in the EU/EEA or California, you have additional rights under GDPR / CCPA.
            We will respect verifiable requests to access or delete data we can identify as yours.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">9. Changes</h2>
          <p>
            We will update this page when our practices change. The "Last updated" date at the
            top reflects the latest revision.
          </p>
        </div>

        <div>
          <h2 className="font-display text-[20px] font-bold mb-2">10. Contact</h2>
          <p>
            Privacy questions: open an issue at the project's public repository, or reach the
            maintainer via the link in the site footer.
          </p>
        </div>

        <p className="text-[12px] text-muted-foreground italic pt-4 border-t border-border">
          Template policy drafted for an MVP information tool. Have qualified counsel review
          before broad public launch, especially if you add accounts, payments, or expand
          beyond U.S. users.
        </p>
      </section>
    </article>
  );
};

export default Privacy;
