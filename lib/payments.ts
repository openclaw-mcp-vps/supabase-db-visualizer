export function getStripePaymentLink() {
  return process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
}

export function isStripePaymentConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK);
}
