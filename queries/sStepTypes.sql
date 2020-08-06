SELECT st.name, t.en, t.es FROM STEP_TYPES st
LEFT JOIN TRANSLATIONS t ON st.translation = t.id
ORDER BY number ASC;
