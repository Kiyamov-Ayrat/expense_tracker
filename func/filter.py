
from database.database import SessionDep
from models.expense import Category, Expense
from sqlmodel import select, func
from fastapi import HTTPException
import csv
from fastapi.responses import StreamingResponse
from io import StringIO
from budget.amount import budget_status

def get_product(session: SessionDep, category: Category):
    statement = select(Expense).where(Expense.category == category)
    result = session.exec(statement).all()
    return result

def get_by_month(session: SessionDep, year: int, month: int):
    statement = select(Expense).where(func.strftime("%Y-%m", Expense.date) == f"{year}-{month:02d}")
    result = session.exec(statement).all()
    return result

def statistic_month(session: SessionDep, year: int, month: int):
    data = get_by_month(session=session, year=year, month=month)
    if not data:
        raise HTTPException(status_code=404, detail="No data found")

    d = {}
    for i in data:
        if i.category not in d:
            d[i.category] = i.amount
        else:
            d[i.category] += i.amount
    sorted_d = sorted(d.items(), key = lambda x: x[1], reverse = True)
    return {k: v for k, v in sorted_d}

def csv_statistic(session: SessionDep, year: int, month: int):
    data = statistic_month(session=session, year=year, month=month)
    data2 = budget_status(session=session, year=year, month=month)
    if not data or data2 is None:
        raise HTTPException(status_code=404, detail="No data found")
    #Объединение двух словарей
    for k, v in data2.items():
        if k != "is_over_limit":
            data[k] = v
        else:
            break
    csv_data = StringIO()
    writer = csv.writer(csv_data, delimiter=';')
    writer.writerow(["Category", "Amount"])

    for category, amount in data.items():
        writer.writerow([category, amount])
    csv_data.seek(0)
    filename = f'test.csv'
    return StreamingResponse(
        iter([csv_data.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

def filter_date_category(session: SessionDep,
                         year: int,
                         month: int,
                         category: Category):
    statement = select(Expense).where(func.strftime
                                      ("%Y-%m", Expense.date)
                                      == f"{year}-{month:02d}",
                                      Expense.category == category)
    results = session.exec(statement).all()
    if not results:
        raise HTTPException(status_code=404, detail="No data found")
    return results