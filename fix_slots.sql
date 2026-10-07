-- Forcefully fix the availability_slots table
DROP TABLE IF EXISTS public.availability_slots CASCADE;

CREATE TABLE public.availability_slots (
    id text PRIMARY KEY,
    is_booked boolean DEFAULT false,
    created_at timestamp with time zone,
    vehicle_id text,
    model text,
    plate text,
    battery numeric,
    host_phone text,
    start_time text,
    end_time text,
    hub_id text,
    pickup_location text
);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_slots" ON public.availability_slots;
DROP POLICY IF EXISTS "select_slots" ON public.availability_slots;
DROP POLICY IF EXISTS "update_slots" ON public.availability_slots;

CREATE POLICY "insert_slots" ON public.availability_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "select_slots" ON public.availability_slots FOR SELECT USING (true);
CREATE POLICY "update_slots" ON public.availability_slots FOR UPDATE USING (true);

-- Refresh the API schema cache just to be safe
NOTIFY pgrst, 'reload schema';
