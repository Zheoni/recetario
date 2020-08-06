SELECT type, content, recipe FROM STEPS
WHERE recipe = ?
ORDER BY sort ASC;
