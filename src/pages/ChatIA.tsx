import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Send, Sparkles, Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ChatIA = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadChatHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("ai_chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (data) {
      setMessages(
        data.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }))
      );
    }
    setLoadingHistory(false);
  };

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("ai_chat_messages").insert([{
      user_id: user.id,
      role,
      content,
    }]);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");
    setLoading(true);

    // Adicionar mensagem do usuário
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      // Salvar mensagem do usuário
      await saveMessage("user", userMessage);

      // Chamar edge function
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          message: userMessage,
          conversationHistory: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Adicionar resposta da IA
      const aiMessage: Message = {
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);

      // Salvar mensagem da IA
      await saveMessage("assistant", data.message);
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB");
      return;
    }

    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;

        const { data, error } = await supabase.functions.invoke("analyze-food", {
          body: { imageBase64: base64 },
        });

        if (error) throw error;

        if (data?.error) {
          toast.error(data.error);
          setLoading(false);
          return;
        }

        const analysisText = `Análise da foto:\n\nAlimentos: ${data.foods.join(", ")}\nProteínas: ${data.protein}g\nCarboidratos: ${data.carbs}g\nGorduras: ${data.fats}g\nCalorias: ${data.calories}`;

        const aiMessage: Message = {
          role: "assistant",
          content: analysisText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        await saveMessage("assistant", analysisText);

        toast.success("Análise concluída!");
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error("Error analyzing image:", error);
      toast.error("Erro ao analisar foto. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Chat com IA</h1>
          <p className="text-muted-foreground mt-1 font-light">
            Converse com seu assistente pessoal do Essenza
          </p>
        </div>

        <Card className="flex-1 flex flex-col card-premium">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Assistente IA
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 p-0">
            <ScrollArea className="flex-1 px-6" ref={scrollRef}>
              {loadingHistory ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <Sparkles className="h-12 w-12 text-primary mb-4" />
                  <p className="text-lg font-medium">Como posso ajudar você hoje?</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Envie uma mensagem ou foto de alimentos para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex gap-3 ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {message.role === "user" && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10">
                          <Sparkles className="h-4 w-4 text-primary" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted rounded-lg px-4 py-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            <div className="px-6 pb-6">
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && !loading && handleSend()}
                  disabled={loading}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={loading || !input.trim()}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                A IA não substitui profissionais de saúde, educação física ou finanças
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ChatIA;
