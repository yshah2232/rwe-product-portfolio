import { motion } from 'framer-motion';
import { Linkedin, Github, Mail, Handshake } from 'lucide-react';
import iconLogo from '@/assets/icon-plc-logo.png';
import syneosLogo from '@/assets/syneos-health-logo.png';

const anim = (delay: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.35 },
});

const About = () => (
  <div className="max-w-3xl mx-auto px-6 md:px-10 py-12 md:py-16 space-y-12">
    <motion.div {...anim(0.1)}>
      <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">About</h1>
      <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
        I am a product manager focused on healthcare analytics and real world evidence. I build tools that help brand teams, payer strategists, and medical affairs leads make better decisions with longitudinal data.
      </p>
    </motion.div>

    {/* Experience */}
    <motion.div {...anim(0.15)} className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">Where I've worked</h2>
      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border/50 bg-card">
          <img src={iconLogo} alt="ICON PLC" loading="lazy" width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <p className="font-semibold text-foreground text-sm">ICON PLC</p>
            <p className="text-xs text-muted-foreground">Clinical Research Organization</p>
          </div>
        </div>
        <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border/50 bg-card">
          <img src={syneosLogo} alt="Syneos Health" loading="lazy" width={40} height={40} className="h-10 w-10 object-contain" />
          <div>
            <p className="font-semibold text-foreground text-sm">Syneos Health</p>
            <p className="text-xs text-muted-foreground">Biopharmaceutical Solutions</p>
          </div>
        </div>
      </div>
    </motion.div>

    <motion.div {...anim(0.2)} className="space-y-4">
      <h2 className="text-lg font-bold text-foreground">What I care about</h2>
      <ul className="space-y-3">
        {[
          'Making healthcare data products that people actually use, not just view once',
          'Clearly separating what is observed from what is inferred in every metric',
          'Building for stakeholders who scan fast and decide faster',
          'Treating data trust as a product feature, not an afterthought',
        ].map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
            <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>

    {/* Collaboration CTA */}
    <motion.div {...anim(0.3)} className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <Handshake className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Let's work together</h2>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
        Looking for a PM who understands healthcare data, RWE pipelines, and product strategy? I'm open to full-time roles, advisory work, and collaboration on data products in life sciences.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href="https://www.linkedin.com/in/yashshah2232"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-[hsl(210,80%,45%)] hover:bg-[hsl(210,80%,40%)] transition-colors text-white text-sm font-semibold"
        >
          <Linkedin className="h-5 w-5" />
          Connect on LinkedIn
        </a>
        <a
          href="https://github.com/yshah2232"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-border/50 bg-card hover:bg-muted/30 transition-colors text-sm font-semibold text-foreground"
        >
          <Github className="h-5 w-5" />
          View GitHub
        </a>
      </div>
    </motion.div>
  </div>
  );
};

export default About;
