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
    const { imageBase64 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Você é um especialista em nutrição que analisa fotos de alimentos. 
Identifique os alimentos na imagem e estime os macronutrientes totais.
Retorne APENAS um JSON válido no seguinte formato:
{
  "foods": ["alimento1", "alimento2"],
  "protein": 25.5,
  "carbs": 45.0,
  "fats": 15.0,
  "calories": 420
}

Valores devem ser números (não strings). Seja preciso e realista nas estimativas.`;

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
          { 
            role: "user", 
            content: [
              { type: "text", text: "Analise esta foto de alimentos e retorne os dados nutricionais:" },
              { 
                type: "image_url", 
                image_url: { url: imageBase64 }
              }
            ]
          }
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
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI Response:", content);

    // Try to extract JSON from markdown code blocks or plain text
    let jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/);
    if (!jsonMatch) {
      jsonMatch = content.match(/(\{[\s\S]*?\})/);
    }
    
    if (!jsonMatch) {
      throw new Error("Não foi possível extrair dados estruturados da resposta");
    }

    const nutritionData = JSON.parse(jsonMatch[1]);
    
    // Validate the structure
    if (!nutritionData.foods || !Array.isArray(nutritionData.foods)) {
      throw new Error("Formato de dados inválido");
    }

    return new Response(
      JSON.stringify(nutritionData), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-food function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
