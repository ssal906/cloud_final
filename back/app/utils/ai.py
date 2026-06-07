from datetime import datetime, date
from openai import OpenAI
from app.config import OPENAI_API_KEY


def build_user_context(user, ledger_items, todos, schedules, documents) -> str:
    today = date.today()
    now = datetime.now()

    ledger_text = ""
    if ledger_items:
        this_month = [(i.name, i.price, i.necessity) for i in ledger_items
                      if i.item_date and i.item_date.month == today.month and i.item_date.year == today.year]
        ledger_text = f"이번 달 지출 항목 {len(this_month)}개:\n"
        for name, price, nec in this_month[:10]:
            nec_map = {"high": "상", "medium": "중", "low": "하"}
            ledger_text += f"  - {name}: {price:,}원 (필요성: {nec_map.get(nec, nec)})\n"
        total = sum(p for _, p, _ in this_month)
        ledger_text += f"  이번 달 총 지출: {total:,}원\n"

    todo_text = ""
    pending = [t for t in todos if not t.is_completed]
    today_todos = [t for t in pending if t.due_date == today]
    todo_text = f"미완료 할 일 {len(pending)}개"
    if today_todos:
        todo_text += f" (오늘 마감 {len(today_todos)}개)"
    todo_text += ":\n"
    for i, t in enumerate(pending[:10], 1):
        due = f" [마감: {t.due_date}]" if t.due_date else ""
        todo_text += f"  {i}. {t.title}{due}\n"

    schedule_text = ""
    today_schedules = [s for s in schedules
                       if s.start_datetime.date() <= today <= s.end_datetime.date()]
    if today_schedules:
        schedule_text = f"오늘 일정 {len(today_schedules)}개:\n"
        for s in today_schedules:
            schedule_text += f"  - {s.title} ({s.start_datetime.strftime('%H:%M')} ~ {s.end_datetime.strftime('%H:%M')})\n"

    doc_text = ""
    if documents:
        doc_text = f"등록된 서류 {len(documents)}개:\n"
        for d in documents[:5]:
            doc_text += f"  - {d.title} ({d.doc_type})\n"

    return f"""현재 날짜/시간: {now.strftime('%Y년 %m월 %d일 %H시 %M분')}
사용자 닉네임: {user.nickname or user.email}

[가계부]
{ledger_text or '이번 달 지출 내역이 없습니다.'}

[투두리스트]
{todo_text or '등록된 할 일이 없습니다.'}

[오늘 일정]
{schedule_text or '오늘 일정이 없습니다.'}

[서류 관리]
{doc_text or '등록된 서류가 없습니다.'}"""


def get_ai_response(user_message: str, context: str) -> str:
    if not OPENAI_API_KEY:
        return "AI 챗봇을 사용하려면 OPENAI_API_KEY를 설정해주세요."

    client = OpenAI(api_key=OPENAI_API_KEY)

    system_prompt = f"""당신은 사용자의 개인 자기관리 AI 어시스턴트입니다.
사용자의 가계부, 투두리스트, 일정, 서류 데이터를 알고 있으며, 이를 바탕으로 친절하고 간결하게 답변합니다.
메모 데이터는 개인정보 보호를 위해 접근하지 않습니다.

사용자 데이터:
{context}

규칙:
- 데이터 기반으로 정확한 정보를 제공하세요
- 한국어로 자연스럽게 답변하세요
- 간결하고 친절하게 답변하세요
- 데이터에 없는 내용은 추측하지 마세요"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        max_tokens=1024,
        temperature=0.7,
    )

    return response.choices[0].message.content
