from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from ..database import get_db
from .. import models
from ..schemas import SurveyCreate, SurveyOut, SurveyListItem, SurveyUpdate
from ..auth import get_current_user

router = APIRouter(prefix="/api/surveys", tags=["surveys"])


def _count_responses(survey: models.Survey) -> int:
    return len(survey.responses)


@router.get("/", response_model=List[SurveyListItem])
def list_surveys(db: Session = Depends(get_db), _=Depends(get_current_user)):
    surveys = db.query(models.Survey).order_by(models.Survey.created_at.desc()).all()
    result = []
    for s in surveys:
        item = SurveyListItem.model_validate(s)
        item.response_count = _count_responses(s)
        result.append(item)
    return result


@router.post("/", response_model=SurveyOut)
def create_survey(data: SurveyCreate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    survey = models.Survey(
        title=data.title,
        description=data.description,
        is_anonymous=data.is_anonymous,
        slug=str(uuid.uuid4())[:8],
    )
    db.add(survey)
    db.flush()

    for q_data in data.questions:
        question = models.Question(
            survey_id=survey.id,
            text=q_data.text,
            question_type=q_data.question_type,
            required=q_data.required,
            order=q_data.order,
        )
        db.add(question)
        db.flush()
        for opt in q_data.options:
            db.add(models.QuestionOption(question_id=question.id, text=opt.text, order=opt.order))

    db.commit()
    db.refresh(survey)
    out = SurveyOut.model_validate(survey)
    out.response_count = 0
    return out


@router.get("/{slug}", response_model=SurveyOut)
def get_survey(slug: str, db: Session = Depends(get_db)):
    survey = db.query(models.Survey).filter(models.Survey.slug == slug).first()
    if not survey:
        raise HTTPException(status_code=404, detail="סקר לא נמצא")
    out = SurveyOut.model_validate(survey)
    out.response_count = _count_responses(survey)
    return out


@router.patch("/{slug}", response_model=SurveyOut)
def update_survey(slug: str, data: SurveyUpdate, db: Session = Depends(get_db), _=Depends(get_current_user)):
    survey = db.query(models.Survey).filter(models.Survey.slug == slug).first()
    if not survey:
        raise HTTPException(status_code=404, detail="סקר לא נמצא")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(survey, field, value)
    db.commit()
    db.refresh(survey)
    out = SurveyOut.model_validate(survey)
    out.response_count = _count_responses(survey)
    return out


@router.delete("/{slug}")
def delete_survey(slug: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    survey = db.query(models.Survey).filter(models.Survey.slug == slug).first()
    if not survey:
        raise HTTPException(status_code=404, detail="סקר לא נמצא")
    db.delete(survey)
    db.commit()
    return {"ok": True}
