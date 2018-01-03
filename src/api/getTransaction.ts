import Transaction, { tKey } from "./Transaction";

export default function getTransaction(p: Promise<any>): Transaction {
  return (p as any)[tKey];
}
