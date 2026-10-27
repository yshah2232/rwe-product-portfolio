import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useSeo } from '@/hooks/useSeo';

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const Section = ({ title, items, delay }: { title: string; items: string[]; delay: number }) => (
  <motion.div {...anim(delay)} className="space-y-4">
    <h2 className="text-lg font-bold text-foreground">{title}</h2>
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </motion.div>
);

const About = () => {
  useSeo({
    title: 'About — Clinical Trial Diversity Studio',
    description: 'What Clinical Trial Diversity Studio is, why it exists, and how it helps patients, clinicians, researchers and sponsors use the public ClinicalTrials.gov registry.',
    canonical: '/about',
  });
  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-16 space-y-12">
      <motion.div {...anim(0.1)}>
        <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-primary/80 mb-4">About the platform</p>
        <h1 className="text-3xl md:text-[44px] font-bold tracking-[-0.01em] text-foreground mb-4 leading-[1.1]">
          Clinical trial search that explains itself.
        </h1>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
          Clinical Trial Diversity Studio is an independent workspace built on the public ClinicalTrials.gov registry.
          It turns everyday or technical questions into precise registry searches, explains why each study matched,
          and adds context about who lives near trial sites.
        </p>
      </motion.div>

      <Section
        delay={0.15}
        title="Why we built it"
        items={[
          'The public registry holds over half a million studies, but finding the right ones takes expert search skills.',
          'Patients and families often cannot tell whether a study is relevant or still enrolling.',
          'Trial teams need to know whether site locations can reach a population that reflects the people affected by a disease.',
          'Decisions about trials deserve transparent reasoning, not black box rankings.',
        ]}
      />

      <Section
        delay={0.2}
        title="How it is used"
        items={[
          'Patients and caregivers search in plain words and read trial summaries in Plain Language mode.',
          'Clinicians find recruiting studies by condition, biomarker, phase, prior treatment and location.',
          'Researchers and feasibility teams compare trial records by sponsor, phase, eligibility and sites without saving a cohort.',
          'Diversity and access leads compare site area demographics with national and disease benchmarks from the US Census.',
        ]}
      />

      <Section
        delay={0.25}
        title="Benefits"
        items={[
          'Live data: every study is pulled from ClinicalTrials.gov at the moment you search.',
          'Grounded explanations: each match reason points to a field in the official study record.',
          'Honest limits: the platform flags when results may be incomplete instead of filling gaps.',
          'No personal health information is collected or stored.',
        ]}
      />

      <motion.div {...anim(0.3)} className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Data sources</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          ClinicalTrials.gov API, US Census American Community Survey, and OpenStreetMap geocoding. Not affiliated with
          NIH or NLM. Read more in <Link to="/data-method" className="underline underline-offset-2" style={{ color: 'hsl(var(--link))' }}>Data & Method</Link>.
        </p>
      </motion.div>
    </div>
  );
};

export default About;
