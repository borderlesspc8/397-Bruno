"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import { Badge } from "@/app/_components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Switch } from "@/app/_components/ui/switch";
import { Skeleton } from "@/app/_components/ui/skeleton";
import { toast } from "sonner";
import {
  Wallet2,
  Plus,
  RefreshCw,
  Link2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Banknote,
  Building2,
  Calculator,
  History
} from "lucide-react";
import { DateRange, WalletBalance } from "../types";
import { useCurrencyFormatter } from "../hooks/useFinancialDashboard";

interface WalletsManagerProps {
  wallets: WalletBalance[];
  loading?: boolean;
  onRefresh?: () => void;
  dateRange: DateRange;
}

interface BankOption {
  id: string;
  name: string;
  logo?: string;
}

export function WalletsManager({ wallets, loading = false, onRefresh, dateRange }: WalletsManagerProps) {
  const formatCurrency = useCurrencyFormatter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "CHECKING",
    bankId: "",
    initialBalance: 0,
    allowNegative: false,
  });

  useEffect(() => {
    const loadBanks = async () => {
      try {
        setBankLoading(true);
        const res = await fetch("/api/banks", { cache: "no-store" });
        if (res.ok) {
          const payload = await res.json();
          setBanks(payload.banks || []);
        }
      } catch (err) {
        console.warn("Falha ao carregar bancos", err);
      } finally {
        setBankLoading(false);
      }
    };

    loadBanks();
  }, []);

  const totals = useMemo(() => {
    const income = wallets.reduce((sum, wallet) => sum + (wallet.autoBalance?.income || 0), 0);
    const expenses = wallets.reduce((sum, wallet) => sum + (wallet.autoBalance?.expenses || 0), 0);
    const computed = wallets.reduce((sum, wallet) => sum + (wallet.computedBalance ?? wallet.balance ?? 0), 0);
    return { income, expenses, computed, net: computed };
  }, [wallets]);

  const formattedRange = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
    return `${formatter.format(dateRange.startDate)} — ${formatter.format(dateRange.endDate)}`;
  }, [dateRange.endDate, dateRange.startDate]);

  const handleCreateWallet = async () => {
    if (!form.name.trim()) {
      toast.error("Informe um nome para a carteira");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/wallets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          bankId: form.bankId || null,
          initialBalance: Number(form.initialBalance) || 0,
          allowNegative: form.allowNegative,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Não foi possível criar a carteira");
      }

      toast.success("Carteira criada com sucesso");
      setIsDialogOpen(false);
      setForm({ name: "", type: "CHECKING", bankId: "", initialBalance: 0, allowNegative: false });
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao criar carteira");
    } finally {
      setCreating(false);
    }
  };

  const handleSyncWallet = async (walletId: string, walletName: string) => {
    setSyncingId(walletId);
    try {
      const res = await fetch("/api/gestao-click/sync-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || "Não foi possível sincronizar esta carteira");
      }

      toast.success(`Sincronização iniciada para ${walletName}`);
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.message || "Falha ao sincronizar carteira");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Saldo calculado a partir das transações no período</p>
          <p className="text-base font-semibold">{formattedRange}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Recalcular
          </Button>
          <Button size="sm" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova carteira
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wallet2 className="h-4 w-4" /> Saldo calculado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : <p className="text-2xl font-bold">{formatCurrency(totals.computed)}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" /> Entradas do período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totals.income)}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingDown className="h-4 w-4" /> Saídas do período
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-32" /> : <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.expenses)}</p>}
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-8 w-40" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center space-y-3 py-10">
            <Banknote className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Nenhuma carteira cadastrada. Crie uma carteira para acompanhar o saldo consolidado.</p>
            <Button onClick={() => setIsDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Criar carteira
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {wallets.map((wallet) => {
            const computed = wallet.computedBalance ?? wallet.balance;
            const difference = computed - (wallet.balance || 0);
            const hasIntegration = Boolean(wallet.bank?.name || wallet.lastSync);
            return (
              <Card key={wallet.walletId} className="flex h-full flex-col">
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Wallet2 className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{wallet.walletName}</CardTitle>
                    </div>
                    {wallet.bank?.name && (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <Building2 className="h-3 w-3" />
                        {wallet.bank.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <History className="h-3 w-3" />
                    <span>
                      Última atualização: {wallet.lastUpdate ? new Date(wallet.lastUpdate).toLocaleString("pt-BR") : "—"}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo calculado</p>
                    <p className="text-2xl font-bold">{formatCurrency(computed)}</p>
                    <p className="text-xs text-muted-foreground">Com base nas transações do período</p>
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Saldo registrado</span>
                      <span className="font-semibold">{formatCurrency(wallet.balance)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Diferença</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          difference === 0
                            ? "text-muted-foreground"
                            : difference > 0
                              ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
                              : "border-red-200 text-red-700 dark:border-red-800 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(difference)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="space-y-1 rounded-lg border bg-green-50 p-3 dark:bg-green-900/10">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                        <TrendingUp className="h-4 w-4" /> Entradas
                      </div>
                      <p className="font-semibold text-green-700 dark:text-green-300">
                        {formatCurrency(wallet.autoBalance?.income || 0)}
                      </p>
                    </div>
                    <div className="space-y-1 rounded-lg border bg-red-50 p-3 dark:bg-red-900/10">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                        <TrendingDown className="h-4 w-4" /> Saídas
                      </div>
                      <p className="font-semibold text-red-700 dark:text-red-300">
                        {formatCurrency(wallet.autoBalance?.expenses || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calculator className="h-3 w-3" />
                    <span>
                      {wallet.totalTransactions || 0} transações consideradas
                    </span>
                  </div>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSyncWallet(wallet.walletId, wallet.walletName)}
                      disabled={syncingId === wallet.walletId}
                    >
                      <Link2 className={`mr-2 h-4 w-4 ${syncingId === wallet.walletId ? "animate-spin" : ""}`} />
                      {hasIntegration ? "Sincronizar banco" : "Forçar sincronização"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRefresh}
                      className="text-muted-foreground"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Atualizar
                    </Button>
                    {difference !== 0 && (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" /> Divergência detectada
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova carteira</DialogTitle>
            <DialogDescription>
              Cadastre contas correntes, poupanças ou carteiras digitais para acompanhar o saldo consolidado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex.: Conta Corrente Bradesco"
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHECKING">Conta corrente</SelectItem>
                    <SelectItem value="SAVINGS">Poupança</SelectItem>
                    <SelectItem value="CASH">Caixa</SelectItem>
                    <SelectItem value="CARD">Cartão</SelectItem>
                    <SelectItem value="INVESTMENT">Investimentos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Banco (opcional)</Label>
                <Select
                  value={form.bankId || undefined}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, bankId: value }))}
                  disabled={bankLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={bankLoading ? "Carregando..." : "Sem banco vinculado"} />
                  </SelectTrigger>
                  <SelectContent>
                    {banks.map((bank) => (
                      <SelectItem key={bank.id} value={bank.id}>
                        {bank.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Saldo inicial</Label>
                <Input
                  type="number"
                  value={form.initialBalance}
                  onChange={(e) => setForm((prev) => ({ ...prev, initialBalance: Number(e.target.value) }))}
                  min={0}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label className="text-sm">Permitir saldo negativo</Label>
                  <p className="text-xs text-muted-foreground">Útil para cartões e limite de crédito</p>
                </div>
                <Switch
                  checked={form.allowNegative}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, allowNegative: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button onClick={handleCreateWallet} disabled={creating}>
              {creating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
              Salvar carteira
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
