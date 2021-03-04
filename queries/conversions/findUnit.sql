SELECT id,
name,
alias
FROM (
    SELECT id,
           name,
           name AS alias
      FROM UNITS
    UNION
    SELECT UNIT_ALIASES.unit AS id,
           UNITS.name,
           UNIT_ALIASES.alias
      FROM UNIT_ALIASES
           LEFT JOIN
           UNITS ON UNIT_ALIASES.unit = UNITS.id
)
WHERE alias IS $name OR 
alias || 's' IS $name OR
alias || '.' IS $name;
