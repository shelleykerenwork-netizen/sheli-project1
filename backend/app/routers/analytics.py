from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from collections import Counter
import io, openpyxl
from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/api/surveys", tags=["analytics"])


def _filter_responses(survey: models.Survey, authority: Optional[str], role: Optional[str]):
    responses = survey.responses
    if authority:
        responses = [r for r in responses if r.respondent_authority == authority]
    if role:
        responses = [r for r in responses if r.respondent_role == role]
    return responses


@router.get("/{slug}/analytics")
def get_analytics(
    slug: str,
    authority: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    survey = db.query(models.Survey).filter(models.Survey.slug == slug).first()
    if not survey:
        raise HTTPException(status_code=404, detail="סקר לא נמצא")

    responses = _filter_responses(survey, authority, role)

    authorities = sorted(set(r.respondent_authority for r in survey.responses if r.respondent_authority))
    roles = sorted(set(r.respondent_role for r in survey.responses if r.respondent_role))

    questions_data = []
    for question in survey.questions:
        answer_values = [
            a.value for r in responses for a in r.answers
            if a.question_id == question.id and a.value is not None
        ]

        q_data: dict = {
            "question_id": question.id,
            "question_text": question.text,
            "question_type": question.question_type,
            "total_answers": len(answer_values),
        }

        if question.question_type == "number":
            nums = []
            for v in answer_values:
                try:
                    nums.append(float(v))
                except (ValueError, TypeError):
                    pass
            if nums:
                q_data["avg"] = round(sum(nums) / len(nums), 2)
                q_data["min"] = min(nums)
                q_data["max"] = max(nums)
                q_data["values"] = nums
        elif question.question_type in ("single_choice", "multiple_choice", "yes_no", "rating"):
            counts = Counter(answer_values)
            q_data["distribution"] = [{"label": k, "count": v} for k, v in counts.most_common()]
            if question.question_type == "rating":
                try:
                    nums = [float(v) for v in answer_values if v is not None]
                    if nums:
                        q_data["avg"] = round(sum(nums) / len(nums), 2)
                except (ValueError, TypeError):
                    pass
        elif question.question_type == "text":
            q_data["text_answers"] = answer_values

        questions_data.append(q_data)

    return {
        "survey_title": survey.title,
        "total_responses": len(responses),
        "filters": {"authorities": authorities, "roles": roles},
        "questions": questions_data,
    }


@router.get("/{slug}/export")
def export_excel(slug: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    survey = db.query(models.Survey).filter(models.Survey.slug == slug).first()
    if not survey:
        raise HTTPException(status_code=404, detail="סקר לא נמצא")

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "תשובות"

    headers = ["#", "תאריך הגשה"]
    if not survey.is_anonymous:
        headers += ["שם", "תפקיד", "רשות"]
    for q in survey.questions:
        headers.append(q.text)
    ws.append(headers)

    for i, response in enumerate(survey.responses, 1):
        row = [i, response.submitted_at.strftime("%d/%m/%Y %H:%M")]
        if not survey.is_anonymous:
            row += [response.respondent_name, response.respondent_role, response.respondent_authority]
        answers_map = {a.question_id: a.value for a in response.answers}
        for q in survey.questions:
            row.append(answers_map.get(q.id, ""))
        ws.append(row)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    filename = f"{survey.title}.xlsx".replace(" ", "_")
    return StreamingResponse(
        buf,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
