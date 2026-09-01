const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    var body = req.body;
    
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }

    var items = body && body.items;
    var customerDetails = body && body.customerDetails;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Le panier est vide ou invalide." });
    }

    var lineItems = items.map(function(item) {
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.name
          },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      };
    });

    var session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: req.headers.origin + '/?success=true',
      cancel_url: req.headers.origin + '/?canceled=true',
      customer_email: customerDetails && customerDetails.email
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('Stripe error details:', err);
    return res.status(500).json({ error: err.message || 'Erreur interne du serveur' });
  }
};