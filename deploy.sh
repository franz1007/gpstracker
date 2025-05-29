#!/bin/bash
set -e # Exits script if any command errors
set -u # errors on undefined variables (DEPLOY_SERVER might be undefined)
set -x #prints commands before execution
backend/gradlew build -p backend
npm install --prefix frontend
npm run build --prefix frontend
scp backend/build/libs/eu.franz1007.gpstracker-all.jar $DEPLOY_SERVER:/opt/gpstracker-backend/
ssh $DEPLOY_SERVER systemctl --user restart gpstracker-backend
rsync --delete -r frontend/dist/angular-leaflet-example/browser $DEPLOY_SERVER:/var/www/gpstracker-ng