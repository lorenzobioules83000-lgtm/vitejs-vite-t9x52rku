import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

// Initialisation avec ta CLÉ PUBLIQUE Stripe (commence par pk_test_...)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_TON_ID_PUBLIC_ICI'
);

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export default function App() {
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: 1,
      name: 'Pack Premium - Abonnement Pro',
      price: 49.99,
      quantity: 1,
      image: '🚀',
    },
    {
      id: 2,
      name: 'Guide Stratégique Digital',
      price: 19.5,
      quantity: 2,
      image: '📚',
    },
  ]);

  const [loading, setLoading] = useState(false);

  // Gestion des quantités
  const updateQuantity = (id: number, delta: number) => {
    setCart(
      (prevCart) =>
        prevCart
          .map((item) => {
            if (item.id === id) {
              const newQty = item.quantity + delta;
              return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Lancement du vrai paiement sécurisé Stripe via le backend
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe n'a pas pu s'initialiser.");

      // 1. Appel de notre fonction backend /api/create-checkout-session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems: cart }),
      });

      const session = await response.json();

      if (session.error) {
        alert('Erreur: ' + session.error);
        return;
      }

      // 2. Redirection automatique vers la page de paiement sécurisée Stripe
      const result = await stripe.redirectToCheckout({ sessionId: session.id });

      if (result.error) {
        alert(result.error.message);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Une erreur est survenue lors de la redirection vers le paiement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Mon Panier E-commerce
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Paiement dynamique et sécurisé via Stripe
          </p>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Articles sélectionnés
          </h2>

          <div className="divide-y divide-slate-100">
            {cart.map((item) => (
              <div
                key={item.id}
                className="py-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
                  <span className="text-3xl p-2 bg-slate-100 rounded-xl">
                    {item.image}
                  </span>
                  <div>
                    <h3 className="font-medium text-slate-900">{item.name}</h3>
                    <p className="text-sm text-slate-500">
                      {item.price.toFixed(2)} € l'unité
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="px-3 py-1 bg-slate-50 hover:bg-slate-100 font-bold"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold text-slate-900 w-20 text-right">
                    {(item.price * item.quantity).toFixed(2)} €
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-lg font-bold text-slate-900">
              Total à régler
            </span>
            <span className="text-2xl font-extrabold text-indigo-600">
              {totalAmount.toFixed(2)} €
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={loading || cart.length === 0}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg transition duration-200 disabled:opacity-50"
          >
            {loading
              ? 'Génération du paiement...'
              : `Payer ${totalAmount.toFixed(2)} € avec Stripe`}
          </button>
        </div>
      </div>
    </div>
  );
}
