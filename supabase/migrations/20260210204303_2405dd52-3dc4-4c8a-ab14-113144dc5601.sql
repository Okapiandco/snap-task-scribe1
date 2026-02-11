
-- Create meeting_notes table
CREATE TABLE public.meeting_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TEXT,
  attendees TEXT[] DEFAULT '{}',
  summary TEXT,
  notes TEXT[] DEFAULT '{}',
  tasks JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notes
CREATE POLICY "Users can view own notes" ON public.meeting_notes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes" ON public.meeting_notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes" ON public.meeting_notes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes" ON public.meeting_notes
  FOR DELETE USING (auth.uid() = user_id);
