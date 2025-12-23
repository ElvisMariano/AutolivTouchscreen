-- Migration: Update RPCs to support plant_ids

-- 1. Update create_user_admin to accept new_plant_ids
CREATE OR REPLACE FUNCTION public.create_user_admin(
    new_username text, 
    new_name text, 
    new_password_hash text, 
    new_salt text, 
    new_role_id uuid,
    new_plant_ids uuid[] DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_id uuid;
BEGIN
  INSERT INTO public.users (username, name, password_hash, salt, role_id, plant_ids)
  VALUES (new_username, new_name, new_password_hash, new_salt, new_role_id, new_plant_ids)
  RETURNING id INTO new_id;
  
  RETURN new_id;
END;
$function$;

-- 2. Update update_user_admin to accept new_plant_ids
CREATE OR REPLACE FUNCTION public.update_user_admin(
    target_user_id uuid, 
    new_username text, 
    new_name text, 
    new_role_id uuid DEFAULT NULL::uuid, 
    new_password_hash text DEFAULT NULL::text, 
    new_salt text DEFAULT NULL::text,
    new_plant_ids uuid[] DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.users
  SET 
    username = COALESCE(new_username, username),
    name = COALESCE(new_name, name),
    role_id = COALESCE(new_role_id, role_id),
    password_hash = COALESCE(new_password_hash, password_hash),
    salt = COALESCE(new_salt, salt),
    plant_ids = COALESCE(new_plant_ids, plant_ids),
    updated_at = now()
  WHERE id = target_user_id;
END;
$function$;
