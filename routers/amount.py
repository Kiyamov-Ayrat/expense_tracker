from budget import amount
from fastapi import APIRouter
from models.budget import BudgetPublic, BudgetCreate, BudgetUpdate
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

@router.patch("/budget/{budget_id}",
              response_model=BudgetPublic,
              tags=["Budget"])
def update_budg(session: SessionDep,
                budget_id: int,
                budget: BudgetUpdate):
    return amount.update_budget(session=session,
                                budget_id=budget_id,
                                budget=budget)


@router.delete("/budget/{budget_id}",
               tags=["Budget"])
def delete_budget(session: SessionDep, budget_id: int):
    return amount.delete_budget(session=session, budget_id=budget_id)
