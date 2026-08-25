<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Image Forge | Login Admin</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        :root { --ink:#19211d; --muted:#69746c; --paper:#f4f1e9; --line:#d5d8cb; --acid:#d6f26a; --coral:#ff765f; --white:#fffdf8; }
        * { box-sizing: border-box; }
        body { 
            margin: 0; min-height: 100vh; color: var(--ink); background: var(--paper); 
            font-family: 'Space Grotesk', sans-serif; display: flex; align-items: center; justify-content: center; 
        }
        body:before { 
            content:''; position:fixed; inset:0; pointer-events:none; opacity:.18; 
            background-image:linear-gradient(90deg, transparent 49%, #b8c0b2 50%, transparent 51%),linear-gradient(#b8c0b2 1px,transparent 1px); 
            background-size:72px 72px; 
        }
        .login-card {
            position: relative; background: var(--ink); color: var(--white);
            padding: 40px; width: 100%; max-width: 400px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            border: 1px solid #48514a;
        }
        .brand { font-weight:700; letter-spacing:-.04em; font-size:24px; margin-bottom: 30px; text-align: center; } 
        .brand span { color:var(--acid); }
        .eyebrow { color:var(--acid); font:10px 'DM Mono',monospace; text-transform:uppercase; letter-spacing:.08em; text-align: center; margin-bottom: 20px; display: block; }
        .input-group { margin-bottom: 20px; }
        .input-group label { display: block; font: 11px 'DM Mono',monospace; color: #adb6aa; margin-bottom: 6px; }
        .input-group input { 
            width: 100%; padding: 12px; border: 1px solid #48514a; background: #29332c; 
            color: var(--white); font: 13px 'DM Mono',monospace; transition: .2s; outline: none;
        }
        .input-group input:focus { border-color: var(--acid); }
        button { 
            width: 100%; padding: 14px; border: 0; background: var(--acid); color: var(--ink); 
            font: 600 14px 'Space Grotesk',sans-serif; cursor: pointer; transition: .2s; 
        }
        button:hover { background: #c6e25a; }
        #error-message { 
            color: var(--coral); font: 11px 'DM Mono',monospace; text-align: center; 
            margin-top: 16px; min-height: 16px; 
        }
    </style>
</head>
<body>
    <div class="login-card">
        <div class="brand">IMAGE <span>FORGE</span></div>
        <span class="eyebrow">Area Riservata Amministratore</span>
        <form id="loginForm">
            <div class="input-group">
                <label for="username">Username</label>
                <input type="text" id="username" required autocomplete="username">
            </div>
            <div class="input-group">
                <label for="password">Password</label>
                <input type="password" id="password" required autocomplete="current-password">
            </div>
            <button type="submit" id="submitBtn">Accedi al sistema</button>
            <div id="error-message"></div>
        </form>
    </div>

    <script>
        // Se c'è già un token, andiamo alla dashboard
        if (localStorage.getItem('adminToken')) {
            window.location.href = '/dashboard';
        }

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-message');
            const submitBtn = document.getElementById('submitBtn');

            submitBtn.textContent = 'Verifica...';
            submitBtn.disabled = true;
            errorDiv.textContent = '';

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem('adminToken', data.token);
                    window.location.href = '/dashboard';
                } else {
                    errorDiv.textContent = data.error || 'Errore di autenticazione';
                    submitBtn.textContent = 'Accedi al sistema';
                    submitBtn.disabled = false;
                }
            } catch (err) {
                errorDiv.textContent = 'Impossibile contattare il server';
                submitBtn.textContent = 'Accedi al sistema';
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
