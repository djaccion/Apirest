from dotenv import load_dotenv
load_dotenv()

import os
from app import app

host = os.getenv("FLASK_HOST", "127.0.0.1")
port = int(os.getenv("FLASK_PORT", 5000))
debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"

if __name__ == "__main__":
    app.run(host=host, port=port, debug=debug)