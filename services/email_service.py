import os
import smtplib

from email.message import EmailMessage
from pathlib import Path

YAHOO_SMTP_HOST = "smtp.mail.yahoo.com"
YAHOO_SMTP_PORT = 465

def send_quotation_analytics_email(pdf_path: Path):

    sender = os.getenv("QUOTATION_ANALYTICS_EMAIL")
    password = os.getenv("QUOTATION_ANALYTICS_EMAIL_PASSWORD")
    recipient = os.getenv("QUOTATION_ANALYTICS_RECIPIENT")

    if not sender:
        raise RuntimeError("QUOTATION_ANALYTICS_EMAIL is not configured.")

    if not password:
        raise RuntimeError("QUOTATION_ANALYTICS_EMAIL_PASSWORD is not configured.")

    if not recipient:
        raise RuntimeError("QUOTATION_ANALYTICS_RECIPIENT is not configured.")

    pdf_path = Path(pdf_path)

    if not pdf_path.exists():
        raise FileNotFoundError(f"Analytics PDF not found: {pdf_path}")

    message = EmailMessage()

    message["From"] = sender
    message["To"] = recipient
    message["Subject"] = ("Tempo Instruments - Daily Quotation Analytics")

    message.set_content(
        "Dear Team,\n\n"
        "Please find attached the daily quotation analytics "
        "report for today.\n\n"
        "This is an automatically generated report.\n\n"
        "Regards,\n"
        "Tempo Instruments AI Sales"
    )

    with pdf_path.open("rb") as file:
        pdf_bytes = file.read()

    message.add_attachment(pdf_bytes, maintype="application", subtype="pdf", filename=pdf_path.name,)

    with smtplib.SMTP_SSL(YAHOO_SMTP_HOST, YAHOO_SMTP_PORT, ) as smtp:

        smtp.login(sender, password)

        smtp.send_message(message)