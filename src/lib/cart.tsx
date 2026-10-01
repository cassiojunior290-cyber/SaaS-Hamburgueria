import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { id: string; name: string; price: number; image_url: string | null; quantity: number };

type CartCtx = {
  items: CartItem[];
  add: (p: Omit<CartItem, "quantity">) => void;
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "cartoon-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, loaded]);

  const add: CartCtx["add"] = (p) =>
    setItems((cur) => {
      const f = cur.find((i) => i.id === p.id);
      if (f) return cur.map((i) => (i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
      return [...cur, { ...p, quantity: 1 }];
    });
  const setQty = (id: string, q: number) =>
    setItems((cur) => (q <= 0 ? cur.filter((i) => i.id !== id) : cur.map((i) => (i.id === id ? { ...i, quantity: q } : i))));
  const remove = (id: string) => setItems((cur) => cur.filter((i) => i.id !== id));
  const clear = () => setItems([]);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return <Ctx.Provider value={{ items, add, setQty, remove, clear, subtotal, count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
}
