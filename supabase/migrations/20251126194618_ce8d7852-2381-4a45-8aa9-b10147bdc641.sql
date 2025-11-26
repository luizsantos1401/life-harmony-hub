-- Tabela de preferências do usuário
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  monthly_income NUMERIC DEFAULT 0,
  fixed_expenses NUMERIC DEFAULT 0,
  color_investments TEXT DEFAULT 'hsl(var(--destructive))',
  color_expenses TEXT DEFAULT 'hsl(var(--primary))',
  color_income TEXT DEFAULT 'hsl(var(--success))',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Tabela para armazenar planos de dieta gerados pela IA
CREATE TABLE public.diet_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own diet plans"
ON public.diet_plans
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diet plans"
ON public.diet_plans
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own diet plans"
ON public.diet_plans
FOR DELETE
USING (auth.uid() = user_id);

-- Tabela para conclusão diária da dieta
CREATE TABLE public.daily_diet_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories INTEGER NOT NULL,
  total_protein NUMERIC NOT NULL,
  total_carbs NUMERIC NOT NULL,
  total_fats NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Habilitar RLS
ALTER TABLE public.daily_diet_completions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own diet completions"
ON public.daily_diet_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diet completions"
ON public.daily_diet_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Tabela para mensagens do chat com IA
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Users can view their own chat messages"
ON public.ai_chat_messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
ON public.ai_chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);