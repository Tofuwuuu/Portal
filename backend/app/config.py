from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://portal:portal@db:5432/portal"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24
    cors_origins: str = "http://localhost,https://frontend-blue-beta-n3fz9uwjje.vercel.app"
    turn_url: str = ""
    turn_username: str = ""
    turn_credential: str = ""

    @property
    def sqlalchemy_database_url(self) -> str:
        url = self.database_url
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql://", 1)
        return url

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
