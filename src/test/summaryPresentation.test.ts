import { expect, it } from 'vitest';
import { summaryProse } from '@/lib/summaryPresentation';
it('removes generated task controls but retains action text and source links', () => {
  expect(summaryProse('- [ ] Verify [record](https://clinicaltrials.gov/study/NCT00003666)\n- [x] Review sites')).toBe('- Verify [record](https://clinicaltrials.gov/study/NCT00003666)\n- Review sites');
});