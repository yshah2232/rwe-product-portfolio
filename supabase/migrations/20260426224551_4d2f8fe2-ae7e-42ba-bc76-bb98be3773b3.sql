-- Module 2 reference tables: official US Census FIPS codes
-- Sources:
--   states: https://www2.census.gov/geo/docs/reference/state.txt
--   counties: https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt

CREATE TABLE IF NOT EXISTS public.state_fips (
  state_code text PRIMARY KEY,
  state_fips text NOT NULL UNIQUE,
  state_name text NOT NULL,
  source_url text NOT NULL DEFAULT 'https://www2.census.gov/geo/docs/reference/state.txt'
);

ALTER TABLE public.state_fips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read state_fips" ON public.state_fips FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.county_fips_lookup (
  fips text PRIMARY KEY,
  state_code text NOT NULL,
  county_name text NOT NULL,
  source_url text NOT NULL DEFAULT 'https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt'
);
CREATE INDEX IF NOT EXISTS idx_county_lookup_state_name
  ON public.county_fips_lookup (state_code, lower(county_name));

ALTER TABLE public.county_fips_lookup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read county_fips_lookup" ON public.county_fips_lookup FOR SELECT USING (true);

-- Seed state_fips (official Census ANSI list)
INSERT INTO public.state_fips (state_code, state_fips, state_name) VALUES
('AL','01','Alabama'),('AK','02','Alaska'),('AZ','04','Arizona'),('AR','05','Arkansas'),
('CA','06','California'),('CO','08','Colorado'),('CT','09','Connecticut'),('DE','10','Delaware'),
('DC','11','District of Columbia'),('FL','12','Florida'),('GA','13','Georgia'),('HI','15','Hawaii'),
('ID','16','Idaho'),('IL','17','Illinois'),('IN','18','Indiana'),('IA','19','Iowa'),
('KS','20','Kansas'),('KY','21','Kentucky'),('LA','22','Louisiana'),('ME','23','Maine'),
('MD','24','Maryland'),('MA','25','Massachusetts'),('MI','26','Michigan'),('MN','27','Minnesota'),
('MS','28','Mississippi'),('MO','29','Missouri'),('MT','30','Montana'),('NE','31','Nebraska'),
('NV','32','Nevada'),('NH','33','New Hampshire'),('NJ','34','New Jersey'),('NM','35','New Mexico'),
('NY','36','New York'),('NC','37','North Carolina'),('ND','38','North Dakota'),('OH','39','Ohio'),
('OK','40','Oklahoma'),('OR','41','Oregon'),('PA','42','Pennsylvania'),('RI','44','Rhode Island'),
('SC','45','South Carolina'),('SD','46','South Dakota'),('TN','47','Tennessee'),('TX','48','Texas'),
('UT','49','Utah'),('VT','50','Vermont'),('VA','51','Virginia'),('WA','53','Washington'),
('WV','54','West Virginia'),('WI','55','Wisconsin'),('WY','56','Wyoming'),
('AS','60','American Samoa'),('GU','66','Guam'),('MP','69','Northern Mariana Islands'),
('PR','72','Puerto Rico'),('UM','74','U.S. Minor Outlying Islands'),('VI','78','U.S. Virgin Islands')
ON CONFLICT (state_code) DO NOTHING;