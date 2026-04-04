-- Ajouter les colonnes latitude et longitude si elles n'existent pas
ALTER TABLE cafes
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL;
