@echo off
echo Avvio dei servizi in corso (Node.js, MySQL, MinIO, Redis, phpMyAdmin)...
docker compose up -d --build
echo.
echo Servizi avviati! 
echo - App Node.js: http://localhost:3003
echo - MinIO Console: http://localhost:9001
echo - phpMyAdmin: http://localhost:8080
echo.
pause
