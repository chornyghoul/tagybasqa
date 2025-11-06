// Minimal JS for modal, form toggles, and simple nav state
(function(){
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

  // Modal logic
  function modal(id){
    const root = document.getElementById(id);
    if(!root) return {
      open:()=>{}, close:()=>{}
    };
    const open = () => root.classList.add('open');
    const close = () => root.classList.remove('open');
    root.addEventListener('click', (e)=>{ if(e.target === root) close(); });
    $$('[data-close="'+id+'"]', root).forEach(btn=>btn.addEventListener('click', close));
    return {open, close};
  }

  const registerModal = modal('register-modal');
  const loginModal = modal('login-modal');

  // Triggers
  $$("[data-open='register']").forEach(btn=>btn.addEventListener('click', (e)=>{ e.preventDefault(); registerModal.open(); }));
  $$("[data-open='login']").forEach(btn=>btn.addEventListener('click', (e)=>{ e.preventDefault(); loginModal.open(); }));

  // Simple tab between login and register inside modals
  $$("[data-switch='to-register']").forEach(el=>el.addEventListener('click', (e)=>{ e.preventDefault(); loginModal.close(); registerModal.open(); }));
  $$("[data-switch='to-login']").forEach(el=>el.addEventListener('click', (e)=>{ e.preventDefault(); registerModal.close(); loginModal.open(); }));

  // Demo submit: prevent full page reload
  $$("form[data-modal]").forEach(form=>{
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      const data = Object.fromEntries(fd.entries());
      console.log('Submitted', form.getAttribute('data-modal'), data);
      // close after fake success
      const id = form.getAttribute('data-modal');
      document.getElementById(id)?.classList.remove('open');
      form.reset();
      const msg = document.getElementById('flash');
      if(msg){
        msg.textContent = 'Успешно!';
        msg.classList.remove('hidden');
        setTimeout(()=>msg.classList.add('hidden'), 2500);
      }
    });
  });
})();

