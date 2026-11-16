#!/usr/bin/env bash
# Запуск тестового сервера. Термінал не закривається після зупинки процесу.
# Корінь проєкту — тека на рівень вище за цей скрипт (tools/../).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$ROOT/tests/server"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  # Ярлик на стільниці не читає .bashrc, тож nvm підключаємо тут.
  # shellcheck disable=SC1090
  . "$HOME/.nvm/nvm.sh"
fi

cd "$SERVER_DIR" || {
  echo "Не вдалося відкрити каталог: $SERVER_DIR"
  exit 1
}

npm start
status=$?

echo
echo "Сервер завершився з кодом ${status}."
echo "Термінал залишено відкритим. Закрийте вікно, коли воно більше не потрібне."
exec bash
