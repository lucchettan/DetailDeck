-- Ajouter la colonne vehicle_info à la table reservations
-- Cette colonne contiendra les informations sur le véhicule (marque, modèle, couleur, plaque, etc.)

ALTER TABLE reservations ADD COLUMN vehicle_info TEXT;

-- Commentaire pour expliquer l'usage
COMMENT ON COLUMN reservations.vehicle_info IS 'Informations sur le véhicule (marque, modèle, couleur, plaque d''immatriculation, etc.)';



