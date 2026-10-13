// Nav toggle
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => navLinks.classList.remove('open')));
}

// Mini terminal (home page)
const termInput = document.getElementById('termInput');
const termOutput = document.getElementById('termOutput');
const routes = {
  help: 'Available: home, about, work, blog, guides, uses, now, contact, resume, clear',
  home: '→ ~/home (you are here on index.html)',
  about: '→ opening ~/about ...',
  work: '→ opening ~/work ...',
  blog: '→ opening ~/blog ...',
  guides: '→ opening ~/guides ...',
  uses: '→ opening ~/uses ...',
  now: '→ opening ~/now ...',
  contact: '→ opening ~/contact ...',
  resume: '→ resume.pdf (add your PDF later)',
};
const pageFor = { about: 'about.html', work: 'work.html', blog: 'blog.html', guides: 'guides.html', uses: 'uses.html', now: 'now.html', contact: 'contact.html' };

if (termInput && termOutput) {
  termInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const cmd = termInput.value.trim().toLowerCase();
    termInput.value = '';
    if (!cmd) return;
    if (cmd === 'clear') { termOutput.textContent = ''; return; }
    const msg = routes[cmd] || `command not found: ${cmd} — try help`;
    termOutput.textContent += `\n$ ${cmd}\n${msg}`;
    termOutput.scrollTop = termOutput.scrollHeight;
    if (pageFor[cmd]) setTimeout(() => { window.location.href = pageFor[cmd]; }, 600);
  });
}

// Contact form (contact page)
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();
    const status = document.getElementById('formStatus');
    if (!name || !email || !message) { status.textContent = 'Please fill in all fields.'; return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { status.textContent = 'Enter a valid email.'; return; }
    status.textContent = `Thanks ${name}! Message noted (demo form).`;
    form.reset();
  });
}
