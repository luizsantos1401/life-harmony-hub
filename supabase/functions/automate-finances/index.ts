import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.84.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar todos os usuários com preferências de automação
    const { data: preferences, error: prefError } = await supabase
      .from("user_preferences")
      .select("*");

    if (prefError) throw prefError;

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const today = now.toISOString().split("T")[0];
    const isFirstDay = now.getDate() === 1;

    if (!isFirstDay) {
      return new Response(
        JSON.stringify({ message: "Automação executada apenas no primeiro dia do mês" }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let processedCount = 0;

    for (const pref of preferences || []) {
      const { user_id, monthly_income, fixed_expenses } = pref;

      // Verificar se já existem transações automáticas para este mês
      const { data: existingTransactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user_id)
        .gte("date", firstDayOfMonth.toISOString().split("T")[0])
        .eq("description", "Automação mensal");

      if (existingTransactions && existingTransactions.length > 0) {
        console.log(`Transações já existem para usuário ${user_id}`);
        continue;
      }

      const transactionsToInsert = [];

      // Adicionar receita mensal
      if (monthly_income && monthly_income > 0) {
        transactionsToInsert.push({
          user_id,
          type: "income",
          amount: monthly_income,
          category: "Salário",
          description: "Automação mensal",
          date: today,
        });
      }

      // Adicionar gastos fixos
      if (fixed_expenses && fixed_expenses > 0) {
        transactionsToInsert.push({
          user_id,
          type: "expense",
          amount: fixed_expenses,
          category: "Gastos Fixos",
          description: "Automação mensal",
          date: today,
        });
      }

      if (transactionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("transactions")
          .insert(transactionsToInsert);

        if (insertError) {
          console.error(`Erro ao inserir transações para usuário ${user_id}:`, insertError);
        } else {
          processedCount++;
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Automação executada com sucesso para ${processedCount} usuários`,
        processed: processedCount 
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in automate-finances function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
