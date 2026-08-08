// Payment method *options* shown on each priced membership plan — presentational
// only. This site has no backend and no payment gateway wired up yet (see
// MembershipPlans.tsx / EnrollButton.tsx: "enrolling" only ever registers
// interest in Neon, there's no real charge), so selecting a method here just
// gets appended to the enrollment's itemDetail snapshot as the visitor's
// stated preference — nothing is submitted to a payment processor. Swap this
// out (and wire an actual checkout) once a gateway is chosen.
export interface PaymentMethod {
  id: string;
  label: string;
}

export const paymentMethods: PaymentMethod[] = [
  { id: 'upi', label: 'UPI' },
  { id: 'card', label: 'Credit / Debit Card' },
  { id: 'netbanking', label: 'Net Banking' },
  { id: 'wallet', label: 'Wallet' },
];
