import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Sécurité maximale pour récupérer le corps de la requête sous Vercel
    let body = req.body;
    
    if (typeof body === 'string') {
      body = JSON.parse(body);
    } else if (!body || Object.keys(body).length === 0) {
      // Si req.body est vide, on tente de le lire via les chunks proprement
      let rawData = '';
      for await (const chunk of req) {
        rawData += chunk;
      }
      if (rawData) {
        body = JSON.parse(rawData);
      }
    }

    const items = body?.items;
    const customerDetails = body?.customerDetails;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Le panier est vide ou invalide." });
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
      customer_email: customerDetails?.email,
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Stripe error details:', err);
    return res.status(500).json({ error: err.message || 'Erreur interne du serveur' });
  }
}