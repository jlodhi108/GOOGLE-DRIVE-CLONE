sudo docker run -d -p 3000:3000 --env-file .env -v $(pwd)/database.sqlite:/app/database.sqlite google-drive-backend
