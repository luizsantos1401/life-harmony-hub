import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, userInfo } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (type === "routine") {
      systemPrompt = "Você é um assistente especializado em criar rotinas diárias personalizadas. Sempre inclua um aviso de que suas sugestões não substituem orientação profissional.";
      userPrompt = `Com base nas seguintes informações, crie uma rotina diária detalhada:
- Objetivo: ${userInfo.goal}
- Horários disponíveis: ${userInfo.availableTime}
- Preferências: ${userInfo.preferences || "Nenhuma especificada"}

Estruture a rotina por horários (manhã, tarde, noite) e inclua atividades específicas.`;
    } else if (type === "diet") {
      systemPrompt = "Você é um assistente especializado em nutrição. Sempre inclua um aviso de que suas sugestões não substituem orientação de um nutricionista.";
      userPrompt = `Com base nas seguintes informações, crie um plano alimentar detalhado:
- Objetivo: ${userInfo.goal}
- Preferências alimentares: ${userInfo.foodPreferences || "Nenhuma"}
- Restrições: ${userInfo.restrictions || "Nenhuma"}
- Peso: ${userInfo.weight || "Não informado"} kg
- Altura: ${userInfo.height || "Não informado"} cm

Inclua sugestões de café da manhã, almoço, jantar e lanches, com opções variadas.`;
    } else if (type === "workout") {
      systemPrompt = "Você é um assistente especializado em treinos. Sempre inclua um aviso de que suas sugestões não substituem orientação de um profissional de educação física.";
      userPrompt = `Com base nas seguintes informações, crie um plano de treino personalizado:
- Objetivo: ${userInfo.goal}
- Horários disponíveis: ${userInfo.availableTime}
- Estilo de treino: ${userInfo.workoutStyle || "Não especificado"}
- Nível de experiência: ${userInfo.level || "Iniciante"}

Inclua exercícios específicos, séries, repetições e orientações de execução.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente mais tarde." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar solicitação" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedPlan = data.choices?.[0]?.message?.content || "Erro ao gerar plano";

    return new Response(
      JSON.stringify({ plan: generatedPlan }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-plan function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
