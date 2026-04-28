import re
import time
from pathlib import Path

import requests

BASE_URL = "http://localhost:3000"

email = f"test.adviser.{int(time.time())}@gmail.com"
password = "TestPass123!"
s = requests.Session()

r = s.get(f"{BASE_URL}/signup", timeout=30)
r.raise_for_status()

match = re.search(r'name="(\$ACTION_ID_[^"]+)"', r.text)
if not match:
  raise RuntimeError("Could not find signup action id")

action_id = match.group(1)

response = s.post(
  f"{BASE_URL}/signup",
  files={
    action_id: (None, ""),
    "email": (None, email),
    "password": (None, password),
  },
  allow_redirects=False,
  timeout=30,
)

print("signup_status=", response.status_code)
print("signup_location=", response.headers.get("location"))
print("cookies_after_signup=", list(s.cookies.keys()))
print("signup_body_preview=", response.text[:1200])

next_url = response.headers.get("location")
if next_url:
  if next_url.startswith("/"):
    next_url = BASE_URL + next_url

  dashboard_response = s.get(next_url, allow_redirects=True, timeout=30)
  print("final_url=", dashboard_response.url)
  print("final_status=", dashboard_response.status_code)
  print(
    "dashboard_present=",
    "Generate and manage suitability reports." in dashboard_response.text,
  )
  print("auth_redirected_to_login=", "/login" in dashboard_response.url)

Path("/tmp/f1-test-user.txt").write_text(f"{email}\n{password}\n")
print("test_email=", email)
