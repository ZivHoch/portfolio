from pydantic import BaseModel, field_validator
from datetime import datetime, timezone
from typing import Optional, List


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    messages: List[Message] = []
    session_id: Optional[str] = None
    timestamp: float

    @field_validator('timestamp')
    def convert_timestamp(cls, v: float) -> datetime:
        # Convert Unix timestamp to datetime object
        return datetime.fromtimestamp(v, tz=timezone.utc)


class RateLimitResponse(BaseModel):
    """Response structure for rate limit exceeded cases"""
    detail: str
    type: str
    limit: str
    retry_after: int  # seconds until the limit resets
    friendly_message: str

    class Config:
        json_schema_extra = {
            "example": {
                "detail": "Rate limit exceeded",
                "type": "chat_rate_limit_exceeded",
                "limit": "60/minute",
                "retry_after": 30,
                "friendly_message": "You're sending messages too quickly! You can send another message in 30 seconds."
            }
        }
class ChatLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    session_id: str = Field(index=True)
    user_message: str = Field(index=True)
    assistant_message: str = Field(default="")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }