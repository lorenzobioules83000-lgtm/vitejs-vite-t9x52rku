import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    let rawBody = '';
    for await (const chunk of req) {
      rawBody += chunk;
    }
    
    console.log('Raw body received:', rawBody); // Pour voir dans les logs Vercel si besoin

    const body = rawBody ? JSON.parse(rawBody) : {};
    
    // On accepte soit body.items, soit si le frontend envoie directement un tableau
    const items = body.items || (Array.isArray(body) ? body : null);
    const customerDetails = body.customerDetails || {};

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Le panier (items) est vide ou introuvable." });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name || 'Produit',
        },
        unit_amount: Math.round((item.price || 0) * 100),
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      customer_email: customerDetails.email,
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
}
