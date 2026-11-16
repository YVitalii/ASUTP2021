#!/usr/bin/env bash
# Створює ярлик start-server на робочому столі і виставляє права для запуску.
set -euo pipefail

if [ "$(id -u)" -eq 0 ]; then
  echo "Запускайте скрипт від свого користувача, без sudo."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_SCRIPT="$SCRIPT_DIR/start-server.sh"

if [ ! -f "$SERVER_SCRIPT" ]; then
  echo "Не знайдено скрипт запуску: $SERVER_SCRIPT"
  exit 1
fi

if command -v xdg-user-dir >/dev/null 2>&1; then
  DESKTOP="$(xdg-user-dir DESKTOP)"
else
  DESKTOP=""
fi

if [ -z "$DESKTOP" ] || [ "$DESKTOP" = "$HOME" ]; then
  if [ -d "$HOME/Робочий стіл" ]; then
    DESKTOP="$HOME/Робочий стіл"
  elif [ -d "$HOME/Стільниця" ]; then
    DESKTOP="$HOME/Стільниця"
  else
    DESKTOP="$HOME/Desktop"
  fi
fi

mkdir -p "$DESKTOP"
LAUNCHER="$DESKTOP/start-server.desktop"

chmod +x "$SERVER_SCRIPT" "$SCRIPT_DIR/start-servers-setup.sh"

cat > "$LAUNCHER" <<EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=start-server
Comment=Запуск tests/server (npm start)
Exec=xfce4-terminal --hold -e "$SERVER_SCRIPT"
Icon=utilities-terminal
Terminal=false
Categories=Development;
StartupNotify=true
EOF

chmod +x "$LAUNCHER"

if command -v gio >/dev/null 2>&1 && command -v sha256sum >/dev/null 2>&1; then
  checksum="$(sha256sum "$LAUNCHER" | awk '{print $1}')"
  gio set -t string "$LAUNCHER" metadata::xfce-exe-checksum "$checksum"
fi

echo "Ярлик створено: $LAUNCHER"
echo "Скрипт запуску: $SERVER_SCRIPT"
