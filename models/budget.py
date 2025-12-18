from sqlmodel import SQLModel, Field
from typing import Optional
from datetime import date as Date


class BudgetBase(SQLModel):
    limit_amount: int = Field(default=None)
    date: Date = Field(default_factory=Date.today,
                       index=True)

class Budget(BudgetBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

class BudgetUpdate(BudgetBase):
    limit_amount: int | None = None
    date: Optional[Date] = None

class BudgetPublic(BudgetBase):
    pass

class BudgetCreate(BudgetBase):
    pass