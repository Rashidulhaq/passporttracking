/*
  Simple client-side passport manager.
  - Stores entries in localStorage under key: "passports_v1"
  - Each entry: {id, name, passport_no, dob, nid, phone, handover, picBase64, createdAt}
*/
const STORAGE_KEY = 'passports_v1';

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

function loadAll(){
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveAll(list){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderList(filter=''){
  const container = document.getElementById('list');
  container.innerHTML = '';
  const all = loadAll();
  const q = filter.trim().toLowerCase();
  const filtered = all.filter(e=>{
    if(!q) return true;
    return (e.name||'').toLowerCase().includes(q) ||
           (e.passport_no||'').toLowerCase().includes(q) ||
           (e.nid||'').toLowerCase().includes(q)
  }).sort((a,b)=>b.createdAt - a.createdAt);

  if(filtered.length===0){
    container.innerHTML = '<div class="small">No records found.</div>';
    return;
  }

  for(const r of filtered){
    const row = document.createElement('div');
    row.className='row card';
    const img = document.createElement('img');
    img.className='thumb';
    img.src = r.picBase64 || '';
    img.alt = '';
    img.onclick = ()=> openPreview(r.picBase64 || '');
    const meta = document.createElement('div');
    meta.className='meta';
    meta.innerHTML = `<strong>${escapeHtml(r.name||'—')}</strong>

        <div class="small">Passport: ${escapeHtml(r.passport_no||'—')} • NID: ${escapeHtml(r.nid||'—')}  • DOB: ${formatDOB(r.dob)}</div>
        <div class="small">Tracking: ${escapeHtml(r.tracking||'—')} • Company/Person: ${escapeHtml(r.company||'—')}</div>
        <div class="small">Phone: ${escapeHtml(r.phone||'—')} • Handover: ${r.handover||'—'}</div>

        <div class="small">Status: ${escapeHtml(r.status || '—')}</div>

        <div class="small">Added: ${new Date(r.createdAt).toLocaleString()}</div>`;

    const ctrl = document.createElement('div');
    ctrl.className='controls';
    const edit = document.createElement('button'); edit.textContent='Edit';
    const del = document.createElement('button'); del.textContent='Delete'; del.style.background='#ff5a5a';
    edit.onclick = ()=> openForm(r.id);
    del.onclick = ()=> {
      if(confirm('Permanently delete this record?')) {
        const all2 = loadAll().filter(x=>x.id!==r.id); saveAll(all2); renderList(document.getElementById('q').value);
      }
    };

const view = document.createElement('button');
view.textContent = 'View';
view.className = 'ghost';
view.onclick = ()=> openPreview(r.picBase64 || '');
ctrl.appendChild(view);
    ctrl.appendChild(edit); ctrl.appendChild(del);
    row.appendChild(img); row.appendChild(meta); row.appendChild(ctrl);
    container.appendChild(row);
  }
}

function escapeHtml(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }

document.getElementById('addBtn').onclick = ()=>{
  showForm();
};
document.getElementById('cancel').onclick = ()=>{
  hideForm();
};
document.getElementById('q').addEventListener('input', e=>{
  renderList(e.target.value);
});


//image view er code

document.getElementById('pic').addEventListener('change', async (e)=>{
  const file = e.target.files && e.target.files[0];
  const imgEl = document.getElementById('picPreview');
  if(file){
    const b64 = await fileToBase64(file);
    imgEl.src = b64;
    imgEl.style.display = 'block';
  }else{
    imgEl.src = '';
    imgEl.style.display = 'none';
  }
});


// form submit
document.getElementById('passportForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const id = document.getElementById('editId').value || uid();
  const name = document.getElementById('name').value.trim();
  const passport_no = document.getElementById('passport_no').value.trim();
  const dob = document.getElementById('dob').value;
  const nid = document.getElementById('nid').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const tracking = document.getElementById('tracking').value.trim();
  const company = document.getElementById('company').value.trim();
  const handover = document.getElementById('handover').value;
  const status = document.getElementById('status').value;

  let picBase64 = '';

  const fileInput = document.getElementById('pic');
  if(fileInput.files && fileInput.files[0]){
    picBase64 = await fileToBase64(fileInput.files[0]);
  } else {
    // if editing, keep existing picture
    const existing = loadAll().find(x=>x.id===id);
    if(existing) picBase64 = existing.picBase64 || '';
  }


  //const entry = {id, name, passport_no, dob, nid, phone, handover, picBase64, createdAt: Date.now()};
const entry = {
  id, name, passport_no, dob, nid, phone, handover,
  tracking, company,status,
  picBase64,
  createdAt: Date.now()
};


  let all = loadAll();
  const idx = all.findIndex(x=>x.id===id);
  if(idx>=0){ all[idx] = {...all[idx], ...entry} } else { all.push(entry) }
  saveAll(all);
  hideForm();
  renderList(document.getElementById('q').value);
  this.reset();
});

function showForm(){
  document.getElementById('formWrap').style.display='block';
  document.getElementById('name').focus();
  document.getElementById('editId').value='';
  document.getElementById('pic').value='';
}
function hideForm(){
  document.getElementById('formWrap').style.display='none';
  document.getElementById('passportForm').reset();
  document.getElementById('editId').value='';
}



// view code

async function openForm(id){
  const all = loadAll();
  const rec = all.find(x=>x.id===id);
  if(!rec) return;
  document.getElementById('formWrap').style.display='block';
  document.getElementById('editId').value = rec.id;
  document.getElementById('name').value = rec.name || '';
  document.getElementById('passport_no').value = rec.passport_no || '';
  document.getElementById('dob').value = rec.dob || '';
  document.getElementById('nid').value = rec.nid || '';
  document.getElementById('phone').value = rec.phone || '';
  document.getElementById('handover').value = rec.handover || '';
  document.getElementById('tracking').value = rec.tracking || '';
  document.getElementById('company').value = rec.company || '';
  document.getElementById('status').value = rec.status || '';


  // preview existing image (if any)
  const imgEl = document.getElementById('picPreview');
  if(rec.picBase64){
    imgEl.src = rec.picBase64;
    imgEl.style.display = 'block';
  }else{
    imgEl.src = '';
    imgEl.style.display = 'none';
  }
}


function fileToBase64(file){
  return new Promise((res,rej)=>{
    const fr = new FileReader();
    fr.onload = ()=> res(fr.result.toString());
    fr.onerror = ()=> rej(fr.error);
    fr.readAsDataURL(file);
  });
}

// Export CSV
document.getElementById('exportBtn').onclick = ()=>{
  const all = loadAll();
  if(all.length===0){ alert('No records to export'); return; }
const rows = [['Name','Passport No','DOB','NID','Phone','Handover','Tracking','Company','CreatedAt']];
for(const r of all)
  rows.push([r.name, r.passport_no, r.dob, r.nid, r.phone, r.handover, r.tracking, r.company, new Date(r.createdAt).toISOString()]);

  const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
  downloadBlob(csv, 'passports_export.csv','text/csv;charset=utf-8;');
};



// Backup (JSON) with optional AES encryption
// document.getElementById('backupBtn').onclick = async ()=>{
//   const all = loadAll();
//   const json = JSON.stringify(all, null, 2);
//   // ask whether encrypt
//   if(confirm('Encrypt backup with a password? Click OK to encrypt, Cancel to download plain JSON.')){
//     const pw = prompt('Enter a password for encryption (remember it!)');
//     if(!pw){ alert('Password required for encryption. Aborted.'); return; }
//     try{
//       const encrypted = await encryptStringWithPassword(json, pw);
//       downloadBlob(encrypted, 'passports_backup_encrypted.txt','text/plain');
//     } catch(err){
//       console.error(err); alert('Encryption failed: '+err);
//     }
//   } else {
//     downloadBlob(json, 'passports_backup.json','application/json');
//   }
// };

// Helpers
function downloadBlob(content, filename, mime){
  const blob = new Blob([content], {type: mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
}

/* === Simple password-based AES-GCM encryption (Web Crypto) ===
   We'll derive a key from password via PBKDF2 and then AES-GCM encrypt.
   The output format: base64(iv) + ':' + base64(salt) + ':' + base64(ciphertext)
*/
async function encryptStringWithPassword(str, password){
  // encode
  const enc = new TextEncoder();
  const data = enc.encode(str);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  // derive key
  const pwKey = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({
    name:'PBKDF2', salt, iterations:100000, hash:'SHA-256'
  }, pwKey, {name:'AES-GCM', length:256}, true, ['encrypt']);
  const ct = await crypto.subtle.encrypt({name:'AES-GCM', iv}, key, data);
  return btoa(arrayBufferToBase64(iv)) + ':' + btoa(arrayBufferToBase64(salt)) + ':' + btoa(arrayBufferToBase64(ct));
}
function arrayBufferToBase64(buf){
  // convert to binary string then btoa
  const u8 = new Uint8Array(buf);
  let s='';
  const chunk = 0x8000;
  for(let i=0;i<u8.length;i+=chunk){
    s += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i+chunk)));
  }
  return s;
}

// on startup
renderList();

// simple UX: pressing Enter in search field doesn't submit form etc.
document.getElementById('q').addEventListener('keydown', e=>{
  if(e.key==='Enter'){ e.preventDefault(); }
});



// === Fullscreen Image Modal Logic ===
function openPreview(src){
  if(!src){ alert('No passport image found.'); return; }
  const modal = document.getElementById('imgModal');
  const img   = document.getElementById('previewImg');
  img.src = src;
  modal.style.display = 'flex';
}

function closePreview(){
  const modal = document.getElementById('imgModal');
  const img   = document.getElementById('previewImg');
  img.src = '';
  modal.style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  const modal    = document.getElementById('imgModal');
  const inner    = document.getElementById('imgModalInner');
  const closeBtn = document.getElementById('imgCloseBtn');

  if(!modal || !inner || !closeBtn) return;
  modal.addEventListener('click', closePreview);
  inner.addEventListener('click', (e)=> e.stopPropagation());
  closeBtn.addEventListener('click', closePreview);
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && modal.style.display === 'flex') closePreview();
  });
});

// === Zoom & Pan for preview image ===
let scale = 1, tx = 0, ty = 0;
const MIN_SCALE = 1;
const MAX_SCALE = 5;

function applyTransform(){
  const img = document.getElementById('previewImg');
  img.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}

const _openPreviewOriginal = openPreview;
openPreview = function(src){
  scale = 1; tx = 0; ty = 0;      // reset zoom & pan
  _openPreviewOriginal(src);
  applyTransform();
};

const _closePreviewOriginal = closePreview;
closePreview = function(){
  _closePreviewOriginal();
  const img = document.getElementById('previewImg');
  img.style.transform = 'none';
};

document.addEventListener('DOMContentLoaded', () => {
  const inner = document.getElementById('imgModalInner');
  const img   = document.getElementById('previewImg');

  inner.addEventListener('wheel', (e)=>{
    e.preventDefault();

    const oldScale = scale;
    const delta = e.deltaY < 0 ? 0.1 : -0.1;      // up = zoom in, down = zoom out
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
    if (scale === oldScale) return;


    const rect = img.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top  + rect.height/2;
    const mx = e.clientX - cx;
    const my = e.clientY - cy;


    tx -= mx * (scale/oldScale - 1);
    ty -= my * (scale/oldScale - 1);

    applyTransform();
  }, { passive:false });

  // Drag/Pan (mouse down -> move -> up)
  let dragging = false, startX = 0, startY = 0;

  img.addEventListener('mousedown', (e)=>{
    if (scale <= 1) return;      
    dragging = true;
    img.classList.add('dragging');
    startX = e.clientX - tx;
    startY = e.clientY - ty;
  });

  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    tx = e.clientX - startX;
    ty = e.clientY - startY;
    applyTransform();
  });

  window.addEventListener('mouseup', ()=>{
    dragging = false;
    img.classList.remove('dragging');
  });

  // Double-click: zoom toggle (1x ↔ 2x)
  img.addEventListener('dblclick', ()=>{
    if (scale === 1){
      scale = 2; tx = 0; ty = 0;
    } else {
      scale = 1; tx = 0; ty = 0;
    }
    applyTransform();
  });
});
function formatDOB(iso){
  if(!iso) return '—';
  // expect: YYYY-MM-DD
  const parts = iso.split('-');
  if(parts.length !== 3) return iso;
  const [y,m,d] = parts;
  return `${d}-${m}-${y}`;
}

// backdrop click to close
document.getElementById('imgModal').addEventListener('click', (e)=>{
  if(e.target.id === 'imgModal'){ closePreview(); }
});
