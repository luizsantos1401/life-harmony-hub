import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Newspaper, TrendingUp, Briefcase, Cpu, Globe } from "lucide-react";

// Mock data - Em produção, isso viria de uma API de notícias
const mockNews = [
  {
    id: 1,
    title: "Economia brasileira cresce 2,5% no último trimestre",
    summary: "Dados do IBGE mostram recuperação econômica com destaque para setores de serviços e agropecuária.",
    category: "economia",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop",
    date: "2024-11-25",
  },
  {
    id: 2,
    title: "Nova tecnologia promete revolucionar energia solar",
    summary: "Startup brasileira desenvolve painéis solares 40% mais eficientes que os modelos tradicionais.",
    category: "tecnologia",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&auto=format&fit=crop",
    date: "2024-11-25",
  },
  {
    id: 3,
    title: "Mercado financeiro reage positivamente a novas medidas",
    summary: "Bolsa de valores registra alta de 3% após anúncio de políticas econômicas.",
    category: "financas",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop",
    date: "2024-11-24",
  },
  {
    id: 4,
    title: "Brasil lidera inovação em agricultura sustentável",
    summary: "Práticas agropecuárias brasileiras são reconhecidas internacionalmente.",
    category: "atualidades",
    image: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop",
    date: "2024-11-24",
  },
  {
    id: 5,
    title: "IA generativa transforma setor produtivo brasileiro",
    summary: "Empresas nacionais adotam inteligência artificial para otimizar processos.",
    category: "tecnologia",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop",
    date: "2024-11-23",
  },
];

const categories = [
  { value: "todas", label: "Todas", icon: Globe },
  { value: "atualidades", label: "Atualidades", icon: Newspaper },
  { value: "economia", label: "Economia", icon: TrendingUp },
  { value: "financas", label: "Finanças", icon: Briefcase },
  { value: "tecnologia", label: "Tecnologia", icon: Cpu },
];

const Noticias = () => {
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [filteredNews, setFilteredNews] = useState(mockNews);

  useEffect(() => {
    if (selectedCategory === "todas") {
      setFilteredNews(mockNews);
    } else {
      setFilteredNews(mockNews.filter(news => news.category === selectedCategory));
    }
  }, [selectedCategory]);

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      economia: "bg-success/10 text-success",
      tecnologia: "bg-primary/10 text-primary",
      financas: "bg-accent/30 text-accent-foreground",
      atualidades: "bg-muted text-muted-foreground",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Notícias</h1>
          <p className="text-muted-foreground mt-1 font-light">
            Fique atualizado com as principais notícias do Brasil
          </p>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            {categories.map(cat => {
              const Icon = cat.icon;
              return (
                <TabsTrigger key={cat.value} value={cat.value} className="gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredNews.map(news => (
                <Card key={news.id} className="overflow-hidden group cursor-pointer hover:shadow-medium transition-shadow">
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={news.image} 
                      alt={news.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryBadgeColor(news.category)}>
                        {categories.find(c => c.value === news.category)?.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(news.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-medium line-clamp-2">
                      {news.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 font-light">
                      {news.summary}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            {filteredNews.length === 0 && (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground font-light">
                      Nenhuma notícia encontrada nesta categoria
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Noticias;
