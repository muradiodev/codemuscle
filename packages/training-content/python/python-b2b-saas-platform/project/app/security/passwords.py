import base64
import hashlib
import hmac
import secrets


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode(), salt=salt, n=2**14, r=8, p=1, dklen=32
    )
    return "scrypt$16384$8$1$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(digest).decode()


def verify_password(password: str, encoded: str) -> bool:
    algorithm, n, r, p, salt_text, digest_text = encoded.split("$", 5)
    if algorithm != "scrypt":
        return False
    salt = base64.b64decode(salt_text)
    expected = base64.b64decode(digest_text)
    actual = hashlib.scrypt(
        password.encode(), salt=salt, n=int(n), r=int(r), p=int(p), dklen=32
    )
    return hmac.compare_digest(actual, expected)
