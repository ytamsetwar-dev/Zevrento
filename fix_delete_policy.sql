-- Add missing DELETE policy to allow hosts to delete their slots
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "delete_slots" ON public.availability_slots;
CREATE POLICY "delete_slots" ON public.availability_slots FOR DELETE USING (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
