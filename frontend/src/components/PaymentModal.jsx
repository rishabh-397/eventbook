import { useState } from 'react';

export default function PaymentModal({ amount, onSuccess, onClose }) {
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [processing, setProcessing] = useState(false);

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  async function handlePay(e) {
    e.preventDefault();
    setProcessing(true);
    // Simulated processing delay for realism - this is a mock gateway,
    // no real card data is transmitted or stored anywhere.
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onSuccess();
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!processing ? (
          <>
            <p style={styles.eyebrow}>Secure Checkout</p>
            <h2 style={styles.title}>₹{amount}</h2>

            <form onSubmit={handlePay} style={styles.form}>
              <label style={styles.label}>Card Number</label>
              <input
                style={styles.input}
                placeholder="4242 4242 4242 4242"
                value={card.number}
                onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                maxLength={19}
                required
              />

              <div style={styles.row}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Expiry</label>
                  <input
                    style={styles.input}
                    placeholder="MM/YY"
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                    maxLength={5}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>CVV</label>
                  <input
                    style={styles.input}
                    placeholder="123"
                    value={card.cvv}
                    onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
                    maxLength={3}
                    required
                  />
                </div>
              </div>

              <label style={styles.label}>Cardholder Name</label>
              <input
                style={styles.input}
                placeholder="Name on card"
                value={card.name}
                onChange={(e) => setCard({ ...card, name: e.target.value })}
                required
              />

              <p style={styles.disclaimer}>
                Test mode — no real payment is processed. Use any card details.
              </p>

              <button type="submit" style={styles.payBtn}>Pay ₹{amount}</button>
              <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            </form>
          </>
        ) : (
          <div style={styles.processing}>
            <div style={styles.spinner} />
            <p style={styles.processingText}>Processing payment…</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    width: 380, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 8, padding: 32,
  },
  eyebrow: {
    color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 11,
    letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
  },
  title: { fontSize: 32, margin: '4px 0 24px' },
  form: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 12, color: 'var(--text-muted)', marginTop: 8 },
  input: {
    padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 4, color: 'var(--text)', fontSize: 14, fontFamily: 'var(--font-mono)',
  },
  row: { display: 'flex', gap: 12 },
  disclaimer: {
    fontSize: 11, color: 'var(--text-muted)', marginTop: 12, textAlign: 'center', lineHeight: 1.4,
  },
  payBtn: {
    marginTop: 16, padding: '14px 0', background: 'var(--gold)', border: 'none',
    borderRadius: 4, color: '#0B0E14', fontWeight: 600, fontSize: 15,
  },
  cancelBtn: {
    marginTop: 8, padding: '10px 0', background: 'transparent', border: '1px solid var(--border)',
    borderRadius: 4, color: 'var(--text-muted)', fontSize: 13,
  },
  processing: { textAlign: 'center', padding: '40px 0' },
  spinner: {
    width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--gold)',
    borderRadius: '50%', margin: '0 auto 20px', animation: 'spin 0.8s linear infinite',
  },
  processingText: { color: 'var(--text-muted)', fontSize: 14 },
};