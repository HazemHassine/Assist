import sqlite3

print(sqlite3.sqlite_version)

import pysqlite3


print("aze", pysqlite3.sqlite_version)


import subprocess
import sys

subprocess.check_call(
[sys.executable, "-m", "pip", "install", "pysqlite3-binary"]
)

__import__("pysqlite3")
sys.modules["sqlite3"] = sys.modules.pop("pysqlite3")

