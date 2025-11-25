import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Financas from "./pages/Financas";
import Habitos from "./pages/Habitos";
import Treino from "./pages/Treino";
import Dieta from "./pages/Dieta";
import Anotacoes from "./pages/Anotacoes";
import Perfil from "./pages/Perfil";
import GerarPlano from "./pages/GerarPlano";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/financas" element={<Financas />} />
          <Route path="/habitos" element={<Habitos />} />
          <Route path="/treino" element={<Treino />} />
          <Route path="/dieta" element={<Dieta />} />
          <Route path="/anotacoes" element={<Anotacoes />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/gerar-plano" element={<GerarPlano />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
