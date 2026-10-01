export const brl = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const STATUS_FLOW = ["recebido", "em_preparo", "saiu_entrega", "entregue"] as const;
export type OrderStatus = (typeof STATUS_FLOW)[number];

export const STATUS_LABEL: Record<string, string> = {
  recebido: "Recebido",
  em_preparo: "Em preparo",
  saiu_entrega: "Saiu para entrega",
  entregue: "Entregue",
};

export const PAYMENT_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro",
  pix: "Pix",
  cartao: "Cartão",
};

export function nextStatus(s: string): OrderStatus | null {
  const i = STATUS_FLOW.indexOf(s as OrderStatus);
  return i >= 0 && i < STATUS_FLOW.length - 1 ? STATUS_FLOW[i + 1]! : null;
}
