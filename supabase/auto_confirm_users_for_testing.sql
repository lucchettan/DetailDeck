-- Script pour confirmer automatiquement les nouveaux utilisateurs (pour les tests uniquement)
-- ATTENTION: Ce script désactive la confirmation d'email pour faciliter les tests
-- À NE PAS utiliser en production !

-- Fonction pour confirmer automatiquement les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION auto_confirm_new_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Confirmer automatiquement l'email pour les tests
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id
    AND email_confirmed_at IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger pour confirmer automatiquement les nouveaux utilisateurs
DROP TRIGGER IF EXISTS auto_confirm_users_trigger ON auth.users;
CREATE TRIGGER auto_confirm_users_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_new_users();

-- Confirmer tous les utilisateurs existants non confirmés
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Afficher un message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Confirmation automatique des emails activée pour les tests';
  RAISE NOTICE '⚠️  ATTENTION: Ceci désactive la confirmation d''email - À NE PAS utiliser en production !';
END $$;
