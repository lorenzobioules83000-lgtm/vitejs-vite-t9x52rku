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
    
    const body = rawBody ? JSON.parse(rawBody) : {};
    const items = body.items || body.cart || (Array.isArray(body) ? body : [{ name: 'Commande', price: 225, quantity: 1 }]);

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name || 'Article',
        },
        unit_amount: Math.round((item.price || 225) * 100),
      },
      quantity: item.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      customer_email: body.customerDetails?.email || body.email,
    });

    // On renvoie à la fois id et url pour satisfaire n'importe quel code frontend
    return res.status(200).json({ 
      id: session.id, 
      url: session.url 
    });
  } catch (err) {
    console.error('Stripe error:', err);
    return res.status(500).json({ error: err.message });
  }
}