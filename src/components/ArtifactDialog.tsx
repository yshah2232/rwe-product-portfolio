import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, CheckCircle2, AlertTriangle, ArrowRight, Layers, GitBranch, BarChart3, FlaskConical, ScrollText } from 'lucide-react';
import { ReactNode } from 'react';

interface ArtifactSection {
  heading: string;
  items: string[];
}

interface ArtifactContent {
  title: string;
  desc: string;
  icon: React.ElementType;
  sections: ArtifactSection[];
}

const artifactContent: ArtifactContent[] = [
  {
    title: 'PRD Snapshot',
    desc: 'Product Requirements Document for the GLP 1 Patient Insights Dashboard',
    icon: FileText,
    sections: [
      {
        heading: 'Problem Statement',
        items: [
          'Brand managers and medical affairs leads lack a single view of how GLP 1 patients move through treatment over time.',
          'Existing reports are static, delayed by weeks, and split across multiple vendor platforms.',
          'No tool connects persistence, payer mix, and geography in one interactive experience.',
        ],
      },
      {
        heading: 'Target Users',
        items: [
          'Primary: Brand Managers tracking commercial performance of GLP 1 products',
          'Secondary: Medical Affairs Leads monitoring real world treatment patterns',
          'Tertiary: Payer Strategists evaluating formulary impact on adherence',
        ],
      },
      {
        heading: 'Success Metrics',
        items: [
          'Weekly active usage by at least 3 cross functional roles',
          'Time to insight reduced from 2 weeks (manual reporting) to under 5 minutes',
          'Persistence rate visibility at 6 and 12 month intervals per brand and payer',
          'Export adoption: at least 40% of sessions include a PPT or data export',
        ],
      },
      {
        heading: 'Scope: What is included',
        items: [
          'Persistence curves with brand and payer filtering',
          'Payer mix and drop off analysis by segment',
          'US geographic heatmap at state level',
          'AI powered Q&A for cohort level questions',
          'PPT export for downstream presentations',
        ],
      },
      {
        heading: 'Scope: What is excluded (v1)',
        items: [
          'Individual patient level drill down',
          'EHR or lab data integration',
          'Real time data feeds (uses monthly batch refresh model)',
          'HCP level prescribing intelligence (roadmap module)',
        ],
      },
    ],
  },
  {
    title: 'Metric Tree',
    desc: 'North star metric decomposed into leading and lagging indicators',
    icon: BarChart3,
    sections: [
      {
        heading: 'North Star Metric',
        items: [
          '12 month persistence rate across the GLP 1 cohort',
          'This measures the percentage of patients who remain on therapy at 12 months from their index fill date.',
        ],
      },
      {
        heading: 'Leading Indicators (Predictive)',
        items: [
          'Refill gap rate: percentage of patients with a gap exceeding 60 days in the first 90 days',
          'Payer switch rate: percentage of patients who change payer segment within 6 months',
          'Geographic cold spot density: number of states with persistence below the 25th percentile',
          'Time to second fill: median days between first and second prescription fill',
        ],
      },
      {
        heading: 'Lagging Indicators (Outcome)',
        items: [
          '6 month persistence rate by brand',
          '12 month persistence rate by payer segment',
          'Drop off concentration: percentage of total discontinuations occurring in months 2 through 4',
          'Brand switch rate at 6 and 12 months',
        ],
      },
      {
        heading: 'Guardrail Metrics',
        items: [
          'Data completeness score must remain above 85%',
          'Cohort size per brand segment must exceed 500 patients for statistical reliability',
          'AI summary confidence must stay above 0.7 or display a warning',
        ],
      },
    ],
  },
  {
    title: 'Event Taxonomy',
    desc: 'Structured event definitions for analytics and tracking',
    icon: Layers,
    sections: [
      {
        heading: 'Patient Lifecycle Events',
        items: [
          'index_fill: First observed prescription fill for a GLP 1 product. Marks cohort entry.',
          'refill: Subsequent prescription fill within expected refill window (30 day supply + 15 day grace).',
          'gap_detected: No refill observed within the expected window. Triggers risk flag.',
          'discontinuation: No refill observed for 90+ days. Patient exits active cohort.',
          'brand_switch: Patient fills a different GLP 1 brand than their previous fill.',
        ],
      },
      {
        heading: 'Payer and Coverage Events',
        items: [
          'payer_segment_assigned: Patient mapped to Commercial, Medicare, Medicaid, or Cash/Coupon segment.',
          'payer_switch: Patient changes payer segment between fills.',
          'prior_auth_flag: Claim includes prior authorization indicator.',
          'step_therapy_flag: Claim sequence suggests step therapy requirement.',
        ],
      },
      {
        heading: 'Platform Interaction Events',
        items: [
          'filter_applied: User applies a filter (time range, payer, brand, geography).',
          'chart_interaction: User hovers, clicks, or drills into a chart element.',
          'ai_query_submitted: User submits a question to the AI Q&A module.',
          'export_triggered: User initiates a PPT or data export.',
          'module_navigation: User navigates between dashboard sections or modules.',
        ],
      },
      {
        heading: 'Data Quality Events',
        items: [
          'low_confidence_warning: AI summary confidence drops below 0.7 threshold.',
          'small_cohort_warning: Filtered cohort falls below 500 patients.',
          'data_freshness_alert: Data vintage exceeds 30 days from last refresh.',
        ],
      },
    ],
  },
  {
    title: 'Data Model',
    desc: 'Entity relationships powering the analytics platform',
    icon: GitBranch,
    sections: [
      {
        heading: 'Core Entities',
        items: [
          'Patient: Unique synthetic patient ID, age bucket, sex, state, index date, current status (active/discontinued)',
          'Claim: Claim ID, patient ID, fill date, brand, days supply, payer segment, NDC code',
          'Brand: Brand name, molecule, delivery method (injection/oral), manufacturer',
          'Payer Segment: Segment type (Commercial, Medicare, Medicaid, Cash/Coupon), formulary tier',
        ],
      },
      {
        heading: 'Derived Entities',
        items: [
          'Persistence Record: Patient ID, months on therapy, persistence flag at 6m and 12m, gap count',
          'Refill Metric: Patient ID, fill sequence number, days since last fill, gap flag, brand at fill',
          'Geographic Aggregate: State, patient count, persistence rate, dominant payer, dominant brand',
        ],
      },
      {
        heading: 'Relationships',
        items: [
          'Patient → Claims: One to many. Each patient has multiple claims over time.',
          'Claim → Brand: Many to one. Each claim is for one brand.',
          'Claim → Payer Segment: Many to one. Each claim is paid through one segment.',
          'Patient → Persistence Record: One to one. Computed from the claims sequence.',
          'Patient → Geographic Aggregate: Many to one. Patients roll up to state level.',
        ],
      },
      {
        heading: 'Design Decisions',
        items: [
          'No PII fields. All patient identifiers are synthetic tokens.',
          'Time grain is monthly for aggregations, daily for raw claims.',
          'Payer segment is assigned at the claim level, not the patient level, to capture switches.',
          'Brand switching is derived by comparing consecutive claims, not stored as a separate entity.',
        ],
      },
    ],
  },
  {
    title: 'Experiment Plan',
    desc: 'Hypothesis testing framework for the AI summary feature',
    icon: FlaskConical,
    sections: [
      {
        heading: 'Hypothesis',
        items: [
          'Adding an AI generated summary to the dashboard will reduce time to first actionable insight by 40% compared to manual chart interpretation.',
          'Users who interact with AI summaries will export reports 25% more frequently because the summary provides pre written narrative context.',
        ],
      },
      {
        heading: 'Test Design',
        items: [
          'A/B test with two variants: Control (dashboard without AI summary) vs Treatment (dashboard with AI summary panel).',
          'Allocation: 50/50 random split at the user session level.',
          'Duration: 4 weeks to reach statistical significance with expected sample size.',
          'Primary metric: Time from dashboard load to first export or filter interaction.',
        ],
      },
      {
        heading: 'Guardrail Metrics',
        items: [
          'AI hallucination rate must stay at 0%. All summaries must be traceable to displayed data.',
          'Confidence score must remain above 0.7 for all generated summaries.',
          'Page load time must not increase by more than 500ms with AI panel enabled.',
          'User satisfaction score (post session survey) must not drop below baseline.',
        ],
      },
      {
        heading: 'Decision Framework',
        items: [
          'Ship if: Primary metric improves by 20%+ and all guardrails hold.',
          'Iterate if: Primary metric improves by 10 to 20% — investigate summary quality and placement.',
          'Kill if: Hallucination rate exceeds 0% or user satisfaction drops significantly.',
          'Follow up: If shipped, run a second experiment testing summary personalization by user role.',
        ],
      },
    ],
  },
  {
    title: 'Release Notes',
    desc: 'Versioned changelog with rollback criteria',
    icon: ScrollText,
    sections: [
      {
        heading: 'v1.0 — Initial Launch',
        items: [
          'GLP 1 Patient Insights Dashboard with persistence curves, payer mix, and US heatmap.',
          'Synthetic cohort of 100K patients across 5 brands, 4 payer segments, and 50 states.',
          'AI Q&A module with rule based responses scoped to cohort metrics.',
          'PPT export with branded slide generation.',
          'Rollback criteria: Dashboard load failure rate exceeds 5% or data rendering errors in any chart.',
        ],
      },
      {
        heading: 'v1.1 — Filters and Interactivity',
        items: [
          'Added global filter bar: time range, payer segment, brand, and geography.',
          'Persistence curves now support multi brand overlay comparison.',
          'Payer drop off chart added with segment level drill down.',
          'Feature flag: ENABLE_MULTI_BRAND_COMPARE (default on).',
          'Rollback criteria: Filter interactions cause chart render lag exceeding 2 seconds.',
        ],
      },
      {
        heading: 'v1.2 — AI Enhancements',
        items: [
          'AI summary panel now displays confidence score alongside every response.',
          'Added limitation disclaimers: AI cannot answer questions outside the displayed cohort data.',
          'Failed prompts now return a clear message explaining what the AI can and cannot do.',
          'Feature flag: ENABLE_AI_CONFIDENCE_DISPLAY (default on).',
          'Rollback criteria: AI response accuracy drops below 90% on test query set.',
        ],
      },
      {
        heading: 'v1.3 — Geographic and Export Improvements',
        items: [
          'State level heatmap now uses continuous color scale with legend.',
          'Added ZIP3 boundary view (work in progress, currently greyed out).',
          'Export now includes filter state metadata in generated slides.',
          'Performance: Chart render time reduced by 30% through memoization.',
          'Rollback criteria: Export file generation fails for more than 2% of attempts.',
        ],
      },
    ],
  },
];

interface ArtifactDialogProps {
  artifact: { title: string; desc: string };
  children: ReactNode;
}

const ArtifactDialog = ({ artifact, children }: ArtifactDialogProps) => {
  const content = artifactContent.find((a) => a.title === artifact.title);
  if (!content) return <>{children}</>;

  const Icon = content.icon;

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">{content.title}</DialogTitle>
              <p className="text-sm text-muted-foreground">{content.desc}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {section.heading}
              </h3>
              <ul className="space-y-2 pl-4">
                {section.items.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <span className="text-primary/40 mt-1.5 shrink-0">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <p className="text-[11px] text-muted-foreground/60">
            This artifact was created as part of the RWE Studio portfolio to demonstrate product management methodology applied to real world evidence products. All data referenced is synthetic.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArtifactDialog;
