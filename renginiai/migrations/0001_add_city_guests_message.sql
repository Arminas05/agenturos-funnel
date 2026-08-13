-- Jau veikiančiai gamybinei bazei nauji stulpeliai pridedami ALTER TABLE,
-- nes schema.sql naudoja CREATE TABLE IF NOT EXISTS ir naujų laukų
-- egzistuojančiai lentelei nepridės.
--
-- Paleisti VIENĄ kartą, PRIEŠ diegiant kodą, kuris į šiuos stulpelius rašo:
--   npx wrangler d1 execute renginiai-leads --remote --file=./migrations/0001_add_city_guests_message.sql
--
-- Arba per Cloudflare skydelį: Workers & Pages → D1 → renginiai-leads →
-- Console → įklijuoti ir paleisti šias tris eilutes.

ALTER TABLE leads ADD COLUMN city TEXT;
ALTER TABLE leads ADD COLUMN guest_count TEXT;
ALTER TABLE leads ADD COLUMN message TEXT;
