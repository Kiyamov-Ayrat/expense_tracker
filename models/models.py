from sqlmodel import SQLModel, Field
from typing import Optional


class ExpenseBase(SQLModel):
    description: str | None = Field(default=None)
    amount: int
    category: str


class Expense(ExpenseBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class ExpenseCreate(ExpenseBase):
    pass

class ExpensePublic(ExpenseBase):
    id: int


class ExpenseUpdate(SQLModel):
    description: str
    amount: float | int
    category: str