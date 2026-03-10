
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'ranger', 'hiker');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  emergency_contact TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Create trail_zones table
CREATE TABLE public.trail_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  coordinates_json JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  max_capacity INT NOT NULL DEFAULT 50,
  difficulty TEXT NOT NULL DEFAULT 'moderate',
  elevation_meters INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create daily_capacity table
CREATE TABLE public.daily_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  max_capacity INT NOT NULL DEFAULT 100,
  current_count INT NOT NULL DEFAULT 0
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  group_size INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending',
  qr_code_data TEXT DEFAULT '',
  emergency_contact_name TEXT DEFAULT '',
  emergency_contact_phone TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create hiker_sessions table
CREATE TABLE public.hiker_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  trail_zone_id UUID REFERENCES public.trail_zones(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  total_distance_km NUMERIC(8,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create hiker_locations table
CREATE TABLE public.hiker_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.hiker_sessions(id) ON DELETE CASCADE NOT NULL,
  latitude NUMERIC(10,7) NOT NULL,
  longitude NUMERIC(10,7) NOT NULL,
  altitude NUMERIC(7,2) DEFAULT 0,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create trail_reports table
CREATE TABLE public.trail_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ranger_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  zone_id UUID REFERENCES public.trail_zones(id) ON DELETE CASCADE NOT NULL,
  condition TEXT NOT NULL DEFAULT 'good',
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hiker_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trail_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger for auto-creating profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'hiker');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Rangers can view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'ranger'));

-- RLS Policies for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for trail_zones (public read)
CREATE POLICY "Anyone authenticated can view zones" ON public.trail_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage zones" ON public.trail_zones FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for daily_capacity (public read)
CREATE POLICY "Anyone authenticated can view capacity" ON public.daily_capacity FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage capacity" ON public.daily_capacity FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for bookings
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage bookings" ON public.bookings FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Rangers can view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'ranger'));

-- RLS Policies for hiker_sessions
CREATE POLICY "Users can view own sessions" ON public.hiker_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.hiker_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all sessions" ON public.hiker_sessions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Rangers can view all sessions" ON public.hiker_sessions FOR SELECT USING (public.has_role(auth.uid(), 'ranger'));

-- RLS Policies for hiker_locations
CREATE POLICY "Users can insert own locations" ON public.hiker_locations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.hiker_sessions WHERE id = session_id AND user_id = auth.uid())
);
CREATE POLICY "Users can view own locations" ON public.hiker_locations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.hiker_sessions WHERE id = session_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all locations" ON public.hiker_locations FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Rangers can view all locations" ON public.hiker_locations FOR SELECT USING (public.has_role(auth.uid(), 'ranger'));

-- RLS Policies for trail_reports
CREATE POLICY "Anyone authenticated can view reports" ON public.trail_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Rangers can create reports" ON public.trail_reports FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'ranger'));
CREATE POLICY "Rangers can update own reports" ON public.trail_reports FOR UPDATE USING (auth.uid() = ranger_id);
CREATE POLICY "Admins can manage reports" ON public.trail_reports FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for chat_messages
CREATE POLICY "Users can view own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable realtime for hiker_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.hiker_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hiker_sessions;

-- Seed trail zones with Mount Kalisungan data
INSERT INTO public.trail_zones (name, description, coordinates_json, status, max_capacity, difficulty, elevation_meters) VALUES
('Summit Trail', 'Main trail to the summit of Mount Kalisungan (622m). Steep ascent with forest canopy.', '[{"lat":14.4833,"lng":121.4167},{"lat":14.4845,"lng":121.4155},{"lat":14.4860,"lng":121.4148},{"lat":14.4878,"lng":121.4140}]', 'active', 30, 'hard', 622),
('River Trail', 'Scenic trail along the river with moderate difficulty. Popular for beginners.', '[{"lat":14.4833,"lng":121.4167},{"lat":14.4828,"lng":121.4180},{"lat":14.4820,"lng":121.4195},{"lat":14.4815,"lng":121.4205}]', 'active', 50, 'easy', 350),
('Ridge Trail', 'Intermediate trail along the mountain ridge with panoramic views of Rizal.', '[{"lat":14.4833,"lng":121.4167},{"lat":14.4840,"lng":121.4175},{"lat":14.4852,"lng":121.4185},{"lat":14.4865,"lng":121.4190}]', 'active', 40, 'moderate', 480),
('Camping Zone A', 'Base camp area near the trailhead with water source and flat ground.', '[{"lat":14.4830,"lng":121.4170},{"lat":14.4835,"lng":121.4172},{"lat":14.4835,"lng":121.4168},{"lat":14.4830,"lng":121.4166}]', 'active', 20, 'easy', 280),
('Restricted Zone', 'Protected wildlife area. Entry requires special permit from park administration.', '[{"lat":14.4870,"lng":121.4130},{"lat":14.4880,"lng":121.4135},{"lat":14.4885,"lng":121.4125},{"lat":14.4875,"lng":121.4120}]', 'restricted', 0, 'hard', 550);

-- Seed daily capacity for next 30 days
INSERT INTO public.daily_capacity (date, max_capacity, current_count)
SELECT generate_series(CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', INTERVAL '1 day')::DATE, 100, 0;
