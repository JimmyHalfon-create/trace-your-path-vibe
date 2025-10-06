-- Supprimer l'ancienne policy problématique
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Créer une policy qui permet à chaque utilisateur de voir ses propres rôles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Créer une policy qui permet aux admins de voir tous les rôles
CREATE POLICY "Admins can view all user roles"
ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.user_id = auth.uid()
  )
);