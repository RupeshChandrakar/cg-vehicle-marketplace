import { EnquiryStatusService } from './enquiry-status.service';

describe('EnquiryStatusService', () => {
  const service = new EnquiryStatusService();

  it('allows the happy-path enquiry pipeline', () => {
    expect(service.canTransition('open', 'contacted')).toBe(true);
    expect(service.canTransition('contacted', 'negotiating')).toBe(true);
    expect(service.canTransition('negotiating', 'closed_won')).toBe(true);
  });

  it('allows dropping out to closed_lost from any non-terminal state', () => {
    expect(service.canTransition('open', 'closed_lost')).toBe(true);
    expect(service.canTransition('contacted', 'closed_lost')).toBe(true);
    expect(service.canTransition('negotiating', 'closed_lost')).toBe(true);
  });

  it('rejects skipping straight to a decision without contact', () => {
    expect(service.canTransition('open', 'negotiating')).toBe(false);
    expect(service.canTransition('open', 'closed_won')).toBe(false);
  });

  it('treats closed_won and closed_lost as terminal', () => {
    expect(service.canTransition('closed_won', 'negotiating')).toBe(false);
    expect(service.canTransition('closed_lost', 'open')).toBe(false);
  });

  it('throws a descriptive error for an invalid transition', () => {
    expect(() => service.assertTransition('open', 'closed_won')).toThrow(
      'Cannot move an enquiry from "open" to "closed_won"',
    );
  });

  it('does not throw for a valid transition', () => {
    expect(() => service.assertTransition('open', 'contacted')).not.toThrow();
  });
});
