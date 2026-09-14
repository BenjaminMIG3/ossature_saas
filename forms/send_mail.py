#!/usr/bin/env python3
"""Envoi d'une demande de démo Ossatura (texte + HTML)."""

from __future__ import annotations

import html
import json
import smtplib
import ssl
import sys
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from pathlib import Path
from zoneinfo import ZoneInfo


def esc(value: str) -> str:
    return html.escape(value or "", quote=True)


def build_plain(data: dict) -> str:
    message = (data.get("message") or "").strip() or "—"
    lines = [
        "Nouvelle demande de démonstration — Ossatura",
        "",
        f"Contact     : {data['prenom']} {data['nom']}",
        f"Entreprise  : {data['entreprise']}",
        f"Email       : {data['email']}",
        f"Métier      : {data.get('metier') or '—'}",
        f"Effectif    : {data.get('effectif') or '—'}",
        f"Reçue le    : {data.get('received_at') or '—'}",
        "",
        "Message",
        "-------",
        message,
        "",
        "Répondre directement à cet e-mail pour contacter le prospect.",
    ]
    return "\n".join(lines)


def build_html(data: dict) -> str:
    message = (data.get("message") or "").strip() or "—"
    message_html = esc(message).replace("\n", "<br>")
    reply = esc(data["email"])
    rows = [
        ("Contact", f"{esc(data['prenom'])} {esc(data['nom'])}"),
        ("Entreprise", esc(data["entreprise"])),
        ("Email", f'<a href="mailto:{reply}" style="color:#12161C;font-weight:600;text-decoration:underline;">{reply}</a>'),
        ("Métier", esc(data.get("metier") or "—")),
        ("Effectif", esc(data.get("effectif") or "—")),
        ("Reçue le", esc(data.get("received_at") or "—")),
    ]
    rows_html = "".join(
        f"""
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #E6E8EB;width:34%;vertical-align:top;color:#8A93A0;font-size:13px;letter-spacing:.02em;text-transform:uppercase;">{label}</td>
          <td style="padding:12px 0;border-bottom:1px solid #E6E8EB;vertical-align:top;color:#1F2933;font-size:15px;font-weight:500;">{value}</td>
        </tr>
        """
        for label, value in rows
    )

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demande de démonstration</title>
</head>
<body style="margin:0;padding:0;background:#ECEDEA;font-family:Arial,Helvetica,sans-serif;color:#1F2933;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Nouvelle demande de démo de {esc(data['prenom'])} {esc(data['nom'])} ({esc(data['entreprise'])}).
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ECEDEA;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E5E8;">
          <tr>
            <td style="background:#12161C;padding:28px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.02em;">
                    <span style="display:inline-block;width:10px;height:10px;background:#F2B705;border-radius:2px;margin-right:10px;vertical-align:middle;"></span>
                    Ossatura
                  </td>
                  <td align="right" style="color:#C3C8CF;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Demande de démo</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;color:#8A93A0;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">Nouveau lead</p>
              <h1 style="margin:0 0 12px;font-size:28px;line-height:1.15;letter-spacing:-0.03em;color:#12161C;">
                {esc(data['prenom'])} {esc(data['nom'])} souhaite une démonstration
              </h1>
              <p style="margin:0 0 28px;color:#8A93A0;font-size:15px;line-height:1.5;">
                Prospect de <strong style="color:#1F2933;">{esc(data['entreprise'])}</strong>. Répondre sous un jour ouvré.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                {rows_html}
              </table>

              <div style="background:#F6F6F4;border:1px solid #E6E8EB;border-radius:12px;padding:20px 22px;margin:0 0 28px;">
                <p style="margin:0 0 10px;color:#8A93A0;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Message</p>
                <p style="margin:0;color:#1F2933;font-size:15px;line-height:1.6;">{message_html}</p>
              </div>

              <a href="mailto:{reply}?subject={esc('Re: Demande de démo Ossatura')}"
                 style="display:inline-block;background:#F2B705;color:#12161C;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:999px;">
                Répondre au prospect
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 32px 24px;border-top:1px solid #E6E8EB;color:#8A93A0;font-size:12px;line-height:1.5;">
              E-mail généré automatiquement depuis le formulaire de démo Ossatura.
              Reply-To prérempli vers {reply}.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: send_mail.py <payload.json>", file=sys.stderr)
        return 2

    data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    cfg = data["cfg"]

    if "received_at" not in data:
        data["received_at"] = datetime.now(ZoneInfo("Europe/Paris")).strftime("%d/%m/%Y à %H:%M")

    plain = build_plain(data)
    rich = build_html(data)

    msg = MIMEMultipart("alternative")
    msg["Subject"] = data["subject"]
    msg["From"] = formataddr((cfg["from_name"], cfg["from_email"]))
    msg["To"] = data["to"]
    msg["Reply-To"] = data["reply_to"]
    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(rich, "html", "utf-8"))

    with smtplib.SMTP(cfg["smtp_host"], int(cfg["smtp_port"]), timeout=30) as smtp:
        smtp.ehlo()
        smtp.starttls(context=ssl.create_default_context())
        smtp.ehlo()
        smtp.login(cfg["smtp_user"], cfg["smtp_pass"])
        smtp.sendmail(cfg["from_email"], [data["to"]], msg.as_string())

    print("OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
