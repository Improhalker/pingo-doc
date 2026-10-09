"""Validate tracked JSON without reading or copying the private frontend history."""
import json
import pathlib
import re
import subprocess

files = subprocess.check_output(["git", "ls-files", "-z"], text=True).split("\0")
count = 0
for name in files:
    if name.endswith(".json"):
        json.loads(pathlib.Path(name).read_text(encoding="utf-8-sig"))
        count += 1
reference = json.loads(pathlib.Path(".agent-change.json").read_text(encoding="utf-8"))
assert reference["frontRepository"] == "pingo-front-crm"
assert re.fullmatch(r"[0-9a-f]{40}", reference["frontCommit"])
assert isinstance(reference["changeId"], str) and reference["changeId"]
print(f"{count} documentos JSON válidos; referência do histórico válida.")
