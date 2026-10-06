// Web Bluetooth thermal printer (ESC/POS) — singleton connection shared across the admin.
import { useSyncExternalStore } from "react";
import { brl, PAYMENT_LABEL } from "@/lib/format";
import type { ReceiptOrder } from "@/components/PrintableReceipt";

export type BtStatus = "disconnected" | "connecting" | "connected" | "error";

// Common services used by cheap BLE thermal printers
const SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
];

type State = { status: BtStatus; deviceName: string | null; error: string | null };
let state: State = { status: "disconnected", deviceName: null, error: null };
let device: any = null;
let characteristic: any = null;
const listeners = new Set<() => void>();
const set = (p: Partial<State>) => { state = { ...state, ...p }; listeners.forEach((l) => l()); };

export const isBluetoothSupported = () =>
  typeof navigator !== "undefined" && !!(navigator as any).bluetooth;

export async function connectPrinter() {
  if (!isBluetoothSupported()) {
    set({ status: "error", error: "Este navegador não suporta Bluetooth. Use o Chrome no Android ou Windows." });
    return;
  }
  try {
    set({ status: "connecting", error: null });
    device = await (navigator as any).bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: SERVICES });
    device.addEventListener("gattserverdisconnected", () => {
      characteristic = null;
      set({ status: "disconnected" });
    });
    const server = await device.gatt.connect();
    characteristic = null;
    for (const uuid of SERVICES) {
      try {
        const svc = await server.getPrimaryService(uuid);
        const chars = await svc.getCharacteristics();
        const w = chars.find((c: any) => c.properties.write || c.properties.writeWithoutResponse);
        if (w) { characteristic = w; break; }
      } catch { /* service not present */ }
    }
    if (!characteristic) throw new Error("Impressora não compatível (canal de escrita não encontrado).");
    set({ status: "connected", deviceName: device.name ?? "Impressora", error: null });
  } catch (e: any) {
    const cancelled = e?.name === "NotFoundError";
    set({ status: cancelled ? "disconnected" : "error", error: cancelled ? null : e?.message ?? "Falha ao conectar" });
  }
}

export function disconnectPrinter() {
  try { device?.gatt?.disconnect(); } catch { /* ignore */ }
  characteristic = null;
  set({ status: "disconnected", deviceName: null });
}

export function useBluetoothPrinter() {
  const s = useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => state,
  );
  return { ...s, supported: isBluetoothSupported(), connect: connectPrinter, disconnect: disconnectPrinter, printOrder };
}

// ---------- ESC/POS builder ----------
const ascii = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E\n]/g, "");

function buildReceipt(order: ReceiptOrder, storeName: string, cols: number): Uint8Array {
  const out: number[] = [];
  const raw = (...b: number[]) => out.push(...b);
  const text = (s: string) => { for (const ch of ascii(s)) out.push(ch.charCodeAt(0)); };
  const ln = (s = "") => { text(s); raw(0x0a); };
  const align = (n: 0 | 1 | 2) => raw(0x1b, 0x61, n);
  const bold = (on: boolean) => raw(0x1b, 0x45, on ? 1 : 0);
  const big = (on: boolean) => raw(0x1d, 0x21, on ? 0x11 : 0);
  const row = (l: string, r: string) => {
    l = ascii(l); r = ascii(r);
    const space = cols - r.length - 1;
    const lines: string[] = [];
    while (l.length > space) { lines.push(l.slice(0, space)); l = l.slice(space); }
    lines.forEach((x) => ln(x));
    ln(l + " ".repeat(Math.max(1, cols - l.length - r.length)) + r);
  };
  const sep = (c = "-") => ln(c.repeat(cols));

  raw(0x1b, 0x40); // init
  align(1); bold(true); big(true); ln(storeName.toUpperCase()); big(false);
  sep("=");
  ln(`PEDIDO #${order.id.slice(0, 6).toUpperCase()}`); bold(false);
  ln(new Date(order.created_at).toLocaleString("pt-BR"));
  sep("=");
  align(0);
  bold(true); ln("CLIENTE"); bold(false);
  ln(order.customer_name);
  ln(`Tel: ${order.phone}`);
  if (order.address) ln(`End: ${order.address}`);
  if (order.notes) ln(`Obs: ${order.notes}`);
  sep();
  bold(true); ln("ITENS"); bold(false);
  let subtotal = 0;
  for (const i of order.order_items) {
    const v = Number(i.unit_price) * i.quantity;
    subtotal += v;
    row(`${i.quantity}x ${i.product_name}`, brl(v));
  }
  sep();
  row("Subtotal", brl(subtotal));
  row("Entrega", brl(Number(order.delivery_fee) || 0));
  bold(true); row("TOTAL", brl(Number(order.total) || 0)); bold(false);
  sep();
  ln(`Pagamento: ${PAYMENT_LABEL[order.payment_method] ?? order.payment_method} (na entrega)`);
  sep("=");
  align(1); ln("Obrigado pela preferencia!");
  raw(0x0a, 0x0a, 0x0a, 0x0a);
  raw(0x1d, 0x56, 0x42, 0x00); // cut (ignored by printers without cutter)
  return new Uint8Array(out);
}

export async function printOrder(order: ReceiptOrder, storeName: string, paperWidth: 58 | 80) {
  if (!characteristic) throw new Error("Impressora não conectada");
  const data = buildReceipt(order, storeName, paperWidth === 80 ? 48 : 32);
  const chunk = 100;
  for (let i = 0; i < data.length; i += chunk) {
    const part = data.slice(i, i + chunk);
    if (characteristic.properties.writeWithoutResponse && characteristic.writeValueWithoutResponse) {
      await characteristic.writeValueWithoutResponse(part);
      await new Promise((r) => setTimeout(r, 20));
    } else {
      await characteristic.writeValue(part);
    }
  }
}
