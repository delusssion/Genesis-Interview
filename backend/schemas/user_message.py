from pydantic import BaseModel


class UserMessageSchema(BaseModel):

    message: str