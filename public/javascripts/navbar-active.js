const currentPage = document.title.replace('Recetario', '');

switch (currentPage) {
	case '':
		document.getElementById('nav-home').classList.add('active');
		break;
	case ' - new recipe':
		document.getElementById('nav-create').classList.add('active');
		break;
	case ' - about':
		document.getElementById('nav-about').classList.add('active');
		break;
}