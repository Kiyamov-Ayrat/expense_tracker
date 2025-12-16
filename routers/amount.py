from budget import amount
from fastapi import APIRouter
from models.budget import BudgetPublic, BudgetCreate
from database.database import SessionDep

router = APIRouter()

@router.post("/budget",
             response_model=BudgetPublic,
             tags=["Budget"])
def create_budget(session: SessionDep, budget: BudgetCreate):
    return amount.set_budget(session=session, budget=budget)

@router.get("/budget/balance",
            tags=["Budget"])
def get_expense_balance(session: SessionDep):
    return amount.budget_status(session=session)
