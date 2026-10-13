/* Shared shell interactions. No network or paid API is required. */
var BizUI = (function () {
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function modal(title, body) {
    var old = document.getElementById('shared-modal'); if (old) old.remove();
    var wrap = document.createElement('div'); wrap.id = 'shared-modal'; wrap.className = 'modal-overlay open';
    wrap.innerHTML = '<section class="modal" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="modal-header"><h2 class="modal-title">'+esc(title)+'</h2><button class="btn btn-ghost" data-close aria-label="Close">✕</button></div><div class="modal-body">'+body+'</div></section>';
    document.body.appendChild(wrap);
    function close(){wrap.remove();document.removeEventListener('keydown',key);}
    function key(e){if(e.key==='Escape')close();}
    wrap.addEventListener('click',function(e){if(e.target===wrap || e.target.closest('[data-close]'))close();});
    document.addEventListener('keydown',key); wrap.querySelector('[data-close]').focus();
    return wrap;
  }
  function notices() {
    var docs = BizStorage.getDocuments().filter(function(d){return d.type==='invoice' && d.payment_status !== 'paid';});
    modal('Business notifications', docs.length ? docs.map(function(d){var c=BizStorage.getCustomerById(d.customer_id);return '<a class="notice-row" href="#/invoices/edit/'+d.id+'" data-close><span class="activity-dot"></span><div><strong>'+esc(d.reference_no)+' · '+(BizMoney.isOverdue(d)?'Overdue':'Awaiting payment')+'</strong><p>'+esc(c && (c.company||c.name))+' · '+esc(BizMoney.format(d.total_p,BizStorage.getSettings().currency_symbol))+'</p></div></a>';}).join('') : '<div class="empty-state"><h3>You’re all caught up</h3><p>No outstanding invoices.</p></div>');
  }
  function headerSearch(input) {
    var old=document.getElementById('header-results'); if(old)old.remove();
    var q=input.value.trim().toLowerCase(); if(!q)return;
    var matches=BizStorage.getDocuments().filter(function(d){var c=BizStorage.getCustomerById(d.customer_id);return [d.reference_no,d.type,c&&c.company,c&&c.name,d.body_json&&d.body_json.subject].join(' ').toLowerCase().includes(q);}).slice(0,6);
    var panel=document.createElement('div'); panel.id='header-results';panel.className='search-results';
    panel.innerHTML=matches.length?matches.map(function(d){var route=d.type==='quotation'?'/quotations/edit/':d.type==='invoice'?'/invoices/edit/':'/generator/edit/';return '<a href="#'+route+d.id+'"><strong>'+esc(d.reference_no)+'</strong><span>'+esc(d.type)+'</span></a>';}).join(''):'<p>No documents found.</p>';
    input.parentNode.appendChild(panel);
  }
  function customerCard(select) {
    var old=document.getElementById('selected-contact');if(old)old.remove();
    var c=BizStorage.getCustomerById(select.value);if(!c)return;
    var div=document.createElement('div'); div.id='selected-contact';div.className='contact-summary';
    div.innerHTML='<strong>'+esc(c.company||c.name)+'</strong><p>'+esc(c.name)+' · '+esc(c.email||'Email not supplied')+' · '+esc(c.phone||'Phone not supplied')+'</p><p>'+esc(c.address)+'</p><a href="#/customers/edit/'+c.id+'">Edit customer details ↗</a>';
    select.closest('.card').appendChild(div);
  }
  function activity() {
    return '<section class="card activity-panel"><div class="card-header"><div><h2 class="card-title">Document activity</h2><p class="card-subtitle">Your business, moving forward</p></div><span class="badge badge-quotation">Local workspace</span></div>'+BizStorage.getRecentDocuments(4).map(function(d){return '<div class="notice-row"><span class="activity-dot"></span><div><strong>'+esc(d.reference_no)+'</strong><p>'+esc(d.type.charAt(0).toUpperCase()+d.type.slice(1))+' saved · '+esc(new Date(d.updated_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'}))+'</p></div></div>';}).join('')+'</section>';
  }
  function enhance() {
    var header=document.querySelector('.header');if(!header || header.dataset.enhanced)return;header.dataset.enhanced='true';
    var right=header.querySelector('.header__right');
    var bell=document.createElement('button');bell.className='notification-button';bell.setAttribute('aria-label','Open notifications');bell.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span></span>';bell.onclick=notices;right.insertBefore(bell,right.querySelector('#avatar-btn'));
    var profile=header.querySelector('#avatar-btn');profile.setAttribute('role','button');profile.setAttribute('tabindex','0');profile.setAttribute('aria-label','Open user profile');profile.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();profile.click();}});
    var search=header.querySelector('#global-search');search.setAttribute('aria-label','Search all documents');search.addEventListener('input',function(){headerSearch(search);});search.addEventListener('keydown',function(e){if(e.key==='Escape'){search.value='';headerSearch(search);}if(e.key==='Enter'){var first=document.querySelector('#header-results a');if(first)first.click();}});
    var side=document.querySelector('.sidebar__nav');side.insertAdjacentHTML('afterend','<div class="sidebar-tip"><span class="badge">OFFLINE READY</span><strong>Small business.<br>Big possibilities.</strong><p>Your documents stay on this device.</p><a href="#/generator">Create something great ↗</a></div>');
    var toggle=document.createElement('button');toggle.className='btn btn-ghost mobile-menu';toggle.textContent='☰';toggle.setAttribute('aria-label','Toggle navigation');toggle.onclick=function(){document.querySelector('.sidebar').classList.toggle('is-open');};header.prepend(toggle);
    var customer=document.querySelector('#q-customer, #i-customer');if(customer){customerCard(customer);customer.addEventListener('change',function(){customerCard(customer);});}
    var print=document.getElementById('btn-print-preview');if(print){print.textContent='Print';var pdf=document.createElement('button');pdf.className='btn btn-primary btn-sm';pdf.textContent='Download PDF';pdf.onclick=function(){var preview=document.querySelector('#quot-preview, #inv-preview');var ref=document.querySelector('#q-ref, #i-ref');BizPDF.download(preview,ref && ref.value || 'BizDocs-'+(document.getElementById('q-ref')?'Quotation':'Invoice'));};print.parentNode.appendChild(pdf);}
    var genPrint=document.getElementById('btn-gen-print');if(genPrint){var genPdf=document.createElement('button');genPdf.className='btn btn-primary btn-sm';genPdf.textContent='Download PDF';genPdf.onclick=function(){if(!document.getElementById('gf-customer')){BizToast.show('Generate a document first.', 'warning');return;}BizPDF.download(document.getElementById('gen-preview'),'BizDocs-Document');};genPrint.parentNode.appendChild(genPdf);}
    if(window.location.hash==='#/dashboard'){
      var page=document.getElementById('page-root');
      page.insertAdjacentHTML('afterbegin','<section class="dashboard-hero"><div><span class="eyebrow">YOUR BUSINESS WORKSPACE</span><h1>Smart Documents.<br>Faster Business.</h1><p>From the first quotation to the final invoice.<br>Keep every business conversation professional.</p><a class="btn hero-button" href="#/generator">Create a document <span>↗</span></a></div><div class="hero-art" aria-hidden="true"><div class="mini-sheet"><div class="mini-brand">✦ BizDocs AI</div><div class="mini-label">QUOTATION</div><div class="mini-rule"></div><div class="mini-rule short"></div><div class="mini-table"><span>Website development</span><b>₹40,000</b><span>GST · 18%</span><b>₹7,200</b></div><div class="mini-total">Grand total <b>₹47,200</b></div><div class="mini-sign">Ready for your next opportunity</div></div><div class="floating-note">✓ Professional. In seconds.</div></div></section>');
      page.insertAdjacentHTML('beforeend',activity());
    }
  }
  new MutationObserver(enhance).observe(document.getElementById('app'),{childList:true});
  document.addEventListener('click',function(e){if(!e.target.closest('.header__search')){var p=document.getElementById('header-results');if(p)p.remove();}});
  return {esc:esc,modal:modal};
})();
