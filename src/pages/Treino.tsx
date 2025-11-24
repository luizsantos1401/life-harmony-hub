import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { CreateWorkout } from "@/components/treino/CreateWorkout";
import { WorkoutCalendar } from "@/components/treino/WorkoutCalendar";
import { WorkoutList } from "@/components/treino/WorkoutList";

const Treino = () => {
  const [view, setView] = useState<"list" | "create" | "calendar">("list");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-medium tracking-tight">Treino</h1>
            <p className="text-muted-foreground mt-1 font-light">
              Crie e acompanhe seus treinos
            </p>
          </div>
        </div>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="create">Criar Treino</TabsTrigger>
            <TabsTrigger value="list">Meus Treinos</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <WorkoutCalendar />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <CreateWorkout />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <WorkoutList />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Treino;
