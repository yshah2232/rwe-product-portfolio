import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

const sections = [
  {
    title: 'Data sources and what each can and cannot see',
    content: [
      'Claims data captures who filled a prescription, when, what they paid, and who the payer was. It does not capture why a patient stopped or how they felt.',
      'EHR data captures clinical encounters, diagnoses, and lab values. It does not capture what happens between visits or at a different provider.',
      'Hub and specialty pharmacy data captures enrollment, copay assistance usage, and adherence support. It does not capture out of network fills.',
      'This product uses synthetic claims data only. Other data sources are referenced conceptually to demonstrate product thinking about data strategy.',
    ],
  },
  {
    title: 'Cohort design and why rules matter',
    content: [
      'A cohort starts with an index event, the first observable GLP 1 fill. Every patient is anchored to their own index date, not a calendar date.',
      'Inclusion and exclusion criteria determine who counts. In this cohort: patients with at least one GLP 1 fill in the observation window, with no prior GLP 1 history.',
      'Cohort rules directly impact every metric downstream. Changing the index date window changes persistence rates, payer mix, and geographic distribution.',
    ],
  },
  {
    title: 'Line of therapy logic',
    content: [
      'Line of therapy (LOT) logic identifies which treatment a patient is on and when they switch. Example: a patient starts on Ozempic, switches to Mounjaro after 90 days.',
      'LOT is determined by gaps between fills and brand changes. A gap longer than the expected refill window plus a grace period triggers a new line.',
      'This logic is critical for persistence calculations. Without it, you cannot distinguish between patients who stopped, switched, or simply delayed a refill.',
    ],
  },
  {
    title: 'How risk is detected using claims proxies',
    content: [
      'Claims data does not have a field called "at risk." Risk is inferred from observable patterns.',
      'Refill gap elongation: when the time between fills increases over successive refills, it signals declining engagement.',
      'Payer switch events: a change in payer type, especially from commercial to cash, often precedes discontinuation.',
      'Geographic cold spots: regions with low fill density relative to diagnosed population may indicate access barriers.',
      'These are proxies, not confirmed outcomes. Every signal should be labeled as observed or inferred.',
    ],
  },
  {
    title: 'Trust and governance',
    content: [
      'Observed vs inferred: every metric in the suite should clearly state whether it was directly measured from the data or estimated using a model or proxy.',
      'Confidence levels: statistical confidence intervals should accompany any aggregated metric where sample size affects reliability.',
      'Data freshness: the recency of the underlying data matters. Stale data produces stale decisions. Every module page should display when the data was last updated.',
    ],
  },
  {
    title: 'Safety and privacy disclaimer',
    content: [
      'This entire product suite uses synthetic data. No real patient records, protected health information, or identifiable data were used at any point.',
      'The synthetic cohort was generated using AI driven statistical modeling calibrated against published clinical studies and national utilization benchmarks.',
      'This product is a demonstration of product management and data product design capability. It is not a clinical tool and should not be used for clinical or regulatory decisions.',
    ],
  },
];

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const Method = () => (
  <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-10">
    <motion.div {...anim(0.1)}>
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">How this suite works</h1>
      <p className="text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
        This page reads like a product spec for executives. Each section explains a design decision, why it matters, and what it means for the data you see.
      </p>
    </motion.div>

    {sections.map((section, i) => (
      <motion.div key={section.title} {...anim(0.15 + i * 0.05)}>
        <h2 className="text-lg font-bold text-foreground mb-4">{section.title}</h2>
        <ul className="space-y-3">
          {section.content.map((item, j) => (
            <li key={j} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
              <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        {i < sections.length - 1 && <Separator className="mt-8" />}
      </motion.div>
    ))}
  </div>
);

export default Method;
