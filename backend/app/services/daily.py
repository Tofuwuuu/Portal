import json
import logging
import urllib.error
import urllib.request

from app.config import settings

logger = logging.getLogger(__name__)

DAILY_API_BASE = "https://api.daily.co/v1"


def ensure_daily_room(room_slug: str) -> None:
    if not settings.daily_api_key:
        return

    body = json.dumps(
        {
            "name": room_slug,
            "properties": {
                "enable_prejoin_ui": True,
                "enable_screenshare": True,
            },
        }
    ).encode()

    request = urllib.request.Request(
        f"{DAILY_API_BASE}/rooms",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {settings.daily_api_key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request) as response:
            response.read()
    except urllib.error.HTTPError as error:
        if error.code == 400:
            detail = error.read().decode().lower()
            if "already exists" in detail:
                return
        logger.exception("Failed to create Daily room %s", room_slug)
        raise
