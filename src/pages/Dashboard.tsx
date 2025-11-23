import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target, CheckCircle2, Dumbbell, UtensilsCrossed } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const Dashboard = () => {
  const [stats, setStats] = useState({
    monthlyIncome: 0,
    monthlyExpense: 0,
    investments: 0,
    savings: 0,
    completedHabits: 0,
    totalHabits: 0,
    weekWorkouts: 0,
    todayMeals: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfWeek = new Date();
    lastDayOfWeek.setDate(now.getDate() - 7);

    // Load financial data
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .gte("date", firstDayOfMonth.toISOString().split("T")[0]);

    const income = transactions
      ?.filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const expense = transactions
      ?.filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const investments = transactions
      ?.filter((t) => t.type === "investment")
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    // Load habits data
    const { data: habits } = await supabase
      .from("habits")
      .select("*, habit_completions(*)");

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedToday = habits?.filter((habit) =>
      habit.habit_completions?.some(
        (c: any) => new Date(c.completed_at) >= todayStart
      )
    ).length || 0;

    // Load workouts
    const { data: workouts } = await supabase
      .from("workouts")
      .select("*")
      .gte("date", lastDayOfWeek.toISOString().split("T")[0]);

    // Load meals
    const { data: meals } = await supabase
      .from("meals")
      .select("*")
      .eq("date", now.toISOString().split("T")[0]);

    setStats({
      monthlyIncome: income,
      monthlyExpense: expense,
      investments,
      savings: income - expense,
      completedHabits: completedToday,
      totalHabits: habits?.length || 0,
      weekWorkouts: workouts?.length || 0,
      todayMeals: meals?.length || 0,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral da sua vida pessoal e financeira
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ganho Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                R$ {stats.monthlyIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Gasto Mensal</CardTitle>
              <TrendingUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                R$ {stats.monthlyExpense.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                R$ {stats.investments.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Economia</CardTitle>
              <DollarSign className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent-foreground">
                R$ {stats.savings.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Hábitos Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{stats.completedHabits} de {stats.totalHabits} completos</span>
                  <span className="text-muted-foreground">
                    {stats.totalHabits > 0
                      ? Math.round((stats.completedHabits / stats.totalHabits) * 100)
                      : 0}%
                  </span>
                </div>
                <Progress
                  value={
                    stats.totalHabits > 0
                      ? (stats.completedHabits / stats.totalHabits) * 100
                      : 0
                  }
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Treinos (7 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.weekWorkouts}</div>
              <p className="text-sm text-muted-foreground mt-1">
                treinos realizados
              </p>
            </CardContent>
          </Card>

          <Card className="card-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-primary" />
                Refeições Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.todayMeals}</div>
              <p className="text-sm text-muted-foreground mt-1">
                refeições registradas
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
