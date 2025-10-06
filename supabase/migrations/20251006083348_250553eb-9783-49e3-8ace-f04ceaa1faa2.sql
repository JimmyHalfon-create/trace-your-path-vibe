-- Supprimer la policy qui cause la récursion infinie
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;

-- Garder seulement la policy qui permet à chaque utilisateur de voir ses propres rôles
-- (déjà créée: "Users can view their own roles")