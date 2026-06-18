cd /tmp
rm -rf diana-temp
git clone https://github.com/NinjaWorld1234/Diana.git diana-temp
cd diana-temp
LATEST_COMMIT=$(git rev-parse HEAD)
echo "LATEST_COMMIT: $LATEST_COMMIT"
docker build --target api-runner -t sgv1wdh5etlvwx58fle9aecr_api:$LATEST_COMMIT -f Dockerfile .
docker build --target web-runner -t sgv1wdh5etlvwx58fle9aecr_web:$LATEST_COMMIT -f Dockerfile .
cd /data/coolify/applications/sgv1wdh5etlvwx58fle9aecr
sed -i -E "s/sgv1wdh5etlvwx58fle9aecr_api:[a-f0-9]+/sgv1wdh5etlvwx58fle9aecr_api:$LATEST_COMMIT/g" docker-compose.yaml
sed -i -E "s/sgv1wdh5etlvwx58fle9aecr_web:[a-f0-9]+/sgv1wdh5etlvwx58fle9aecr_web:$LATEST_COMMIT/g" docker-compose.yaml
docker compose up -d
