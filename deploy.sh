#!/bin/bash
set -e # Exits script if any command errors
set -u # errors on undefined variables (DEPLOY_SERVER might be undefined)
set -x #prints commands before execution
backend/gradlew build -p backend
docker compose -f frontend/docker-compose.yaml run --rm npm install
docker compose -f frontend/docker-compose.yaml run --rm npm run build --output-hashing=all
scp backend/gpstracker/build/libs/gpstracker-all.jar $DEPLOY_SERVER:/opt/gpstracker-backend/
ssh $DEPLOY_SERVER systemctl --user restart gpstracker-backend
rsync --delete -r frontend/dist/angular-leaflet-example/browser/ $DEPLOY_SERVER:/var/www/gpstracker-ng
scp frontend/dist/angular-leaflet-example/3rdpartylicenses.txt $DEPLOY_SERVER:/var/www/gpstracker-ng
