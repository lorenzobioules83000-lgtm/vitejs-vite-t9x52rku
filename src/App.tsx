import React, { useState, useEffect } from 'react';
import emailjs from '@emailjs/browser';

const LOGO_URL = '/logo.png';

interface Product {
  id: number;
  nom: string;
  prix: string;
  categorie: string;
  img: string;
  description: string;
}

interface CartItem {
  id: number;
  qty: number;
}

interface ShippingInfo {
  nom: string;
  prenom: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
}

export default function App() {
  const [currentView, setCurrentView] = useState<'shop' | 'admin' | 'success'>('shop');
  const [logoClicks, setLogoClicks] = useState(0);

  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    nom: '',
    prenom: '',
    email: '',
    adresse: '',
    codePostal: '',
    ville: '',
  });

  const [step, setStep] = useState<'cart' | 'shipping'>('cart');

  const handleLogoClick = () => {
    const newCount = logoClicks + 1;
    if (newCount >= 3) {
      setCurrentView('admin');
      setLogoClicks(0);
    } else {
      setLogoClicks(newCount);
      setTimeout(() => setLogoClicks(0), 2000);
    }
  };

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('app_categories');
    return saved ? JSON.parse(saved) : ['Créations florales', 'Objets en bois', 'Sur-mesure'];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('app_products');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 1,
            nom: 'Cœur fleuri personnalisé',
            prix: '45.00',
            categorie: 'Créations florales',
            img: 'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=500',
            description: 'Composition de fleurs séchées faites à la main.',
          },
          {
            id: 2,
            nom: 'Notre famille (Arbre gravé)',
            prix: '39.00',
            categorie: 'Objets en bois',
            img: 'https://images.unsplash.com/photo-1517705008128-361805f42e07?w=500',
            description: 'Plaque en bois massif gravée au laser.',
          },
        ];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('app_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [newProduct, setNewProduct] = useState({
    nom: '',
    prix: '',
    categorie: 'Créations florales',
    imgUrl: '',
  });
  const [customCategory, setCustomCategory] = useState('');
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('app_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('app_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('app_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (id: number) => {
    setCart((prev) => {
      const exists = prev.find((item) => item.id === id);
      if (exists) {
        return prev.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...prev, { id, qty: 1 }];
    });
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const cartTotalAmount = cart.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.id);
    return sum + (prod ? parseFloat(prod.prix) * item.qty : 0);
  }, 0);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'admin123') {
      setIsAuthenticated(true);
      setPassword('');
    } else {
      alert('Mot de passe incorrect');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImg(result);
        setNewProduct((prev) => ({ ...prev, imgUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nom.trim() || !newProduct.prix.trim()) {
      return alert('Merci de renseigner un nom et un prix.');
    }

    let targetCategory = newProduct.categorie;
    if (customCategory.trim() !== '') {
      targetCategory = customCategory.trim();
      if (!categories.includes(targetCategory)) {
        setCategories([...categories, targetCategory]);
      }
    }

    const finalImg =
      newProduct.imgUrl ||
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=500';

    const itemToAdd: Product = {
      id: Date.now(),
      nom: newProduct.nom.trim(),
      prix: parseFloat(newProduct.prix).toFixed(2),
      categorie: targetCategory,
      img: finalImg,
      description: 'Nouvelle création faite main.',
    };

    setProducts([itemToAdd, ...products]);
    setNewProduct({ nom: '', prix: '', categorie: targetCategory, imgUrl: '' });
    setCustomCategory('');
    setPreviewImg(null);
  };

  const handleRenameCategory = (oldCat: string) => {
    const newName = prompt(`Renommer la catégorie "${oldCat}" en :`, oldCat);
    if (newName && newName.trim() !== '' && newName.trim() !== oldCat) {
      const trimmedName = newName.trim();
      setCategories(categories.map((cat) => (cat === oldCat ? trimmedName : cat)));
      setProducts(
        products.map((p) => (p.categorie === oldCat ? { ...p, categorie: trimmedName } : p))
      );
    }
  };

  const handleDeleteProduct = (id: number) => {
    if (confirm('Voulez-vous vraiment supprimer cet article ?')) {
      setProducts(products.filter((p) => p.id !== id));
      removeFromCart(id);
    }
  };

  // Validation de la commande, envoi EmailJS et redirection moderne vers Stripe
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    const listeArticles = cart
      .map((item) => {
        const p = products.find((prod) => prod.id === item.id);
        return `- ${p?.nom} x${item.qty} (${(parseFloat(p?.prix || '0') * item.qty).toFixed(2)} €)`;
      })
      .join('\n');

    const templateParams = {
      client_nom: `${shippingInfo.prenom} ${shippingInfo.nom}`,
      client_email: shippingInfo.email,
      adresse_livraison: `${shippingInfo.adresse}, ${shippingInfo.codePostal} ${shippingInfo.ville}`,
      articles: listeArticles,
      total: `${cartTotalAmount.toFixed(2)} €`,
    };

    try {
      // 1. Envoi de l'e-mail à l'atelier
      await emailjs.send(
        'service_xsiu4de',
        'template_814jv1h',
        templateParams,
        'BIjG1I0PqxOF4gcWz'
      );

      // 2. Préparation des articles pour le backend Stripe
      const cartItemsForStripe = cart.map((item) => {
        const p = products.find((prod) => prod.id === item.id);
        return {
          name: p?.nom || 'Article',
          price: parseFloat(p?.prix || '0'),
          quantity: item.qty,
        };
      });

      // 3. Appel du backend Vercel pour créer la session Stripe sécurisée
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          items: cartItemsForStripe,
          customerDetails: { email: shippingInfo.email }
        }),
      });

      const session = await response.json();

      if (session.error) {
        alert("Erreur Stripe: " + session.error);
        return;
      }

      // 4. Redirection moderne et directe vers l'URL de paiement Stripe
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error("URL de redirection Stripe introuvable.");
      }

    } catch (err) {
      console.error('Erreur :', err);
      alert("Une erreur est survenue lors de la validation ou de la redirection vers le paiement.");
    }
  };

  if (currentView === 'success') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #E7DCCB', maxWidth: '420px', width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '12px', color: '#3C2C20' }}>Paiement et commande validés !</h2>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5', marginBottom: '24px' }}>
            Merci <strong>{shippingInfo.prenom}</strong> ! L'atelier a bien reçu le détail de votre commande par e-mail.
          </p>
          <button onClick={() => { setCurrentView('shop'); setShippingInfo({ nom: '', prenom: '', email: '', adresse: '', codePostal: '', ville: '' }); }} style={{ width: '100%', padding: '12px', backgroundColor: '#D6918B', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
            Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'admin') {
    if (!isAuthenticated) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <form onSubmit={handleLogin} style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '24px', border: '1px solid #E7DCCB', maxWidth: '320px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#3C2C20' }}>Espace Administration</h2>
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#D6918B', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px' }}>
              Connexion
            </button>
            <button type="button" onClick={() => setCurrentView('shop')} style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer' }}>
              ← Retour à la boutique
            </button>
          </form>
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', color: '#3C2C20', padding: '24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={LOGO_URL} alt="Logo" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>Administration</h1>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setCurrentView('shop')} style={{ backgroundColor: '#fff', border: '1px solid #E7DCCB', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '14px' }}>
                👁️ Voir le site
              </button>
              <button onClick={() => setIsAuthenticated(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '14px' }}>
                Déconnexion
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #E7DCCB' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>➕ Ajouter un article</h2>
                <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Nom du produit" value={newProduct.nom} onChange={(e) => setNewProduct({ ...newProduct, nom: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                  <input type="number" step="0.01" placeholder="Prix (€)" value={newProduct.prix} onChange={(e) => setNewProduct({ ...newProduct, prix: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                  <select value={newProduct.categorie} onChange={(e) => setNewProduct({ ...newProduct, categorie: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}>
                    {categories.map((cat, i) => (<option key={i} value={cat}>{cat}</option>))}
                  </select>
                  <input type="text" placeholder="Ou nouvelle catégorie..." value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px dashed #D6918B', fontSize: '12px', boxSizing: 'border-box' }} />
                  <div style={{ border: '2px dashed #ddd', borderRadius: '8px', padding: '12px', textAlign: 'center', position: 'relative' }}>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
                    {previewImg ? <img src={previewImg} alt="Preview" style={{ height: '80px', width: '100%', objectFit: 'cover', borderRadius: '6px' }} /> : <span style={{ fontSize: '12px', color: '#888' }}>📷 Importer une image</span>}
                  </div>
                  <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#D6918B', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>Publier</button>
                </form>
              </div>

              <div style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '20px', border: '1px solid #E7DCCB' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>🏷️ Catégories actuelles</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {categories.map((cat, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#FAF7F2', borderRadius: '8px', fontSize: '13px' }}>
                      <span>{cat}</span>
                      <button onClick={() => handleRenameCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>✏️</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {products.map((p) => (
                <div key={p.id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '16px', border: '1px solid #E7DCCB', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {p.img && <img src={p.img} alt={p.nom} style={{ width: '100%', height: '120px', borderRadius: '8px', objectFit: 'cover', marginBottom: '8px' }} />}
                    <span style={{ fontSize: '10px', backgroundColor: '#F3E7DD', padding: '2px 6px', borderRadius: '10px', display: 'inline-block' }}>{p.categorie}</span>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '4px 0' }}>{p.nom}</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#D6918B' }}>{p.prix} €</span>
                    <button onClick={() => handleDeleteProduct(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FAF7F2', color: '#3C2C20', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '16px 24px', backgroundColor: '#fff', borderBottom: '1px solid #E7DCCB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={LOGO_URL} alt="Logo" onClick={handleLogoClick} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer', userSelect: 'none' }} />
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>L'atelier aux mille trésors</h1>
        </div>
        <button onClick={() => { setIsCartOpen(true); setStep('cart'); }} style={{ backgroundColor: '#F3E7DD', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
          🛒 Panier ({totalCartCount})
        </button>
      </header>

      <main style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%', boxSizing: 'border-box', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
          {products.map((p) => (
            <div key={p.id} style={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E7DCCB', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <img src={p.img} alt={p.nom} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <span style={{ fontSize: '11px', backgroundColor: '#F3E7DD', padding: '2px 8px', borderRadius: '10px', alignSelf: 'flex-start', marginBottom: '8px' }}>{p.categorie}</span>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0' }}>{p.nom}</h3>
                <p style={{ fontSize: '12px', color: '#666', flex: 1, margin: '0 0 16px 0' }}>{p.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#D6918B' }}>{p.prix} €</span>
                  <button onClick={() => addToCart(p.id)} style={{ backgroundColor: '#D6918B', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Ajouter</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* MODALE PANIER & LIVRAISON */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ backgroundColor: '#fff', width: '100%', maxWidth: '400px', height: '100%', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box', overflowY: 'auto' }}>
            {step === 'cart' ? (
              <>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Mon Panier</h2>
                    <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                  </div>
                  {cart.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>Votre panier est vide.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
                      {cart.map((item) => {
                        const prod = products.find((p) => p.id === item.id);
                        if (!prod) return null;
                        return (
                          <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                            {prod.img && <img src={prod.img} alt={prod.nom} style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />}
                            <div style={{ flex: 1 }}>
                              <h4 style={{ fontSize: '13px', margin: '0 0 4px 0' }}>{prod.nom}</h4>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <button onClick={() => updateQuantity(item.id, -1)} style={{ border: '1px solid #ccc', background: '#fff', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer' }}>-</button>
                                <span style={{ fontSize: '12px' }}>{item.qty}</span>
                                <button onClick={() => updateQuantity(item.id, 1)} style={{ border: '1px solid #ccc', background: '#fff', borderRadius: '4px', width: '20px', height: '20px', cursor: 'pointer' }}>+</button>
                              </div>
                              <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#D6918B', margin: '4px 0 0 0' }}>{(parseFloat(prod.prix) * item.qty).toFixed(2)} €</p>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#c00', cursor: 'pointer' }}>🗑️</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {cart.length > 0 && (
                  <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span>Total :</span>
                      <strong>{cartTotalAmount.toFixed(2)} €</strong>
                    </div>
                    <button onClick={() => setStep('shipping')} style={{ width: '100%', padding: '12px', backgroundColor: '#D6918B', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                      Passer à la livraison
                    </button>
                  </div>
                )}
              </>
            ) : (
              <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <button type="button" onClick={() => setStep('cart')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' }}>← Retour au panier</button>
                    <button type="button" onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                  </div>
                  <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>Informations de livraison & Paiement</h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input type="text" placeholder="Prénom" required value={shippingInfo.prenom} onChange={(e) => setShippingInfo({ ...shippingInfo, prenom: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    <input type="text" placeholder="Nom" required value={shippingInfo.nom} onChange={(e) => setShippingInfo({ ...shippingInfo, nom: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    <input type="email" placeholder="Adresse e-mail" required value={shippingInfo.email} onChange={(e) => setShippingInfo({ ...shippingInfo, email: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    <input type="text" placeholder="Adresse postale" required value={shippingInfo.adresse} onChange={(e) => setShippingInfo({ ...shippingInfo, adresse: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" placeholder="Code postal" required value={shippingInfo.codePostal} onChange={(e) => setShippingInfo({ ...shippingInfo, codePostal: e.target.value })} style={{ width: '40%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                      <input type="text" placeholder="Ville" required value={shippingInfo.ville} onChange={(e) => setShippingInfo({ ...shippingInfo, ville: e.target.value })} style={{ width: '60%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #eee', paddingTop: '16px' }}>
                  <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#D6918B', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Payer et commander ({cartTotalAmount.toFixed(2)} €) 💳
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}