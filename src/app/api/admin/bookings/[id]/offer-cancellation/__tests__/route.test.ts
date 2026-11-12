import { beforeEach, expect, it, vi } from 'vitest';
const { requireAdmin, authError, callable } = vi.hoisted(() => ({ requireAdmin: vi.fn(), authError: vi.fn(), callable: vi.fn() }));
vi.mock('@/lib/adminAuth', () => ({ requireAdmin, adminAuthErrorResponse: authError }));
vi.mock('@/lib/adminCallables', () => ({ callAdminCallable: callable, AdminCallableError: class extends Error { status = 409; } }));
import { POST } from '../route';
beforeEach(() => { vi.clearAllMocks(); requireAdmin.mockResolvedValue({ idToken: 'admin-token' }); authError.mockReturnValue(null); callable.mockResolvedValue({ ok: true }); });
const request = () => new Request('https://example.com', { method: 'POST', body: JSON.stringify({ decision: 'refund', reason: 'Lucrare neîncepută' }) });
it('forwards the explicit refund decision with administrator credentials', async () => {
  const result = await POST(request(), { params: Promise.resolve({ id: 'b1' }) });
  expect(result.status).toBe(200);
  expect(callable).toHaveBeenCalledWith('resolveBookingOfferCancellation', { bookingId: 'b1', decision: 'refund', reason: 'Lucrare neîncepută' }, expect.any(String), 'admin-token');
});
it('denies non-administrators before calling the financial service', async () => {
  requireAdmin.mockRejectedValue(new Error('Forbidden')); authError.mockReturnValue(new Response(null, { status: 403 }));
  expect((await POST(request(), { params: Promise.resolve({ id: 'b1' }) })).status).toBe(403);
  expect(callable).not.toHaveBeenCalled();
});
