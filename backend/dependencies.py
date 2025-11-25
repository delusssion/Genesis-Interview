from dotenv import load_dotenv
from os import environ


load_dotenv()


BASE_URL = environ.get("BASE_URL")
if BASE_URL is None:
    raise EnvironmentError("BASE_URL key not found in environment")
