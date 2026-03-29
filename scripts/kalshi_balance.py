#!/usr/bin/env python3
"""Fetch live Kalshi portfolio balance and print as JSON."""
import sys, os, re, json
sys.path.insert(0, os.path.expanduser("~/.openclaw/workspace/agents/uni/data/kalshi_raw/code/kalshi_scraping"))
from clients_kalshi import KalshiHttpClient, Environment
from cryptography.hazmat.primitives import serialization

env_file = open(os.path.expanduser("~/.openclaw/workspace/agents/uni/data/kalshi_raw/env.env")).read()
pk_match = re.search(r'KALSHI_PRIVATE_KEY="(.*?)"', env_file, re.DOTALL)
pk = serialization.load_pem_private_key(pk_match.group(1).replace("\\n", "\n").encode(), password=None)
client = KalshiHttpClient(
    key_id="ccc037e3-5836-48e9-97ad-a07c72a8fd56",
    private_key=pk,
    environment=Environment.PROD
)
resp = client.get("/trade-api/v2/portfolio/balance")
print(json.dumps(resp))
