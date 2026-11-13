#!/bin/bash
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Запустіть так: sudo bash $0"
  exit 1
fi

if [[ -z "${SUDO_USER:-}" || "${SUDO_USER}" == "root" ]]; then
  echo "Запускайте зі свого облікового запису, не з root: sudo bash $0"
  exit 1
fi

USER_HOME=$(getent passwd "$SUDO_USER" | cut -d: -f6)
if [[ -z "${USER_HOME}" || ! -d "${USER_HOME}" ]]; then
  echo "Не знайдено домашній каталог користувача ${SUDO_USER}"
  exit 1
fi

if ! command -v startxfce4 >/dev/null 2>&1; then
  echo "Не знайдено startxfce4. Скрипт розрахований на Xubuntu."
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y xrdp

usermod -aG ssl-cert xrdp

cat > "${USER_HOME}/.xsession" << 'EOF'
#!/bin/sh
unset DBUS_SESSION_BUS_ADDRESS
unset XDG_RUNTIME_DIR
exec startxfce4
EOF
chown "${SUDO_USER}:${SUDO_USER}" "${USER_HOME}/.xsession"
chmod 755 "${USER_HOME}/.xsession"

install -d -o root -g root -m 755 /etc/polkit-1/rules.d
cat > /etc/polkit-1/rules.d/49-networkmanager-xrdp.rules << 'EOF'
polkit.addRule(function(action, subject) {
    if (action.id.indexOf("org.freedesktop.NetworkManager.") === 0 &&
        subject.isInGroup("sudo")) {
        return polkit.Result.YES;
    }
});
EOF
chown root:root /etc/polkit-1/rules.d/49-networkmanager-xrdp.rules
chmod 644 /etc/polkit-1/rules.d/49-networkmanager-xrdp.rules

STARTWM=/etc/xrdp/startwm.sh
if [[ -f "${STARTWM}" ]] && ! grep -q 'DBUS_SESSION_BUS_ADDRESS' "${STARTWM}"; then
  sed -i '/test -x \/etc\/X11\/Xsession/i unset DBUS_SESSION_BUS_ADDRESS\nunset XDG_RUNTIME_DIR' "${STARTWM}"
fi

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 3389/tcp
fi

systemctl enable xrdp xrdp-sesman
systemctl restart xrdp xrdp-sesman

IP=$(hostname -I 2>/dev/null | awk '{print $1}')
IP=${IP:-невідома}

echo
echo "Готово. Адреса цього комп'ютера: ${IP}"
echo "Вийдіть з облікового запису на ноутбуці (має лишитися екран входу)."
echo "На Windows: Win+R, команда mstsc, у полі комп'ютера вкажіть ${IP}"
