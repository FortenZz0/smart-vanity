#!/usr/bin/env bash
set -euo pipefail

case "${0##*/}" in
  smart-vanity-deploy|deploy.sh)
    root=/opt/smart-vanity
    service=smart-vanity-api.service
    port=3000
    public_health=https://smartvanity.filinda.ru/api/health
    public_status=200
    ;;
  smart-vanity-deploy-test)
    root=/opt/smart-vanity-test
    service=smart-vanity-api-test.service
    port=3001
    public_health=https://smartvanity.filinda.ru/test/api/health
    public_status=401
    ;;
  *) echo 'Unknown deployment entry point' >&2; exit 1 ;;
esac

exec 9>"$root/deploy.lock"
flock -x 9

previous=$(readlink "$root/current" || true)
release=$(mktemp -d "$root/releases/$(date -u +%Y%m%dT%H%M%SZ)-XXXXXX")
chmod 0755 "$release"
link="$root/.current-${release##*/}"
activated=false

point_current() {
  ln -s -- "$1" "$link"
  mv -Tf -- "$link" "$root/current"
}

on_exit() {
  status=$?
  if (( status == 0 )); then return; fi

  set +e
  rm -f -- "$link"

  if [[ $activated == true ]]; then
    if [[ -n $previous ]]; then
      if ! point_current "$previous"; then
        echo "Could not restore $previous; keeping failed release $release" >&2
        return
      fi
      sudo -n /usr/bin/systemctl restart "$service" || echo 'Could not restart previous release' >&2
    else
      sudo -n /usr/bin/systemctl stop "$service" || echo 'Could not stop failed service' >&2
      rm -f -- "$root/current"
    fi
  fi

  rm -rf -- "$release"
}
trap on_exit EXIT
trap 'exit 130' INT
trap 'exit 143' TERM HUP

tar -xzf - -C "$release"
cd "$release"
if [[ $service == smart-vanity-api-test.service && ! -s client/index.html ]]; then
  echo 'The test release is missing the browser build' >&2
  exit 1
fi
npm ci --omit=dev --workspace server --include-workspace-root=false --no-audit --no-fund

activated=true
point_current "$release"
sudo -n /usr/bin/systemctl restart "$service"

responds_with() {
  [[ $(curl --silent --show-error --max-time 5 --output /dev/null --write-out '%{http_code}' \
    "$1") == "$2" ]]
}

for attempt in {1..10}; do
  if responds_with "http://127.0.0.1:$port/api/health" 200 && responds_with "$public_health" "$public_status"; then
    printf 'Deployed %s\n' "${release##*/}"
    exit 0
  fi
  sleep 1
done

echo 'Health check failed; rolling back' >&2
exit 1
