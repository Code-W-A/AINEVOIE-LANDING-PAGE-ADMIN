import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('@/components/admin/adminApi', () => ({ adminFetch: vi.fn(), readAdminResponseError: vi.fn() }));
import { BookingOfferSummary } from '../BookingOfferSummary';
const booking = { bookingId: 'b1', paymentFlowProfile: 'offer_advance_v1', offer: { description: 'Montaj', offerTotal: 1000, advanceAmount: 200, remainingAmount: 800, version: 1, status: 'accepted' } };
describe('offer support and refund visibility', () => {
  it('shows a failed refund and intervention instructions', () => {
    const html = renderToStaticMarkup(React.createElement(BookingOfferSummary, { booking: { ...booking, refundSummary: { status: 'failed', stripeRefundId: 're_test' }, offerOperationalAlert: { code: 'refund_failed' } } }));
    expect(html).toContain('role="alert"');
    expect(html).toContain('Rambursare eșuată');
    expect(html).toContain('re_test');
    expect(html).toContain('Extraurile nu modifică oferta acceptată');
  });
  it('requires a reason before an administrator decides', () => {
    const html = renderToStaticMarkup(React.createElement(BookingOfferSummary, { booking: { ...booking, cancellationRequest: { status: 'pending_admin', reason: 'Neprezentare' } } }));
    expect(html).toContain('Neprezentare');
    expect((html.match(/disabled=""/g) || []).length).toBe(3);
  });
  it('does not change legacy booking displays', () => {
    expect(renderToStaticMarkup(React.createElement(BookingOfferSummary, { booking: { bookingId: 'legacy' } }))).toBe('');
  });
});
