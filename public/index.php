<!doctype html>
<html lang="it">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Image Resize | Resize</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
		:root { --ink:#19211d; --muted:#69746c; --paper:#f4f1e9; --line:#d5d8cb; --acid:#d6f26a; --coral:#ff765f; --white:#fffdf8; }
		* { box-sizing:border-box; }
		body { margin:0; min-height:100vh; color:var(--ink); background:var(--paper); font-family:'Space Grotesk', sans-serif; display:flex; flex-direction:column; }
		body:before { content:''; position:fixed; inset:0; pointer-events:none; opacity:.18; background-image:linear-gradient(90deg, transparent 49%, #b8c0b2 50%, transparent 51%),linear-gradient(#b8c0b2 1px,transparent 1px); background-size:72px 72px; }
		header { position:relative; display:flex; justify-content:space-between; align-items:center; max-width:1180px; margin:auto; padding:4px 20px 0; }
		.brand { font-weight:700; letter-spacing:-.04em; font-size:18px; } .brand span { color:#728a2c; }
		.tabs { display: flex; gap: 8px; margin-bottom: 8px; }
		.tab { padding: 6px 14px; background: transparent; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; color: var(--muted); font-weight: 500; font-size: 13px; }
		.tab.active { background: var(--ink); color: var(--white); border-color: var(--ink); }
		.status { display:flex; gap:8px; align-items:center; font:12px 'DM Mono', monospace; text-transform:uppercase; color:var(--muted); }
		.dot { width:8px; height:8px; border-radius:50%; background:#80aa3e; }
		main { position:relative; max-width:1180px; width:100%; margin:0 auto; padding:6px 20px 8px; display:flex; flex-direction:column; flex:1; min-height:0; }
		.intro { display:flex; justify-content:space-between; gap:15px; align-items:end; margin-bottom:6px; }
		h1 { max-width:700px; margin:0; font-size:clamp(22px,3.5vw,38px); line-height:.92; letter-spacing:-.07em; }
		.intro p { max-width:250px; margin:0 0 5px; color:var(--muted); line-height:1.4; font-size: 12px; }
		.workspace { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(310px,.75fr); gap:12px; flex:1; min-height:0; }
		.drop { height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; border:1.5px dashed #8c9787; background:rgba(255,253,248,.72); cursor:pointer; transition:.2s ease; }
		.drop:hover,.drop.dragging { border-color:var(--ink); background:var(--acid); transform:translateY(-2px); }
		.drop strong { font-size:18px; margin:8px 0 4px; } .drop small { color:var(--muted); font-size: 11px; }
		.cross { width:50px; height:50px; display:grid; place-items:center; border:1px solid var(--ink); border-radius:50%; font-size:28px; font-weight:300; }
		input[type=file] { display:none; }
		.panel { height:100%; min-height:0; padding:12px; background:var(--ink); color:var(--white); overflow-y:auto; }
		.eyebrow { color:var(--acid); font:10px 'DM Mono',monospace; text-transform:uppercase; letter-spacing:.08em; }
		.panel h2 { margin:2px 0 6px; font-size:15px; letter-spacing:-.04em; }
		.choice { display:block; position:relative; padding:6px 10px 6px 28px; border:1px solid #48514a; margin:2px 0; cursor:pointer; transition:.2s; }
		.choice:hover { border-color:var(--acid); } .choice input { position:absolute; opacity:0; }
		.choice:before { content:''; position:absolute; left:8px; top:9px; width:12px; height:12px; border:1px solid #aeb8a9; border-radius:50%; }
		.choice:has(input:checked) { border-color:var(--acid); background:#29332c; } .choice:has(input:checked):before { background:var(--acid); box-shadow:inset 0 0 0 3px #29332c; }
		.choice b { display:block; font-size:12px; } .choice span { display:block; margin-top:1px; color:#adb6aa; font-size:10px; line-height:1.2; }
		.sizes { display:grid; grid-template-columns:repeat(3,1fr); gap:4px; margin-top:6px; }
		.size { position:relative; padding:6px 4px; border:1px solid #48514a; text-align:center; cursor:pointer; font:11px 'DM Mono',monospace; }
		.size input { position:absolute; opacity:0; } .size:has(input:checked) { border-color:var(--acid); background:#29332c; color:var(--acid); }
		.custom-sizes { display:grid; gap:4px; margin-top:4px; }
		.custom-size { display:flex; gap:4px; }
		.custom-size input { width:100%; padding:4px; border:1px solid #48514a; background:#29332c; color:var(--white); font:11px 'DM Mono',monospace; }
		.add-size { margin-top:2px; padding:4px; border:1px dashed #68756a; background:transparent; color:#adb6aa; font:11px 'DM Mono',monospace; }
		button { width:100%; margin-top:6px; padding:8px; border:0; background:var(--coral); color:var(--ink); font:600 13px 'Space Grotesk',sans-serif; cursor:pointer; } button:disabled { opacity:.45; cursor:not-allowed; }
		#message { min-height:16px; margin-top:4px; color:var(--acid); font:11px 'DM Mono',monospace; }
		.api-box { margin-top:8px; padding-top:8px; border-top:1px solid #48514a; }
		.api-box button { margin-top:4px; background:var(--acid); }
		.api-result { display:none; margin-top:8px; padding:8px; border:1px solid #48514a; background:#202a23; }
		.api-result.visible { display:block; }
		.api-status { display:flex; gap:7px; align-items:center; color:var(--acid); font:10px 'DM Mono',monospace; text-transform:uppercase; }
		.api-status i { width:7px; height:7px; border-radius:50%; background:var(--acid); }
		.api-label { display:block; margin-top:13px; color:#879589; font:10px 'DM Mono',monospace; text-transform:uppercase; }
		.api-field { display:flex; align-items:center; gap:8px; margin-top:5px; }
		.api-value { flex:1; min-width:0; padding:8px; color:var(--white); background:#172019; font:11px 'DM Mono',monospace; overflow-wrap:anywhere; }
		.api-copy { width:auto; margin:0; padding:8px 10px; background:#48514a !important; color:var(--white); font:11px 'DM Mono',monospace; }
		.api-snippet { margin:8px 0 0; padding:8px; overflow:auto; color:#c9d2c3; background:#151b17; font:10px 'DM Mono',monospace; line-height:1.4; white-space:pre-wrap; }
		.api-note { display:block; margin-top:8px; color:#879589; font-size:10px; line-height:1.3; }
		#results { display:none; margin-top:60px; } #results.visible { display:block; }
		.result-head { display:flex; justify-content:space-between; border-bottom:1px solid var(--line); padding-bottom:14px; } .result-head h2 { margin:0; font-size:27px; letter-spacing:-.04em; }
		.result-head span { color:var(--muted); font:12px 'DM Mono',monospace; }
		.gallery { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:14px; margin-top:20px; }
		.tile { background:var(--white); border:1px solid var(--line); padding:10px; } .tile img { width:100%; aspect-ratio:1; object-fit:contain; background:#e9e9e0; display:block; } .tile p { margin:11px 2px 2px; font:11px 'DM Mono',monospace; color:var(--muted); }
		/* Modal Gestisci API */
		#apiManagerOverlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.65); z-index:1000; align-items:center; justify-content:center; }
		#apiManagerOverlay.open { display:flex; }
		#apiManagerModal { background:#1a2320; border:1px solid #48514a; width:100%; max-width:560px; max-height:80vh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,.5); }
		.modal-header { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid #48514a; }
		.modal-header h3 { margin:0; font-size:14px; color:var(--white); letter-spacing:-.03em; }
		.modal-close { width:auto; margin:0; padding:4px 10px; background:#48514a; color:var(--white); font-size:12px; border:0; cursor:pointer; }
		.modal-body { overflow-y:auto; padding:12px 16px; flex:1; }
		.key-list { display:flex; flex-direction:column; gap:8px; }
		.key-item { display:flex; justify-content:space-between; align-items:flex-start; padding:10px; background:#202a23; border:1px solid #48514a; gap:10px; }
		.key-info { flex:1; min-width:0; }
		.key-name { font:600 12px 'Space Grotesk',sans-serif; color:var(--white); margin:0 0 2px; }
		.key-meta { font:10px 'DM Mono',monospace; color:#879589; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
		.key-delete { width:auto; margin:0; padding:5px 10px; background:#ff765f22; border:1px solid #ff765f66; color:#ff765f; font:11px 'DM Mono',monospace; cursor:pointer; white-space:nowrap; flex-shrink:0; }
		.key-delete:hover { background:#ff765f44; }
		.modal-empty { color:#879589; font:11px 'DM Mono',monospace; text-align:center; padding:24px 0; }
		.modal-loading { color:var(--acid); font:11px 'DM Mono',monospace; text-align:center; padding:24px 0; }
		@media (max-width:760px) { header { padding:20px 18px 0; } main { padding:54px 18px 50px; } .intro { display:block; } .intro p { margin-top:22px; } .workspace { grid-template-columns:1fr; } .drop { min-height:300px; } .panel { padding:24px; } #apiManagerModal { max-width:95vw; } }
	</style>
</head>
<body>
	<header>
		<div class="brand">IMAGE <span>RESIZE</span></div>
		<div style="display:flex; gap:15px; align-items:center;">
			<div class="status"><i class="dot"></i> minio storage</div>
			<button id="logoutBtn" style="width:auto; margin:0; padding:6px 12px; background:transparent; border:1px solid #48514a; color:var(--muted); font-size:11px; cursor:pointer; border-radius:6px;">Logout</button>
		</div>
	</header>
	<script>
		const token = localStorage.getItem('adminToken');
		if (!token) window.location.href = '/';
		document.getElementById('logoutBtn').addEventListener('click', () => {
			localStorage.removeItem('adminToken');
			sessionStorage.removeItem('activeApiKey');
			window.location.href = '/';
		});
	</script>
	<main>
		<section class="intro"><h1>Ridimensiona.<br><em>Conserva.</em></h1><p>Carica un'immagine e crea automaticamente versioni ottimizzate, mantenendo le proporzioni originali.</p></section>
		<div class="tabs">
			<button type="button" class="tab active" id="tabFoto">Foto</button>
			<button type="button" class="tab" id="tabVideo">Video</button>
		</div>
		<div class="api-key-session" style="margin-bottom: 12px; background: var(--ink); padding: 12px 20px; color: var(--white); display: flex; gap: 15px; align-items: center; border: 1px solid var(--line); flex-wrap: wrap;">
			<span class="eyebrow" style="margin:0; min-width: 60px;">Sessione</span>
			<input type="text" id="sessionApiKey" placeholder="Inserisci la tua API Key" style="flex: 1; min-width: 200px; padding: 8px; border: 1px solid #48514a; background: #29332c; color: var(--white); font: 11px 'DM Mono',monospace;" required>
		</div>

		<form id="uploadForm" class="workspace">
			<label class="drop" id="dropZone" for="fileInput"><input id="fileInput" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff" multiple required><span class="cross">+</span><strong id="fileLabel">Trascina qui le immagini</strong><small>oppure fai clic per sceglierle · max 15 MB</small></label>
            <section class="panel"><div class="eyebrow">01 / Destinazione</div><h2>Cosa vuoi conservare?</h2>
				<label class="choice"><input type="radio" name="keepOriginal" value="false" checked><b>Solo modificate</b><span>L'originale non viene conservato.</span></label>
				<label class="choice"><input type="radio" name="keepOriginal" value="true"><b>Modificate + originale</b><span>Conserva anche il file originale.</span></label>
				<div class="eyebrow" style="margin-top:16px">02 / Percorso Originale (Opzionale)</div>
				<input type="text" id="imageUploadPath" name="uploadPath" placeholder="es. cartella/sottocartella" style="width:100%; margin-top:6px; padding:6px; border:1px solid #48514a; background:#29332c; color:var(--white); font:11px 'DM Mono',monospace;">
				<div class="eyebrow" style="margin-top:16px">03 / Percorso Modificate (Opzionale)</div>
				<input type="text" id="resizedUploadPath" name="resizedPath" placeholder="Lascia vuoto per usare lo stesso percorso dell'originale" style="width:100%; margin-top:6px; padding:6px; border:1px solid #48514a; background:#29332c; color:var(--white); font:11px 'DM Mono',monospace;">
				<div class="eyebrow" style="margin-top:16px">04 / Dimensioni output</div>
				<div class="sizes"><label class="size"><input type="checkbox" name="sizes" value="200x200" checked>200 × 200</label><label class="size"><input type="checkbox" name="sizes" value="400x400" checked>400 × 400</label><label class="size"><input type="checkbox" name="sizes" value="680x680" checked>680 × 680</label></div>
				<div id="customSizes" class="custom-sizes"></div><button id="addSize" class="add-size" type="button">+ Aggiungi dimensione personalizzata (max 2)</button>
				<button id="submitButton" type="submit" disabled>Seleziona un'immagine</button><div id="message" role="status"></div>
				<div class="api-box"><div class="eyebrow">05 / API integrabile</div><span style="display:block;margin-top:4px;color:#adb6aa;font-size:10px;line-height:1.4">Genera una chiave per usare il ridimensionamento da un'altra applicazione. Verrà associata al bucket selezionato.</span>
				<input type="text" id="apiNameInput" placeholder="Nome API (es. Progetto X)" style="width:100%; margin-top:10px; padding:6px; border:1px solid #48514a; background:#29332c; color:var(--white); font:11px 'DM Mono',monospace;" required>
				<select id="apiBucketSelect" style="width:100%; margin-top:6px; padding:6px; border:1px solid #48514a; background:#29332c; color:var(--white); font:11px 'DM Mono',monospace;" required><option value="">Caricamento bucket...</option></select>
				<button id="generateApiKey" type="button">Genera API key</button>
				<button id="manageApiKeys" type="button" style="background:#48514a; color:var(--white); margin-top:4px;">Gestisci API</button>
				<div id="apiResult" class="api-result" role="status"></div></div>
			</section>
		</form>
		<form id="videoForm" class="workspace" style="display: none;">
			<label class="drop" id="videoDropZone" for="videoFileInput"><input id="videoFileInput" name="file" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" multiple required><span class="cross">+</span><strong id="videoFileLabel">Trascina qui i video</strong><small>oppure fai clic per sceglierli · max 100 MB</small></label>
			<section class="panel">
				<div class="eyebrow">01 / Storage</div><h2>Salvataggio Video</h2>
				<p style="color:var(--muted); line-height:1.5; margin-bottom: 20px;">I video verranno salvati su MinIO nel loro formato originale (senza ridimensionamento).</p>
				<div class="eyebrow">02 / Percorso di salvataggio (Opzionale)</div>
				<input type="text" id="videoUploadPath" name="uploadPath" placeholder="es. cartella/video" style="width:100%; margin-top:6px; margin-bottom: 20px; padding:6px; border:1px solid #48514a; background:#29332c; color:var(--white); font:11px 'DM Mono',monospace;">
				<button id="videoSubmitButton" type="submit" disabled>Seleziona un video</button>
				<div id="videoMessage" role="status"></div>
			</section>
		</form>
			<section id="results"><div class="result-head"><h2>File elaborati</h2><span id="resultSizes"></span></div><div class="gallery" id="gallery"></div></section>
	</main>

	<!-- Modal Gestisci API -->
	<div id="apiManagerOverlay">
		<div id="apiManagerModal" role="dialog" aria-modal="true" aria-labelledby="apiManagerTitle">
			<div class="modal-header">
				<h3 id="apiManagerTitle">API Key attive</h3>
				<button class="modal-close" id="closeApiManager" type="button">✕ Chiudi</button>
			</div>
			<div class="modal-body">
				<div id="keyList" class="key-list"><p class="modal-loading">Caricamento...</p></div>
			</div>
		</div>
	</div>
	<script>
		const form = document.getElementById('uploadForm'); const input = document.getElementById('fileInput'); const zone = document.getElementById('dropZone'); const label = document.getElementById('fileLabel'); const submit = document.getElementById('submitButton'); const message = document.getElementById('message'); const customSizes = document.getElementById('customSizes'); const addSize = document.getElementById('addSize');
		
		const sessionApiInput = document.getElementById('sessionApiKey');
		if (sessionStorage.getItem('activeApiKey')) {
			sessionApiInput.value = sessionStorage.getItem('activeApiKey');
		}
		sessionApiInput.addEventListener('input', (e) => {
			sessionStorage.setItem('activeApiKey', e.target.value.trim());
		});

		document.getElementById('generateApiKey').addEventListener('click', async () => { const result = document.getElementById('apiResult'); const name = document.getElementById('apiNameInput').value; const bucket = document.getElementById('apiBucketSelect').value; if (!name || !bucket) { result.textContent = 'Inserisci nome e seleziona un bucket'; result.classList.add('visible'); return; } result.textContent = 'Generazione...'; result.classList.add('visible'); try { const response = await fetch('/api/auth/api-key', { method:'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ name, bucket }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error); const endpoint = `${location.origin}${data.uploadEndpoint}`; result.innerHTML = `<div class="api-status"><i></i>Chiave attiva</div><span class="api-label">API key (VISIBILE SOLO ORA)</span><div class="api-field" id="apiFieldContainer"><code class="api-value" id="apiKeyValue"></code><button class="api-copy" id="copyApiKey" type="button">Copia</button></div><span class="api-label">Endpoint upload</span><code class="api-value" style="display:block;margin-top:5px">${endpoint}</code><pre class="api-snippet">curl -H "x-api-key: LA_TUA_CHIAVE" \\\n  -F "file=@foto.jpg" \\\n  -F "sizes=800x600" \\\n  ${endpoint}</pre><small class="api-note">Conserva questa chiave in un secret manager. Non inserirla in codice frontend pubblico.</small>`; document.getElementById('apiKeyValue').textContent = data.apiKey; document.getElementById('copyApiKey').addEventListener('click', async () => { await navigator.clipboard?.writeText(data.apiKey); document.getElementById('apiFieldContainer').innerHTML = '<span style="color:var(--acid); font:11px monospace">Chiave nascosta per sicurezza. Se l\'hai persa, generane un\'altra.</span>'; }); } catch (error) { result.textContent = error.message; } });
		
		// Fetch buckets on load
		async function loadBuckets() {
			try {
				const res = await fetch('/api/files/buckets', { headers: { 'Authorization': `Bearer ${token}` } });
				if (res.ok) {
					const data = await res.json();
					const select = document.getElementById('apiBucketSelect');
					select.innerHTML = '<option value="">-- Seleziona Bucket --</option>';
					data.buckets.forEach(b => {
						const opt = document.createElement('option');
						opt.value = b; opt.textContent = b;
						select.appendChild(opt);
					});
				}
			} catch (e) { console.error('Errore nel caricamento dei bucket', e); }
		}
		loadBuckets();
		addSize.addEventListener('click', () => { if (customSizes.children.length >= 2) return; const wrapper = document.createElement('label'); wrapper.className = 'custom-size'; wrapper.innerHTML = '<input name="sizes" type="text" pattern="[0-9]{1,5}x[0-9]{1,5}" placeholder="es. 1024x768" aria-label="Dimensione personalizzata">'; customSizes.appendChild(wrapper); if (customSizes.children.length >= 2) addSize.disabled = true; });
		input.addEventListener('change', () => { if (input.files.length > 0) { label.textContent = input.files.length === 1 ? input.files[0].name : `${input.files.length} file selezionati`; submit.disabled = false; submit.textContent = 'Crea versioni'; } else { label.textContent = "Trascina qui le immagini"; submit.disabled = true; } });
		['dragenter','dragover'].forEach(event => zone.addEventListener(event, e => { e.preventDefault(); zone.classList.add('dragging'); }));
		['dragleave','drop'].forEach(event => zone.addEventListener(event, e => { e.preventDefault(); zone.classList.remove('dragging'); }));
		zone.addEventListener('drop', e => { if (e.dataTransfer.files[0]) { input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change')); } });
		form.addEventListener('submit', async e => { 
			e.preventDefault(); 
			const currentApiKey = sessionApiInput.value.trim();
			if (!currentApiKey) { message.textContent = 'Errore: Inserisci la tua API Key in alto'; return; }
			const selectedSizes = [...form.querySelectorAll('input[name="sizes"]')].filter(size => size.type === 'checkbox' ? size.checked : size.value.trim()); if (!selectedSizes.length) { message.textContent = 'Seleziona almeno una dimensione'; return; } submit.disabled = true; submit.textContent = 'Elaborazione in corso...'; message.textContent = 'Invio a MinIO e creazione varianti'; document.getElementById('results').classList.remove('visible'); const keepOriginal = form.querySelector('input[name="keepOriginal"]:checked').value; const gallery = document.getElementById('gallery'); gallery.innerHTML = '';
			try {
				const files = Array.from(input.files);
				const promises = files.map(async file => {
					const formData = new FormData();
					formData.append('file', file);
					formData.append('keepOriginal', keepOriginal);
					formData.append('path', document.getElementById('imageUploadPath').value.trim());
					formData.append('resizedPath', document.getElementById('resizedUploadPath').value.trim());
					const selectedBucket = document.getElementById('apiBucketSelect').value.trim();
					if (selectedBucket) formData.append('bucket', selectedBucket);
					selectedSizes.forEach(size => formData.append('sizes', size.value));
					const response = await fetch('/api/files/upload-api', { 
						method:'POST', 
						headers: { 'x-api-key': currentApiKey },
						body: formData 
					});
					const data = await response.json();
					if (!response.ok) throw new Error(data.error || 'Upload non riuscito');
					return data;
				});
				const results = await Promise.all(promises);
				message.textContent = `${results.length} immagini elaborate con successo!`; document.getElementById('resultSizes').textContent = selectedSizes.map(size => size.value.replace('x',' × ')).join(' · '); 
				results.forEach(data => { data.variants.forEach(key => { const tile = document.createElement('article'); tile.className = 'tile'; tile.innerHTML = `<img src="/api/files/object/${encodeURIComponent(key)}" alt="Versione ridimensionata"><p>${key.split('/').pop()}</p>`; gallery.appendChild(tile); }); }); document.getElementById('results').classList.add('visible');
			} catch (error) { message.textContent = error.message; } finally { submit.disabled = false; submit.textContent = 'Crea versioni'; }
		});

		// Video tab
		const tabFoto = document.getElementById('tabFoto'); const tabVideo = document.getElementById('tabVideo'); const videoForm = document.getElementById('videoForm');
		tabFoto.addEventListener('click', () => { tabFoto.classList.add('active'); tabVideo.classList.remove('active'); form.style.display = 'grid'; videoForm.style.display = 'none'; });
		tabVideo.addEventListener('click', () => { tabVideo.classList.add('active'); tabFoto.classList.remove('active'); form.style.display = 'none'; videoForm.style.display = 'grid'; });

		// Upload video
		const videoInput = document.getElementById('videoFileInput'); const videoZone = document.getElementById('videoDropZone'); const videoLabel = document.getElementById('videoFileLabel'); const videoSubmit = document.getElementById('videoSubmitButton'); const videoMessage = document.getElementById('videoMessage');
		videoInput.addEventListener('change', () => { if (videoInput.files.length > 0) { videoLabel.textContent = videoInput.files.length === 1 ? videoInput.files[0].name : `${videoInput.files.length} video selezionati`; videoSubmit.disabled = false; videoSubmit.textContent = 'Carica video'; } else { videoLabel.textContent = "Trascina qui i video"; videoSubmit.disabled = true; } });
		['dragenter','dragover'].forEach(event => videoZone.addEventListener(event, e => { e.preventDefault(); videoZone.classList.add('dragging'); }));
		['dragleave','drop'].forEach(event => videoZone.addEventListener(event, e => { e.preventDefault(); videoZone.classList.remove('dragging'); }));
		videoZone.addEventListener('drop', e => { if (e.dataTransfer.files[0]) { videoInput.files = e.dataTransfer.files; videoInput.dispatchEvent(new Event('change')); } });
		
		videoForm.addEventListener('submit', async e => {
			e.preventDefault(); 
			const currentApiKey = sessionApiInput.value.trim();
			if (!currentApiKey) { videoMessage.textContent = 'Errore: Inserisci la tua API Key in alto'; return; }
			videoSubmit.disabled = true; videoSubmit.textContent = 'Caricamento in corso...'; videoMessage.textContent = 'Invio a MinIO in corso...';
			document.getElementById('results').classList.remove('visible'); const gallery = document.getElementById('gallery'); gallery.innerHTML = '';
			try {
				const files = Array.from(videoInput.files);
				const promises = files.map(async file => {
					const formData = new FormData(); formData.append('file', file);
					formData.append('path', document.getElementById('videoUploadPath').value.trim());
					const selectedBucket = document.getElementById('apiBucketSelect').value.trim();
					if (selectedBucket) formData.append('bucket', selectedBucket);
					const response = await fetch('/api/files/upload-api', { 
						method:'POST', 
						headers: { 'x-api-key': currentApiKey },
						body: formData 
					});
					const data = await response.json();
					if (!response.ok) throw new Error(data.error || 'Upload non riuscito');
					return data;
				});
				const results = await Promise.all(promises);
				videoMessage.textContent = `${results.length} video salvati con successo!`; document.getElementById('resultSizes').textContent = 'Video Originale'; 
				results.forEach(data => { const tile = document.createElement('article'); tile.className = 'tile'; tile.innerHTML = `<video src="/api/files/object/${encodeURIComponent(data.original)}" style="width:100%; aspect-ratio:1; object-fit:cover; background:#000;" controls></video><p>${data.original.split('/').pop()}</p>`; gallery.appendChild(tile); });
				document.getElementById('results').classList.add('visible');
			} catch (error) { videoMessage.textContent = error.message; } finally { videoSubmit.disabled = false; videoSubmit.textContent = 'Carica video'; }
		});

		// Gestisci API Modal
		const overlay = document.getElementById('apiManagerOverlay');
		const keyList = document.getElementById('keyList');

		async function loadApiKeys() {
			keyList.innerHTML = '<p class="modal-loading">Caricamento...</p>';
			try {
				const res = await fetch('/api/auth/api-keys', {
					headers: { 'Authorization': 'Bearer ' + token }
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				if (!data.keys || data.keys.length === 0) {
					keyList.innerHTML = '<p class="modal-empty">Nessuna API key registrata.</p>';
					return;
				}
				keyList.innerHTML = '';
				data.keys.forEach(function(k) {
					var item = document.createElement('div');
					item.className = 'key-item';
					var date = new Date(k.createdAt).toLocaleDateString('it-IT', { day:'2-digit', month:'short', year:'numeric' });
					item.innerHTML = '<div class="key-info">'
						+ '<p class="key-name">' + (k.name || '—') + '</p>'
						+ '<span class="key-meta">Bucket: ' + k.bucket + ' · ' + date + '</span>'
						+ '<span class="key-meta" title="' + k.hash + '">Hash: ' + k.hash.slice(0,16) + '…</span>'
						+ '</div>'
						+ '<button class="key-delete" data-hash="' + k.hash + '" type="button">Elimina</button>';
					item.querySelector('.key-delete').addEventListener('click', async function(e) {
						var btn = e.currentTarget;
						var hash = btn.dataset.hash;
						if (!confirm("Eliminare questa API key? L'operazione non è reversibile.")) return;
						btn.disabled = true;
						btn.textContent = '...';
						try {
							var delRes = await fetch('/api/auth/api-key/' + hash, {
								method: 'DELETE',
								headers: { 'Authorization': 'Bearer ' + token }
							});
							var delData = await delRes.json();
							if (!delRes.ok) throw new Error(delData.error);
							await loadApiKeys();
						} catch(err) {
							btn.disabled = false;
							btn.textContent = 'Elimina';
							alert('Errore: ' + err.message);
						}
					});
					keyList.appendChild(item);
				});
			} catch(err) {
				keyList.innerHTML = '<p class="modal-empty">Errore: ' + err.message + '</p>';
			}
		}

		document.getElementById('manageApiKeys').addEventListener('click', function() {
			overlay.classList.add('open');
			loadApiKeys();
		});
		document.getElementById('closeApiManager').addEventListener('click', function() {
			overlay.classList.remove('open');
		});
		overlay.addEventListener('click', function(e) {
			if (e.target === overlay) overlay.classList.remove('open');
		});
	</script>

</body>
</html>
