-- Parametrización

-- Reseteo
DROP INDEX IF EXISTS uk_users_email_active;
DROP INDEX IF EXISTS uk_users_username_active;
DROP INDEX IF EXISTS uk_roles_active;
DROP INDEX IF EXISTS uk_permissions_active;
DROP INDEX IF EXISTS uk_parameters_active;
DROP INDEX IF EXISTS uk_user_parameters_active;
DROP INDEX IF EXISTS uk_modules_active;
DROP INDEX IF EXISTS uk_menu_permissions_active;
DROP INDEX IF EXISTS uk_menus_active;

DROP INDEX IF EXISTS uk_countries_code_active;
DROP INDEX IF EXISTS uk_countries_name_active;
DROP INDEX IF EXISTS uk_municipalities_country_name_active;
DROP INDEX IF EXISTS uk_municipalities_code_active;

DROP INDEX IF EXISTS uk_type_regimen_code_active;
DROP INDEX IF EXISTS uk_type_organization_code_active;
DROP INDEX IF EXISTS uk_withholdings_code_active;

-- Creacion de idexes
CREATE UNIQUE INDEX IF NOT EXISTS uk_users_email_active
ON users (email)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_users_username_active
ON users (username)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_roles_active
ON roles (name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_permissions_active
ON permissions (code)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_parameters_active
ON parameters (name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_user_parameters_active
ON user_parameters (user_id, parameter_id)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_modules_active
ON modules (url)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_menu_permissions_active
ON menu_permissions (menu_id, role_id)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_menus_active
ON menus (module_id, component, path)
WHERE deleted_at IS NULL;

-- Companies

CREATE UNIQUE INDEX IF NOT EXISTS uk_companies_nit_active
ON companies (nit)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_companies_ass_whitholding
ON company_withholding_assignments (company_id, withholding_id)
WHERE deleted_at IS NULL;

-- Countries and Municipalities

CREATE UNIQUE INDEX IF NOT EXISTS uk_countries_code_active
ON countries (code)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_countries_name_active
ON countries (name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_municipalities_country_name_active
ON municipalities (country_id, name)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_municipalities_code_active
ON municipalities (country_id, code)
WHERE deleted_at IS NULL;

-- Type organization, type regimen, withholding

CREATE UNIQUE INDEX IF NOT EXISTS uk_type_regimen_code_active
ON type_regimen (code)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_type_organization_code_active
ON type_organization (code)
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uk_withholdings_code_active
ON withholdings (code)
WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS prevent_soft_delete_last_superadmin ON users;
CREATE TRIGGER prevent_soft_delete_last_superadmin
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION check_soft_delete_superadmin();

DROP TRIGGER IF EXISTS prevent_delete_last_role1 ON users_roles;
CREATE TRIGGER prevent_delete_last_role1
BEFORE DELETE ON users_roles
FOR EACH ROW
EXECUTE FUNCTION check_min_role1_user();

DROP TRIGGER IF EXISTS prevent_update_last_role1 ON users_roles;
CREATE TRIGGER prevent_update_last_role1
BEFORE UPDATE ON users_roles
FOR EACH ROW
WHEN (OLD.role_id = 1 AND NEW.role_id <> 1)
EXECUTE FUNCTION check_min_role1_user();