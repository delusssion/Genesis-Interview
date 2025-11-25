from pydantic import BaseModel, Field


class UserLoginSchema(BaseModel):
    nickname: str = Field(min_length=4)
    password: str = Field(min_length=8)


class UserRegisterSchema(UserLoginSchema):
    confirm_password: str = Field(min_length=8)
