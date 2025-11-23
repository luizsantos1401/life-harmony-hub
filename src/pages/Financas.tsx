import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, Target } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const categories = [
  "Alimentação",
  "Transporte",
  "Lazer",
  "Contas Fixas",
  "Saúde",
  "Educação",
  "Outros",
];

const Financas = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    setTransactions(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("transactions").insert([{
      ...formData,
      amount: parseFloat(formData.amount),
      user_id: user.id,
    }]);

    if (error) {
      toast.error("Erro ao adicionar transação");
      return;
    }

    toast.success("Transação adicionada!");
    setOpen(false);
    setFormData({
      type: "expense",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    loadTransactions();
  };

  const monthlyData = transactions.reduce((acc: any[], transaction) => {
    const month = new Date(transaction.date).toLocaleDateString("pt-BR", {
      month: "short",
    });
    const existing = acc.find((item) => item.month === month);

    if (existing) {
      if (transaction.type === "income") {
        existing.receitas += Number(transaction.amount);
      } else {
        existing.despesas += Number(transaction.amount);
      }
    } else {
      acc.push({
        month,
        receitas: transaction.type === "income" ? Number(transaction.amount) : 0,
        despesas: transaction.type === "expense" ? Number(transaction.amount) : 0,
      });
    }
    return acc;
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Finanças</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas receitas, despesas e investimentos
            </p>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Transação</DialogTitle>
                <DialogDescription>
                  Registre uma nova receita, despesa ou investimento
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="investment">Investimento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Adicionar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {monthlyData.length > 0 && (
          <Card className="card-soft">
            <CardHeader>
              <CardTitle>Gráfico Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="receitas" fill="hsl(var(--success))" name="Receitas" />
                  <Bar dataKey="despesas" fill="hsl(var(--destructive))" name="Despesas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <Card className="card-soft">
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    {transaction.type === "income" ? (
                      <TrendingUp className="h-5 w-5 text-success" />
                    ) : transaction.type === "investment" ? (
                      <Target className="h-5 w-5 text-primary" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-destructive" />
                    )}
                    <div>
                      <p className="font-medium">{transaction.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description || "Sem descrição"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        transaction.type === "income"
                          ? "text-success"
                          : transaction.type === "investment"
                          ? "text-primary"
                          : "text-destructive"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}R${" "}
                      {Number(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Financas;
