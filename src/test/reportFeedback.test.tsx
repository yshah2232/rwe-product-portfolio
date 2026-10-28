import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ReportFeedback } from '@/components/compare/ReportFeedback';

const mock = vi.hoisted(() => ({ invoke: vi.fn().mockResolvedValue({ error: null }), accepted: true }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { functions: { invoke: mock.invoke } } }));
vi.mock('@/contexts/PlainModeContext', () => ({ usePlainMode: () => ({ termsAccepted: mock.accepted }) }));

describe('voluntary report feedback privacy', () => {
  it('sends only the explicitly submitted rating and comment, never on open or dismissal', async () => {
    mock.invoke.mockClear();
    const view = render(<ReportFeedback open onOpenChange={() => {}} />);
    expect(mock.invoke).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }));
    expect(mock.invoke).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Rate 4 out of 5' }));
    fireEvent.change(screen.getByLabelText('What could be better? (optional)'), { target: { value: 'Clearer comparison' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    await waitFor(() => expect(mock.invoke).toHaveBeenCalledTimes(1));
    expect(mock.invoke).toHaveBeenCalledWith('report-feedback', { body: { rating: 4, comment: 'Clearer comparison' } });
    view.unmount();
  });
  it('does not submit before Terms acceptance', () => {
    mock.invoke.mockClear(); mock.accepted = false;
    const view = render(<ReportFeedback open onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Rate 5 out of 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Send feedback' }));
    expect(mock.invoke).not.toHaveBeenCalled();
    view.unmount(); mock.accepted = true;
  });
});