function openModal(modalKey) {
	const overlay = document.getElementById('modal-overlay');
	if (!overlay) return;

	overlay.querySelectorAll('.modal-panel').forEach((panel) => {
		panel.hidden = panel.dataset.modalKey !== modalKey;
	});

	overlay.hidden = false;
	document.body.style.overflow = 'hidden';
	overlay.querySelector('.modal-close')?.focus();
}

function closeModal() {
	const overlay = document.getElementById('modal-overlay');
	if (!overlay || overlay.hidden) return;
	overlay.hidden = true;
	document.body.style.overflow = '';
}

function initModals() {
	const overlay = document.getElementById('modal-overlay');
	if (!overlay) return;

	document.addEventListener('click', (event) => {
		const trigger = event.target.closest('.box-trigger');
		if (!trigger) return;
		event.preventDefault();
		event.stopPropagation();
		openModal(trigger.dataset.modal);
	});

	overlay.querySelector('.modal-close')?.addEventListener('click', closeModal);
	overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
	document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

export { initModals };