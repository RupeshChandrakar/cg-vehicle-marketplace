import { VehicleStatusService } from './vehicle-status.service';

describe('VehicleStatusService', () => {
  const service = new VehicleStatusService();

  it('allows the happy-path listing pipeline', () => {
    expect(service.canTransition('draft', 'submitted')).toBe(true);
    expect(service.canTransition('submitted', 'under_review')).toBe(true);
    expect(service.canTransition('under_review', 'approved')).toBe(true);
    expect(service.canTransition('approved', 'live')).toBe(true);
    expect(service.canTransition('live', 'sold')).toBe(true);
  });

  it('rejects skipping the review pipeline', () => {
    expect(service.canTransition('draft', 'live')).toBe(false);
    expect(service.canTransition('submitted', 'approved')).toBe(false);
  });

  it('treats sold and rejected as terminal', () => {
    expect(service.canTransition('sold', 'live')).toBe(false);
    expect(service.canTransition('rejected', 'submitted')).toBe(false);
  });

  it('throws a descriptive error for an invalid transition', () => {
    expect(() => service.assertTransition('draft', 'live')).toThrow(
      'Cannot move a vehicle from "draft" to "live"',
    );
  });

  it('does not throw for a valid transition', () => {
    expect(() => service.assertTransition('draft', 'submitted')).not.toThrow();
  });
});
