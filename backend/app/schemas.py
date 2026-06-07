from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from .models import QuestionType


class Token(BaseModel):
    access_token: str
    token_type: str


class QuestionOptionCreate(BaseModel):
    text: str
    order: int = 0


class QuestionOptionOut(BaseModel):
    id: int
    text: str
    order: int
    model_config = {"from_attributes": True}


class QuestionCreate(BaseModel):
    text: str
    question_type: QuestionType
    required: bool = True
    order: int = 0
    options: List[QuestionOptionCreate] = []


class QuestionOut(BaseModel):
    id: int
    text: str
    question_type: QuestionType
    required: bool
    order: int
    options: List[QuestionOptionOut] = []
    model_config = {"from_attributes": True}


class SurveyCreate(BaseModel):
    title: str
    description: str = ""
    is_anonymous: bool = False
    questions: List[QuestionCreate] = []


class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_anonymous: Optional[bool] = None
    is_active: Optional[bool] = None


class SurveyOut(BaseModel):
    id: int
    title: str
    description: str
    is_anonymous: bool
    is_active: bool
    created_at: datetime
    slug: str
    questions: List[QuestionOut] = []
    response_count: int = 0
    model_config = {"from_attributes": True}


class SurveyListItem(BaseModel):
    id: int
    title: str
    is_anonymous: bool
    is_active: bool
    created_at: datetime
    slug: str
    response_count: int = 0
    model_config = {"from_attributes": True}


class AnswerCreate(BaseModel):
    question_id: int
    value: Optional[str] = None


class ResponseCreate(BaseModel):
    respondent_name: Optional[str] = None
    respondent_role: Optional[str] = None
    respondent_authority: Optional[str] = None
    answers: List[AnswerCreate]


class AnswerOut(BaseModel):
    question_id: int
    value: Optional[str]
    model_config = {"from_attributes": True}


class ResponseOut(BaseModel):
    id: int
    respondent_name: Optional[str]
    respondent_role: Optional[str]
    respondent_authority: Optional[str]
    submitted_at: datetime
    answers: List[AnswerOut] = []
    model_config = {"from_attributes": True}
