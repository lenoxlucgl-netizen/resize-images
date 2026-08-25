<!doctype html>
<html lang="it">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title>Image Forge | Resize</title>
	<style>
		@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
		:root { --ink:#19211d; --muted:#69746c; --paper:#f4f1e9; --line:#d5d8cb; --acid:#d6f26a; --coral:#ff765f; --white:#fffdf8; }
		* { box-sizing:border-box; }
		body { margin:0; min-height:100vh; color:var(--ink); background:var(--paper); font-family:'Space Grotesk', sans-serif; }
		body:before { content:''; position:fixed; inset:0; pointer-events:none; opacity:.18; background-image:linear-gradient(90deg, transparent 49%, #b8c0b2 50%, transparent 51%),linear-gradient(#b8c0b2 1px,transparent 1px); background-size:72px 72px; }
		header { position:relative; display:flex; justify-content:space-between; align-items:center; max-width:1180px; margin:auto; padding:14px 28px 0; }
		.brand { font-weight:700; letter-spacing:-.04em; font-size:20px; } .brand span { color:#728a2c; }
		.tabs { display: flex; gap: 10px; margin-bottom: 20px; }
		.tab { padding: 10px 20px; background: transparent; border: 1px solid var(--line); border-radius: 8px; cursor: pointer; color: var(--muted); font-weight: 500; font-size: 15px; }
		.tab.active { background: var(--ink); color: var(--white); border-color: var(--ink); }
		.status { display:flex; gap:8px; align-items:center; font:12px 'DM Mono', monospace; text-transform:uppercase; color:var(--muted); }
		.dot { width:8px; height:8px; border-radius:50%; background:#80aa3e; }
		main { position:relative; max-width:1180px; margin:0 auto; padding:20px 28px 40px; }
		.intro { display:flex; justify-content:space-between; gap:30px; align-items:end; margin-bottom:16px; }
		h1 { max-width:700px; margin:0; font-size:clamp(32px,5vw,64px); line-height:.92; letter-spacing:-.07em; }
		.intro p { max-width:250px; margin:0 0 5px; color:var(--muted); line-height:1.4; font-size: 14px; }
		.workspace { display:grid; grid-template-columns:minmax(0,1.25fr) minmax(310px,.75fr); gap:18px; }
		.drop { min-height:260px; display:flex; flex-direction:column; justify-content:center; align-items:center; border:1.5px dashed #8c9787; background:rgba(255,253,248,.72); cursor:pointer; transition:.2s ease; }
		.drop:hover,.drop.dragging { border-color:var(--ink); background:var(--acid); transform:translateY(-3px); }
		.drop strong { font-size:24px; margin:20px 0 8px; } .drop small { color:var(--muted); }
		.cross { width:74px; height:74px; display:grid; place-items:center; border:1px solid var(--ink); border-radius:50%; font-size:38px; font-weight:300; }
		input[type=file] { display:none; }
		.panel { padding:20px; background:var(--ink); color:var(--white); }
		.eyebrow { color:var(--acid); font:11px 'DM Mono',monospace; text-transform:uppercase; letter-spacing:.08em; }
		.panel h2 { margin:8px 0 16px; font-size:22px; letter-spacing:-.04em; }
		.choice { display:block; position:relative; padding:12px 12px 12px 35px; border:1px solid #48514a; margin:6px 0; cursor:pointer; transition:.2s; }
		.choice:hover { border-color:var(--acid); } .choice input { position:absolute; opacity:0; }
		.choice:before { content:''; position:absolute; left:12px; top:15px; width:15px; height:15px; border:1px solid #aeb8a9; border-radius:50%; }
		.choice:has(input:checked) { border-color:var(--acid); background:#29332c; } .choice:has(input:checked):before { background:var(--acid); box-shadow:inset 0 0 0 4px #29332c; }
		.choice b { display:block; font-size:14px; } .choice span { display:block; margin-top:3px; color:#adb6aa; font-size:11px; line-height:1.3; }
		.sizes { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:12px; }
		.size { position:relative; padding:12px 8px; border:1px solid #48514a; text-align:center; cursor:pointer; font:12px 'DM Mono',monospace; }
		.size input { position:absolute; opacity:0; } .size:has(input:checked) { border-color:var(--acid); background:#29332c; color:var(--acid); }
		.custom-sizes { display:grid; gap:8px; margin-top:8px; }
		.custom-size { display:flex; gap:8px; }
		.custom-size input { width:100%; padding:8px; border:1px solid #48514a; background:#29332c; color:var(--white); font:12px 'DM Mono',monospace; }
		.add-size { margin-top:6px; padding:8px; border:1px dashed #68756a; background:transparent; color:#adb6aa; font:12px 'DM Mono',monospace; }
		button { width:100%; margin-top:14px; padding:12px; border:0; background:var(--coral); color:var(--ink); font:600 14px 'Space Grotesk',sans-serif; cursor:pointer; } button:disabled { opacity:.45; cursor:not-allowed; }
		#message { min-height:20px; margin-top:12px; color:var(--acid); font:12px 'DM Mono',monospace; }
		.api-box { margin-top:12px; padding-top:12px; border-top:1px solid #48514a; }
		.api-box button { margin-top:8px; background:var(--acid); }
		.api-result { display:none; margin-top:14px; padding:14px; border:1px solid #48514a; background:#202a23; }
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
		@media (max-width:760px) { header { padding:20px 18px 0; } main { padding:54px 18px 50px; } .intro { display:block; } .intro p { margin-top:22px; } .workspace { grid-template-columns:1fr; } .drop { min-height:300px; } .panel { padding:24px; } }
	</style>
</head>
<body>
	<header><div class="brand">IMAGE <span>FORGE</span></div><div class="status"><i class="dot"></i> minio storage</div></header>
	<main>
		<section class="intro"><h1>Ridimensiona.<br><em>Conserva.</em></h1><p>Carica un'immagine e crea automaticamente versioni ottimizzate, mantenendo le proporzioni originali.</p></section>
		<div class="tabs">
			<button type="button" class="tab active" id="tabFoto">Foto</button>
			<button type="button" class="tab" id="tabVideo">Video</button>
		</div>
		<form id="uploadForm" class="workspace">
			<label class="drop" id="dropZone" for="fileInput"><input id="fileInput" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/tiff" multiple required><span class="cross">+</span><strong id="fileLabel">Trascina qui le immagini</strong><small>oppure fai clic per sceglierle · max 15 MB</small></label>
            <section class="panel"><div class="eyebrow">01 / Destinazione</div><h2>Cosa vuoi conservare?</h2>
				<label class="choice"><input type="radio" name="keepOriginal" value="false" checked><b>Solo modificate</b><span>L'originale non viene conservato.</span></label>
				<label class="choice"><input type="radio" name="keepOriginal" value="true"><b>Modificate + originale</b><span>Conserva anche il file originale.</span></label>
				<div class="eyebrow" style="margin-top:16px">02 / Dimensioni output</div>
				<div class="sizes"><label class="size"><input type="checkbox" name="sizes" value="200x200" checked>200 × 200</label><label class="size"><input type="checkbox" name="sizes" value="400x400" checked>400 × 400</label><label class="size"><input type="checkbox" name="sizes" value="680x680" checked>680 × 680</label></div>
				<div id="customSizes" class="custom-sizes"></div><button id="addSize" class="add-size" type="button">+ Aggiungi dimensione personalizzata (max 2)</button>
				<button id="submitButton" type="submit" disabled>Seleziona un'immagine</button><div id="message" role="status"></div>
				<div class="api-box"><div class="eyebrow">03 / API integrabile</div><span style="display:block;margin-top:8px;color:#adb6aa;font-size:12px;line-height:1.4">Genera una chiave per usare il ridimensionamento da un'altra applicazione. Inserisci la password per autorizzare l'operazione.</span><input type="password" id="adminSecretInput" placeholder="Password admin" style="width:100%; margin-top:12px; padding:11px; border:1px solid #48514a; background:#29332c; color:var(--white); font:12px 'DM Mono',monospace;"><button id="generateApiKey" type="button">Genera API key</button><div id="apiResult" class="api-result" role="status"></div></div>
			</section>
		</form>
		<form id="videoForm" class="workspace" style="display: none;">
			<label class="drop" id="videoDropZone" for="videoFileInput"><input id="videoFileInput" name="file" type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" multiple required><span class="cross">+</span><strong id="videoFileLabel">Trascina qui i video</strong><small>oppure fai clic per sceglierli · max 100 MB</small></label>
			<section class="panel">
				<div class="eyebrow">01 / Storage</div><h2>Salvataggio Video</h2>
				<p style="color:var(--muted); line-height:1.5; margin-bottom: 20px;">I video verranno salvati su MinIO nel loro formato originale (senza ridimensionamento).</p>
				<button id="videoSubmitButton" type="submit" disabled>Seleziona un video</button>
				<div id="videoMessage" role="status"></div>
			</section>
		</form>
			<section id="results"><div class="result-head"><h2>File elaborati</h2><span id="resultSizes"></span></div><div class="gallery" id="gallery"></div></section>
	</main>
	<script>
		const form = document.getElementById('uploadForm'); const input = document.getElementById('fileInput'); const zone = document.getElementById('dropZone'); const label = document.getElementById('fileLabel'); const submit = document.getElementById('submitButton'); const message = document.getElementById('message'); const customSizes = document.getElementById('customSizes'); const addSize = document.getElementById('addSize');
		document.getElementById('generateApiKey').addEventListener('click', async () => { const result = document.getElementById('apiResult'); const secret = document.getElementById('adminSecretInput').value; result.textContent = 'Generazione...'; result.classList.add('visible'); try { const response = await fetch('/api/auth/api-key', { method:'POST', headers: { 'x-admin-secret': secret } }); const data = await response.json(); if (!response.ok) throw new Error(data.error); const endpoint = `${location.origin}${data.uploadEndpoint}`; result.innerHTML = `<div class="api-status"><i></i>Chiave attiva</div><span class="api-label">API key</span><div class="api-field"><code class="api-value" id="apiKeyValue"></code><button class="api-copy" id="copyApiKey" type="button">Copia</button></div><span class="api-label">Endpoint upload</span><code class="api-value" style="display:block;margin-top:5px">${endpoint}</code><pre class="api-snippet">curl -H "x-api-key: LA_TUA_CHIAVE" \\\n  -F "file=@foto.jpg" \\\n  -F "sizes=800x600" \\\n  ${endpoint}</pre><small class="api-note">Conserva questa chiave in un secret manager. Non inserirla in codice frontend pubblico.</small>`; document.getElementById('apiKeyValue').textContent = data.apiKey; document.getElementById('copyApiKey').addEventListener('click', async () => { await navigator.clipboard?.writeText(data.apiKey); document.getElementById('copyApiKey').textContent = 'Copiata'; }); await navigator.clipboard?.writeText(data.apiKey); } catch (error) { result.textContent = error.message; } });
		addSize.addEventListener('click', () => { if (customSizes.children.length >= 2) return; const wrapper = document.createElement('label'); wrapper.className = 'custom-size'; wrapper.innerHTML = '<input name="sizes" type="text" pattern="[0-9]{1,5}x[0-9]{1,5}" placeholder="es. 1024x768" aria-label="Dimensione personalizzata">'; customSizes.appendChild(wrapper); if (customSizes.children.length >= 2) addSize.disabled = true; });
		input.addEventListener('change', () => { if (input.files.length > 0) { label.textContent = input.files.length === 1 ? input.files[0].name : `${input.files.length} file selezionati`; submit.disabled = false; submit.textContent = 'Crea versioni'; } else { label.textContent = "Trascina qui le immagini"; submit.disabled = true; } });
		['dragenter','dragover'].forEach(event => zone.addEventListener(event, e => { e.preventDefault(); zone.classList.add('dragging'); }));
		['dragleave','drop'].forEach(event => zone.addEventListener(event, e => { e.preventDefault(); zone.classList.remove('dragging'); }));
		zone.addEventListener('drop', e => { if (e.dataTransfer.files[0]) { input.files = e.dataTransfer.files; input.dispatchEvent(new Event('change')); } });
		form.addEventListener('submit', async e => { e.preventDefault(); const selectedSizes = [...form.querySelectorAll('input[name="sizes"]')].filter(size => size.type === 'checkbox' ? size.checked : size.value.trim()); if (!selectedSizes.length) { message.textContent = 'Seleziona almeno una dimensione'; return; } submit.disabled = true; submit.textContent = 'Elaborazione in corso...'; message.textContent = 'Invio a MinIO e creazione varianti'; document.getElementById('results').classList.remove('visible'); const keepOriginal = form.querySelector('input[name="keepOriginal"]:checked').value; const gallery = document.getElementById('gallery'); gallery.innerHTML = '';
			try {
				const files = Array.from(input.files);
				const promises = files.map(async file => {
					const formData = new FormData();
					formData.append('file', file);
					formData.append('keepOriginal', keepOriginal);
					selectedSizes.forEach(size => formData.append('sizes', size.value));
					const response = await fetch('/api/files/upload', { method:'POST', body: formData });
					const data = await response.json();
					if (!response.ok) throw new Error(data.error || 'Upload non riuscito');
					return data;
				});
				const results = await Promise.all(promises);
				message.textContent = `${results.length} immagini elaborate con successo!`; document.getElementById('resultSizes').textContent = selectedSizes.map(size => size.value.replace('x',' × ')).join(' · '); 
				results.forEach(data => { data.variants.forEach(key => { const tile = document.createElement('article'); tile.className = 'tile'; tile.innerHTML = `<img src="/api/files/object/${encodeURIComponent(key)}" alt="Versione ridimensionata"><p>${key.split('/').pop()}</p>`; gallery.appendChild(tile); }); }); document.getElementById('results').classList.add('visible');
			} catch (error) { message.textContent = error.message; } finally { submit.disabled = false; submit.textContent = 'Crea versioni'; }
		});

		// Video Tab Logic
		const tabFoto = document.getElementById('tabFoto'); const tabVideo = document.getElementById('tabVideo'); const videoForm = document.getElementById('videoForm');
		tabFoto.addEventListener('click', () => { tabFoto.classList.add('active'); tabVideo.classList.remove('active'); form.style.display = 'grid'; videoForm.style.display = 'none'; });
		tabVideo.addEventListener('click', () => { tabVideo.classList.add('active'); tabFoto.classList.remove('active'); form.style.display = 'none'; videoForm.style.display = 'grid'; });

		// Video Upload Logic
		const videoInput = document.getElementById('videoFileInput'); const videoZone = document.getElementById('videoDropZone'); const videoLabel = document.getElementById('videoFileLabel'); const videoSubmit = document.getElementById('videoSubmitButton'); const videoMessage = document.getElementById('videoMessage');
		videoInput.addEventListener('change', () => { if (videoInput.files.length > 0) { videoLabel.textContent = videoInput.files.length === 1 ? videoInput.files[0].name : `${videoInput.files.length} video selezionati`; videoSubmit.disabled = false; videoSubmit.textContent = 'Carica video'; } else { videoLabel.textContent = "Trascina qui i video"; videoSubmit.disabled = true; } });
		['dragenter','dragover'].forEach(event => videoZone.addEventListener(event, e => { e.preventDefault(); videoZone.classList.add('dragging'); }));
		['dragleave','drop'].forEach(event => videoZone.addEventListener(event, e => { e.preventDefault(); videoZone.classList.remove('dragging'); }));
		videoZone.addEventListener('drop', e => { if (e.dataTransfer.files[0]) { videoInput.files = e.dataTransfer.files; videoInput.dispatchEvent(new Event('change')); } });
		
		videoForm.addEventListener('submit', async e => {
			e.preventDefault(); videoSubmit.disabled = true; videoSubmit.textContent = 'Caricamento in corso...'; videoMessage.textContent = 'Invio a MinIO in corso...';
			document.getElementById('results').classList.remove('visible'); const gallery = document.getElementById('gallery'); gallery.innerHTML = '';
			try {
				const files = Array.from(videoInput.files);
				const promises = files.map(async file => {
					const formData = new FormData(); formData.append('file', file);
					const response = await fetch('/api/files/upload', { method:'POST', body: formData });
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
	</script>
</body>
</html>
