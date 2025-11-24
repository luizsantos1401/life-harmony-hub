import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, TrendingUp, TrendingDown, PiggyBank, DollarSign, Edit2, Trash2 } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--accent))"];

const Financas = () => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [chartType, setChartType] = useState<"pie" | "bar" | "line" | "area" | "radar">("bar");
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
      toast.error("Erro ao registrar transação");
      return;
    }

    toast.success("Transação registrada!");
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

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description || "",
      date: transaction.date,
    });
    setEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("transactions")
      .update({
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
      })
      .eq("id", editingTransaction.id);

    if (error) {
      toast.error("Erro ao atualizar transação");
      return;
    }

    toast.success("Transação atualizada!");
    setEditOpen(false);
    setEditingTransaction(null);
    loadTransactions();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao deletar transação");
      return;
    }

    toast.success("Transação deletada!");
    setDeleteId(null);
    loadTransactions();
  };

  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += Number(t.amount);
      if (t.type === "expense") acc.expense += Number(t.amount);
      if (t.type === "investment") acc.investment += Number(t.amount);
      return acc;
    },
    { income: 0, expense: 0, investment: 0 }
  );

  const balance = totals.income - totals.expense - totals.investment;

  // Prepare chart data
  const categoryData = transactions.reduce((acc: any, t) => {
    if (!acc[t.category]) {
      acc[t.category] = 0;
    }
    acc[t.category] += Number(t.amount);
    return acc;
  }, {});

  const chartData = Object.entries(categoryData).map(([name, value]) => ({
    name,
    value: Number(value),
  }));

  const renderChart = () => {
    switch (chartType) {
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
              <Radar name="Valor" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Financeiro</h1>
            <p className="text-muted-foreground mt-1 font-light">
              Controle suas finanças
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
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Input
                    placeholder="Ex: Alimentação, Transporte..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    placeholder="Opcional"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full">
                  Registrar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">Receitas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-2xl font-medium">R$ {totals.income.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">Despesas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-2xl font-medium">R$ {totals.expense.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">Investimentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-primary" />
                <span className="text-2xl font-medium">R$ {totals.investment.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="card-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-light text-muted-foreground">Saldo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className={`text-2xl font-medium ${balance >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {balance.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <Card className="card-premium">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-medium">Análise por Categoria</CardTitle>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo de gráfico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Barras</SelectItem>
                  <SelectItem value="pie">Pizza</SelectItem>
                  <SelectItem value="line">Linhas</SelectItem>
                  <SelectItem value="area">Área</SelectItem>
                  <SelectItem value="radar">Radar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              renderChart()
            ) : (
              <p className="text-center text-muted-foreground font-light py-8">
                Nenhuma transação registrada
              </p>
            )}
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Transações Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground font-light py-4">
                  Nenhuma transação ainda
                </p>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{transaction.category}</div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          transaction.type === "income" ? "bg-success/10 text-success" :
                          transaction.type === "expense" ? "bg-destructive/10 text-destructive" :
                          "bg-primary/10 text-primary"
                        }`}>
                          {transaction.type === "income" ? "Receita" :
                           transaction.type === "expense" ? "Despesa" : "Investimento"}
                        </span>
                      </div>
                      {transaction.description && (
                        <p className="text-sm text-muted-foreground font-light mt-1">
                          {transaction.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-light mt-1">
                        {new Date(transaction.date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium">
                        R$ {Number(transaction.amount).toFixed(2)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
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
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Salvar Alterações
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar transação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Financas;
