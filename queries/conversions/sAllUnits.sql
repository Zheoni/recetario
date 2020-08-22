SELECT u.id as id, u.name as name, q.name as quantity, s.name as system
FROM UNITS u
LEFT JOIN QUANTITIES q ON u.quantity = q.id
LEFT JOIN UNIT_SYSTEMS s ON u.unitSystem = s.id
ORDER BY u.id ASC;
