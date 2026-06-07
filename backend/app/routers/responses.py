from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models
from ..schemas import ResponseCreate, ResponseOut
from ..auth import get_current_user

router = APIRouter(prefix="/api/surveys", tags=["responses"])


@router.post("/{slug}/responses", response_model=ResponseOut)
def submit_response(slug: str, data: ResponseCreate, db: Session = Depends(get_db)):
    survey = db.query(models.Survey).filter(models.Survey.slug == slug, models.Survey.is_active == True).first()
    if not survey:
        raise HTTPException(status_code=404, detail="סקר לא נמצא או לא פעיל")

    response = models.Response(
        survey_id=survey.id,
        respondent_name=None if survey.is_anonymous else data.respondent_name,
        respondent_role=None if survey.is_anonymous else data.respondent_role,
        respondent_authority=None if survey.is_anonymous else data.respondent_authority,
    )
    db.add(response)
    db.flush()

    for ans in data.answers:
        db.add(models.Answer(response_id=response.id, question_id=ans.question_id, value=ans.value))

    db.commit()
    db.refresh(response)
    return response


@router.get("/{slug}/responses", response_model=List[ResponseOut])
def get_responses(slug: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    survey = db.query(models.Survey).filter(models.Survey.slug == slug).first()
    if not survey:
        raise HTTPException(status_code=404, detail="סקר לא נמצא")
    return survey.responses
