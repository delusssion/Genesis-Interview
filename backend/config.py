from dotenv import load_dotenv
from os import environ


load_dotenv()


FRONTEND_ORIGIN = environ.get("FRONTEND_ORIGIN")
if FRONTEND_ORIGIN is None:
    raise EnvironmentError("FRONTEND_ORIGIN key not found in env")


BASE_URL = environ.get("BASE_URL")
if BASE_URL is None:
    raise EnvironmentError("BASE_URL key not found in env")



JWT_SECRET_KEY = environ.get("JWT_SECRET_KEY")
if JWT_SECRET_KEY is None:
    raise EnvironmentError("JWT_SECRET_KEY not found in env")

JWT_ALGORITHM = environ.get("JWT_ALGORITHM")
if JWT_ALGORITHM is None:
    raise EnvironmentError("JWT_ALGORITHM not found in env")

JWT_ACCESS_TOKEN_EXPIRES_MINUTES = 15
JWT_REFRESH_TOKEN_EXPIRES_DAYS = 7



URL_DATABASE = environ.get('URL_DATABASE')
if URL_DATABASE is None:
    raise EnvironmentError("URL_DATABASE not found in env")